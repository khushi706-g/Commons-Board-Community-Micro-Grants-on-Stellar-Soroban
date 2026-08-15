//! Contributor Registry Contract
//!
//! Tracks on-chain contributor history and a running score across every
//! bounty a person completes. The BountyBoard contract calls into this
//! contract cross-contract whenever a bounty is paid out. Score model: +1
//! point per completed bounty, plus the bounty's reward tier bonus (small
//! bounties: +0, medium: +1, large: +2), so consistent small contributions
//! and occasional big wins both build reputation, just on different axes
//! anyone can inspect.

#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Vec};

#[contracttype]
#[derive(Clone)]
pub struct CompletionRecord {
    pub bounty_id: u64,
    pub reward_amount: i128,
    pub ledger_timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct ContributorProfile {
    pub score: u32,
    pub bounties_completed: u32,
    pub total_earned: i128,
}

#[contracttype]
pub enum DataKey {
    AuthorizedBoard,
    Profile(Address),
    History(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContributorError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
}


#[contract]
pub struct ContributorRegistryContract;

#[contractimpl]
impl ContributorRegistryContract {
    /// Set the single BountyBoard contract permitted to log completions.
    pub fn initialize(env: Env, board: Address) -> Result<(), ContributorError> {
        if env.storage().instance().has(&DataKey::AuthorizedBoard) {
            return Err(ContributorError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::AuthorizedBoard, &board);
        Ok(())
    }

    /// Called cross-contract by the BountyBoard when a bounty is paid out.
    /// Score bonus scales with reward size: <100 -> +1, 100-499 -> +2, 500+ -> +3.
    pub fn log_completion(
        env: Env,
        contributor: Address,
        bounty_id: u64,
        reward_amount: i128,
    ) -> Result<u32, ContributorError> {
        let board: Address = env
            .storage()
            .instance()
            .get(&DataKey::AuthorizedBoard)
            .ok_or(ContributorError::NotInitialized)?;
        board.require_auth();

        let bonus: u32 = if reward_amount >= 500 {
            3
        } else if reward_amount >= 100 {
            2
        } else {
            1
        };

        let mut profile: ContributorProfile = env
            .storage()
            .persistent()
            .get(&DataKey::Profile(contributor.clone()))
            .unwrap_or(ContributorProfile { score: 0, bounties_completed: 0, total_earned: 0 });

        profile.score += bonus;
        profile.bounties_completed += 1;
        profile.total_earned += reward_amount;
        env.storage().persistent().set(&DataKey::Profile(contributor.clone()), &profile);

        let history_key = DataKey::History(contributor.clone());
        let mut history: Vec<CompletionRecord> = env.storage().persistent().get(&history_key).unwrap_or(Vec::new(&env));
        history.push_back(CompletionRecord { bounty_id, reward_amount, ledger_timestamp: env.ledger().timestamp() });
        env.storage().persistent().set(&history_key, &history);

        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "ContributionLogged"), contributor.clone()),
            (bounty_id, profile.score)
        );
        Ok(profile.score)
    }

    pub fn get_profile(env: Env, contributor: Address) -> ContributorProfile {
        env.storage()
            .persistent()
            .get(&DataKey::Profile(contributor))
            .unwrap_or(ContributorProfile { score: 0, bounties_completed: 0, total_earned: 0 })
    }

    pub fn get_history(env: Env, contributor: Address) -> Vec<CompletionRecord> {
        env.storage().persistent().get(&DataKey::History(contributor)).unwrap_or(Vec::new(&env))
    }
}

mod test;
