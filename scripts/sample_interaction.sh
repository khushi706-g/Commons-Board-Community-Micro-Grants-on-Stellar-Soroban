#!/usr/bin/env bash
# Runs an end-to-end interaction against deployed testnet contracts so you
# have a real transaction hash for the submission checklist: post a bounty.
#
# Fill in these values after running deploy.sh:
BOARD_ID="REPLACE_WITH_BOARD_CONTRACT_ID"
CONTRIBUTOR_ID="REPLACE_WITH_CONTRIBUTOR_CONTRACT_ID"
REWARD_TOKEN_ID="REPLACE_WITH_TESTNET_TOKEN_ID"
POSTER_IDENTITY="deployer"

set -euo pipefail

POSTER_ADDRESS="$(stellar keys address $POSTER_IDENTITY)"

echo "==> Posting a sample bounty"
stellar contract invoke \
  --id "$BOARD_ID" \
  --source "$POSTER_IDENTITY" \
  --network testnet \
  -- post_bounty \
  --poster "$POSTER_ADDRESS" \
  --title "Fix onboarding docs typo" \
  --description "The setup guide references an outdated CLI flag." \
  --reward_token "$REWARD_TOKEN_ID" \
  --reward_amount 100 \
  --contributor_registry "$CONTRIBUTOR_ID"

echo ""
echo "Copy the transaction hash printed above into your README / submission form."
