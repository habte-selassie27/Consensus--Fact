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
      {/* Hero glow orb */}
      <div className="hero-glow -top-40 left-1/2 -translate-x-1/2" />

      {/* Hero */}
      <section className="relative pt-16 pb-12 sm:pt-28 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-ring" />
            <span className="font-mono text-xs font-medium text-signal">
              Powered by GenLayer Intelligent Contracts
            </span>
          </div>

          <h1 className="font-display text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight">
            Is it{" "}
            <span className="text-gradient-signal">true</span>?
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-dim sm:text-lg">
            Submit a claim and a source. Our on-chain contract cross-references
            three live sources and stores the verdict permanently &mdash; no API,
            no admin, no trust required.
          </p>
        </motion.div>
      </section>

      {/* Claim form */}
      <motion.section
        aria-label="Submit a claim"
        initial={{ opacity: 0, y: 30 }}
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
