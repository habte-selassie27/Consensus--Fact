import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BatchClaimForm from "@/components/BatchClaimForm";
import ClaimForm from "@/components/ClaimForm";
import ClaimOfTheDay from "@/components/ClaimOfTheDay";
import RecentChecksTicker from "@/components/RecentChecksTicker";
import ValidatorProgress from "@/components/ValidatorProgress";
import { saveCategory } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import { submitClaim } from "@/lib/genlayer";
import type { TxStatus } from "@/lib/types";

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      <section className="relative pt-20 pb-14 sm:pt-32 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-ring" />
            <span className="font-mono text-xs text-signal">
              Powered by GenLayer Intelligent Contracts
            </span>
          </div>

          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Is it <span className="text-gradient-signal">true</span>?
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-dim">
            Submit a claim and a source. Our on-chain contract cross-references
            three live sources and stores the verdict permanently &mdash; no API,
            no admin, no trust required.
          </p>
        </motion.div>
      </section>

      <ClaimOfTheDay />

      <motion.section
        aria-label="Submit a claim"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      >
        <div
          role="tablist"
          aria-label="Claim submission mode"
          className="mb-4 inline-flex rounded-lg border border-line bg-surface p-1"
        >
          <button
            role="tab"
            aria-selected={mode === "single"}
            onClick={() => setMode("single")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === "single"
                ? "bg-signal text-void"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            Single
          </button>
          <button
            role="tab"
            aria-selected={mode === "batch"}
            onClick={() => setMode("batch")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === "batch"
                ? "bg-signal text-void"
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
            <ValidatorProgress
              status={status}
              txHash={txHash}
              errorMessage={errorMessage}
            />
          </>
        ) : (
          <BatchClaimForm onSubmitAll={() => {}} />
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        <RecentChecksTicker limit={5} />
      </motion.section>
    </div>
  );
}
