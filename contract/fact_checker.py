# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""TruthLock - On-Chain Fact Checker.

GenLayer Intelligent Contract: fetches live web data for a claim + primary
source, cross-references three independent sources via LLM reasoning, and
stores a permanent consensus verdict on-chain:
TRUE / FALSE / MISLEADING / UNVERIFIABLE with confidence score & explanation.
"""

import json
import time
from dataclasses import dataclass

from genlayer import *

MAX_CLAIM_LENGTH = 500
MAX_RECENT_LIMIT = 50
DEFAULT_RECENT_LIMIT = 10
SOURCE_CONTENT_SLICE = 2000
NUM_CORROBORATING_SOURCES = 2
MAX_LLM_ATTEMPTS = 2

VERDICT_TRUE = "TRUE"
VERDICT_FALSE = "FALSE"
VERDICT_MISLEADING = "MISLEADING"
VERDICT_UNVERIFIABLE = "UNVERIFIABLE"
VALID_VERDICTS = (
    VERDICT_TRUE,
    VERDICT_FALSE,
    VERDICT_MISLEADING,
    VERDICT_UNVERIFIABLE,
)

UNREACHABLE_EXPLANATION = "Primary source could not be fetched."
PIPELINE_FAILURE_EXPLANATION = (
    "The fact-check pipeline failed to produce a structured verdict."
)
INVALID_VERDICT_EXPLANATION = "The model returned an unrecognized verdict value."

ERROR_EXPECTED = "[EXPECTED]"
ERROR_EXTERNAL = "[EXTERNAL]"
ERROR_TRANSIENT = "[TRANSIENT]"
ERROR_LLM = "[LLM_ERROR]"

EQUIVALENCE_PRINCIPLE = """
The payload is JSON with fields: status, sources, raw_result.
For status 'ok', raw_result must contain verdict, confidence, explanation.
The verdict field must be exactly the same across validator runs and one of: TRUE, FALSE, MISLEADING, UNVERIFIABLE.
The confidence must be an integer between 0 and 100 and within 10 points across validator runs.
The explanation must be a non-empty string; minor wording differences are acceptable.
The extracted sources list must contain the same primary URL and equivalent corroborating URLs.
A 'unreachable' status must agree with a 'unreachable' status.
"""

EXTRACT_URLS_PROMPT = """You are a research assistant. Below is the text content of a web page.

PAGE CONTENT:
{content}

Extract exactly {num} URLs that appear in or are referenced by this page content which would be good independent corroborating sources about the page's subject matter. Only use https:// URLs. Prefer official institutions, encyclopedias, and established news outlets.

