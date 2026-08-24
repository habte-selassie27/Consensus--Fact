import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Copy, ExternalLink, ArrowLeft, Info } from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import ChallengePanel from "@/components/ChallengePanel";
import ConfidenceRing from "@/components/ConfidenceRing";
import ExportReportButton from "@/components/ExportReportButton";
import ScanLine from "@/components/ScanLine";
import ShareCardActions from "@/components/ShareCardActions";
import SourcePanel from "@/components/SourcePanel";
import VerdictCard from "@/components/VerdictCard";
import VerdictTimeline from "@/components/VerdictTimeline";
import VerificationMethod from "@/components/VerificationMethod";
import { ClaimNotFoundState } from "@/components/States";
import { SkeletonCard } from "@/components/Skeleton";
import { getStoredCategory } from "@/lib/categories";
import { getCheck } from "@/lib/genlayer";
import { SOURCE_STATUS_LABELS } from "@/lib/types";

const VERDICT_COLORS: Record<string, string> = {
  TRUE: "#00E5A0",
  FALSE: "#FF4444",
  MISLEADING: "#F5A623",
  UNVERIFIABLE: "#6B7280",
};

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const checkId = typeof id === "string" ? id : "";
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const {
    data: record,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["check", checkId],
    queryFn: () => getCheck(checkId),
    enabled: checkId.length > 0,
    retry: false,
  });

  async function handleCopyId() {
    try {
      await navigator.clipboard.writeText(checkId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-page px-5 py-24 space-y-6">
        <div className="h-6 w-64 skeleton" />
        <SkeletonCard />
        <div className="h-40 skeleton rounded-xl" />
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

  const explanationLines = (record.explanation || "No explanation was recorded for this verdict.")
    .split(/(?<=[.!?])\s+/)
    .filter((line) => line.length > 0);

  const verdictColor = VERDICT_COLORS[record.verdict] ?? "#6B7280";
  const isKnowledgeBased = record.verification_mode === "KNOWLEDGE_BASED";
  const showSourceNotice =
    isKnowledgeBased || record.source_status !== "FETCHED";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.4 }}
      className="mx-auto max-w-page px-5 pb-24"
    >
      <ScanLine />

      {/* Claim echo */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay(0.2), duration: 0.4 }}
        className="pt-10"
      >
        <p className="max-w-[600px] font-display text-lg text-ink-dim" style={{ lineHeight: 1.6 }}>
          &ldquo;{record.claim}&rdquo;
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CategoryBadge category={getStoredCategory(record.id, record.claim) ?? "Other"} />
          <VerificationMethod
            mode={record.verification_mode}
            sourceStatus={record.source_status}
            sourceUrl={record.source_url}
          />
        </div>
      </motion.div>

      {/* Knowledge-based notice */}
      {showSourceNotice && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay(0.8), duration: 0.3 }}
          className="mt-6 flex items-start gap-3 rounded-lg border border-pending/30 bg-pending-dim px-4 py-3"
        >
          <Info size={15} className="mt-0.5 shrink-0 text-pending" />
          <p className="text-xs leading-relaxed text-ink-dim">
            {record.source_status === "NOT_PROVIDED"
              ? "This verdict is knowledge-based: no source URL was provided, so the AI evaluated the claim from its own knowledge. Confidence is capped and should be read accordingly."
              : `The provided source could not be used (${SOURCE_STATUS_LABELS[record.source_status]}). The verdict below is a knowledge-based assessment made without live web evidence.`}
          </p>
        </motion.div>
      )}

      {/* Verdict row */}
      <section
        aria-label="Verdict"
        className="mt-8 grid gap-8 rounded-xl border border-line bg-surface p-8 shadow-card sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <VerdictCard record={record} />
        <ConfidenceRing confidence={record.confidence} delay={delay(1300)} />
      </section>

      {/* Explanation box with verdict-colored border */}
      <motion.section
        aria-label="Explanation"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay(2.1), duration: 0.4 }}
        className="mt-8"
      >
        <h2 className="label mb-3" style={{ color: verdictColor }}>AI Judgment</h2>
        <div
          className="rounded-r-lg bg-surface p-5 leading-[1.7] text-ink"
          style={{ borderLeft: `3px solid ${verdictColor}` }}
        >
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

      {/* Sources panel */}
      <motion.section
        aria-label="Sources checked"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay(2500), duration: 0.35, ease: "easeOut" }}
        className="mt-8"
      >
        <h2 className="label mb-3">
          {isKnowledgeBased ? "Evidence" : "Sources cross-referenced"}
        </h2>
        {isKnowledgeBased ? (
          <div className="rounded-lg border border-line bg-surface-2 px-4 py-5 text-center">
            <p className="font-mono text-xs text-ink-dim">
              No external sources were fetched for this check.
            </p>
            <p className="mt-1 font-mono text-[0.65rem] text-ink-ghost">
              The verdict is based solely on the AI model's knowledge. Submit with a
              source URL for a source-verified verdict.
            </p>
          </div>
        ) : (
          <SourcePanel
            sources={[record.source_url, ...record.sources_checked.filter((s) => s !== record.source_url)]}
            primaryStatus={record.source_status}
          />
        )}
      </motion.section>

      <VerdictTimeline record={record} />

      {/* Metadata strip */}
      <motion.section
        aria-label="Metadata"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay(2800), duration: 0.3 }}
        className="mt-8 rounded-lg bg-surface-2 p-4"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">Check ID</p>
            <button
              type="button"
              onClick={handleCopyId}
              className="mt-1 flex items-center gap-1.5 font-mono text-xs text-ink transition-colors hover:text-signal"
            >
              <span className="truncate">{record.id.slice(0, 12)}...{record.id.slice(-4)}</span>
              <Copy size={10} className="shrink-0 text-ink-ghost" />
            </button>
          </div>
          <div>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">Submitted</p>
            <p className="mt-1 font-mono text-xs text-ink">{formatTimestamp(record.timestamp)}</p>
          </div>
          <div>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">Submitter</p>
            <p className="mt-1 font-mono text-xs text-ink">
              {record.submitter.slice(0, 6)}...{record.submitter.slice(-4)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">Method</p>
            <p className="mt-1 font-mono text-xs text-ink">
              {isKnowledgeBased ? "Knowledge-based" : "Source-verified"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">Network</p>
            <p className="mt-1 font-mono text-xs text-signal">GenLayer Studio</p>
          </div>
        </div>
      </motion.section>

      <ShareCardActions record={record} />

      <ChallengePanel original={record} />

      {/* Action row */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-3 text-center font-display text-sm font-semibold text-ink-dim transition-colors hover:border-signal/40 hover:text-ink sm:flex-1"
        >
          <ArrowLeft size={14} />
          Check another claim
        </Link>
        <ExportReportButton record={record} />
        <Link
          to={`/embed/${record.id}`}
          className="flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-3 text-center font-display text-sm font-semibold text-ink-dim transition-colors hover:border-signal/40 hover:text-ink sm:flex-1"
        >
          <ExternalLink size={14} />
          Embed
        </Link>
      </div>
    </motion.div>
  );
}
