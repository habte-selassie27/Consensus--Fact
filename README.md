# TruthLock — On-Chain Fact Checker

Submit any claim + a source URL. A GenLayer Intelligent Contract fetches live web data, cross-references 3 independent sources via LLM reasoning, and stores a permanent consensus verdict on-chain: `TRUE / FALSE / MISLEADING / UNVERIFIABLE` with confidence score and explanation.

Built on [GenLayer](https://genlayer.com) Intelligent Contracts (Python/GenVM) with a Next.js 15 frontend.

## How it works

1. User submits a claim (text, ≤500 chars) + a primary source URL (`https://`)
2. The contract fetches the primary source with `get_webpage()`
3. An LLM pass extracts 2 corroborating source URLs from that content
4. All 3 sources are fetched and cross-referenced by the LLM
5. Validators reach consensus via Optimistic Democracy; output is constrained by the equivalence principle
6. The verdict + confidence + explanation are stored permanently on-chain

## Repository layout

```
contract/          Intelligent Contract (Python/GenVM)
  fact_checker.py    main contract
  tests/             direct-mode (mocked) + integration tests
frontend/          Next.js 15 app (App Router, TypeScript strict)
docs/              design system + GenLayer submission notes
AGENTS.md          binding technical spec for AI agents
```

## Deploy the contract

```bash
# Install GenLayer CLI
npm install -g @genlayer/cli

# Deploy to GenLayer Studio
genlayer deploy contract/fact_checker.py --network studio
```

Copy the deployed contract address into `frontend/.env.local` (see below).

## Run the frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

`.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...        # address from the deploy step
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/rpc
NEXT_PUBLIC_NETWORK=studionet             # localnet | studionet | testnetAsimov | testnetBradbury
```

```bash
npm run dev
```

Open http://localhost:3000. Submitting a claim requires a browser wallet; reads work without one.

> SDK note: all on-chain access is isolated in `frontend/lib/genlayer.ts` using `genlayer-js`
> (`createClient`, `readContract`, `writeContract`, `waitForTransactionReceipt`). Components never
> call the SDK directly.

## Tests

Direct mode (mocked LLM/web, no SDK needed — runs anywhere):

```bash
python3 -m pytest contract/tests/test_direct.py -v
```

Integration (requires a running Studio node):

```bash
pip install gltest
export GENLAYER_STUDIO_URL=http://localhost:8080
pytest contract/tests/test_integration.py -v
```

## Public methods

| Method | Type | Description |
|---|---|---|
| `submit_claim(claim, source_url)` | write | Runs the full check pipeline, returns check ID |
| `get_check(id)` | view | Returns one `FactCheckRecord` |
| `get_recent_checks(limit=10)` | view | Last N checks (max 50), newest first |
| `get_stats()` | view | Total checks, verdict tally, latest timestamp |

## Verdicts

| Verdict | Color |
|---|---|
| TRUE | `#00E5A0` mint green |
| FALSE | `#FF4D4D` red |
| MISLEADING | `#FFB800` amber |
| UNVERIFIABLE | `#6B7280` gray |

## License

MIT
