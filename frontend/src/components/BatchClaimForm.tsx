import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Download,
  Globe,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { verdictBadgeClass } from "@/components/verdictStyles";
import { submitClaim, getCheck } from "@/lib/genlayer";
import type { Verdict } from "@/lib/types";

const MAX_BATCH = 10;
const MIN_CLAIM_LENGTH = 10;
const MAX_CLAIM_LENGTH = 500;
const CONCURRENCY = 2;

interface BatchClaimFormProps {
  onSubmitAll?: () => void;
}

interface BatchItem {
  key: string;
  claim: string;
  sourceUrl: string;
}

type ItemState =
  | { kind: "pending" }
  | { kind: "processing" }
  | { kind: "success"; checkId: string; verdict: Verdict | null; confidence: number }
  | { kind: "failed"; message: string };

let localKeyCounter = 0;
function nextKey(): string {
  localKeyCounter += 1;
  return `batch-${Date.now()}-${localKeyCounter}`;
}

function parseCsv(text: string): BatchItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const items: BatchItem[] = [];
  for (const line of lines) {
    // Simple CSV: claim[,source_url] — supports quoted fields
    const match = line.match(/^\s*"((?:[^"]|"")*)"\s*(?:,\s*"([^"]*)")?\s*$/) ?? null;
    const claim = match ? match[1].replace(/""/g, '"') : line.split(",")[0]?.replace(/^"|"$/g, "") ?? "";
    const url = match
      ? (match[2] ?? "")
      : line.includes(",")
        ? (line.split(",").slice(1).join(",").trim().replace(/^"|"$/g, "") ?? "")
        : "";
    if (claim.length > 0) {
      items.push({ key: nextKey(), claim, sourceUrl: url });
    }
  }
  return items.slice(0, MAX_BATCH);
}

