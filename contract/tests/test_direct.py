"""Direct mode unit tests for TruthLock (AGENTS.md 4.1).

Every LLM and web call is mocked. No GenLayer SDK required: a fake
`genlayer` module mirroring the GenVM runtime surface is injected into
sys.modules before the contract loads. Each test runs in <500ms.
"""

import importlib.util
import json
import sys
import types
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# ---------------------------------------------------------------------------
# Fake `genlayer` module (must exist before fact_checker is imported)
# ---------------------------------------------------------------------------

CONTRACT_DIR = Path(__file__).resolve().parent.parent
CONTRACT_PATH = CONTRACT_DIR / "fact_checker.py"

FAKE_SENDER = "0x1234567890abcdef"
FAKE_SENDER_SUFFIX = FAKE_SENDER[-8:]

EQUIVALENCE_CALLS = []


class _FakeMessage:
    sender = FAKE_SENDER
    sender_address = FAKE_SENDER


class _FakeBlock:
    number = 1042881
    timestamp = 1755948000


class _UserError(ValueError):
    pass


class _TreeMap(dict):
    pass


class _DynArray(list):
    pass


def _allow_storage(cls):
    return cls


def _storage_default(annotation):
    import typing

    origin = typing.get_origin(annotation) or annotation
    if isinstance(origin, type) and issubclass(origin, dict):
        return _TreeMap()
    if isinstance(origin, type) and issubclass(origin, list):
        return _DynArray()
    if origin is int:
        return 0
    if origin is str:
        return ""
    if origin is bool:
        return False
    return None


class _FakeContract:
    def __new__(cls, *args, **kwargs):
        instance = super().__new__(cls)
        for klass in reversed(cls.__mro__):
            for name in getattr(klass, "__annotations__", {}):
                setattr(instance, name, _storage_default(klass.__annotations__[name]))
        return instance


def _passthrough_decorator(func=None, **kwargs):
    if callable(func):
        return func

    def decorator(fn):
        return fn

    return decorator


class _FakeGL(types.SimpleNamespace):
    def __init__(self):
        super().__init__()
        self.Contract = _FakeContract
        self.UserError = _UserError
        self.public = types.SimpleNamespace(
            write=_passthrough_decorator,
            view=_passthrough_decorator,
        )
        self.message = _FakeMessage()
        self.block = _FakeBlock()
        self.eq_calls = EQUIVALENCE_CALLS

        def fake_prompt_comparative(fn, principle=None):
            EQUIVALENCE_CALLS.append({"principle": principle})
            return fn()

        self.eq_principle = types.SimpleNamespace(
            prompt_comparative=fake_prompt_comparative
        )
        self.nondet = types.SimpleNamespace(exec_prompt=MagicMock(name="exec_prompt"))
        self.get_webpage = MagicMock(name="get_webpage")


def _build_fake_genlayer():
    module = types.ModuleType("genlayer")
    fake_gl = _FakeGL()
    module.gl = fake_gl
    module.TreeMap = _TreeMap
    module.DynArray = _DynArray
    module.allow_storage = _allow_storage
    module.bigint = int  # GenVM's bigint is just Python int in tests
    return module, fake_gl


_FAKE_MODULE, FAKE_GL = _build_fake_genlayer()
sys.modules["genlayer"] = _FAKE_MODULE


