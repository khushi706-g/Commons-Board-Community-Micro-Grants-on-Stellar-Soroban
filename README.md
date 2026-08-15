# Commons Board — Community Micro-Grants on Stellar Soroban

A public corkboard of funded bounties. Anyone can pin a small job with a
reward attached; anyone can pick it up and submit work; the poster approves
one submission and the reward pays out immediately. Every completed bounty
becomes part of a contributor's public, on-chain track record via a
dedicated ContributorRegistry contract.

Built for the Stellar Orange Belt submission — public-goods micro-funding
is a distinct domain from payment escrow, ticketing, barter, supply-chain
tracking, or study commitment devices.

---

## Why this project

Small open-source and community contributions rarely get compensated or
recognized — there's no lightweight way to say "I'll pay $50 for this" and
have that promise, the work, and the payout all be verifiable by anyone.
This project makes the whole loop on-chain and public:

- **The reward is escrowed the moment the bounty is posted**, not promised — a contributor knows the money is already there before doing any work.
- **BountyBoard and ContributorRegistry are separate contracts on purpose.** The board owns bounty lifecycle; the registry is an independent, cumulative record of a person's contributions across every bounty they've ever completed — readable by anyone deciding whether to trust a contributor with a bigger job.
- **Reward tiers shape the score, not just completion count.** A contributor who does one $500 job and one who does five $50 jobs both build real reputation, just along different signals anyone can inspect.

---

## Architecture

```
Poster / Contributor
        │
        ▼
 React frontend (corkboard of pinned bounty cards, live activity feed)
        │
        ▼
 BountyBoard contract ──────► Token contract (reward deposit & payout)
        │
        └──────────────────► ContributorRegistry contract (log_completion, called on payout)
```

**Inter-contract communication**: the BountyBoard contract's
`approve_submission` calls into ContributorRegistry's `log_completion`
immediately after paying the winner (`contracts/bounty/src/lib.rs`). The
ContributorRegistry requires `board.require_auth()`, so only the authorized
BountyBoard instance can write to anyone's contributor record — a person's
public score can't be inflated by any contract other than the one that
actually verified and paid for real work.

**Event streaming**: every state change (`BountyPosted`, `SubmissionMade`,
`BountyPaid`, `BountyCancelled`) is emitted as a Soroban contract event. The
frontend's `useContractEvents` hook polls `getEvents` on a short interval
and renders a live activity ticker under the board, so the whole community
can watch new bounties and payouts land in real time.

---

## Project structure

```
commons-board/
├── contracts/
│   ├── bounty/             # Main contract: post, submit, approve, cancel
│   │   └── src/
│   │       ├── lib.rs
│   │       └── test.rs     # 6 unit tests
│   └── contributor/          # Score + history, called cross-contract
│       └── src/
│           ├── lib.rs
│           └── test.rs     # 7 unit tests
├── frontend/
│   ├── src/
│   │   ├── components/      # BountyCard, PostBountyForm, ContributorCard
│   │   ├── hooks/           # useWallet, useContractEvents
│   │   ├── contracts/       # boardClient.js, config.js
│   │   └── test/            # Vitest + Testing Library specs
│   └── package.json
├── scripts/
│   ├── deploy.sh                # Deploys + initializes both contracts to testnet
│   └── sample_interaction.sh    # Posts a bounty for a demo tx hash
├── .github/workflows/ci.yml     # CI: contract tests + frontend tests + build
└── vercel.json
```

---

## Smart contract design

### BountyBoard contract (`contracts/bounty`)

| Function | Caller | What it does |
|---|---|---|
| `post_bounty` | Poster | Deposits the full reward up front, opens the bounty |
| `submit_work` | Contributor | Attaches a note/link, moves the bounty into review |
| `approve_submission` | Poster | Pays the winner, then cross-contract call to log the completion |
| `cancel_bounty` | Poster (only while still Open) | Refunds the poster |
| `get_bounty` | Anyone (read-only) | Returns full bounty state including submissions |

### ContributorRegistry contract (`contracts/contributor`)

