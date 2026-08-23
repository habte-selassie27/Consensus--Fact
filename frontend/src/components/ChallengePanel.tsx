import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, Swords, ExternalLink } from "lucide-react";
import { verdictBadgeClass } from "@/components/verdictStyles";
import { getCheck, submitClaim } from "@/lib/genlayer";
import type { FactCheckRecord } from "@/lib/types";

interface ChallengePanelProps {
  original: FactCheckRecord;
}

type ChallengeState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "done"; record: FactCheckRecord };

export default function ChallengePanel({ original }: ChallengePanelProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<ChallengeState>({ kind: "idle" });

  const urlValid = url.startsWith("https://") && url.length > "https://".length;

  async function handleChallenge() {
    setTouched(true);
    if (!urlValid || state.kind === "submitting") return;
    setState({ kind: "submitting" });
    try {
      const { checkId } = await submitClaim(original.claim, url.trim());
      const record = await getCheck(checkId);
      setState({ kind: "done", record });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Challenge failed.",
      });
    }
  }

  const differs =
    state.kind === "done" && state.record.verdict !== original.verdict;

  return (
    <section aria-label="Challenge verdict" className="mt-8">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-warn/30 bg-warn/5 px-4 py-3 font-display text-sm font-semibold tracking-wide text-warn transition-colors hover:border-warn/50 hover:bg-warn/10"
        >
          <Swords size={16} />
          Challenge this verdict
        </button>
      ) : (
        <div className="card">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-ink">
            <Swords size={14} className="text-warn" />
            Challenge with a different source
          </h3>
          <p className="mb-3 text-xs leading-relaxed text-ink-dim">
            Submit the same claim with a new source URL. If the challenge returns a different
            verdict, both will be shown side by side.
          </p>

          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="https://alternative-source.com/article"
              aria-invalid={touched && !urlValid}
              disabled={state.kind === "submitting" || state.kind === "done"}
              className="flex-1"
            />
            <button
              type="button"
              onClick={handleChallenge}
              disabled={!urlValid || state.kind === "submitting" || state.kind === "done"}
              className="btn-primary w-auto shrink-0 px-6 disabled:opacity-40"
            >
              {state.kind === "submitting" ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Checking...
                </span>
              ) : state.kind === "done" ? (
                "Challenged"
              ) : (
                "Challenge"
              )}
            </button>
          </div>

          {touched && !urlValid && url.length > 0 && (
            <p className="mt-2 flex items-center gap-1 text-xs text-danger">
              <AlertCircle size={11} />
              Must start with https://
            </p>
          )}

          {state.kind === "error" && (
            <p className="mt-3 flex items-center gap-1 font-mono text-xs text-danger">
              <AlertCircle size={12} />
              {state.message}
            </p>
          )}

          <AnimatePresence>
            {state.kind === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                {differs && (
                  <p className="mb-3 rounded-md bg-warn/10 px-3 py-2 font-mono text-xs text-warn">
                    Verdicts differ — community disagreement detected.
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Original */}
                  <div className="rounded-lg border border-line bg-void p-4">
                    <p className="label mb-3">Original</p>
                    <span
                      className={`inline-block rounded border px-2 py-1 font-display text-[0.7rem] font-bold tracking-widest ${verdictBadgeClass(original.verdict)}`}
                    >
                      {original.verdict}
                    </span>
                    <p className="mt-2 font-mono text-xs text-ink-ghost">
                      {original.confidence}% · {original.source_url.slice(0, 44)}…
                    </p>
                  </div>

                  {/* Challenge */}
                  <div
                    className={`rounded-lg border p-4 ${
                      differs ? "border-warn/40 bg-warn/5" : "border-line bg-void"
                    }`}
                  >
                    <p className="label mb-3">Challenge</p>
                    <span
                      className={`inline-block rounded border px-2 py-1 font-display text-[0.7rem] font-bold tracking-widest ${verdictBadgeClass(state.record.verdict)}`}
                    >
                      {state.record.verdict}
                    </span>
                    <p className="mt-2 font-mono text-xs text-ink-ghost">
                      {state.record.confidence}% · {state.record.source_url.slice(0, 44)}…
                    </p>
                    <Link
                      to={`/result/${state.record.id}`}
                      className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-signal hover:underline"
                    >
                      View challenge <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
