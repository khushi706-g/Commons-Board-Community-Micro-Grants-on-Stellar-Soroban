#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Env, String as SorobanString};

fn create_token<'a>(env: &Env, admin: &Address) -> (Address, token::StellarAssetClient<'a>, token::Client<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let address = sac.address();
    let admin_client = token::StellarAssetClient::new(env, &address);
    let client = token::Client::new(env, &address);
    (address, admin_client, client)
}

mod contributor_test_shim {
    pub use contributor_registry::{ContributorRegistryContract, ContributorRegistryContractClient};
}

fn setup_bounty(
    env: &Env,
    reward: i128,
) -> (BountyBoardContractClient<'static>, u64, Address, token::Client<'static>, Address) {
    env.mock_all_auths();
    let contract_id = env.register_contract(None, BountyBoardContract);
    let client = BountyBoardContractClient::new(env, &contract_id);

    let poster = Address::generate(env);
    let token_admin = Address::generate(env);
    let (token_addr, admin_client, token_client) = create_token(env, &token_admin);
    admin_client.mint(&poster, &10_000i128);

    let registry_id = env.register_contract(None, contributor_test_shim::ContributorRegistryContract);
    contributor_test_shim::ContributorRegistryContractClient::new(env, &registry_id).initialize(&contract_id);

    let bounty_id = client.post_bounty(
        &poster,
        &SorobanString::from_str(env, "Fix onboarding docs typo"),
        &SorobanString::from_str(env, "The setup guide has an outdated CLI flag."),
        &token_addr,
        &reward,
        &registry_id,
    );

    (client, bounty_id, poster, token_client, registry_id)
}

#[test]
fn test_post_bounty_deposits_full_reward() {
    let env = Env::default();
    let (client, bounty_id, _poster, token_client, _registry) = setup_bounty(&env, 100i128);
    assert_eq!(token_client.balance(&client.address), 100i128);
    let bounty = client.get_bounty(&bounty_id);
    assert_eq!(bounty.status, BountyStatus::Open);
}

#[test]
fn test_submit_work_moves_to_in_review() {
    let env = Env::default();
    let (client, bounty_id, _poster, _token_client, _registry) = setup_bounty(&env, 100i128);
    let contributor = Address::generate(&env);
    client.submit_work(&bounty_id, &contributor, &SorobanString::from_str(&env, "Fixed the flag in PR #42"));

    let bounty = client.get_bounty(&bounty_id);
    assert_eq!(bounty.status, BountyStatus::InReview);
    assert_eq!(bounty.submissions.len(), 1);
}

#[test]
fn test_double_submission_rejected() {
    let env = Env::default();
    let (client, bounty_id, _poster, _token_client, _registry) = setup_bounty(&env, 100i128);
    let contributor = Address::generate(&env);
    client.submit_work(&bounty_id, &contributor, &SorobanString::from_str(&env, "First try"));
    let result = client.try_submit_work(&bounty_id, &contributor, &SorobanString::from_str(&env, "Second try"));
    assert!(result.is_err());
}

#[test]
fn test_approve_submission_pays_winner_and_logs_via_cross_contract_call() {
    let env = Env::default();
    let (client, bounty_id, _poster, token_client, registry_id) = setup_bounty(&env, 150i128);
    let contributor = Address::generate(&env);
    client.submit_work(&bounty_id, &contributor, &SorobanString::from_str(&env, "Fixed it"));

    client.approve_submission(&bounty_id, &contributor);

    assert_eq!(token_client.balance(&contributor), 150i128);
    let bounty = client.get_bounty(&bounty_id);
    assert_eq!(bounty.status, BountyStatus::Paid);
    assert_eq!(bounty.winner, Some(contributor.clone()));

    let registry_client = contributor_test_shim::ContributorRegistryContractClient::new(&env, &registry_id);
    let profile = registry_client.get_profile(&contributor);
    assert_eq!(profile.bounties_completed, 1u32);
    assert_eq!(profile.score, 2u32); // 150 is in the 100-499 medium tier -> +2
}

#[test]
fn test_cancel_bounty_refunds_poster() {
    let env = Env::default();
    let (client, bounty_id, poster, token_client, _registry) = setup_bounty(&env, 100i128);
    client.cancel_bounty(&bounty_id);
    assert_eq!(token_client.balance(&poster), 10_000i128);
    let bounty = client.get_bounty(&bounty_id);
    assert_eq!(bounty.status, BountyStatus::Cancelled);
}

#[test]
fn test_bounty_not_found_errors() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, BountyBoardContract);
    let client = BountyBoardContractClient::new(&env, &contract_id);
    let result = client.try_get_bounty(&999u64);
    assert!(result.is_err());
}
