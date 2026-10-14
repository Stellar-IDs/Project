use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    NotFound = 1,
    AlreadyExists = 2,
    Unauthorized = 3,
    Deactivated = 4,
    InvalidVerificationMethod = 5,
    InvalidProof = 6,
    Revoked = 7,
    Expired = 8,
    LimitExceeded = 9,
    InvalidInput = 10,
}
