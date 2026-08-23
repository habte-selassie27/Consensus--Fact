"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ClaimForm from "@/components/ClaimForm";
import RecentChecksTicker from "@/components/RecentChecksTicker";
import TxStatusBar from "@/components/TxStatusBar";
import { submitClaim } from "@/lib/genlayer";
import type { TxStatus } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(claim: string, url: string) {
    setStatus("pending");
    setTxHash(null);
    setErrorMessage(null);

    try {
      const result = await submitClaim(claim, url);
      setTxHash(result.txHash);
      setStatus("confirming");
      await new Promise((resolve) => setTimeout(resolve, 700));
      setStatus("done");
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.push(`/result/${result.checkId}`);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error occurred."
      );
    }
  }

  return (
    <div className="relative mx-auto max-w-page px-5 pb-24">
      {/* Hero glow */}
      <div className="hero-glow top-0 left-1/2 -translate-x-1/2 -translate-y-1/3" />

      {/* Hero */}
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
            Is it{" "}
            <span className="text-gradient-signal">true</span>?
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-dim">
            Submit a claim and a source. Our on-chain contract cross-references
            three live sources and stores the verdict permanently &mdash; no API,
            no admin, no trust required.
          </p>
        </motion.div>
      </section>

      {/* Claim form */}
      <motion.section
        aria-label="Submit a claim"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      >
        <ClaimForm
          onSubmit={handleSubmit}
          isLoading={status === "pending" || status === "confirming"}
        />
        <TxStatusBar
          status={status}
          txHash={txHash}
          errorMessage={errorMessage}
        />
      </motion.section>

      {/* Recent checks */}
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
