"""Integration tests for TruthLock against GenLayer Studio (AGENTS.md 4.2).

Requires a running Studio node and the gltest pytest plugin:

    export GENLAYER_STUDIO_URL=http://localhost:8080
    pip install -e .[gltest]   # or: pip install gltest
    pytest contract/tests/test_integration.py

Skips cleanly when gltest or the Studio node is unavailable, so the plain
direct-mode suite always runs.
"""

import os

import pytest

STUDIO_URL = os.environ.get("GENLAYER_STUDIO_URL")

pytest.importorskip(
    "gltest",
    reason="gltest plugin required for integration tests (pip install gltest)",
)

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        not STUDIO_URL,
        reason="GENLAYER_STUDIO_URL not set",
    ),
]

from gltest import deploy_contract, get_account_factory  # noqa: E402

CONTRACT_FILE = "fact_checker.py"
VALID_VERDICTS = {"TRUE", "FALSE", "MISLEADING", "UNVERIFIABLE"}
LIVE_CLAIM = (
    "The Eiffel Tower was completed in 1889 for the World's Fair in Paris."
)
LIVE_SOURCE_URL = "https://www.toureiffel.paris/en/the-monument"


@pytest.fixture(scope="module")
def checker_contract(deploy_contract):
    return deploy_contract(
        contract_file_name=CONTRACT_FILE,
        constructor_args=[],
    )


def _submit(checker_contract, claim: str, url: str) -> str:
    user_account = get_account_factory()()
    response = checker_contract.submit_claim(
        args=[claim, url],
        account=user_account,
    )
    check_id = _extract_return_value(response)
    assert isinstance(check_id, str) and len(check_id) > 0
    return check_id


def _extract_return_value(response):
    if isinstance(response, dict) and "return_value" in response:
        return response["return_value"]
    return response


def _get_record(checker_contract, check_id: str) -> dict:
    result = checker_contract.get_check(args=[check_id])
    if isinstance(result, dict) and "return_value" in result:
        result = result["return_value"]
    if isinstance(result, str):
        import json

        result = json.loads(result)
    return result


# ---------------------------------------------------------------------------
# Required assertions (AGENTS.md 4.2)
# ---------------------------------------------------------------------------


class TestIntegration:
    def test_deploy(self, checker_contract):
        stats = checker_contract.get_stats(args=[])
        if isinstance(stats, dict) and "return_value" in stats:
            stats = stats["return_value"]
        total = int(stats["total_checks"]) if isinstance(stats, dict) else 0
        assert total >= 0

    def test_live_claim(self, checker_contract):
        check_id = _submit(checker_contract, LIVE_CLAIM, LIVE_SOURCE_URL)
        record = _get_record(checker_contract, check_id)
        assert record["verdict"] in VALID_VERDICTS
        confidence = int(record["confidence"])
        assert 0 <= confidence <= 100

    def test_check_stored(self, checker_contract):
        check_id = _submit(checker_contract, LIVE_CLAIM, LIVE_SOURCE_URL)
        record = _get_record(checker_contract, check_id)
        assert record["id"] == check_id
        assert record["source_url"] == LIVE_SOURCE_URL
        assert len(record["explanation"]) > 0

    def test_history_updates(self, checker_contract):
        check_id = _submit(checker_contract, LIVE_CLAIM, LIVE_SOURCE_URL)
        recent = checker_contract.get_recent_checks(args=[10])
        if isinstance(recent, dict) and "return_value" in recent:
            recent = recent["return_value"]
        if isinstance(recent, str):
            import json

            recent = json.loads(recent)
        ids = [r["id"] if isinstance(r, dict) else r.id for r in recent]
        assert check_id in ids