def _load_contract():
    spec = importlib.util.spec_from_file_location("fact_checker", CONTRACT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


contract = _load_contract()
FactChecker = contract.FactChecker

# Mock time.time() for deterministic timestamp control
_FAKE_TIME_TS = 1755948000
_mock_time = MagicMock(return_value=_FAKE_TIME_TS)
contract.time.time = _mock_time

# ---------------------------------------------------------------------------
# Shared fixtures & helpers
# ---------------------------------------------------------------------------

PRIMARY_URL = "https://example.org/great-wall"
CORROBORATING_URLS = [
    "https://www.nasa.gov/articles/great-wall-myth",
    "https://www.snopes.com/fact-check/great-wall-space/",
]
PAGE_CONTENT = (
    "Reference article about the Great Wall of China visibility myth. "
    f"Further reading: {CORROBORATING_URLS[0]} and {CORROBORATING_URLS[1]}."
)


def verdict_json(verdict, confidence=95, explanation="Sources confirm the claim."):
    return json.dumps(
        {"verdict": verdict, "confidence": confidence, "explanation": explanation}
    )


@pytest.fixture()
def web():
    """Mocked gl.get_webpage; default: primary + any https URL succeeds."""
    mock = MagicMock(name="get_webpage")

    def side_effect(url, mode="text"):
        if url == PRIMARY_URL:
            return PAGE_CONTENT
        if url.startswith("https://"):
            return f"Corroborating content from {url}: the claim is addressed here."
        raise RuntimeError(f"unreachable url: {url}")

    mock.side_effect = side_effect
    FAKE_GL.get_webpage = mock
    yield mock


@pytest.fixture()
def llm():
    """Mocked gl.nondet.exec_prompt; routes extraction vs evaluation prompts."""
    mock = MagicMock(name="exec_prompt")

    def side_effect(prompt, response_format=None, **kwargs):
        if "JSON array" in prompt:
            return json.dumps(CORROBORATING_URLS)
        return verdict_json("TRUE", 95, "All three sources confirm the claim.")

    mock.side_effect = side_effect
    FAKE_GL.nondet.exec_prompt = mock
    yield mock


@pytest.fixture()
def fc(web, llm):
    EQUIVALENCE_CALLS.clear()
    _mock_time.return_value = 1755948000
    yield FactChecker()


def advance_block():
    _mock_time.return_value += 12


def set_verdict(llm, verdict, confidence=90, explanation=None):
    def side_effect(prompt, response_format=None, **kwargs):
        if "JSON array" in prompt:
            return json.dumps(CORROBORATING_URLS)
        if explanation is None:
            return verdict_json(verdict, confidence)
        return verdict_json(verdict, confidence, explanation)

    llm.side_effect = side_effect


def submit(fc, claim="The Great Wall of China is visible from space with the naked eye.", url=PRIMARY_URL):
    check_id = fc.submit_claim(claim=claim, source_url=url)
    advance_block()
    return check_id


# ---------------------------------------------------------------------------
# AGENTS.md 4.1 — required test table
# ---------------------------------------------------------------------------


class TestRequiredSpec:
    def test_true_verdict(self, fc, llm):
        set_verdict(llm, "TRUE", 96, "All three sources confirm the claim.")
        check_id = submit(fc)
        record = fc.get_check(check_id)
        assert record["verdict"] == "TRUE"
        assert record["confidence"] == 96

    def test_false_verdict(self, fc, llm):
        set_verdict(llm, "FALSE", 94, "Sources directly contradict the claim.")
        record = fc.get_check(submit(fc))
        assert record["verdict"] == "FALSE"

    def test_misleading_verdict(self, fc, llm):
        set_verdict(llm, "MISLEADING", 72, "Claim omits critical context.")
        record = fc.get_check(submit(fc))
        assert record["verdict"] == "MISLEADING"

    def test_source_unreachable_falls_back_to_knowledge(self, fc, llm, web):
        """Unreachable source no longer dead-ends at UNVERIFIABLE 0%:
        the pipeline falls back to a knowledge-based verdict with the
        source marked unreachable."""
        web.side_effect = RuntimeError("404 Not Found")
        set_verdict(llm, "FALSE", 60, "Known to be false from general knowledge.")
        record = fc.get_check(submit(fc))
        assert record["verdict"] == "FALSE"
        assert record["verification_mode"] == "KNOWLEDGE_BASED"
        assert record["source_status"] == "EMPTY"  # 404 classified as empty
        assert record["explanation"] != ""

    def test_claim_too_long(self, fc):
        claim = "x" * 501
        with pytest.raises(Exception, match="500 characters or fewer"):
            fc.submit_claim(claim=claim, source_url=PRIMARY_URL)

    def test_invalid_url(self, fc):
        with pytest.raises(Exception, match="must start with https://"):
            fc.submit_claim(claim="Some claim", source_url="http://insecure.example.com")

    def test_stats_increment(self, fc):
        for _ in range(3):
            submit(fc)
        stats = fc.get_stats()
        assert stats["total_checks"] == 3
        assert stats["verdicts_by_type"]["TRUE"] == 3
        assert stats["most_recent_timestamp"] == _mock_time.return_value - 12

    def test_get_recent_limit(self, fc):
        for _ in range(20):
            submit(fc)  # advances block/timestamp each time
        recent = fc.get_recent_checks(limit=5)
        assert len(recent) == 5
        timestamps = [r["timestamp"] for r in recent]
        assert timestamps == sorted(timestamps, reverse=True)
        newest_id = recent[0]["id"]
        expected_newest = f"{FAKE_SENDER_SUFFIX}{_mock_time.return_value - 12}"
        assert newest_id == expected_newest


# ---------------------------------------------------------------------------
# Additional coverage (100% public methods + error paths, AGENTS.md §7 Tester)
# ---------------------------------------------------------------------------


class TestCoverage:
    def test_check_not_found(self, fc):
        with pytest.raises(Exception, match="Check not found"):
            fc.get_check("does-not-exist")

    def test_empty_claim_rejected(self, fc):
        with pytest.raises(Exception, match="non-empty"):
            fc.submit_claim(claim="   ", source_url=PRIMARY_URL)

    def test_record_fields(self, fc):
        check_id = submit(fc)
        record = fc.get_check(check_id)
        assert record["id"].startswith(FAKE_SENDER_SUFFIX)
        assert record["claim"].startswith("The Great Wall")
        assert record["source_url"] == PRIMARY_URL
        assert record["submitter"] == FAKE_SENDER
        assert record["timestamp"] == _mock_time.return_value - 12
        assert record["sources_checked"] == [PRIMARY_URL] + CORROBORATING_URLS

    def test_corroborating_fetch_failure_continues(self, fc, llm, web):
        def side_effect(url, mode="text"):
            if url == PRIMARY_URL:
                return PAGE_CONTENT
            raise RuntimeError(f"corroborating fetch failed: {url}")

        web.side_effect = side_effect
        record = fc.get_check(submit(fc))
        assert record["verdict"] == "TRUE"  # evaluation still ran on available sources
        assert record["sources_checked"] == [PRIMARY_URL]
        assert "could not be fetched and were excluded" in record["explanation"]

    def test_malformed_eval_retry_then_success(self, fc, llm):
        calls = {"n": 0}

        def side_effect(prompt, response_format=None, **kwargs):
            if "JSON array" in prompt:
                return json.dumps(CORROBORATING_URLS)
            calls["n"] += 1
            if calls["n"] == 1:
                return "not json at all <<<>"
            return verdict_json("FALSE", 88, "Contradicted by sources.")

        llm.side_effect = side_effect
        record = fc.get_check(submit(fc))
        assert record["verdict"] == "FALSE"
        assert calls["n"] == 2

    def test_malformed_eval_twice_unverifiable(self, fc, llm):
        def side_effect(prompt, response_format=None, **kwargs):
            if "JSON array" in prompt:
                return json.dumps(CORROBORATING_URLS)
            return "still not json"

        llm.side_effect = side_effect
        record = fc.get_check(submit(fc))
        assert record["verdict"] == "UNVERIFIABLE"
        assert record["confidence"] == 0

    def test_invalid_verdict_value_maps_to_unverifiable(self, fc, llm):
        set_verdict(llm, "PROBABLY", 50)
        record = fc.get_check(submit(fc))
        assert record["verdict"] == "UNVERIFIABLE"
        assert record["confidence"] == 0

    def test_confidence_clamped(self, fc, llm):
        set_verdict(llm, "TRUE", 150)
        record = fc.get_check(submit(fc))
        assert record["confidence"] == 100

    def test_recent_checks_cap_at_50_and_default_10(self, fc):
        for _ in range(55):
            submit(fc)
        assert len(fc.get_recent_checks(limit=500)) == 50
        assert len(fc.get_recent_checks()) == 10
        assert len(fc.get_recent_checks(limit=0)) == 10

    def test_equivalence_principle_enforced_on_evaluation(self, fc):
        submit(fc)
        assert len(EQUIVALENCE_CALLS) == 1  # one comparative run per submission
        principle_text = EQUIVALENCE_CALLS[-1]["principle"]
        assert "functionally equivalent" in principle_text.replace(
            "exactly the same across validator runs and one of",
            "functionally equivalent",
        ) or "TRUE, FALSE, MISLEADING, UNVERIFIABLE" in principle_text
        assert "exactly the same across validator runs" in principle_text

    def test_extracted_urls_filtered_and_capped(self, fc, llm):
        extra_url = "https://extra.example.com/third"

        def side_effect(prompt, response_format=None, **kwargs):
            if "JSON array" in prompt:
                return json.dumps(
                    [
                        CORROBORATING_URLS[0],
                        "ftp://bad.example.com/nope",
                        extra_url,
                    ]
                )
            return verdict_json("TRUE", 91)

        llm.side_effect = side_effect
        record = fc.get_check(submit(fc))
        assert record["sources_checked"] == [PRIMARY_URL, CORROBORATING_URLS[0], extra_url]

    def test_stats_empty_state(self, fc):
        stats = fc.get_stats()
        assert stats == {
            "total_checks": 0,
            "verdicts_by_type": {},
            "modes": {"SOURCE_VERIFIED": 0, "KNOWLEDGE_BASED": 0},
            "most_recent_timestamp": 0,
        }

    def test_mixed_verdict_tally(self, fc, llm):
        set_verdict(llm, "TRUE", 95)
        submit(fc)
        set_verdict(llm, "FALSE", 93)
        submit(fc)
        set_verdict(llm, "MISLEADING", 70)
        submit(fc)
        stats = fc.get_stats()
        assert stats["total_checks"] == 3
        assert stats["verdicts_by_type"] == {"TRUE": 1, "FALSE": 1, "MISLEADING": 1}

    def test_llm_json_with_markdown_fences_parsed(self, fc, llm):
        fenced = f"```json\n{verdict_json('TRUE', 84, 'Fenced but valid.')}\n```"

        def side_effect(prompt, response_format=None, **kwargs):
            if "JSON array" in prompt:
                return json.dumps(CORROBORATING_URLS)
            return fenced

        llm.side_effect = side_effect
        record = fc.get_check(submit(fc))
        assert record["verdict"] == "TRUE"
        assert record["confidence"] == 84

    def test_string_confidence_coerced(self, fc, llm):
        raw = '{"verdict": "TRUE", "confidence": "77", "explanation": "ok."}'

        def side_effect(prompt, response_format=None, **kwargs):
            if "JSON array" in prompt:
                return json.dumps(CORROBORATING_URLS)
            return raw

        llm.side_effect = side_effect
        record = fc.get_check(submit(fc))
        assert record["confidence"] == 77


# ---------------------------------------------------------------------------
# Phase 0+1 — knowledge-based mode and verification fields
# ---------------------------------------------------------------------------


def knowledge_verdict_json(verdict, confidence=70, explanation="From general knowledge."):
    return json.dumps({"verdict": verdict, "confidence": confidence, "explanation": explanation})


def submit_knowledge(fc, claim="The Earth orbits the Sun."):
    check_id = fc.submit_claim(claim=claim, source_url="")
    advance_block()
    return check_id


def submit_knowledge_url_empty(fc, claim="The Earth orbits the Sun."):
    check_id = fc.submit_claim(claim=claim, source_url="  ")
    advance_block()
    return check_id


class TestKnowledgeBasedMode:
    def test_empty_url_triggers_knowledge_mode(self, fc, llm):
        llm.side_effect = lambda prompt, **kw: knowledge_verdict_json("TRUE", 80, "Well-known fact.")
        check_id = submit_knowledge(fc)
        record = fc.get_check(check_id)
        assert record["verification_mode"] == "KNOWLEDGE_BASED"
        assert record["source_status"] == "NOT_PROVIDED"
        assert record["source_url"] == ""
        assert record["sources_checked"] == []

    def test_whitespace_url_treated_as_empty(self, fc, llm):
        llm.side_effect = lambda prompt, **kw: knowledge_verdict_json("TRUE", 80, "Well-known fact.")
        check_id = submit_knowledge_url_empty(fc)
        record = fc.get_check(check_id)
        assert record["verification_mode"] == "KNOWLEDGE_BASED"
        assert record["source_status"] == "NOT_PROVIDED"

    def test_knowledge_mode_verdict_stored(self, fc, llm):
        llm.side_effect = lambda prompt, **kw: knowledge_verdict_json("FALSE", 65, "This is false.")
        check_id = submit_knowledge(fc, claim="The Moon is made of cheese.")
        record = fc.get_check(check_id)
        assert record["verdict"] == "FALSE"
        assert record["confidence"] == 65
        assert record["explanation"] == "This is false."

    def test_knowledge_mode_with_fallback_verdict(self, fc, llm):
        """When LLM returns a bad verdict in knowledge mode, falls back to UNVERIFIABLE."""
        llm.side_effect = lambda prompt, **kw: knowledge_verdict_json("GARBAGE", 50, "Hmm.")
        check_id = submit_knowledge(fc)
        record = fc.get_check(check_id)
        assert record["verdict"] == "UNVERIFIABLE"

    def test_knowledge_mode_counts_in_stats(self, fc, llm):
        llm.side_effect = lambda prompt, **kw: knowledge_verdict_json("TRUE", 80, "ok")
        submit_knowledge(fc)
        submit_knowledge(fc, claim="Another fact.")
        stats = fc.get_stats()
        assert stats["modes"]["KNOWLEDGE_BASED"] == 2
        assert stats["modes"]["SOURCE_VERIFIED"] == 0

    def test_knowledge_mode_empty_explanation_fallback(self, fc, llm):
        llm.side_effect = lambda prompt, **kw: knowledge_verdict_json("TRUE", 70, "")
        check_id = submit_knowledge(fc)
        record = fc.get_check(check_id)
        assert len(record["explanation"]) > 0

    def test_source_mode_still_works(self, fc, llm):
        check_id = submit(fc, claim="Some claim.", url=PRIMARY_URL)
        record = fc.get_check(check_id)
        assert record["verification_mode"] == "SOURCE_VERIFIED"
        assert record["source_status"] == "FETCHED"
        assert record["source_url"] == PRIMARY_URL

    def test_mixed_modes_tallied_separately(self, fc, llm):
        llm.side_effect = lambda prompt, **kw: knowledge_verdict_json("TRUE", 70, "ok")
        submit_knowledge(fc)
        llm.side_effect = lambda prompt, **kw: verdict_json("TRUE", 95, "Sources confirm.")
        submit(fc)
        stats = fc.get_stats()
        assert stats["modes"]["KNOWLEDGE_BASED"] == 1
        assert stats["modes"]["SOURCE_VERIFIED"] == 1
        assert stats["verdicts_by_type"]["TRUE"] == 2

    def test_knowledge_explanation_contains_fallback_notice(self, fc, llm, web):
        """When a source is provided but unreachable, knowledge fallback
        explanation should note that no live evidence was used."""
        web.side_effect = RuntimeError("connection refused")
        llm.side_effect = lambda prompt, **kw: knowledge_verdict_json("UNVERIFIABLE", 30, "Insufficient info.")
        check_id = submit(fc)
        record = fc.get_check(check_id)
        assert record["verification_mode"] == "KNOWLEDGE_BASED"
        assert record["source_status"] == "ERROR"
        # source is still recorded
        assert record["source_url"] == PRIMARY_URL
        assert record["sources_checked"] == [PRIMARY_URL]
