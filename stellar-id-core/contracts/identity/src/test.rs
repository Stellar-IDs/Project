#![cfg(test)]

use super::*;
use soroban_sdk::Env;

#[test]
fn contract_version_returns_zero() {
    let env = Env::default();
    let contract_id = env.register(IdentityContract, ());
    let client = IdentityContractClient::new(&env, &contract_id);

    assert_eq!(client.contract_version(), 0);
}
