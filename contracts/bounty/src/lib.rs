//! Bounty Board Contract
//!
//! Anyone can post a funded bounty (depositing the reward up front),
//! contributors submit work against it, and the poster approves one
//! submission to release payment. On payout, the contract makes a
//! cross-contract call into the ContributorRegistry to log the completion
//! and update the contributor's on-chain score. Bounties move through a
//! simple Kanban-style lifecycle: Open -> InReview -> Paid.

#![no_std]

use soroban_sdk::{contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env, String, Vec};

mod contributor {
    soroban_sdk::contractimport!(
        file = "../contributor/target/wasm32-unknown-unknown/release/contributor_registry.wasm"
    );
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BountyStatus {
    Open,
    InReview,
    Paid,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Submission {
    pub contributor: Address,
    pub note: String,
}

#[contracttype]
#[derive(Clone)]
pub struct Bounty {
    pub poster: Address,
    pub title: String,
    pub description: String,
    pub reward_token: Address,
    pub reward_amount: i128,
    pub contributor_registry: Address,
    pub submissions: Vec<Submission>,
    pub status: BountyStatus,
    pub winner: Option<Address>,
}

#[contracttype]
pub enum DataKey {
    Bounty(u64),
    NextBountyId,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum BoardError {
    BountyNotFound = 1,
    Unauthorized = 2,
    InvalidStatus = 3,
    SubmissionNotFound = 4,
    AlreadySubmitted = 5,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct BountyPosted {
    #[topic]
    pub bounty_id: u64,
    pub poster: Address,
    pub reward_amount: i128,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct SubmissionMade {
    #[topic]
    pub bounty_id: u64,
    pub contributor: Address,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct BountyPaid {
    #[topic]
    pub bounty_id: u64,
    pub winner: Address,
    pub reward_amount: i128,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct BountyCancelled {
    #[topic]
    pub bounty_id: u64,
}

#[contract]
pub struct BountyBoardContract;

#[contractimpl]
impl BountyBoardContract {
    /// Poster funds a bounty up front; funds sit in the contract until paid or cancelled.
    pub fn post_bounty(
        env: Env,
        poster: Address,
        title: String,
        description: String,
        reward_token: Address,
        reward_amount: i128,
        contributor_registry: Address,
    ) -> Result<u64, BoardError> {
        poster.require_auth();

        let token_client = token::Client::new(&env, &reward_token);
        token_client.transfer(&poster, &env.current_contract_address(), &reward_amount);

        let bounty_id: u64 = env.storage().instance().get(&DataKey::NextBountyId).unwrap_or(0);
        env.storage().instance().set(&DataKey::NextBountyId, &(bounty_id + 1));

        let bounty = Bounty {
            poster: poster.clone(),
            title,
            description,
            reward_token,
            reward_amount,
            contributor_registry,
            submissions: Vec::new(&env),
            status: BountyStatus::Open,
            winner: None,
        };
        env.storage().persistent().set(&DataKey::Bounty(bounty_id), &bounty);

        BountyPosted { bounty_id, poster, reward_amount }.publish(&env);
        Ok(bounty_id)
    }

    /// A contributor submits work against an open bounty, moving it into review.
    pub fn submit_work(env: Env, bounty_id: u64, contributor: Address, note: String) -> Result<(), BoardError> {
        contributor.require_auth();
        let mut bounty = Self::load_bounty(&env, bounty_id)?;

        if bounty.status != BountyStatus::Open && bounty.status != BountyStatus::InReview {
            return Err(BoardError::InvalidStatus);
        }
        for i in 0..bounty.submissions.len() {
            if bounty.submissions.get(i).unwrap().contributor == contributor {
                return Err(BoardError::AlreadySubmitted);
            }
        }

        bounty.submissions.push_back(Submission { contributor: contributor.clone(), note });
        bounty.status = BountyStatus::InReview;
        env.storage().persistent().set(&DataKey::Bounty(bounty_id), &bounty);

        SubmissionMade { bounty_id, contributor }.publish(&env);
        Ok(())
    }

    /// Poster approves one submission, releasing the reward and making a
    /// cross-contract call into ContributorRegistry to log the win.
    pub fn approve_submission(env: Env, bounty_id: u64, winner: Address) -> Result<(), BoardError> {
        let mut bounty = Self::load_bounty(&env, bounty_id)?;
        bounty.poster.require_auth();

        if bounty.status != BountyStatus::InReview {
            return Err(BoardError::InvalidStatus);
        }
        let mut found = false;
        for i in 0..bounty.submissions.len() {
            if bounty.submissions.get(i).unwrap().contributor == winner {
                found = true;
                break;
            }
        }
        if !found {
            return Err(BoardError::SubmissionNotFound);
        }

        let token_client = token::Client::new(&env, &bounty.reward_token);
        token_client.transfer(&env.current_contract_address(), &winner, &bounty.reward_amount);

        // Cross-contract call: BountyBoard -> ContributorRegistry
        let registry_client = contributor::Client::new(&env, &bounty.contributor_registry);
        registry_client.log_completion(&winner, &bounty_id, &bounty.reward_amount);

        bounty.status = BountyStatus::Paid;
        bounty.winner = Some(winner.clone());
        env.storage().persistent().set(&DataKey::Bounty(bounty_id), &bounty);

        BountyPaid { bounty_id, winner, reward_amount: bounty.reward_amount }.publish(&env);
        Ok(())
    }

    /// Poster can cancel an unfunded-to-anyone-yet bounty and reclaim their deposit.
    pub fn cancel_bounty(env: Env, bounty_id: u64) -> Result<(), BoardError> {
        let mut bounty = Self::load_bounty(&env, bounty_id)?;
        bounty.poster.require_auth();

        if bounty.status != BountyStatus::Open {
            return Err(BoardError::InvalidStatus);
        }

        let token_client = token::Client::new(&env, &bounty.reward_token);
        token_client.transfer(&env.current_contract_address(), &bounty.poster, &bounty.reward_amount);

        bounty.status = BountyStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Bounty(bounty_id), &bounty);

        BountyCancelled { bounty_id }.publish(&env);
        Ok(())
    }

    pub fn get_bounty(env: Env, bounty_id: u64) -> Result<Bounty, BoardError> {
        Self::load_bounty(&env, bounty_id)
    }

    fn load_bounty(env: &Env, bounty_id: u64) -> Result<Bounty, BoardError> {
        env.storage().persistent().get(&DataKey::Bounty(bounty_id)).ok_or(BoardError::BountyNotFound)
    }
}

mod test;
