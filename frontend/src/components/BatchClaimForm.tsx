"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { verdictBadgeClass } from "@/components/verdictStyles";
import { submitClaim } from "@/lib/genlayer";
import type { Verdict } from "@/lib/types";

const MAX_BATCH = 5;
const MIN_CLAIM_LENGTH = 10;
const MAX_CLAIM_LENGTH = 500;

interface BatchClaimFormProps {
  onSubmitAll: () => void;
}

type ClaimState =
  | { kind: "waiting" }
  | { kind: "submitting" }
  | { kind: "done"; verdict: Verdict | null; confidence: number; checkId: string }
  | { kind: "error"; message: string };

export default function BatchClaimForm({ onSubmitAll }: BatchClaimFormProps) {
  const [claims, setClaims] = useState<string[]>([""]);
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [states, setStates] = useState<ClaimState[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const urlValid = url.startsWith("https://") && url.length > "https://".length;
  const filledClaims = claims.map((c) => c.trim()).filter((c) => c.length > 0);
  const allValid = filledClaims.every(
    (c) => c.length >= MIN_CLAIM_LENGTH && c.length <= MAX_CLAIM_LENGTH
  );
  const formValid = urlValid && allValid && filledClaims.length > 0;

  function updateClaim(index: number, value: string) {
    setClaims((prev) => prev.map((c, i) => (i === index ? value : c)));
  }

  function removeClaim(index: number) {
    setClaims((prev) => (prev.length === 1 ? [""] : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!formValid || isRunning) return;

    setIsRunning(true);
    onSubmitAll();
    setStates(filledClaims.map(() => ({ kind: "submitting" as const })));

    const results = await Promise.allSettled(
      filledClaims.map((claim) =>
        submitClaim(claim, url.trim()).then((r) => {
          setStates((prev) => {
            const next = [...prev];
            next[filledClaims.indexOf(claim)] = {
              kind: "done",
              verdict: null,
              confidence: 0,
              checkId: r.checkId,
            };
            return next;
          });
          return r;
        })
      )
    );

    // Resolve verdicts after all receipts land
    const { getCheck } = await import("@/lib/genlayer");
    setStates(
      await Promise.all(
        results.map(async (result, i): Promise<ClaimState> => {
          if (result.status === "rejected") {
            const message =
              result.reason instanceof Error ? result.reason.message : "Submission failed.";
            return { kind: "error", message };
          }
          try {
            const record = await getCheck(result.value.checkId);
            return {
              kind: "done",
              verdict: record.verdict,
              confidence: record.confidence,
              checkId: record.id,
            };
          } catch {
            return { kind: "done", verdict: null, confidence: 0, checkId: result.value.checkId };
          }
        })
      )
    );
    setIsRunning(false);
  }

  const doneCount = states.filter((s) => s.kind === "done").length;

  return (
    <form onSubmit={handleSubmit} className="card" noValidate>
      <p className="mb-5 text-sm text-ink-dim">
        Paste up to {MAX_BATCH} claims that share the same source. All{" "}
        {MAX_BATCH > 1 ? "are checked" : "is checked"} on-chain in parallel.
      </p>

      <div className="space-y-4">
        {claims.map((claim, index) => {
          const state = states[index];
          return (
            <div key={index}>
              <div className="relative">
                <textarea
                  rows={2}
                  value={claim}
                  maxLength={MAX_CLAIM_LENGTH}
                  onChange={(e) => updateClaim(index, e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={`Claim ${index + 1} — e.g. "Water boils at 100°C at sea level"`}
                  aria-label={`Claim ${index + 1}`}
                  className={state?.kind === "error" ? "!border-danger/50" : ""}
                  disabled={isRunning}
                />
                {states.length > 0 && (
                  <span className="absolute right-3 top-3">
                    {state?.kind === "submitting" && (
                      <Loader2 size={16} className="animate-spin text-pending" />
                    )}
                    {state?.kind === "done" && (
                      <CheckCircle2 size={16} className="text-signal" />
                    )}
                    {state?.kind === "error" && (
                      <XCircle size={16} className="text-danger" />
                    )}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center justify-between font-mono text-xs">
                <span className="text-danger">
                  {touched &&
                  claim.trim().length > 0 &&
                  claim.trim().length < MIN_CLAIM_LENGTH
                    ? `Min ${MIN_CLAIM_LENGTH} chars`
                    : ""}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-ink-ghost">
                    {claim.length}/{MAX_CLAIM_LENGTH}
                  </span>
                  {claims.length > 1 && !isRunning && (
                    <button
                      type="button"
                      onClick={() => removeClaim(index)}
                      aria-label={`Remove claim ${index + 1}`}
                      className="text-ink-ghost transition-colors hover:text-danger"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Per-claim verdict row */}
              {state?.kind === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-3 rounded-lg border border-line bg-void px-3 py-2"
                >
                  {state.verdict ? (
                    <>
                      <span
                        className={`w-24 shrink-0 rounded border px-2 py-0.5 text-center font-display text-[0.6rem] font-bold tracking-widest ${verdictBadgeClass(state.verdict)}`}
                      >
                        {state.verdict}
                      </span>
                      <span className="font-mono text-xs text-ink-dim">
                        {state.confidence}% confidence
                      </span>
                      <a
                        href={`/result/${state.checkId}`}
                        className="ml-auto font-mono text-xs text-signal hover:underline"
                      >
                        View →
                      </a>
                    </>
                  ) : (
                    <a
                      href={`/result/${state.checkId}`}
                      className="font-mono text-xs text-signal hover:underline"
                    >
                      Recorded on-chain — view check →
                    </a>
                  )}
                </motion.div>
              )}
              {state?.kind === "error" && (
                <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-danger">
                  <AlertCircle size={12} /> {state.message}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add claim */}
      {!isRunning && claims.length < MAX_BATCH && (
        <button
          type="button"
          onClick={() => setClaims((prev) => [...prev, ""])}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line py-3 text-sm text-ink-dim transition-colors hover:border-signal/40 hover:text-signal"
        >
          <Plus size={15} />
          Add claim ({claims.length}/{MAX_BATCH})
        </button>
      )}

      {/* Shared source */}
      <div className="mt-6 mb-6">
        <label htmlFor="batch-source-url" className="label mb-2 block">
          Shared source URL
        </label>
        <input
          id="batch-source-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="https://..."
          aria-invalid={touched && !urlValid}
          required
          disabled={isRunning}
        />
        {touched && !urlValid && url.length > 0 && (
          <p className="mt-2 flex items-center gap-1 text-xs text-danger">
            <AlertCircle size={11} />
            Must start with https://
          </p>
        )}
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={!formValid || isRunning}
      >
        {isRunning
          ? `Checking... (${doneCount}/${filledClaims.length} recorded)`
          : `Check ${filledClaims.length || MAX_BATCH} claim${filledClaims.length === 1 ? "" : "s"}`}
      </button>
    </form>
  );
}
