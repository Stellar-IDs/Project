use soroban_sdk::{Address, BytesN, Env};

use crate::error::ContractError;

// TODO(wave: core-4): resource-fee optimization (fewer reads/writes/bytes)
// happens in this storage layer; `docs/COSTS.md` is the baseline.
use crate::types::{CredentialRecord, DataKey, DidRecord};

/// TTL thresholds - extend when remaining TTL drops below this threshold
const TTL_THRESHOLD: u32 = 172800; // ~2 days in ledgers (assuming ~5s/ledger)
const TTL_EXTEND_TO: u32 = 2592000; // ~30 days in ledgers

/// Read a DID record from storage
pub fn read_did_record(e: &Env, controller: &Address) -> Result<DidRecord, ContractError> {
    let key = DataKey::Did(controller.clone());
    e.storage()
        .persistent()
        .get(&key)
        .ok_or(ContractError::NotFound)
}

/// Write a DID record to storage with TTL extension
pub fn write_did_record(e: &Env, controller: &Address, record: &DidRecord) {
    let key = DataKey::Did(controller.clone());
    e.storage().persistent().set(&key, record);
    // Extend TTL if below threshold (host function handles the check internally)
    e.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

/// Check if a DID record exists
pub fn has_did_record(e: &Env, controller: &Address) -> bool {
    let key = DataKey::Did(controller.clone());
    e.storage().persistent().has(&key)
}

/// Remove a DID record from storage (used by controller rotation, which
/// moves the record to the new controller's key).
pub fn remove_did_record(e: &Env, controller: &Address) {
    let key = DataKey::Did(controller.clone());
    e.storage().persistent().remove(&key);
}

/// Extend a DID record's TTL without modifying it. Anyone may call and pay.
pub fn extend_did_ttl(e: &Env, controller: &Address) {
    let key = DataKey::Did(controller.clone());
    e.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

/// Read a credential record from storage.
pub fn read_credential_record(
    e: &Env,
    issuer: &Address,
    hash: &BytesN<32>,
) -> Result<CredentialRecord, ContractError> {
    let key = DataKey::Credential(issuer.clone(), hash.clone());
    e.storage()
        .persistent()
        .get(&key)
        .ok_or(ContractError::NotFound)
}

/// Write a credential record to storage with TTL extension.
pub fn write_credential_record(
    e: &Env,
    issuer: &Address,
    hash: &BytesN<32>,
    record: &CredentialRecord,
) {
    let key = DataKey::Credential(issuer.clone(), hash.clone());
    e.storage().persistent().set(&key, record);
    // Extend TTL if below threshold (host function handles the check internally)
    e.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

/// Check if a credential record exists.
pub fn has_credential_record(e: &Env, issuer: &Address, hash: &BytesN<32>) -> bool {
    let key = DataKey::Credential(issuer.clone(), hash.clone());
    e.storage().persistent().has(&key)
}
