#!/usr/bin/env bash
# Deploys the ContributorRegistry and BountyBoard contracts to Stellar Testnet.
#
# Prerequisites:
#   - Stellar CLI installed: https://developers.stellar.org/docs/tools/cli
#   - A funded testnet identity: `stellar keys generate deployer --network testnet --fund`
#
# Usage:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh

set -euo pipefail

NETWORK="testnet"
IDENTITY="deployer"

echo "==> Building contracts"
stellar contract build

echo "==> Deploying ContributorRegistry contract"
CONTRIBUTOR_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contributor_registry.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK")
echo "ContributorRegistry deployed at: $CONTRIBUTOR_ID"

echo "==> Deploying BountyBoard contract"
BOARD_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/bounty_board.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK")
echo "BountyBoard deployed at: $BOARD_ID"

echo "==> Initializing ContributorRegistry (authorizing the Board contract to call it)"
stellar contract invoke \
  --id "$CONTRIBUTOR_ID" \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  -- initialize \
  --board "$BOARD_ID"

echo ""
echo "=================================================="
echo " Deployment complete"
echo "=================================================="
echo " ContributorRegistry contract ID: $CONTRIBUTOR_ID"
echo " BountyBoard contract ID:         $BOARD_ID"
echo ""
echo " Next steps:"
echo " 1. Add these IDs to frontend/.env as VITE_CONTRIBUTOR_CONTRACT_ID and VITE_BOARD_CONTRACT_ID"
echo " 2. Deploy or reuse a testnet SEP-41 token for rewards, set VITE_REWARD_TOKEN_ID"
echo " 3. Run scripts/sample_interaction.sh to post a bounty for your submission's tx hash"
echo "=================================================="
