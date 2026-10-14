use soroban_sdk::{contracttype, Address, BytesN, String, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Did(Address),
    Credential(Address, BytesN<32>),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationMethod {
    pub id: String,
    pub kind: Symbol,
    pub public_key: BytesN<32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Service {
    pub id: String,
    pub kind: String,
    pub endpoint: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DidRecord {
    pub controller: Address,
    pub verification_methods: Vec<VerificationMethod>,
    pub authentication: Vec<String>,
    pub assertion_method: Vec<String>,
    pub services: Vec<Service>,
    pub created: u64,
    pub updated: u64,
    pub version: u32,
    pub deactivated: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NewDidDoc {
    pub controller: Address,
    pub verification_methods: Vec<VerificationMethod>,
    pub authentication: Vec<String>,
    pub assertion_method: Vec<String>,
    pub services: Vec<Service>,
}

/// On-chain record for an anchored credential hash.
///
/// The credential contents stay off-chain (no PII on-chain). Only the
/// SHA-256 hash of the JCS-canonicalized credential JSON is stored,
/// plus status flags. See `docs/METHOD_SPEC.md` §6.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CredentialRecord {
    pub issuer: Address,
    pub hash: BytesN<32>,
    pub anchored_at: u64,
    pub expires_at: Option<u64>,
    pub revoked: bool,
}

/// Read-only credential status, returned by `credential_status`.
///
/// `Unknown` means no anchor record exists (never anchored).
/// `Revoked` takes precedence over `Expired`: once revoked, a credential
/// stays revoked even after its expiry time passes.
// TODO(wave: core-3): batched revocation lists plug in here — the public
// `credential_status` signature stays stable while the internals gain
// index-based lookups.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CredentialStatus {
    Unknown,
    Active,
    Revoked,
    Expired,
}
