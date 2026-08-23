# AGENTS.md — On-Chain Fact Checker (GenLayer Intelligent Contract)

> **Binding technical contract for all AI agents in this pipeline.**
> Architect → Implementer → Tester → Reviewer must read and enforce every rule here.
> No agent may deviate from this spec without an explicit override in the task prompt.

---

## 0. Project Overview

**Name:** TruthLock — On-Chain Fact Checker
**Platform:** GenLayer (Intelligent Contracts — Python/GenVM)
**Stack:** GenLayer Intelligent Contract (Python) + Next.js 15 frontend (TypeScript)
**Purpose:** Submit any claim + a source URL. The contract fetches live web data, cross-references 3 independent sources via LLM reasoning, and stores a permanent consensus verdict on-chain: `TRUE / FALSE / MISLEADING / UNVERIFIABLE` with confidence score and explanation.
**Submission Type:** Builder → Projects (20–4000 pts)
**Points target:** 2000–4000 pts (live contract + frontend + docs + demo video)

---

## 1. Repository Structure

```
truthlock/
├── AGENTS.md                        ← this file (binding spec)
├── README.md                        ← project overview + deploy guide
├── contract/
│   ├── fact_checker.py              ← Intelligent Contract (main)
│   ├── tests/
│   │   ├── test_direct.py           ← Direct mode unit tests (mocked LLM/web)
│   │   └── test_integration.py      ← Integration tests (GenLayer Studio)
│   └── genlayer.config.json         ← Studio deployment config
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 ← Home / claim submission
│   │   ├── result/[id]/page.tsx     ← Verdict detail page
│   │   ├── history/page.tsx         ← On-chain check history
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ClaimForm.tsx
│   │   ├── VerdictCard.tsx
│   │   ├── SourcePanel.tsx
│   │   ├── ConfidenceRing.tsx
│   │   └── HistoryTable.tsx
│   ├── lib/
│   │   ├── genlayer.ts              ← GenLayer JS SDK client
│   │   └── types.ts
│   ├── public/
│   └── package.json
└── docs/
    ├── DESIGN.md                    ← Frontend design system (see FRONTEND_DESIGN.md)
    └── SUBMISSION_NOTES.md          ← GenLayer portal submission writeup
```

---

## 2. Intelligent Contract Spec (`contract/fact_checker.py`)

### 2.1 Language & Runtime

- Python, GenVM sandbox
- **Line 1 must be a pinned runner header** (networks reject `test`/`latest` aliases):
  `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }`
- Import via `from genlayer import *` (`gl`, `TreeMap`, `DynArray`, `allow_storage`)
- No external pip packages
- No `import os`, no file I/O, no network calls outside `gl.get_webpage`
- Non-deterministic calls: `gl.get_webpage(url, mode="text")`, `gl.nondet.exec_prompt(prompt, response_format="json")`
- Consensus wrapper for LLM/web results: `gl.eq_principle.prompt_comparative(fn, principle=...)` — never bare `ValueError`; use `gl.UserError`

### 2.2 State Schema

```python
@allow_storage
@dataclass
class FactCheckRecord:
    id: str                   # uuid4 hex, generated at submission
    claim: str                # raw claim text (max 500 chars)
    source_url: str           # primary URL submitted by user
    verdict: str              # "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIABLE"
    confidence: int           # 0–100
    explanation: str          # LLM-generated 2–3 sentence reasoning
    sources_checked: DynArray[str]  # URLs actually fetched (NOT plain list)
    timestamp: int            # block timestamp
    submitter: str            # wallet address

class FactChecker(gl.Contract):
    checks: TreeMap[str, FactCheckRecord]   # id → record (NOT plain dict)
    total_checks: int
    verdicts_by_type: TreeMap[str, int]     # tally per verdict type
```

View methods return plain dicts (`_record_to_dict`), not dataclass instances.

### 2.3 Public Methods