Respond ONLY with a valid JSON array of URL strings, no markdown, no preamble:
["https://example.com/a", "https://example.com/b"]
"""


def _clean_json(text):
    if isinstance(text, dict) or isinstance(text, list):
        return text
    raw = str(text).strip()
    if raw.startswith("```"):
        newline = raw.find("\n")
        if newline != -1:
            raw = raw[newline + 1 :]
        if raw.rstrip().endswith("```"):
            raw = raw.rstrip()[:-3]
        raw = raw.strip()
    candidates = []
    brace_start = raw.find("{")
    brace_end = raw.rfind("}")
    bracket_start = raw.find("[")
    bracket_end = raw.rfind("]")
    if bracket_start != -1 and (brace_start == -1 or bracket_start < brace_start):
        if bracket_end > bracket_start:
            candidates.append(raw[bracket_start : bracket_end + 1])
    if brace_start != -1 and brace_end > brace_start:
        candidates.append(raw[brace_start : brace_end + 1])
    candidates.append(raw)
    import re

    for candidate in candidates:
        cleaned = re.sub(r",(?!\s*?[\{\[\"\'\w])", "", candidate)
        try:
            return json.loads(cleaned)
        except (ValueError, TypeError):
            continue
    return None


@allow_storage
@dataclass
class FactCheckRecord:
    id: str                   # generated at submission (see submit_claim)
    claim: str                # raw claim text (max 500 chars)
    source_url: str           # primary URL submitted by user
    verdict: str              # TRUE | FALSE | MISLEADING | UNVERIFIABLE
    confidence: bigint        # 0-100
    explanation: str          # LLM-generated 2-3 sentence reasoning
    sources_checked: DynArray[str]
    timestamp: bigint         # int(time.time()) — tx-pinned clock
    submitter: str            # wallet address


class FactChecker(gl.Contract):
    checks: TreeMap[str, FactCheckRecord]
    total_checks: bigint
    verdicts_by_type: TreeMap[str, bigint]

    def __init__(self):
        self.total_checks = 0

    # ------------------------------------------------------------------
    # Public methods (AGENTS.md 2.3)
    # ------------------------------------------------------------------

    @gl.public.write
    def submit_claim(self, claim: str, source_url: str) -> str:
        """Submit a claim + primary source URL; returns the on-chain check ID."""
        self._validate_claim(claim)
        self._validate_source_url(source_url)

        # GenVM has no block number; use tx-pinned timestamp for uniqueness
        check_id = str(gl.message.sender_address)[-8:] + str(int(time.time()))

        def run():
            return self._run_check_pipeline(claim, source_url)

        outcome = gl.eq_principle.prompt_comparative(
            run, principle=EQUIVALENCE_PRINCIPLE
        )

        parsed = _clean_json(outcome)
        sources_checked, verdict, confidence, explanation = self._resolve_outcome(
            parsed, source_url
        )
        self._store_record(
            check_id=check_id,
            claim=claim,
            source_url=source_url,
            verdict=verdict,
            confidence=confidence,
            explanation=explanation,
            sources=sources_checked,
        )
        return check_id

    @gl.public.view
    def get_check(self, id: str) -> dict:
        """Return a stored fact-check record by ID."""
        if id not in self.checks:
            raise gl.UserError("Check not found")
        return self._record_to_dict(self.checks[id])

    @gl.public.view
    def get_recent_checks(self, limit: int = DEFAULT_RECENT_LIMIT) -> list:
        """Return the last N checks sorted by timestamp desc (max 50)."""
        if limit is None or limit <= 0:
            limit = DEFAULT_RECENT_LIMIT
        limit = min(limit, MAX_RECENT_LIMIT)

        records = sorted(
            list(self.checks.values()), key=lambda r: r.timestamp, reverse=True
        )
        return [self._record_to_dict(r) for r in records[:limit]]

    @gl.public.view
    def get_stats(self) -> dict:
        """Return global contract stats."""
        most_recent_timestamp = 0
        for record in self.checks.values():
            if record.timestamp > most_recent_timestamp:
                most_recent_timestamp = record.timestamp
        tallies = {}
        for key, value in self.verdicts_by_type.items():
            tallies[key] = value
        return {
            "total_checks": self.total_checks,
            "verdicts_by_type": tallies,
            "most_recent_timestamp": most_recent_timestamp,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _validate_claim(self, claim: str) -> None:
        if claim is None or len(claim.strip()) == 0:
            raise gl.UserError("Claim must be non-empty")
        if len(claim) > MAX_CLAIM_LENGTH:
            raise gl.UserError("Claim must be 500 characters or fewer")

    def _validate_source_url(self, source_url: str) -> None:
        if not isinstance(source_url, str) or not source_url.startswith("https://"):
            raise gl.UserError("Source URL must start with https://")

    def _run_check_pipeline(self, claim: str, source_url: str) -> str:
        """Non-deterministic pipeline: fetch primary, extract corroborating
        URLs via LLM, fetch them, evaluate via LLM. Returns a JSON string
        comparable across validators."""
        try:
            primary_content = gl.get_webpage(source_url, mode="text")
        except Exception:
            return json.dumps(
                {
                    "status": "unreachable",
                    "sources": [source_url],
                    "raw_result": None,
                    "failed_count": 0,
                }
            )

        corroborating_urls = self._extract_corroborating_sources(primary_content)

        contents = [str(primary_content)]
        fetched_urls = [source_url]
        failed_count = 0

        for url in corroborating_urls[:NUM_CORROBORATING_SOURCES]:
            try:
                contents.append(str(gl.get_webpage(url, mode="text")))
                fetched_urls.append(url)
            except Exception:
                failed_count += 1

        while len(contents) < 3:
            contents.append("")

        prompt = self._build_evaluation_prompt(claim, contents, fetched_urls)

        raw_result = None
        for attempt in range(MAX_LLM_ATTEMPTS):
            response = gl.nondet.exec_prompt(prompt, response_format="json")
            raw_result = _clean_json(response)
            if isinstance(raw_result, dict):
                break

        return json.dumps(
            {
                "status": "ok",
                "sources": fetched_urls,
                "raw_result": raw_result if isinstance(raw_result, dict) else None,
                "failed_count": failed_count,
            }
        )

    def _extract_corroborating_sources(self, primary_content: str) -> list:
        """Use the LLM to pull up to 2 corroborating URLs from page content."""
        prompt = EXTRACT_URLS_PROMPT.format(
            content=str(primary_content)[:SOURCE_CONTENT_SLICE],
            num=NUM_CORROBORATING_SOURCES,
        )
        response = gl.nondet.exec_prompt(prompt, response_format="json")
        parsed = _clean_json(response)

        if not isinstance(parsed, list):
            return []

        urls = []
        for item in parsed:
            if isinstance(item, str) and item.startswith("https://"):
                if item not in urls and item != "":
                    urls.append(item)
        return urls[:NUM_CORROBORATING_SOURCES]

    def _build_evaluation_prompt(
        self, claim: str, contents: list, source_urls: list
    ) -> str:
        url1 = source_urls[0] if len(source_urls) > 0 else "unavailable"
        url2 = source_urls[1] if len(source_urls) > 1 else "unavailable"
        url3 = source_urls[2] if len(source_urls) > 2 else "unavailable"

        return f"""You are a professional fact-checker. Evaluate the following claim against the provided source content.

