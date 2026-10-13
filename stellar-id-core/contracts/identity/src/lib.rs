#![no_std]

use soroban_sdk::{contract, contractimpl, Env};

/// Contract entry point for the `did:stellar` DID method.
///
/// Phase 0 scaffold: the DID lifecycle (create / resolve / update /
/// deactivate), verification methods, services, credential anchoring, and
/// revocation functions are implemented in Phases 1 and 2
/// (`PLAYBOOK.md` §8 in the monorepo root). The public interface is
/// specified in `docs/METHOD_SPEC.md`, a Phase 1 deliverable.
#[contract]
pub struct IdentityContract;

#[contractimpl]
impl IdentityContract {
    /// Returns the contract interface version.
    ///
    /// Phase 0 placeholder: it exists so the package builds, tests, and
    /// deploys end-to-end. It is replaced by the DID lifecycle functions
    /// in Phase 1.
    pub fn contract_version(_env: Env) -> u32 {
        0
    }
}

mod test;