#### `submit_claim(claim: str, source_url: str) → str`
- **Visibility:** `@gl.public.write`
- **Returns:** check ID
- **Logic:**
  1. Validate `claim` is non-empty, ≤500 chars
  2. Validate `source_url` starts with `https://`
  3. Generate `id = gl.message.sender[-8:] + str(gl.block.number)`
  4. Fetch primary source: `primary_content = get_webpage(source_url, mode="text")`
  5. Use LLM to extract 2 corroborating source URLs from primary content
  6. Fetch both corroborating sources
  7. Call `_evaluate_claim()` with all 3 sources
  8. Store `FactCheckRecord` in `self.checks`
  9. Increment `self.total_checks`
  10. Increment `self.verdicts_by_type[verdict]`
  11. Return `id`

#### `get_check(id: str) → FactCheckRecord`
- **Visibility:** `@gl.public.view`
- Returns stored record or raises `ValueError("Check not found")`

#### `get_recent_checks(limit: int = 10) → list[FactCheckRecord]`
- **Visibility:** `@gl.public.view`
- Returns last N checks sorted by timestamp desc
- Max limit: 50

#### `get_stats() → dict`
- **Visibility:** `@gl.public.view`
- Returns `{ total_checks, verdicts_by_type, most_recent_timestamp }`

### 2.4 Private Method: `_evaluate_claim()`

```python
def _evaluate_claim(
    self,
    claim: str,
    primary_content: str,
    source2_content: str,
    source3_content: str,
    source_urls: list[str]
) -> tuple[str, int, str]:
```

**LLM Prompt contract (never alter without updating tests):**

```
You are a professional fact-checker. Evaluate the following claim against the provided source content.

CLAIM: {claim}

SOURCE 1 ({url1}):
{primary_content[:2000]}

SOURCE 2 ({url2}):
{source2_content[:2000]}

SOURCE 3 ({url3}):
{source3_content[:2000]}

Based on ALL THREE sources, respond ONLY with a valid JSON object using exactly this structure:
{{
  "verdict": "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIABLE",
  "confidence": <integer 0-100>,
  "explanation": "<2-3 sentences explaining the verdict, citing which sources support it>"
}}

Rules:
- TRUE: All credible sources confirm the claim
- FALSE: Sources directly contradict the claim with evidence
- MISLEADING: Claim is partially true but omits critical context
- UNVERIFIABLE: Sources do not contain sufficient information
- confidence reflects source quality and agreement level
- explanation must reference specific source content
- Return ONLY the JSON, no markdown, no preamble
```

**Equivalence principle:**
```python
gl.eq_principle.prompt_comparative(
    run,
    principle="""
    The verdict field must be exactly the same across validator runs and one of: TRUE, FALSE, MISLEADING, UNVERIFIABLE.
    The confidence must be an integer between 0 and 100 and within 10 points across validator runs.
    The explanation must be a non-empty string; minor wording differences are acceptable.
    A 'unreachable' status must agree with a 'unreachable' status.
    """
)
```

The full fetch → extract-URLs → evaluate pipeline runs inside the
`prompt_comparative` callback; validators re-execute it and compare per the
principle (verdict is a classification, so comparative validation is required).

### 2.5 Error Handling

| Error Condition | Behavior |
|---|---|
| `source_url` unreachable | Set verdict `UNVERIFIABLE`, confidence 0, explanation "Primary source could not be fetched." |
| Corroborating sources fail | Continue with available sources, note in explanation |
| LLM returns malformed JSON | Retry once; if still malformed, `UNVERIFIABLE` |
| Claim > 500 chars | Raise `ValueError("Claim must be 500 characters or fewer")` |
| Invalid URL scheme | Raise `ValueError("Source URL must start with https://")` |

### 2.6 Equivalence Principle Rules

- **Never** use `strict_eq` for LLM outputs
- Verdict is a classification → use `prompt_comparative` (validators re-run and compare)
- Web fetch results: use `strict_eq` only for deterministic fields (id, timestamp)
- Verdict field: must be identical across validators (constrained output set)

