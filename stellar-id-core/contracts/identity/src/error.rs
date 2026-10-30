use soroban_sdk::contracterror;

// Each doc comment starts with the variant name on purpose: stellar-sdk
// clients turn the contract spec's error docs into `Err({ message })`, and
// the TypeScript SDK maps errors by that name. An undocumented variant
// reaches clients as an empty message.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    /// NotFound: no DID or credential record exists for this key.
    NotFound = 1,
    /// AlreadyExists: a DID, method, service or credential with this id already exists.
    AlreadyExists = 2,
    /// Unauthorized: the caller does not control this record.
    Unauthorized = 3,
    /// Deactivated: the DID is deactivated and cannot be changed or used.
    Deactivated = 4,
    /// InvalidVerificationMethod: the verification method is missing, unreferenced or still referenced.
    InvalidVerificationMethod = 5,
    /// InvalidProof: the proof could not be verified.
    InvalidProof = 6,
    /// Revoked: the credential is revoked.
    Revoked = 7,
    /// Expired: the credential is expired.
    Expired = 8,
    /// LimitExceeded: a per-DID size limit would be exceeded.
    LimitExceeded = 9,
    /// InvalidInput: an argument failed validation.
    InvalidInput = 10,
}
