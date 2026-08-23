# GenLayer Portal Submission Notes

Use as the portal "Notes / Description" field:

---

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
- Next.js 15 frontend that calls the contract end-to-end (genlayer-js SDK)
- Direct mode test suite (21 tests, all LLM/web calls mocked) + Studio integration suite
- Live demo on GenLayer Studio testnet

HOW TO USE:
1. Open the app and connect your wallet
2. Enter a claim (e.g. "The Great Wall of China is visible from space") + any https:// source URL
3. Watch the transaction status: pending → validators reaching consensus → verdict recorded
4. The result page shows the stamped verdict, animated confidence ring, explanation, and all 3 sources checked — permanently verifiable by anyone via the History page

REPO: https://github.com/habte-selassie27/truthlock-genlayer