---

## 3. Frontend Spec (`frontend/`)

### 3.1 Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js | 15 (App Router) |
| Language | TypeScript | 5.x strict mode |
| Styling | Tailwind CSS | 3.x |
| GenLayer SDK | `genlayer-js` | ^1.1 |
| State | TanStack Query | v5 |
| Animations | Framer Motion | v11 |
| Icons | Lucide React | latest |
| Fonts | Space Grotesk + JetBrains Mono | Google Fonts |

### 3.2 Pages

#### `/` — Home (Claim Submission)
- Hero: large claim input textarea
- URL input field
- Submit button → triggers `submit_claim` on-chain
- Live transaction status (pending → confirming → done)
- Recent checks ticker (last 5 verdicts from chain)

#### `/result/[id]` — Verdict Detail
- Verdict badge: TRUE / FALSE / MISLEADING / UNVERIFIABLE (color-coded)
- Confidence ring (animated SVG arc, 0–100)
- Explanation text
- Sources panel: 3 URLs that were checked, each with status
- Share button (copies link)
- "Check another claim" CTA

#### `/history` — On-Chain History
- Table of all stored checks
- Filter by verdict type
- Sortable by date / confidence
- Click row → go to `/result/[id]`

### 3.3 GenLayer Client (`lib/genlayer.ts`)

```typescript
// All contract calls go through this module
// No direct SDK calls in components

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!

export async function submitClaim(claim: string, sourceUrl: string): Promise<string>
export async function getCheck(id: string): Promise<FactCheckRecord>
export async function getRecentChecks(limit?: number): Promise<FactCheckRecord[]>
export async function getStats(): Promise<ContractStats>
```

- Use `genlayer-js` `createClient` with Studio/testnet RPC (chain from `genlayer-js/chains`)
- All write calls: wait for transaction receipt before returning
- All read calls: typed returns matching `FactCheckRecord`

### 3.4 Component Contracts

#### `ClaimForm.tsx`
```
Props: onSubmit(claim, url) → void, isLoading: boolean
- Textarea: min 10 chars, max 500 chars, live char counter
- URL input: validates https:// prefix client-side before submit
- Submit disabled while isLoading
- Shows tx hash while pending
```

#### `VerdictCard.tsx`
```
Props: record: FactCheckRecord
- Color coding:
  TRUE       → #00E5A0 (mint green)
  FALSE      → #FF4D4D (red)
  MISLEADING → #FFB800 (amber)
  UNVERIFIABLE → #6B7280 (gray)
- Animate in on mount (framer motion: fade + slide up)
```

#### `ConfidenceRing.tsx`
```
Props: confidence: number (0–100)
- SVG arc, animates from 0 to value on mount
- Color interpolates: red (0) → amber (50) → green (100)
- Center label: "{confidence}%"
- Sub-label: confidence tier text
```

#### `SourcePanel.tsx`
```
Props: sources: string[]
- List of URLs checked
- Each: favicon, truncated domain, "Fetched" status badge
- Expandable to show full URL
```

---

## 4. Tests Spec

### 4.1 Direct Mode Tests (`test_direct.py`)

All LLM and web calls must be mocked. Tests must run in <500ms each.

| Test | Assertion |
|---|---|
| `test_true_verdict` | Submit claim matching mock source → verdict == "TRUE" |
| `test_false_verdict` | Submit contradicting claim → verdict == "FALSE" |
| `test_misleading_verdict` | Partial claim → verdict == "MISLEADING" |
| `test_source_unreachable` | Mock 404 → verdict == "UNVERIFIABLE", confidence == 0 |
| `test_claim_too_long` | 501 char claim → `ValueError` |
| `test_invalid_url` | `http://` URL → `ValueError` |
| `test_stats_increment` | Submit 3 checks → `total_checks == 3` |
| `test_get_recent_limit` | 20 checks → `get_recent_checks(5)` returns 5 |

