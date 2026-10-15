#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, Address, Bytes, BytesN, Env, String, Symbol, Vec,
};

mod error;
mod storage;
mod types;

use crate::error::ContractError;
use crate::storage::{
    has_credential_record, has_did_record, read_credential_record, read_did_record,
    write_credential_record, write_did_record,
};
use crate::types::{
    CredentialRecord, CredentialStatus, DidRecord, NewDidDoc, Service, VerificationMethod,
};

const MAX_VERIFICATION_METHODS: u32 = 10;
const MAX_SERVICES: u32 = 10;
const MAX_ID_LENGTH: u32 = 128;
const MAX_ENDPOINT_LENGTH: u32 = 512;

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DidCreated {
    pub controller: Address,
    pub version: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DidUpdated {
    pub controller: Address,
    pub version: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DidDeactivated {
    pub controller: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DidControllerRotated {
    pub old_controller: Address,
    pub new_controller: Address,
    pub version: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CredentialAnchored {
    pub issuer: Address,
    pub hash: BytesN<32>,
    pub expires_at: Option<u64>,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CredentialRevoked {
    pub issuer: Address,
    pub hash: BytesN<32>,
}

#[contract]
pub struct IdentityContract;

#[contractimpl]
impl IdentityContract {
    // TODO(wave: core-1): DID method registration plugs in here — the
    // method name (`stellar`) and network are currently hard-coded
    // assumptions (see docs/METHOD_SPEC.md §12).
    pub fn create_did(env: Env, controller: Address, doc: NewDidDoc) -> Result<(), ContractError> {
        controller.require_auth();

        if has_did_record(&env, &controller) {
            return Err(ContractError::AlreadyExists);
        }

        Self::validate_new_doc(&env, &doc)?;

        let now = env.ledger().timestamp();
        let record = DidRecord {
            controller: controller.clone(),
            verification_methods: doc.verification_methods,
            authentication: doc.authentication,
            assertion_method: doc.assertion_method,
            services: doc.services,
            created: now,
            updated: now,
            version: 1,
            deactivated: false,
        };

        write_did_record(&env, &controller, &record);

        DidCreated {
            controller: controller.clone(),
            version: 1,
        }
        .publish(&env);

        Ok(())
    }

    pub fn resolve(env: Env, controller: Address) -> Result<DidRecord, ContractError> {
        read_did_record(&env, &controller)
    }

    /// Add a verification method to a DID.
    ///
    /// Requires authorization from `controller`. The method id must be
    /// unique within the DID, at most 128 bytes, and the kind must be
    /// `Ed25519` (v1). At most 10 methods per DID (`LimitExceeded`).
    /// Bumps `updated`/`version` and emits a `did/updated` event.
    pub fn add_verification_method(
        env: Env,
        controller: Address,
        vm: VerificationMethod,
    ) -> Result<(), ContractError> {
        controller.require_auth();

        let mut record = read_did_record(&env, &controller)?;
        if record.controller != controller {
            return Err(ContractError::Unauthorized);
        }
        if record.deactivated {
            return Err(ContractError::Deactivated);
        }
        if vm.id.len() > MAX_ID_LENGTH {
            return Err(ContractError::InvalidInput);
        }
        if vm.kind != Symbol::new(&env, "Ed25519") {
            return Err(ContractError::InvalidInput);
        }
        if record
            .verification_methods
            .iter()
            .any(|existing| existing.id == vm.id)
        {
            return Err(ContractError::AlreadyExists);
        }
        if record.verification_methods.len() >= MAX_VERIFICATION_METHODS {
            return Err(ContractError::LimitExceeded);
        }

        record.verification_methods.push_back(vm);
        record.updated = env.ledger().timestamp();
        record.version += 1;
        write_did_record(&env, &controller, &record);

        DidUpdated {
            controller: controller.clone(),
            version: record.version,
        }
        .publish(&env);

        Ok(())
    }

    /// Remove a verification method from a DID.
    ///
    /// Requires authorization from `controller`. Returns `NotFound` for an
    /// unknown method id. A method still referenced by `authentication` or
    /// `assertion_method` cannot be removed (`InvalidVerificationMethod` —
    /// call `set_relationships` first). Bumps `updated`/`version` and emits
    /// a `did/updated` event.
    pub fn remove_verification_method(
        env: Env,
        controller: Address,
        vm_id: String,
    ) -> Result<(), ContractError> {
        controller.require_auth();

        let mut record = read_did_record(&env, &controller)?;
        if record.controller != controller {
            return Err(ContractError::Unauthorized);
        }
        if record.deactivated {
            return Err(ContractError::Deactivated);
        }
        if record.authentication.iter().any(|id| id == vm_id)
            || record.assertion_method.iter().any(|id| id == vm_id)
        {
            return Err(ContractError::InvalidVerificationMethod);
        }

        let index = record
            .verification_methods
            .iter()
            .position(|vm| vm.id == vm_id)
            .map(|pos| pos as u32);
        let index = match index {
            Some(index) => index,
            None => return Err(ContractError::NotFound),
        };
        // Out-of-bounds cannot happen: `index` came from the loop above.
        if record.verification_methods.remove(index).is_none() {
            return Err(ContractError::NotFound);
        }

        record.updated = env.ledger().timestamp();
        record.version += 1;
        write_did_record(&env, &controller, &record);

        DidUpdated {
            controller: controller.clone(),
            version: record.version,
        }
        .publish(&env);

        Ok(())
    }

    /// Deactivate a DID (terminal).
    ///
    /// Requires authorization from `controller`. Sets the `deactivated`
    /// flag; afterwards every mutating operation on the DID (updates,
    /// rotation, anchoring) fails with `Deactivated`, while `resolve`,
    /// `credential_status` and `revoke_credential` keep working so existing
    /// credentials can be wound down. `resolve` still returns the record so
    /// verifiers can distinguish "deactivated" from "never existed".
    /// Bumps `updated`/`version` and emits a `did/deactivated` event.
    /// Deactivating twice returns `Deactivated`.
    pub fn deactivate_did(env: Env, controller: Address) -> Result<(), ContractError> {
        controller.require_auth();

        let mut record = read_did_record(&env, &controller)?;
        if record.controller != controller {
            return Err(ContractError::Unauthorized);
        }
        if record.deactivated {
            return Err(ContractError::Deactivated);
        }

        record.deactivated = true;
        record.updated = env.ledger().timestamp();
        record.version += 1;
        write_did_record(&env, &controller, &record);

        DidDeactivated {
            controller: controller.clone(),
        }
        .publish(&env);

        Ok(())
    }

    /// Replace the `authentication` and `assertion_method` relationship lists.
    ///
    /// Requires authorization from `controller`. Every id in both lists must
    /// reference an existing verification method, otherwise
    /// `InvalidVerificationMethod`. Both lists are replaced wholesale (pass
    /// the current list back with edits to add or drop a single entry).
    /// Bumps `updated`/`version` and emits a `did/updated` event.
    pub fn set_relationships(
        env: Env,
        controller: Address,
        authentication: Vec<String>,
        assertion_method: Vec<String>,
    ) -> Result<(), ContractError> {
        controller.require_auth();

        let mut record = read_did_record(&env, &controller)?;
        if record.controller != controller {
            return Err(ContractError::Unauthorized);
        }
        if record.deactivated {
            return Err(ContractError::Deactivated);
        }
        for id in &authentication {
            if !record.verification_methods.iter().any(|vm| vm.id == id) {
                return Err(ContractError::InvalidVerificationMethod);
            }
        }
        for id in &assertion_method {
            if !record.verification_methods.iter().any(|vm| vm.id == id) {
                return Err(ContractError::InvalidVerificationMethod);
            }
        }

        record.authentication = authentication;
        record.assertion_method = assertion_method;
        record.updated = env.ledger().timestamp();
        record.version += 1;
        write_did_record(&env, &controller, &record);

        DidUpdated {
            controller: controller.clone(),
            version: record.version,
        }
        .publish(&env);

        Ok(())
    }

    /// Add a service endpoint to a DID.
    ///
    /// Requires authorization from `controller`. The service id must be
    /// unique within the DID (max 128 bytes), the kind at most 128 bytes,
    /// and the endpoint an `https://` URL of at most 512 bytes. At most 10
    /// services per DID (`LimitExceeded`). Bumps `updated`/`version` and
    /// emits a `did/updated` event.
    pub fn add_service(env: Env, controller: Address, svc: Service) -> Result<(), ContractError> {
        controller.require_auth();

        let mut record = read_did_record(&env, &controller)?;
        if record.controller != controller {
            return Err(ContractError::Unauthorized);
        }
        if record.deactivated {
            return Err(ContractError::Deactivated);
        }
        if svc.id.len() > MAX_ID_LENGTH {
            return Err(ContractError::InvalidInput);
        }
        if svc.kind.len() > MAX_ID_LENGTH {
            return Err(ContractError::InvalidInput);
        }
        if svc.endpoint.len() > MAX_ENDPOINT_LENGTH {
            return Err(ContractError::InvalidInput);
        }
        if !Self::is_https_endpoint(&env, &svc.endpoint) {
            return Err(ContractError::InvalidInput);
        }
        if record.services.iter().any(|existing| existing.id == svc.id) {
            return Err(ContractError::AlreadyExists);
        }
        if record.services.len() >= MAX_SERVICES {
            return Err(ContractError::LimitExceeded);
        }

        record.services.push_back(svc);
        record.updated = env.ledger().timestamp();
        record.version += 1;
        write_did_record(&env, &controller, &record);

        DidUpdated {
            controller: controller.clone(),
            version: record.version,
        }
        .publish(&env);

        Ok(())
    }

    /// Remove a service endpoint from a DID.
    ///
    /// Requires authorization from `controller`. Returns `NotFound` for an
    /// unknown service id. Bumps `updated`/`version` and emits a
    /// `did/updated` event.
    pub fn remove_service(
        env: Env,
        controller: Address,
        svc_id: String,
    ) -> Result<(), ContractError> {
        controller.require_auth();

        let mut record = read_did_record(&env, &controller)?;
        if record.controller != controller {
            return Err(ContractError::Unauthorized);
        }
        if record.deactivated {
            return Err(ContractError::Deactivated);
        }

        let index = record
            .services
            .iter()
            .position(|svc| svc.id == svc_id)
            .map(|pos| pos as u32);
        let index = match index {
            Some(index) => index,
            None => return Err(ContractError::NotFound),
        };
        // Out-of-bounds cannot happen: `index` came from the search above.
        if record.services.remove(index).is_none() {
            return Err(ContractError::NotFound);
        }

        record.updated = env.ledger().timestamp();
        record.version += 1;
        write_did_record(&env, &controller, &record);

        DidUpdated {
            controller: controller.clone(),
            version: record.version,
        }
        .publish(&env);

        Ok(())
    }

    /// Anchor a credential hash on-chain.
    ///
    /// Stores the SHA-256 hash of the JCS-canonicalized credential JSON
    /// (see `docs/METHOD_SPEC.md` §6) with an optional expiry timestamp.
    /// The credential contents themselves stay off-chain — never any PII
    /// on-chain.
    ///
    /// Requires authorization from `issuer`, who must own a non-deactivated
    /// DID. Returns `AlreadyExists` if this `(issuer, hash)` pair was
    /// already anchored — a revoked credential can never be re-anchored.
    /// Emits a `cred/anchored` event.
    pub fn anchor_credential(
        env: Env,
        issuer: Address,
        credential_hash: BytesN<32>,
        expires_at: Option<u64>,
    ) -> Result<(), ContractError> {
        issuer.require_auth();

        let issuer_did = read_did_record(&env, &issuer)?;
        if issuer_did.deactivated {
            return Err(ContractError::Deactivated);
        }

        if has_credential_record(&env, &issuer, &credential_hash) {
            return Err(ContractError::AlreadyExists);
        }

        let record = CredentialRecord {
            issuer: issuer.clone(),
            hash: credential_hash.clone(),
            anchored_at: env.ledger().timestamp(),
            expires_at,
            revoked: false,
        };
        write_credential_record(&env, &issuer, &credential_hash, &record);

        CredentialAnchored {
            issuer: issuer.clone(),
            hash: credential_hash,
            expires_at,
        }
        .publish(&env);

        Ok(())
    }

    /// Revoke a previously anchored credential.
    ///
    /// Requires authorization from `issuer` (the address that anchored the
    /// hash). Revocation is terminal: the record stays stored with the
    /// revoked flag set, so `credential_status` keeps reporting `Revoked`
    /// and the hash can never be re-anchored. Emits a `cred/revoked` event.
    pub fn revoke_credential(
        env: Env,
        issuer: Address,
        credential_hash: BytesN<32>,
    ) -> Result<(), ContractError> {
        issuer.require_auth();

        let mut record = read_credential_record(&env, &issuer, &credential_hash)?;
        if record.revoked {
            return Err(ContractError::Revoked);
        }
        record.revoked = true;
        write_credential_record(&env, &issuer, &credential_hash, &record);

        CredentialRevoked {
            issuer: issuer.clone(),
            hash: credential_hash,
        }
        .publish(&env);

        Ok(())
    }

    /// Return the on-chain status of a credential hash (read-only, no auth).
    ///
    /// - `Unknown`: never anchored under this `(issuer, hash)` pair.
    /// - `Active`: anchored, not revoked, not expired.
    /// - `Revoked`: explicitly revoked (terminal, takes precedence over expiry).
    /// - `Expired`: past `expires_at` per the current ledger timestamp.
    /// Verify an Ed25519 credential proof against the issuer's DID.
    ///
    /// Loads the issuer's DID (must exist and not be deactivated), finds
    /// `vm_id` in the DID's `assertion_method` relationship, and runs
    /// Ed25519 signature verification of `signature` over `message_hash`
    /// with that verification method's public key. `message_hash` is the
    /// SHA-256 of the JCS-canonicalized credential JSON (see
    /// `docs/METHOD_SPEC.md` §6).
    ///
    /// **Trap behaviour:** Soroban's `env.crypto().ed25519_verify` traps
    /// (fails the whole transaction or simulation) on an invalid signature
    /// instead of returning false. This function therefore returns `Ok(())`
    /// on success, a `ContractError` for DID/key problems (`NotFound`,
    /// `Deactivated`, `InvalidVerificationMethod`), or traps for a bad
    /// signature. Verifiers must treat a trap as "invalid proof". The client
    /// SDK documents this in its `verifyCredential` reference.
    // TODO(wave: core-2): additional proof types (secp256r1/passkey, BBS+)
    // plug in here by dispatching on `VerificationMethod.kind`; the v1
    // Ed25519 path stays as the default.
    pub fn verify_credential_proof(
        env: Env,
        issuer: Address,
        vm_id: String,
        message_hash: BytesN<32>,
        signature: BytesN<64>,
    ) -> Result<(), ContractError> {
        let issuer_did = read_did_record(&env, &issuer)?;
        if issuer_did.deactivated {
            return Err(ContractError::Deactivated);
        }
        if !issuer_did.assertion_method.iter().any(|id| id == vm_id) {
            return Err(ContractError::InvalidVerificationMethod);
        }
        let vm = issuer_did
            .verification_methods
            .iter()
            .find(|vm| vm.id == vm_id)
            .ok_or(ContractError::InvalidVerificationMethod)?;
        // v1 supports Ed25519 only; `create_did` already enforces this, so
        // this is defense-in-depth until core-2 adds proof-type dispatch.
        if vm.kind != Symbol::new(&env, "Ed25519") {
            return Err(ContractError::InvalidVerificationMethod);
        }
        let message = Bytes::from_slice(&env, &message_hash.to_array());
        env.crypto()
            .ed25519_verify(&vm.public_key, &message, &signature);
        Ok(())
    }

    // TODO(wave: core-3): batched revocation lists plug in here — the
    // public signature stays stable while internals gain index lookups.
    pub fn credential_status(
        env: Env,
        issuer: Address,
        credential_hash: BytesN<32>,
    ) -> CredentialStatus {
        let record = match read_credential_record(&env, &issuer, &credential_hash) {
            Ok(record) => record,
            Err(_) => return CredentialStatus::Unknown,
        };
        if record.revoked {
            return CredentialStatus::Revoked;
        }
        if let Some(expires_at) = record.expires_at {
            if env.ledger().timestamp() >= expires_at {
                return CredentialStatus::Expired;
            }
        }
        CredentialStatus::Active
    }

    /// Check that a service endpoint is an `https://` URL.
    fn is_https_endpoint(env: &Env, endpoint: &String) -> bool {
        let endpoint_bytes = endpoint.to_bytes();
        endpoint_bytes.len() >= 8
            && endpoint_bytes.slice(0..8) == Bytes::from_slice(env, b"https://")
    }

    fn validate_new_doc(env: &Env, doc: &NewDidDoc) -> Result<(), ContractError> {
        if doc.verification_methods.len() > MAX_VERIFICATION_METHODS {
            return Err(ContractError::InvalidInput);
        }
        if doc.services.len() > MAX_SERVICES {
            return Err(ContractError::InvalidInput);
        }

        let mut seen_vm_ids = Vec::new(env);
        for vm in &doc.verification_methods {
            if vm.id.len() > MAX_ID_LENGTH {
                return Err(ContractError::InvalidInput);
            }
            if seen_vm_ids.iter().any(|id| id == vm.id) {
                return Err(ContractError::InvalidInput);
            }
            seen_vm_ids.push_back(vm.id.clone());

            if vm.kind != Symbol::new(env, "Ed25519") {
                return Err(ContractError::InvalidInput);
            }
        }

        for auth_id in &doc.authentication {
            if !doc.verification_methods.iter().any(|vm| vm.id == auth_id) {
                return Err(ContractError::InvalidInput);
            }
        }

        for assertion_id in &doc.assertion_method {
            if !doc
                .verification_methods
                .iter()
                .any(|vm| vm.id == assertion_id)
            {
                return Err(ContractError::InvalidInput);
            }
        }

        let mut seen_svc_ids = Vec::new(env);
        for svc in &doc.services {
            if svc.id.len() > MAX_ID_LENGTH {
                return Err(ContractError::InvalidInput);
            }
            if seen_svc_ids.iter().any(|id| id == svc.id) {
                return Err(ContractError::InvalidInput);
            }
            seen_svc_ids.push_back(svc.id.clone());

            if svc.endpoint.len() > MAX_ENDPOINT_LENGTH {
                return Err(ContractError::InvalidInput);
            }
            if !Self::is_https_endpoint(env, &svc.endpoint) {
                return Err(ContractError::InvalidInput);
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    extern crate alloc;
    use alloc::format;

    use super::*;
    use crate::types::{Service, VerificationMethod};
    use ed25519_dalek::{Signer as _, SigningKey};
    use sha2::Digest as _;
    use soroban_sdk::{
        testutils::{Address as _, Events as _, Ledger as _},
        Address, BytesN, Env, String, Symbol, Vec,
    };

    /// JCS-canonicalized (RFC 8785) form of the example credential shared
    /// with `docs/test-vectors.json`. Keys sorted, no whitespace. The same
    /// string is hashed (SHA-256) in both the contract tests and the vectors
    /// file so the client SDK can prove cross-language compatibility.
    const TEST_CREDENTIAL_CANONICAL: &str = "{\"credentialSubject\":{\"degree\":\"Bachelor of Science\",\"id\":\"did:stellar:testnet:GDEF_______________\"},\"id\":\"http://example.edu/credentials/3732\",\"issuanceDate\":\"2026-01-01T00:00:00Z\",\"issuer\":\"did:stellar:testnet:GABC_______________\",\"type\":[\"VerifiableCredential\"]}";

    /// Fixed test signing key (seeded, deterministic — never a real key).
    const TEST_SIGNING_SEED: [u8; 32] = [42u8; 32];

    fn test_signing_key() -> SigningKey {
        SigningKey::from_bytes(&TEST_SIGNING_SEED)
    }

    fn sha256_of(data: &[u8]) -> [u8; 32] {
        let mut hasher = sha2::Sha256::new();
        hasher.update(data);
        hasher.finalize().into()
    }

    fn create_issuer_did_with_key(
        env: &Env,
        client: &IdentityContractClient<'_>,
        issuer: &Address,
        public_key: &[u8; 32],
    ) {
        let vm = VerificationMethod {
            id: String::from_str(env, "key-1"),
            kind: Symbol::new(env, "Ed25519"),
            public_key: BytesN::from_array(env, public_key),
        };
        let doc = NewDidDoc {
            controller: issuer.clone(),
            verification_methods: Vec::from_array(env, [vm]),
            authentication: Vec::from_array(env, [String::from_str(env, "key-1")]),
            assertion_method: Vec::from_array(env, [String::from_str(env, "key-1")]),
            services: Vec::new(env),
        };
        client.create_did(issuer, &doc);
    }

    fn create_test_vm(env: &Env, id: &str, key_bytes: [u8; 32]) -> VerificationMethod {
        VerificationMethod {
            id: String::from_str(env, id),
            kind: Symbol::new(env, "Ed25519"),
            public_key: BytesN::from_array(env, &key_bytes),
        }
    }

    fn create_test_svc(env: &Env, id: &str, kind: &str, endpoint: &str) -> Service {
        Service {
            id: String::from_str(env, id),
            kind: String::from_str(env, kind),
            endpoint: String::from_str(env, endpoint),
        }
    }

    fn setup_contract(env: &Env) -> IdentityContractClient<'_> {
        let contract_id = env.register(IdentityContract, ());
        let client = IdentityContractClient::new(env, &contract_id);
        client
    }

    #[test]
    fn create_did_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        let vm = create_test_vm(&env, "key-1", [1u8; 32]);
        let svc = create_test_svc(
            &env,
            "cred-1",
            "VerifiableCredentialService",
            "https://example.com/cred",
        );

        let doc = NewDidDoc {
            controller: controller.clone(),
            verification_methods: Vec::from_array(&env, [vm]),
            authentication: Vec::from_array(&env, [String::from_str(&env, "key-1")]),
            assertion_method: Vec::from_array(&env, [String::from_str(&env, "key-1")]),
            services: Vec::from_array(&env, [svc]),
        };

        client.create_did(&controller, &doc);

        let record = client.resolve(&controller);
        assert_eq!(record.controller, controller);
        assert_eq!(record.version, 1);
        assert!(!record.deactivated);
        assert_eq!(record.verification_methods.len(), 1);
        assert_eq!(record.authentication.len(), 1);
        assert_eq!(record.assertion_method.len(), 1);
        assert_eq!(record.services.len(), 1);
    }

    #[test]
    fn create_did_duplicate_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        let vm = create_test_vm(&env, "key-1", [1u8; 32]);

        let doc = NewDidDoc {
            controller: controller.clone(),
            verification_methods: Vec::from_array(&env, [vm.clone()]),
            authentication: Vec::from_array(&env, [String::from_str(&env, "key-1")]),
            assertion_method: Vec::from_array(&env, [String::from_str(&env, "key-1")]),
            services: Vec::new(&env),
        };

        client.create_did(&controller, &doc.clone());
        let result = client.try_create_did(&controller, &doc);
        assert_eq!(result, Err(Ok(ContractError::AlreadyExists)));
    }

    #[test]
    fn create_did_too_many_vms_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        let mut vms = Vec::new(&env);
        let mut auth_ids = Vec::new(&env);

        for i in 0..11 {
            let key_bytes = [i as u8; 32];
            vms.push_back(create_test_vm(&env, &format!("key-{}", i), key_bytes));
            auth_ids.push_back(String::from_str(&env, &format!("key-{}", i)));
        }

        let doc = NewDidDoc {
            controller: controller.clone(),
            verification_methods: vms,
            authentication: auth_ids,
            assertion_method: Vec::new(&env),
            services: Vec::new(&env),
        };

        let result = client.try_create_did(&controller, &doc);
        assert_eq!(result, Err(Ok(ContractError::InvalidInput)));
    }

    #[test]
    fn create_did_unknown_vm_in_auth_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        let vm = create_test_vm(&env, "key-1", [1u8; 32]);

        let doc = NewDidDoc {
            controller: controller.clone(),
            verification_methods: Vec::from_array(&env, [vm]),
            authentication: Vec::from_array(&env, [String::from_str(&env, "key-99")]),
            assertion_method: Vec::new(&env),
            services: Vec::new(&env),
        };

        let result = client.try_create_did(&controller, &doc);
        assert_eq!(result, Err(Ok(ContractError::InvalidInput)));
    }

    #[test]
    fn create_did_invalid_kind_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        let mut vm = create_test_vm(&env, "key-1", [1u8; 32]);
        vm.kind = Symbol::new(&env, "Invalid");

        let doc = NewDidDoc {
            controller: controller.clone(),
            verification_methods: Vec::from_array(&env, [vm]),
            authentication: Vec::from_array(&env, [String::from_str(&env, "key-1")]),
            assertion_method: Vec::new(&env),
            services: Vec::new(&env),
        };

        let result = client.try_create_did(&controller, &doc);
        assert_eq!(result, Err(Ok(ContractError::InvalidInput)));
    }

    #[test]
    fn create_did_http_endpoint_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        let vm = create_test_vm(&env, "key-1", [1u8; 32]);
        let svc = create_test_svc(&env, "svc-1", "Test", "http://example.com");

        let doc = NewDidDoc {
            controller: controller.clone(),
            verification_methods: Vec::from_array(&env, [vm]),
            authentication: Vec::from_array(&env, [String::from_str(&env, "key-1")]),
            assertion_method: Vec::new(&env),
            services: Vec::from_array(&env, [svc]),
        };

        let result = client.try_create_did(&controller, &doc);
        assert_eq!(result, Err(Ok(ContractError::InvalidInput)));
    }

    #[test]
    fn resolve_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        let vm = create_test_vm(&env, "key-1", [1u8; 32]);

        let doc = NewDidDoc {
            controller: controller.clone(),
            verification_methods: Vec::from_array(&env, [vm]),
            authentication: Vec::from_array(&env, [String::from_str(&env, "key-1")]),
            assertion_method: Vec::new(&env),
            services: Vec::new(&env),
        };

        client.create_did(&controller, &doc);
        let record = client.resolve(&controller);

        assert_eq!(record.controller, controller);
        assert_eq!(record.version, 1);
        assert!(!record.deactivated);
    }

    #[test]
    fn resolve_not_found() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);

        let result = client.try_resolve(&controller);
        assert_eq!(result, Err(Ok(ContractError::NotFound)));
    }

    fn create_issuer_did(env: &Env, client: &IdentityContractClient<'_>, issuer: &Address) {
        let vm = create_test_vm(env, "key-1", [2u8; 32]);
        let doc = NewDidDoc {
            controller: issuer.clone(),
            verification_methods: Vec::from_array(env, [vm]),
            authentication: Vec::from_array(env, [String::from_str(env, "key-1")]),
            assertion_method: Vec::from_array(env, [String::from_str(env, "key-1")]),
            services: Vec::new(env),
        };
        client.create_did(issuer, &doc);
    }

    /// Assert the most recent invocation emitted exactly one event whose
    /// first topic is `expected_topic` (the snake_case event name, e.g.
    /// `"credential_anchored"`). Must be called before any further contract
    /// invocation: in SDK 28's test env, `events().all()` reflects the most
    /// recent invocation only.
    fn assert_last_event(env: &Env, expected_topic: &str) {
        let events = env.events().all();
        let evts = events.events();
        assert_eq!(evts.len(), 1, "expected exactly one event");
        let debug = format!("{:?}", evts[0]);
        assert!(
            debug.contains(expected_topic),
            "expected topic {expected_topic}, got: {debug}"
        );
    }

    fn create_did_with_vms(
        env: &Env,
        client: &IdentityContractClient<'_>,
        controller: &Address,
        vm_ids: &[&str],
        auth_ids: &[&str],
        assertion_ids: &[&str],
    ) {
        let mut vms = Vec::new(env);
        for (i, id) in vm_ids.iter().enumerate() {
            vms.push_back(create_test_vm(env, id, [(i as u8) + 1; 32]));
        }
        let mut auth = Vec::new(env);
        for id in auth_ids {
            auth.push_back(String::from_str(env, id));
        }
        let mut assertion = Vec::new(env);
        for id in assertion_ids {
            assertion.push_back(String::from_str(env, id));
        }
        let doc = NewDidDoc {
            controller: controller.clone(),
            verification_methods: vms,
            authentication: auth,
            assertion_method: assertion,
            services: Vec::new(env),
        };
        client.create_did(controller, &doc);
    }

    #[test]
    fn add_verification_method_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        env.ledger().set_timestamp(100);
        let vm = create_test_vm(&env, "key-2", [9u8; 32]);
        client.add_verification_method(&controller, &vm);
        assert_last_event(&env, "did_updated");

        let record = client.resolve(&controller);
        assert_eq!(record.verification_methods.len(), 2);
        assert_eq!(record.version, 2);
        assert_eq!(record.updated, 100);
    }

    #[test]
    fn add_verification_method_duplicate_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        let vm = create_test_vm(&env, "key-1", [9u8; 32]);
        let result = client.try_add_verification_method(&controller, &vm);
        assert_eq!(result, Err(Ok(ContractError::AlreadyExists)));
    }

    #[test]
    fn add_verification_method_limit_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        let ids = ["k0", "k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8", "k9"];
        create_did_with_vms(&env, &client, &controller, &ids, &[], &[]);

        let vm = create_test_vm(&env, "k10", [9u8; 32]);
        let result = client.try_add_verification_method(&controller, &vm);
        assert_eq!(result, Err(Ok(ContractError::LimitExceeded)));
    }

    #[test]
    fn add_verification_method_bad_kind_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        let mut vm = create_test_vm(&env, "key-2", [9u8; 32]);
        vm.kind = Symbol::new(&env, "Invalid");
        let result = client.try_add_verification_method(&controller, &vm);
        assert_eq!(result, Err(Ok(ContractError::InvalidInput)));
    }

    #[test]
    fn add_verification_method_no_auth_fails() {
        // No mock_all_auths: require_auth must fail for an unsigned call.
        let env = Env::default();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        let vm = create_test_vm(&env, "key-1", [9u8; 32]);
        let result = client.try_add_verification_method(&controller, &vm);
        assert!(result.is_err(), "unsigned call must fail, got {result:?}");
    }

    #[test]
    fn remove_verification_method_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1", "key-2"], &[], &[]);

        client.remove_verification_method(&controller, &String::from_str(&env, "key-1"));
        assert_last_event(&env, "did_updated");

        let record = client.resolve(&controller);
        assert_eq!(record.verification_methods.len(), 1);
        assert_eq!(
            record.verification_methods.get(0).unwrap().id,
            String::from_str(&env, "key-2")
        );
        assert_eq!(record.version, 2);
    }

    #[test]
    fn remove_verification_method_referenced_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(
            &env,
            &client,
            &controller,
            &["key-1"],
            &["key-1"],
            &["key-1"],
        );

        let result =
            client.try_remove_verification_method(&controller, &String::from_str(&env, "key-1"));
        assert_eq!(result, Err(Ok(ContractError::InvalidVerificationMethod)));
    }

    #[test]
    fn remove_verification_method_unknown_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        let result =
            client.try_remove_verification_method(&controller, &String::from_str(&env, "key-99"));
        assert_eq!(result, Err(Ok(ContractError::NotFound)));
    }

    fn create_test_svc_full(env: &Env, id: &str) -> crate::types::Service {
        create_test_svc(env, id, "TestKind", "https://example.com/svc")
    }

    #[test]
    fn add_service_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        let svc = create_test_svc_full(&env, "svc-1");
        client.add_service(&controller, &svc);
        assert_last_event(&env, "did_updated");

        let record = client.resolve(&controller);
        assert_eq!(record.services.len(), 1);
        assert_eq!(record.version, 2);
    }

    #[test]
    fn add_service_duplicate_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        let svc = create_test_svc_full(&env, "svc-1");
        client.add_service(&controller, &svc);
        let result = client.try_add_service(&controller, &svc);
        assert_eq!(result, Err(Ok(ContractError::AlreadyExists)));
    }

    #[test]
    fn add_service_limit_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        for i in 0..10 {
            let svc = create_test_svc_full(&env, &format!("svc-{i}"));
            client.add_service(&controller, &svc);
        }
        let svc = create_test_svc_full(&env, "svc-10");
        let result = client.try_add_service(&controller, &svc);
        assert_eq!(result, Err(Ok(ContractError::LimitExceeded)));
    }

    #[test]
    fn add_service_http_endpoint_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        let svc = create_test_svc(&env, "svc-1", "TestKind", "http://example.com/svc");
        let result = client.try_add_service(&controller, &svc);
        assert_eq!(result, Err(Ok(ContractError::InvalidInput)));
    }

    #[test]
    fn remove_service_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        let svc = create_test_svc_full(&env, "svc-1");
        client.add_service(&controller, &svc);
        client.remove_service(&controller, &String::from_str(&env, "svc-1"));
        assert_last_event(&env, "did_updated");

        let record = client.resolve(&controller);
        assert_eq!(record.services.len(), 0);
        assert_eq!(record.version, 3);
    }

    #[test]
    fn remove_service_unknown_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        let result = client.try_remove_service(&controller, &String::from_str(&env, "svc-99"));
        assert_eq!(result, Err(Ok(ContractError::NotFound)));
    }

    #[test]
    fn deactivate_did_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        client.deactivate_did(&controller);
        assert_last_event(&env, "did_deactivated");

        // Resolve still works and shows the tombstone flag.
        let record = client.resolve(&controller);
        assert!(record.deactivated);
        assert_eq!(record.version, 2);
    }

    #[test]
    fn deactivate_did_double_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        client.deactivate_did(&controller);
        let result = client.try_deactivate_did(&controller);
        assert_eq!(result, Err(Ok(ContractError::Deactivated)));
    }

    #[test]
    fn deactivated_did_rejects_mutations() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(
            &env,
            &client,
            &controller,
            &["key-1"],
            &["key-1"],
            &["key-1"],
        );
        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.anchor_credential(&controller, &hash, &None);
        client.deactivate_did(&controller);

        // Every state-changing DID operation must fail with Deactivated.
        let vm = create_test_vm(&env, "key-2", [9u8; 32]);
        assert_eq!(
            client.try_add_verification_method(&controller, &vm),
            Err(Ok(ContractError::Deactivated))
        );
        assert_eq!(
            client.try_remove_verification_method(&controller, &String::from_str(&env, "key-1")),
            Err(Ok(ContractError::Deactivated))
        );
        let empty = Vec::new(&env);
        assert_eq!(
            client.try_set_relationships(&controller, &empty, &empty),
            Err(Ok(ContractError::Deactivated))
        );
        let svc = create_test_svc_full(&env, "svc-1");
        assert_eq!(
            client.try_add_service(&controller, &svc),
            Err(Ok(ContractError::Deactivated))
        );
        assert_eq!(
            client.try_remove_service(&controller, &String::from_str(&env, "svc-1")),
            Err(Ok(ContractError::Deactivated))
        );
        let hash2 = BytesN::from_array(&env, &[8u8; 32]);
        assert_eq!(
            client.try_anchor_credential(&controller, &hash2, &None),
            Err(Ok(ContractError::Deactivated))
        );
        // resolve still works.
        assert!(client.resolve(&controller).deactivated);
    }

    #[test]
    fn revoke_after_deactivate_still_works() {
        // Revocation destroys trust rather than creating it, so it stays
        // available as a safety action after deactivation.
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_issuer_did(&env, &client, &controller);
        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.anchor_credential(&controller, &hash, &None);
        client.deactivate_did(&controller);

        client.revoke_credential(&controller, &hash);
        let status = client.credential_status(&controller, &hash);
        assert_eq!(status, CredentialStatus::Revoked);
    }

    #[test]
    fn verify_after_deactivate_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let signing_key = test_signing_key();
        let public_bytes: [u8; 32] = signing_key.verifying_key().to_bytes();
        let issuer = Address::generate(&env);
        create_issuer_did_with_key(&env, &client, &issuer, &public_bytes);
        client.deactivate_did(&issuer);

        let message_hash = sha256_of(TEST_CREDENTIAL_CANONICAL.as_bytes());
        let signature = signing_key.sign(&message_hash);
        let signature_bytes: [u8; 64] = signature.to_bytes();

        let result = client.try_verify_credential_proof(
            &issuer,
            &String::from_str(&env, "key-1"),
            &BytesN::from_array(&env, &message_hash),
            &BytesN::from_array(&env, &signature_bytes),
        );
        assert_eq!(result, Err(Ok(ContractError::Deactivated)));
    }

    #[test]
    fn set_relationships_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1", "key-2"], &[], &[]);

        let auth = Vec::from_array(&env, [String::from_str(&env, "key-1")]);
        let assertion = Vec::from_array(&env, [String::from_str(&env, "key-2")]);
        client.set_relationships(&controller, &auth, &assertion);
        assert_last_event(&env, "did_updated");

        let record = client.resolve(&controller);
        assert_eq!(record.authentication.len(), 1);
        assert_eq!(
            record.authentication.get(0).unwrap(),
            String::from_str(&env, "key-1")
        );
        assert_eq!(record.assertion_method.len(), 1);
        assert_eq!(record.version, 2);
    }

    #[test]
    fn set_relationships_unknown_vm_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        create_did_with_vms(&env, &client, &controller, &["key-1"], &[], &[]);

        let auth = Vec::from_array(&env, [String::from_str(&env, "key-99")]);
        let assertion = Vec::new(&env);
        let result = client.try_set_relationships(&controller, &auth, &assertion);
        assert_eq!(result, Err(Ok(ContractError::InvalidVerificationMethod)));
    }

    #[test]
    fn set_relationships_no_auth_fails() {
        let env = Env::default();
        let client = setup_contract(&env);

        let controller = Address::generate(&env);
        let auth = Vec::new(&env);
        let assertion = Vec::new(&env);
        let result = client.try_set_relationships(&controller, &auth, &assertion);
        assert!(result.is_err(), "unsigned call must fail, got {result:?}");
    }

    #[test]
    fn anchor_credential_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        create_issuer_did(&env, &client, &issuer);

        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.anchor_credential(&issuer, &hash, &None);
        assert_last_event(&env, "credential_anchored");

        let status = client.credential_status(&issuer, &hash);
        assert_eq!(status, CredentialStatus::Active);
    }

    #[test]
    fn anchor_credential_duplicate_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        create_issuer_did(&env, &client, &issuer);

        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.anchor_credential(&issuer, &hash, &None);

        let result = client.try_anchor_credential(&issuer, &hash, &None);
        assert_eq!(result, Err(Ok(ContractError::AlreadyExists)));
    }

    #[test]
    fn anchor_credential_no_did_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        let hash = BytesN::from_array(&env, &[7u8; 32]);

        let result = client.try_anchor_credential(&issuer, &hash, &None);
        assert_eq!(result, Err(Ok(ContractError::NotFound)));
    }

    #[test]
    fn anchor_revoked_cannot_reanchor() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        create_issuer_did(&env, &client, &issuer);

        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.anchor_credential(&issuer, &hash, &None);
        client.revoke_credential(&issuer, &hash);

        let result = client.try_anchor_credential(&issuer, &hash, &None);
        assert_eq!(result, Err(Ok(ContractError::AlreadyExists)));

        // Status stays Revoked even after the failed re-anchor.
        let status = client.credential_status(&issuer, &hash);
        assert_eq!(status, CredentialStatus::Revoked);
    }

    #[test]
    fn revoke_credential_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        create_issuer_did(&env, &client, &issuer);

        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.anchor_credential(&issuer, &hash, &None);
        assert_last_event(&env, "credential_anchored");
        client.revoke_credential(&issuer, &hash);
        assert_last_event(&env, "credential_revoked");

        let status = client.credential_status(&issuer, &hash);
        assert_eq!(status, CredentialStatus::Revoked);
    }

    #[test]
    fn revoke_unknown_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        create_issuer_did(&env, &client, &issuer);

        let hash = BytesN::from_array(&env, &[7u8; 32]);
        let result = client.try_revoke_credential(&issuer, &hash);
        assert_eq!(result, Err(Ok(ContractError::NotFound)));
    }

    #[test]
    fn revoke_double_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        create_issuer_did(&env, &client, &issuer);

        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.anchor_credential(&issuer, &hash, &None);
        client.revoke_credential(&issuer, &hash);

        let result = client.try_revoke_credential(&issuer, &hash);
        assert_eq!(result, Err(Ok(ContractError::Revoked)));
    }

    #[test]
    fn revoke_by_non_issuer_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        create_issuer_did(&env, &client, &alice);
        create_issuer_did(&env, &client, &bob);

        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.anchor_credential(&alice, &hash, &None);

        // Bob's (issuer, hash) pair was never anchored: per-issuer isolation.
        let result = client.try_revoke_credential(&bob, &hash);
        assert_eq!(result, Err(Ok(ContractError::NotFound)));

        // Alice's credential is untouched.
        let status = client.credential_status(&alice, &hash);
        assert_eq!(status, CredentialStatus::Active);
    }

    #[test]
    fn credential_status_unknown() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        let hash = BytesN::from_array(&env, &[7u8; 32]);

        let status = client.credential_status(&issuer, &hash);
        assert_eq!(status, CredentialStatus::Unknown);
    }

    #[test]
    fn credential_status_expired() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        create_issuer_did(&env, &client, &issuer);

        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.anchor_credential(&issuer, &hash, &Some(100));

        // Ledger starts at timestamp 0: not yet expired.
        let status = client.credential_status(&issuer, &hash);
        assert_eq!(status, CredentialStatus::Active);

        env.ledger().set_timestamp(99);
        let status = client.credential_status(&issuer, &hash);
        assert_eq!(status, CredentialStatus::Active);

        // Expiry is inclusive: timestamp >= expires_at counts as expired.
        env.ledger().set_timestamp(100);
        let status = client.credential_status(&issuer, &hash);
        assert_eq!(status, CredentialStatus::Expired);
    }

    #[test]
    fn verify_credential_proof_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let signing_key = test_signing_key();
        let public_bytes: [u8; 32] = signing_key.verifying_key().to_bytes();

        let issuer = Address::generate(&env);
        create_issuer_did_with_key(&env, &client, &issuer, &public_bytes);

        let message_hash = sha256_of(TEST_CREDENTIAL_CANONICAL.as_bytes());
        let signature = signing_key.sign(&message_hash);
        let signature_bytes: [u8; 64] = signature.to_bytes();

        // Success is silent (client unwraps Ok); any failure would panic.
        client.verify_credential_proof(
            &issuer,
            &String::from_str(&env, "key-1"),
            &BytesN::from_array(&env, &message_hash),
            &BytesN::from_array(&env, &signature_bytes),
        );
    }

    #[test]
    fn verify_credential_proof_wrong_key_traps() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        // DID holds key A, but the message is signed by key B.
        let key_a = SigningKey::from_bytes(&[1u8; 32]);
        let key_b = SigningKey::from_bytes(&[2u8; 32]);
        let public_a: [u8; 32] = key_a.verifying_key().to_bytes();

        let issuer = Address::generate(&env);
        create_issuer_did_with_key(&env, &client, &issuer, &public_a);

        let message_hash = sha256_of(TEST_CREDENTIAL_CANONICAL.as_bytes());
        let bad_sig = key_b.sign(&message_hash);
        let bad_sig_bytes: [u8; 64] = bad_sig.to_bytes();

        // ed25519_verify traps on a bad signature instead of returning an
        // error, so `try_` surfaces a host error (outer Err), never a
        // declared ContractError and never Ok.
        let result = client.try_verify_credential_proof(
            &issuer,
            &String::from_str(&env, "key-1"),
            &BytesN::from_array(&env, &message_hash),
            &BytesN::from_array(&env, &bad_sig_bytes),
        );
        assert!(result.is_err(), "bad signature must fail, got {result:?}");
        assert_ne!(result, Ok(Ok(())), "bad signature must not verify");
    }

    #[test]
    fn verify_credential_proof_vm_not_in_assertion_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        // DID with key-1 in `authentication` only, not `assertion_method`.
        let signing_key = test_signing_key();
        let public_bytes: [u8; 32] = signing_key.verifying_key().to_bytes();
        let vm = VerificationMethod {
            id: String::from_str(&env, "key-1"),
            kind: Symbol::new(&env, "Ed25519"),
            public_key: BytesN::from_array(&env, &public_bytes),
        };
        let issuer = Address::generate(&env);
        let doc = NewDidDoc {
            controller: issuer.clone(),
            verification_methods: Vec::from_array(&env, [vm]),
            authentication: Vec::from_array(&env, [String::from_str(&env, "key-1")]),
            assertion_method: Vec::new(&env),
            services: Vec::new(&env),
        };
        client.create_did(&issuer, &doc);

        let message_hash = sha256_of(TEST_CREDENTIAL_CANONICAL.as_bytes());
        let signature = signing_key.sign(&message_hash);
        let signature_bytes: [u8; 64] = signature.to_bytes();

        let result = client.try_verify_credential_proof(
            &issuer,
            &String::from_str(&env, "key-1"),
            &BytesN::from_array(&env, &message_hash),
            &BytesN::from_array(&env, &signature_bytes),
        );
        assert_eq!(result, Err(Ok(ContractError::InvalidVerificationMethod)));
    }

    #[test]
    fn verify_credential_proof_unknown_vm_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let signing_key = test_signing_key();
        let public_bytes: [u8; 32] = signing_key.verifying_key().to_bytes();

        let issuer = Address::generate(&env);
        create_issuer_did_with_key(&env, &client, &issuer, &public_bytes);

        let message_hash = sha256_of(TEST_CREDENTIAL_CANONICAL.as_bytes());
        let signature = signing_key.sign(&message_hash);
        let signature_bytes: [u8; 64] = signature.to_bytes();

        let result = client.try_verify_credential_proof(
            &issuer,
            &String::from_str(&env, "key-99"),
            &BytesN::from_array(&env, &message_hash),
            &BytesN::from_array(&env, &signature_bytes),
        );
        assert_eq!(result, Err(Ok(ContractError::InvalidVerificationMethod)));
    }

    #[test]
    fn verify_credential_proof_no_did_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        let result = client.try_verify_credential_proof(
            &issuer,
            &String::from_str(&env, "key-1"),
            &BytesN::from_array(&env, &[5u8; 32]),
            &BytesN::from_array(&env, &[6u8; 64]),
        );
        assert_eq!(result, Err(Ok(ContractError::NotFound)));
    }

    #[test]
    fn revoked_takes_precedence_over_expired() {
        let env = Env::default();
        env.mock_all_auths();
        let client = setup_contract(&env);

        let issuer = Address::generate(&env);
        create_issuer_did(&env, &client, &issuer);

        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.anchor_credential(&issuer, &hash, &Some(100));
        client.revoke_credential(&issuer, &hash);

        env.ledger().set_timestamp(200);
        let status = client.credential_status(&issuer, &hash);
        assert_eq!(status, CredentialStatus::Revoked);
    }
}
