#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup() -> (Env, ContributorRegistryContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, ContributorRegistryContract);
    let client = ContributorRegistryContractClient::new(&env, &contract_id);
    let board = Address::generate(&env);
    client.initialize(&board);
    (env, client, board)
}

#[test]
fn test_new_contributor_has_zero_score() {
    let (env, client, _board) = setup();
    let user = Address::generate(&env);
    let profile = client.get_profile(&user);
    assert_eq!(profile.score, 0u32);
}

#[test]
fn test_small_bounty_gives_plus_one() {
    let (env, client, _board) = setup();
    let user = Address::generate(&env);
    let score = client.log_completion(&user, &1u64, &50i128);
    assert_eq!(score, 1u32);
}

#[test]
fn test_large_bounty_gives_plus_three() {
    let (env, client, _board) = setup();
    let user = Address::generate(&env);
    let score = client.log_completion(&user, &1u64, &500i128);
    assert_eq!(score, 3u32);
}

#[test]
fn test_medium_bounty_gives_plus_two() {
    let (env, client, _board) = setup();
    let user = Address::generate(&env);
    let score = client.log_completion(&user, &1u64, &150i128);
    assert_eq!(score, 2u32);
}

#[test]
fn test_total_earned_accumulates() {
    let (env, client, _board) = setup();
    let user = Address::generate(&env);
    client.log_completion(&user, &1u64, &50i128);
    client.log_completion(&user, &2u64, &75i128);
    let profile = client.get_profile(&user);
    assert_eq!(profile.total_earned, 125i128);
    assert_eq!(profile.bounties_completed, 2u32);
}

#[test]
fn test_history_accumulates() {
    let (env, client, _board) = setup();
    let user = Address::generate(&env);
    client.log_completion(&user, &1u64, &50i128);
    client.log_completion(&user, &2u64, &50i128);
    let history = client.get_history(&user);
    assert_eq!(history.len(), 2);
}

#[test]
fn test_already_initialized_rejected() {
    let (env, client, _board) = setup();
    let other = Address::generate(&env);
    let result = client.try_initialize(&other);
    assert!(result.is_err());
}
