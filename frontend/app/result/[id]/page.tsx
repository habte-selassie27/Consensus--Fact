"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import CategoryBadge from "@/components/CategoryBadge";
import ChallengePanel from "@/components/ChallengePanel";
import ConfidenceRing from "@/components/ConfidenceRing";
import ExportReportButton from "@/components/ExportReportButton";
import ScanLine from "@/components/ScanLine";
import ShareCardActions from "@/components/ShareCardActions";
import SourcePanel from "@/components/SourcePanel";
import VerdictCard from "@/components/VerdictCard";
import { ClaimNotFoundState } from "@/components/States";
import { getStoredCategory } from "@/lib/categories";
import { getCheck } from "@/lib/genlayer";

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const {
    data: record,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["check", id],
    queryFn: () => getCheck(id),
    enabled: id.length > 0,
    retry: false,
  });

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-page px-5 py-24">
        <div className="h-6 w-64 animate-pulse rounded bg-line" />
        <div className="mt-8 h-40 animate-pulse rounded-xl bg-surface" />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="mx-auto max-w-page px-5 py-16">
        <ClaimNotFoundState />
      </div>
    );
  }

  const explanationLines = record.explanation
    .split(/(?<=[.!?])\s+/)
    .filter((line) => line.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.4 }}
      className="mx-auto max-w-page px-5 pb-24"
    >
      <ScanLine />

      <div className="flex items-start justify-between gap-4 pt-10">
        <p className="font-mono text-sm text-ink-dim flex-1">&ldquo;{record.claim}&rdquo;</p>
        <CategoryBadge category={getStoredCategory(record.id, record.claim) ?? "Other"} />
      </div>

      <section
        aria-label="Verdict"
        className="mt-8 grid gap-8 rounded-xl border border-line bg-surface p-8 shadow-card sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <VerdictCard record={record} />
        <ConfidenceRing confidence={record.confidence} delay={delay(1300)} />
      </section>

      <motion.section
        aria-label="Explanation"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay(2.1), duration: 0.4 }}
        className="mt-8"
      >
        <h2 className="label mb-3">Explanation</h2>
        <div className="rounded-lg border border-line bg-surface p-5 leading-relaxed text-ink">
          {explanationLines.map((line, index) => (
            <motion.p
              key={`${index}-${line.slice(0, 12)}`}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: delay(2100 + index * 80),
                duration: 0.25,
              }}
              className="mb-2 last:mb-0"
            >
              {line}
            </motion.p>
          ))}
        </div>
      </motion.section>

      <motion.section
        aria-label="Sources checked"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay(2500), duration: 0.35, ease: "easeOut" }}
        className="mt-8"
      >
        <h2 className="label mb-3">Sources checked</h2>
        <SourcePanel sources={[record.source_url, ...record.sources_checked.filter((s) => s !== record.source_url)]} />
      </motion.section>

      <section aria-label="Metadata" className="mt-8 space-y-1 font-mono text-xs text-ink-dim">
        <p>Check ID: {record.id}</p>
        <p>Submitted: {formatTimestamp(record.timestamp)}</p>
        <p>
          Submitter: {record.submitter.slice(0, 6)}...{record.submitter.slice(-4)}
        </p>
      </section>

      <ShareCardActions record={record} />

      <ChallengePanel original={record} />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <ExportReportButton record={record} />
        <button type="button" onClick={handleShare} className="rounded-md border border-line px-4 py-3.5 text-center font-display text-sm font-semibold tracking-wide text-ink transition-colors hover:border-signal/40 sm:flex-1">
          {copied ? "Link copied" : "Copy link"}
        </button>
        <Link
          href="/"
          className="rounded-md border border-line px-4 py-3.5 text-center font-display text-sm font-semibold tracking-wide text-ink transition-colors hover:border-signal/40 sm:flex-1"
        >
          Check another claim →
        </Link>
      </div>
    </motion.div>
  );
}