CLAIM: {claim}

SOURCE 1 ({url1}):
{contents[0][:SOURCE_CONTENT_SLICE]}

SOURCE 2 ({url2}):
{contents[1][:SOURCE_CONTENT_SLICE]}

SOURCE 3 ({url3}):
{contents[2][:SOURCE_CONTENT_SLICE]}

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
- Return ONLY the JSON, no markdown, no preamble"""

    def _resolve_outcome(self, parsed, fallback_source_url: str):
        """Deterministic post-processing of the pipeline output."""
        if not isinstance(parsed, dict):
            return [fallback_source_url], VERDICT_UNVERIFIABLE, 0, PIPELINE_FAILURE_EXPLANATION

        sources = [fallback_source_url]
        raw_sources = parsed.get("sources")
        if isinstance(raw_sources, list):
            sources = []
            for item in raw_sources:
                if isinstance(item, str) and item.startswith("https://"):
                    sources.append(item)
            if fallback_source_url not in sources:
                sources.insert(0, fallback_source_url)

        if parsed.get("status") != "ok":
            return sources, VERDICT_UNVERIFIABLE, 0, UNREACHABLE_EXPLANATION

        raw_result = parsed.get("raw_result")
        if not isinstance(raw_result, dict):
            return sources, VERDICT_UNVERIFIABLE, 0, PIPELINE_FAILURE_EXPLANATION

        verdict = raw_result.get("verdict")
        confidence = self._coerce_confidence(raw_result.get("confidence"))
        explanation = raw_result.get("explanation")

        if not isinstance(verdict, str) or verdict not in VALID_VERDICTS:
            return sources, VERDICT_UNVERIFIABLE, 0, INVALID_VERDICT_EXPLANATION

        if not isinstance(explanation, str) or len(explanation.strip()) == 0:
            explanation = "No explanation was provided by the model."

        failed_count = parsed.get("failed_count", 0)
        if isinstance(failed_count, int) and failed_count > 0:
            explanation = (
                f"Note: {failed_count} corroborating source(s) could not be "
                f"fetched and were excluded. {explanation}"
            )

        return sources, verdict, confidence, explanation

    @staticmethod
    def _coerce_confidence(value) -> int:
        try:
            confidence = int(round(float(str(value).strip())))
        except (TypeError, ValueError):
            return 0
        if confidence < 0:
            return 0
        if confidence > 100:
            return 100
        return confidence

    def _record_to_dict(self, record: FactCheckRecord) -> dict:
        return {
            "id": record.id,
            "claim": record.claim,
            "source_url": record.source_url,
            "verdict": record.verdict,
            "confidence": record.confidence,
            "explanation": record.explanation,
            "sources_checked": [u for u in record.sources_checked],
            "timestamp": record.timestamp,
            "submitter": record.submitter,
        }

    def _current_timestamp(self) -> int:
        # Transaction-pinned clock: deterministic across all validators
        return int(time.time())

    def _store_record(
        self,
        check_id: str,
        claim: str,
        source_url: str,
        verdict: str,
        confidence: int,
        explanation: str,
        sources: list,
    ) -> None:
        record = FactCheckRecord(
            id=check_id,
            claim=claim,
            source_url=source_url,
            verdict=verdict,
            confidence=confidence,
            explanation=explanation,
            sources_checked=[],
            timestamp=self._current_timestamp(),
            submitter=str(gl.message.sender_address),
        )
        for url in sources:
            record.sources_checked.append(url)

        self.checks[check_id] = record
        self.total_checks += 1
        current = self.verdicts_by_type[verdict] if verdict in self.verdicts_by_type else 0
        self.verdicts_by_type[verdict] = current + 1