export default function BatchClaimForm({ onSubmitAll }: BatchClaimFormProps) {
  const [items, setItems] = useState<BatchItem[]>([
    { key: nextKey(), claim: "", sourceUrl: "" },
  ]);
  const [states, setStates] = useState<Record<string, ItemState>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [touched, setTouched] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvError, setCsvError] = useState<string | null>(null);
  const runTokenRef = useRef(0);

  const validItems = useMemo(
    () =>
      items.filter(
        (it) =>
          it.claim.trim().length >= MIN_CLAIM_LENGTH &&
          it.claim.trim().length <= MAX_CLAIM_LENGTH
      ),
    [items]
  );

  const allUrlsValid = items.every(
    (it) =>
      it.sourceUrl === "" ||
      (it.sourceUrl.startsWith("https://") && it.sourceUrl.length > "https://".length)
  );
  const formValid = validItems.length > 0 && allUrlsValid;

  const counts = useMemo(() => {
    const list = items.map((it) => states[it.key]).filter(Boolean);
    return {
      total: validItems.length,
      done: list.filter((s) => s.kind === "success").length,
      failed: list.filter((s) => s.kind === "failed").length,
      processing: list.filter((s) => s.kind === "processing").length,
      pending: validItems.length - list.filter((s) => s && s.kind !== "pending").length,
    };
  }, [items, states, validItems.length]);

  const updateItem = useCallback((key: string, patch: Partial<BatchItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) =>
      prev.length === 1
        ? [{ key: nextKey(), claim: "", sourceUrl: "" }]
        : prev.filter((it) => it.key !== key)
    );
  }, []);

  async function verifyOne(item: BatchItem, token: number): Promise<void> {
    setStates((prev) => ({ ...prev, [item.key]: { kind: "processing" } }));
    try {
      const { checkId } = await submitClaim(item.claim.trim(), item.sourceUrl.trim());
      let verdict: Verdict | null = null;
      let confidence = 0;
      try {
        const record = await getCheck(checkId);
        verdict = record.verdict;
        confidence = record.confidence;
      } catch {
        // state not propagated yet — still a success, link out
      }
      if (runTokenRef.current !== token) return;
      setStates((prev) => ({
        ...prev,
        [item.key]: { kind: "success", checkId, verdict, confidence },
      }));
    } catch (error) {
      if (runTokenRef.current !== token) return;
      setStates((prev) => ({
        ...prev,
        [item.key]: {
          kind: "failed",
          message: error instanceof Error ? error.message : "Submission failed.",
        },
      }));
    }
  }

  async function runQueue(queue: BatchItem[]) {
    const token = runTokenRef.current;
    let cursor = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (cursor < queue.length) {
        const item = queue[cursor++];
        if (runTokenRef.current !== token) return;
        await verifyOne(item, token);
      }
    });
    await Promise.all(workers);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!formValid || isRunning) return;
    setIsRunning(true);
    onSubmitAll?.();
    setStates(
      Object.fromEntries(validItems.map((it) => [it.key, { kind: "pending" as const }]))
    );
    await runQueue(validItems);
    setIsRunning(false);
  }

  async function retryFailed() {
    const failedKeys = new Set(
      items.filter((it) => states[it.key]?.kind === "failed").map((it) => it.key)
    );
    const retryQueue = validItems.filter((it) => failedKeys.has(it.key));
    if (retryQueue.length === 0) return;
    setIsRunning(true);
    await runQueue(retryQueue);
    setIsRunning(false);
  }

  function handleCsvImport() {
    const parsed = parseCsv(csvText);
    if (parsed.length === 0) {
      setCsvError("No valid claims found. Expected: claim[,source_url] per line.");
      return;
    }
    const badUrl = parsed.find(
      (it) =>
        it.sourceUrl !== "" &&
        !it.sourceUrl.startsWith("https://")
    );
    if (badUrl) {
      setCsvError(`Source URLs must start with https:// (got: ${badUrl.sourceUrl.slice(0, 40)})`);
      return;
    }
    setCsvError(null);
    setItems(parsed);
    setStates({});
    setShowCsvImport(false);
    setCsvText("");
  }

  function exportCsv() {
    const rows = [
      ["claim", "source_url", "verdict", "confidence", "check_id", "status"],
      ...items.map((it) => {
        const s = states[it.key];
        if (s?.kind === "success") {
          return [
            it.claim,
            it.sourceUrl,
            s.verdict ?? "",
            String(s.confidence),
            s.checkId,
            "SUCCESS",
          ];
        }
        if (s?.kind === "failed") {
          return [it.claim, it.sourceUrl, "", "", "", `FAILED: ${s.message}`];
        }
        if (s?.kind === "processing") return [it.claim, it.sourceUrl, "", "", "", "PROCESSING"];
        return [it.claim, it.sourceUrl, "", "", "", "PENDING"];
      }),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `truthlock-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasResults = items.some((it) => {
    const s = states[it.key];
    return s && (s.kind === "success" || s.kind === "failed");
  });
  const progressPct =
    counts.total === 0
      ? 0
      : Math.round(((counts.done + counts.failed) / counts.total) * 100);

  return (
    <form onSubmit={handleSubmit} className="card" noValidate>
      <div className="mb-5 flex items-start justify-between gap-4">
        <p className="text-sm leading-relaxed text-ink-dim">
          Add up to {MAX_BATCH} claims, each with its own optional source URL.
          Claims verify {CONCURRENCY} at a time — each gets its own on-chain transaction.
        </p>
        <button
          type="button"
          onClick={() => setShowCsvImport((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[0.65rem] text-ink-dim transition-colors hover:border-signal/40 hover:text-signal"
        >
          <Upload size={12} />
          CSV
        </button>
      </div>

      <AnimatePresence>
        {showCsvImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="rounded-lg border border-pending/30 bg-pending-dim p-3">
              <p className="mb-2 font-mono text-[0.65rem] font-semibold text-pending">
                Paste CSV — one claim per line, optional second column for source URL:
              </p>
              <textarea
                rows={4}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={'"Bitcoin launched in 2009","https://whitepaper.bitcoin.com"\n"Water boils at 100°C at sea level"'}
                className="!bg-void font-mono !text-xs"
                aria-label="CSV import"
              />
              {csvError && (
                <p className="mt-2 flex items-center gap-1 font-mono text-xs text-danger">
                  <AlertCircle size={11} /> {csvError}
                </p>
              )}
              <button
                type="button"
                onClick={handleCsvImport}
                className="mt-2 rounded-md border border-pending/40 px-3 py-1.5 font-mono text-xs text-pending transition-colors hover:bg-pending/10"
              >
                Import claims
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {isRunning && (
        <div className="mb-5" role="status" aria-live="polite">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[0.65rem] text-ink-dim">
            <span>
              {counts.done + counts.failed}/{counts.total} processed ·{" "}
              {counts.processing} active
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-signal transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => {
          const state = states[item.key];
          const claimLen = item.claim.trim().length;
          const claimInvalid =
            touched && claimLen > 0 && claimLen < MIN_CLAIM_LENGTH;
          const urlInvalid =
            touched &&
            item.sourceUrl.length > 0 &&
            !item.sourceUrl.startsWith("https://");

          return (
            <div
              key={item.key}
              className={`rounded-lg border p-4 transition-colors ${
                state?.kind === "failed"
                  ? "border-danger/40 bg-danger-dim"
                  : state?.kind === "success"
                    ? "border-signal/30 bg-signal-dim"
                    : "border-line bg-surface-2"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[0.6rem] font-semibold tracking-wider text-ink-ghost">
                  CLAIM {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {state?.kind === "processing" && (
                    <Loader2 size={14} className="animate-spin text-pending" />
                  )}
                  {state?.kind === "success" && (
                    <CheckCircle2 size={14} className="text-signal" />
                  )}
                  {state?.kind === "failed" && (
                    <XCircle size={14} className="text-danger" />
                  )}
                  {items.length > 1 && !isRunning && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      aria-label={`Remove claim ${index + 1}`}
                      className="text-ink-ghost transition-colors hover:text-danger"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={2}
                value={item.claim}
                maxLength={MAX_CLAIM_LENGTH}
                onChange={(e) => updateItem(item.key, { claim: e.target.value })}
                onBlur={() => setTouched(true)}
                placeholder={`Claim ${index + 1} — e.g. "The James Webb Space Telescope launched in 2021"`}
                aria-label={`Claim ${index + 1}`}
                aria-invalid={claimInvalid}
                disabled={isRunning}
                className={claimInvalid ? "!border-danger/50" : ""}
              />

              <div className="relative mt-2">
                <Globe
                  size={13}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    item.sourceUrl ? "text-signal" : "text-ink-ghost"
                  }`}
                />
                <input
                  type="url"
                  value={item.sourceUrl}
                  onChange={(e) =>
                    updateItem(item.key, { sourceUrl: e.target.value })
                  }
                  onBlur={() => setTouched(true)}
                  placeholder="Source URL (optional — empty = knowledge-based)"
                  aria-label={`Source URL for claim ${index + 1}`}
                  aria-invalid={urlInvalid}
                  disabled={isRunning}
                  className={`!py-2.5 !pl-9 !text-xs ${urlInvalid ? "!border-danger/50" : ""}`}
                />
              </div>
              {urlInvalid && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                  <AlertCircle size={11} /> Must start with https://
                </p>
              )}
              {claimInvalid && (
                <p className="mt-1.5 font-mono text-xs text-danger">
                  Min {MIN_CLAIM_LENGTH} chars ({claimLen})
                </p>
              )}

              {/* Result row */}
              <AnimatePresence>
                {state?.kind === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-line bg-void px-3 py-2"
                  >
                    {state.verdict ? (
                      <>
                        <span
                          className={`w-24 shrink-0 rounded border px-2 py-0.5 text-center font-display text-[0.6rem] font-bold tracking-widest ${verdictBadgeClass(state.verdict)}`}
                        >
                          {state.verdict}
                        </span>
                        <span className="font-mono text-xs text-ink-dim">
                          {state.confidence}%
                        </span>
                      </>
                    ) : (
                      <span className="font-mono text-xs text-ink-dim">
                        Recorded on-chain
                      </span>
                    )}
                    <Link
                      to={`/result/${state.checkId}`}
                      className="ml-auto font-mono text-xs text-signal hover:underline"
                    >
                      View →
                    </Link>
                  </motion.div>
                )}
                {state?.kind === "failed" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 flex items-start gap-1.5 font-mono text-xs text-danger"
                  >
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    {state.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Add claim */}
      {!isRunning && items.length < MAX_BATCH && (
        <button
          type="button"
          onClick={() =>
            setItems((prev) => [...prev, { key: nextKey(), claim: "", sourceUrl: "" }])
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line py-3 text-sm text-ink-dim transition-colors hover:border-signal/40 hover:text-signal"
        >
          <Plus size={15} />
          Add claim ({items.length}/{MAX_BATCH})
        </button>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={!formValid || isRunning}
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" />
              Verifying {counts.done + counts.failed}/{counts.total}...
            </span>
          ) : (
            `Verify ${validItems.length || ""} claim${validItems.length === 1 ? "" : "s"} →`
          )}
        </button>
        {counts.failed > 0 && !isRunning && (
          <button
            type="button"
            onClick={retryFailed}
            className="flex items-center justify-center gap-2 rounded-lg border border-warn/40 bg-warn/5 px-4 py-3 font-display text-sm font-semibold text-warn transition-colors hover:bg-warn/10"
          >
            <RotateCcw size={14} />
            Retry {counts.failed} failed
          </button>
        )}
        {hasResults && !isRunning && (
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-3 font-display text-sm font-semibold text-ink-dim transition-colors hover:border-signal/40 hover:text-ink"
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {/* Batch summary */}
      {hasResults && !isRunning && (
        <div className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3">
          <p className="font-mono text-xs text-ink-dim">
            Batch summary:{" "}
            <span className="text-signal">{counts.done} succeeded</span>
            {counts.failed > 0 && (
              <span className="text-danger"> · {counts.failed} failed</span>
            )}
          </p>
        </div>
      )}
    </form>
  );
}