### 4.2 Integration Tests (`test_integration.py`)

Run against GenLayer Studio. Require env: `GENLAYER_STUDIO_URL`.

| Test | Assertion |
|---|---|
| `test_deploy` | Contract deploys without error |
| `test_live_claim` | Real URL submitted → returns one of 4 valid verdicts |
| `test_check_stored` | Submitted ID is retrievable via `get_check` |
| `test_history_updates` | `get_recent_checks` includes latest submission |

---

## 5. Deployment

### 5.1 GenLayer Studio

```bash
# Install GenLayer CLI
npm install -g genlayer

# Deploy contract
genlayer deploy --contract contract/fact_checker.py

# Run integration tests
GENLAYER_STUDIO_URL=http://localhost:8080 pytest contract/tests/test_integration.py
```

### 5.2 Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_CONTRACT_ADDRESS and NEXT_PUBLIC_GENLAYER_RPC
npm run dev
```

### 5.3 Environment Variables

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/rpc
NEXT_PUBLIC_NETWORK=studio
```

---

## 6. Submission Notes Template (`docs/SUBMISSION_NOTES.md`)

Use this as the GenLayer portal "Notes / Description" field:

```
TruthLock is an on-chain fact-checker powered by GenLayer Intelligent Contracts.

HOW IT WORKS:
1. User submits a claim (text) + a primary source URL via the React frontend
2. The Intelligent Contract fetches the primary source using get_webpage()
3. The LLM extracts 2 corroborating source URLs from the primary content
4. All 3 sources are fetched and sent to the LLM for cross-reference analysis
5. Validators reach consensus via Optimistic Democracy on the verdict
6. Result is stored permanently on-chain: TRUE / FALSE / MISLEADING / UNVERIFIABLE

WHY GENLAYER:
Traditional smart contracts cannot evaluate "Is this claim supported by evidence?"
GenLayer's LLM consensus + live web access enables trustless judgment — no oracle,
no human reviewer, no centralized API.

WHAT'S BUILT:
- Full Intelligent Contract (Python/GenVM) with 4 public methods
- Next.js 15 frontend that calls the contract end-to-end
- Direct mode + integration test suite
- Live demo on GenLayer Studio testnet

REPO: https://github.com/habte-selassie27/truthlock-genlayer
```

---

## 7. Agent Roles & Rules

### Architect (Qwen3)
- Owns this AGENTS.md
- Any spec change requires updating this file first
- Must not introduce external dependencies not listed in §3.1

### Implementer (Claude Sonnet)
- Implement exactly as specced — no creative deviations
- Contract file must be `contract/fact_checker.py`
- Frontend must use App Router, never Pages Router
- Every component must have TypeScript props interface
- No `any` types
- No inline styles — Tailwind only

### Tester (Gemini 2.5 Pro)
- Every method in §2.3 must have a direct mode test
- Mock all external calls in `test_direct.py`
- Integration tests must clean up state between runs
- Coverage target: 100% of public contract methods

### Reviewer (o3)
- Verify equivalence principle is correct for every LLM call
- Verify no `strict_eq` used on LLM outputs
- Verify frontend error states are handled
- Verify submission notes match actual implementation

---

## 8. Quality Bar Checklist (GenLayer Portal)

Before submitting, every item must be true:

- [ ] Solves a real trust problem (not a demo/toy)
- [ ] Uses live web data (`get_webpage` is called on real URLs)
- [ ] Complete source code in repo with accurate README
- [ ] Frontend genuinely calls the contract (not mocked)
- [ ] Handles the full transaction lifecycle (submit → pending → result)
- [ ] Meaningfully different from boilerplate HelloWorld
- [ ] Integration tests pass on Studio
- [ ] Submission notes explain what it does, the problem it solves, and how to use it

**Bonus (extra points):**
- [ ] Live demo video (Loom, <3 min)
- [ ] Public post on X/Twitter tagging @GenLayerLabs
