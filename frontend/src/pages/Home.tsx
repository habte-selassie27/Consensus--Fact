import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Brain, ShieldCheck, Link2 } from "lucide-react";
import BatchClaimForm from "@/components/BatchClaimForm";
import ClaimForm from "@/components/ClaimForm";
import ClaimOfTheDay from "@/components/ClaimOfTheDay";
import RecentChecksTicker from "@/components/RecentChecksTicker";
import HowItWorks from "@/components/HowItWorks";
import TrustLayers from "@/components/TrustLayers";
import UseCases from "@/components/UseCases";
import VerificationSpotlight from "@/components/VerificationSpotlight";
import AnimatedCounter from "@/components/AnimatedCounter";
import { saveCategory } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import { submitClaim, getStats } from "@/lib/genlayer";
import type { TxStatus } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["stats-home"],
    queryFn: getStats,
    retry: false,
  });

  async function handleSubmit(claim: string, url: string, category: Category) {
    setStatus("pending");
    setTxHash(null);
    setErrorMessage(null);

    try {
      const result = await submitClaim(claim, url);
      saveCategory(result.checkId, category);
      setTxHash(result.txHash);
      setStatus("confirming");
      await new Promise((resolve) => setTimeout(resolve, 700));
      setStatus("done");
      await new Promise((resolve) => setTimeout(resolve, 900));
      navigate(`/result/${result.checkId}`);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error occurred."
      );
    }
  }

  return (
    <div className="relative mx-auto max-w-page px-5 pb-24">
      <div className="hero-glow top-0 left-1/2 -translate-x-1/2 -translate-y-1/3" />

      {/* HERO */}
      <section className="relative pt-20 pb-10 sm:pt-32 sm:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[0.95] tracking-tight">
            Verify the web.
            <br />
            <span className="text-gradient-signal">Trust the result.</span>
          </h1>

          <p className="mt-5 max-w-[560px] text-base leading-relaxed text-ink-dim">
            TruthLock turns live web evidence into decentralized, onchain
            verdicts. Submit a claim. Validators independently reason about the
            evidence. The result is permanent.
          </p>

          {/* Trust chips */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-signal-border bg-signal-dim px-3 py-1 font-mono text-[0.65rem] font-medium text-signal">
              <Globe size={10} /> Live Web
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-signal-border bg-signal-dim px-3 py-1 font-mono text-[0.65rem] font-medium text-signal">
              <Brain size={10} /> AI Reasoning
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-signal-border bg-signal-dim px-3 py-1 font-mono text-[0.65rem] font-medium text-signal">
              <ShieldCheck size={10} /> Consensus
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-signal-border bg-signal-dim px-3 py-1 font-mono text-[0.65rem] font-medium text-signal">
              <Link2 size={10} /> Onchain
            </span>
          </div>

          {/* Stats strip */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 font-mono text-ink-dim">
              <AnimatedCounter
                value={stats?.total_checks ?? 0}
                className="font-semibold text-ink"
              />
              <span>claims verified</span>
            </div>
            <span className="h-3 w-px bg-line" />
            <div className="flex items-center gap-2 font-mono text-ink-dim">
              <span className="font-semibold text-ink">3</span>
              <span>sources per check</span>
            </div>
            <span className="h-3 w-px bg-line" />
            <div className="flex items-center gap-2 font-mono text-ink-dim">
              <span className="font-semibold text-signal">
                {stats?.total_checks
                  ? `${Math.round(
                      ((stats.verdicts_by_type?.TRUE ?? 0) /
                        stats.total_checks) *
                        100
                    )}%`
                  : "—"}
              </span>
              <span>consensus rate</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* SPOTLIGHT + FORM side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* LEFT: Spotlight + How it works + Trust layers */}
        <div className="space-y-6">
          <VerificationSpotlight />
          <HowItWorks />
          <TrustLayers />
          <UseCases />
        </div>

        {/* RIGHT: Form + Batch + Ticker */}
        <div>
          <motion.section
            aria-label="Submit a claim"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          >
            {/* Tab switcher */}
            <div
              role="tablist"
              aria-label="Claim submission mode"
              className="mb-4 inline-flex rounded-lg bg-surface-2 p-1"
            >
              <button
                role="tab"
                aria-selected={mode === "single"}
                onClick={() => setMode("single")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  mode === "single"
                    ? "bg-surface-3 text-ink shadow-sm"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                Single
              </button>
              <button
                role="tab"
                aria-selected={mode === "batch"}
                onClick={() => setMode("batch")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  mode === "batch"
                    ? "bg-surface-3 text-ink shadow-sm"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                Batch check
              </button>
            </div>

            {mode === "single" ? (
              <>
                <ClaimForm
                  onSubmit={handleSubmit}
                  isLoading={status === "pending" || status === "confirming"}
                />
                {status !== "idle" && (
                  <div className="mt-4 rounded-lg border border-line bg-surface p-4">
                    <div className="flex items-center gap-3">
                      {status === "pending" && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-signal/30 border-t-signal" />
                      )}
                      {status === "confirming" && (
                        <span className="h-3 w-3 animate-pulse rounded-full bg-signal" />
                      )}
                      {status === "done" && (
                        <span className="h-3 w-3 rounded-full bg-signal" />
                      )}
                      {status === "error" && (
                        <span className="h-3 w-3 rounded-full bg-danger" />
                      )}
                      <span className="font-mono text-xs text-ink-dim">
                        {status === "pending" &&
                          "Submitting claim to the verification network..."}
                        {status === "confirming" &&
                          "Validators processing..."}
                        {status === "done" && "Redirecting to result..."}
                        {status === "error" && errorMessage}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <BatchClaimForm onSubmitAll={() => {}} />
            )}
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="mt-6"
          >
            <RecentChecksTicker limit={5} />
          </motion.div>
        </div>
      </div>

      <ClaimOfTheDay />
    </div>
  );
}