| Function | Caller | What it does |
|---|---|---|
| `initialize` | Deployer | Authorizes the one BountyBoard contract permitted to log completions |
| `log_completion` | BountyBoard contract only | +1/+2/+3 score by reward tier; appends history |
| `get_profile` | Anyone (read-only) | Returns score, completed count, total earned |
| `get_history` | Anyone (read-only) | Returns every bounty a contributor has completed |

Errors are typed contract errors (`BoardError`, `ContributorError`) rather
than panics, so the frontend gets a clean, catchable failure reason — e.g.
"already submitted" if a contributor tries to submit twice — instead of a
raw trap.

---

## Frontend

- **React 18 + Vite + Tailwind**, mobile-first, styled around a literal
  corkboard of pinned index cards — a colored pushpin encodes status
  (green = open, yellow = in review, blue = paid, pink = cancelled), and
  cards sit at a slight tilt. This is deliberately not a generic Kanban
  board; the physical bulletin-board metaphor is the point for a community
  micro-grants product.
- **Wallet connect** via Stellar Wallets Kit (Freighter, xBull, Albedo, etc.).
- **Three views**: The board (look up/act on a bounty), Post a bounty
  (funder flow), Contributors (public score lookup).
- **Live activity feed** driven by `useContractEvents` (polls Soroban RPC `getEvents`).
- **Error and loading states** throughout: skeleton loaders while fetching
  a bounty, dismissible error/success banners, disabled buttons
  mid-transaction.

### Environment variables

Copy `frontend/.env.example` to `frontend/.env` and fill in the contract IDs
from `scripts/deploy.sh`:

```
VITE_BOARD_CONTRACT_ID=
VITE_CONTRIBUTOR_CONTRACT_ID=
VITE_REWARD_TOKEN_ID=
```

---

## Running locally

### Contracts

```bash
# Requires Rust + wasm32-unknown-unknown target + Stellar CLI
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli

cargo test --workspace          # run all contract tests
stellar contract build           # build .wasm files
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # local dev server
npm run test      # Vitest unit tests
npm run build     # production build
```

---

## Deployment (testnet)

```bash
stellar keys generate deployer --network testnet --fund
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This builds both contracts, deploys them to Stellar Testnet, initializes
ContributorRegistry to authorize the BountyBoard contract, and prints both
contract IDs.

Then run the sample interaction script to post a demo bounty and get a real
transaction hash for your submission:

```bash
chmod +x scripts/sample_interaction.sh
# fill in the contract IDs at the top of the script first
./scripts/sample_interaction.sh
```

Deploy the frontend to Vercel/Netlify pointing at `frontend/` as the root
(see `vercel.json`), with the three `VITE_*` env vars set in the dashboard.

---

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. **Contracts job** — builds both contracts to `wasm32-unknown-unknown` and runs `cargo test --workspace`.
2. **Frontend job** — installs deps, lints, runs Vitest, builds the production bundle.
3. **Deploy-readiness job** — gates on both passing before signaling the build is deploy-ready.

---

## Testing

- **Contracts**: 13 Rust unit tests total (6 in `bounty`, 7 in `contributor`) covering the full lifecycle, double-submission rejection, cancellation refunds, reward-tier scoring, and not-found cases. Run with `cargo test --workspace`.
- **Frontend**: Vitest + React Testing Library specs for the bounty card's role-gated actions and the post-bounty form's field conversion. Run with `npm run test` inside `frontend/`.

---

## Submission checklist mapping

| Requirement | Where |
|---|---|
| Inter-contract communication | `bounty::approve_submission` calls into `contributor::log_completion` |
| Event streaming & real-time updates | Contract events + `useContractEvents` polling hook |
| CI/CD pipeline | `.github/workflows/ci.yml` |
| Deployment workflow | `scripts/deploy.sh` |
| Mobile responsive frontend | Tailwind responsive layout, pinned cards stack cleanly on narrow screens |
| Error handling & loading states | `Banner.jsx`, `Skeleton.jsx`, try/catch in `App.jsx` |
| Tests (contracts + frontend) | `contracts/*/src/test.rs`, `frontend/src/test/*.test.jsx` |
| Documentation | This README + inline doc comments in every contract |

---

## License

MIT
