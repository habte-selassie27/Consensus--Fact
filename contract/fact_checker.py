# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""TruthLock - On-Chain Fact Checker.

GenLayer Intelligent Contract: fetches live web data for a claim + primary
source, cross-references three independent sources via LLM reasoning, and
stores a permanent consensus verdict on-chain:
TRUE / FALSE / MISLEADING / UNVERIFIABLE with confidence score & explanation.
"""

import json
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


@allow_storage
@dataclass
class FactCheckRecord:
    id: str                   # generated at submission (see submit_claim)
    claim: str                # raw claim text (max 500 chars)
    source_url: str           # primary URL submitted by user
    verdict: str              # TRUE | FALSE | MISLEADING | UNVERIFIABLE
    confidence: int           # 0-100
    explanation: str          # LLM-generated 2-3 sentence reasoning
    sources_checked: DynArray[str]
    timestamp: int            # block timestamp
    submitter: str            # wallet address


class FactChecker(gl.Contract):
    checks: TreeMap[str, FactCheckRecord]
    total_checks: int
    verdicts_by_type: TreeMap[str, int]

    def __init__(self):
        self.total_checks = 0

    def _validate_claim(self, claim: str) -> None:
        if claim is None or len(claim.strip()) == 0:
            raise gl.UserError("Claim must be non-empty")
        if len(claim) > MAX_CLAIM_LENGTH:
            raise gl.UserError("Claim must be 500 characters or fewer")

    def _validate_source_url(self, source_url: str) -> None:
        if not isinstance(source_url, str) or not source_url.startswith("https://"):
            raise gl.UserError("Source URL must start with https://")
