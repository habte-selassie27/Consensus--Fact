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
