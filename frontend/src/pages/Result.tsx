import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import ChallengePanel from "@/components/ChallengePanel";
import ConfidenceRing from "@/components/ConfidenceRing";
import ContradictionPanel from "@/components/ContradictionPanel";
import EvidencePanel from "@/components/EvidencePanel";
import ExportReportButton from "@/components/ExportReportButton";
import OnchainProof from "@/components/OnchainProof";
import ScanLine from "@/components/ScanLine";
import ShareCardActions from "@/components/ShareCardActions";
import SourceDiscovery from "@/components/SourceDiscovery";
import ValidationCertificate from "@/components/ValidationCertificate";
import ValidatorConsensus from "@/components/ValidatorConsensus";
import VerdictCard from "@/components/VerdictCard";
import VerdictMatrix from "@/components/VerdictMatrix";
import VerdictTimeline from "@/components/VerdictTimeline";
import VerificationMethod from "@/components/VerificationMethod";
import { ClaimNotFoundState } from "@/components/States";
import { SkeletonCard } from "@/components/Skeleton";
import { getStoredCategory } from "@/lib/categories";
import { getCheck } from "@/lib/genlayer";
import { SOURCE_STATUS_LABELS } from "@/lib/types";
import { verificationId } from "@/lib/verification";

const VERDICT_COLORS: Record<string, string> = {
  TRUE: "#00E5A0",
  FALSE: "#FF4444",
  MISLEADING: "#F5A623",
  UNVERIFIABLE: "#6B7280",
};

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const checkId = typeof id === "string" ? id : "";
  const reduceMotion = useReducedMotion();
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

  const verdictColor = VERDICT_COLORS[record.verdict] ?? "#6B7280";
  const isKnowledgeBased = record.verification_mode === "KNOWLEDGE_BASED";
  const showSourceNotice =
    isKnowledgeBased || record.source_status !== "FETCHED";
  const vid = verificationId(record.id);

  const explanationLines = (
    record.explanation || "No explanation was recorded for this verdict."
  )
    .split(/(?<=[.!?])\s+/)
    .filter((line) => line.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: delay(0.3) }}
      className="mx-auto max-w-page px-5 pb-24"
    >
      <ScanLine />

      {/* Verification ID header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay(0.15), duration: 0.4 }}
        className="flex items-center justify-between pt-10"
      >
        <span className="rounded bg-surface-2 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-signal">
          {vid}
        </span>
        <div className="flex items-center gap-2">
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
          transition={{ delay: delay(0.4), duration: 0.3 }}
          className="mt-4 rounded-lg border border-pending/30 bg-pending-dim px-4 py-3 text-xs leading-relaxed text-ink-dim"
        >
          {record.source_status === "NOT_PROVIDED"
            ? "This verdict is knowledge-based: no source URL was provided, so the AI evaluated the claim from its own knowledge. Confidence is capped."
            : `The provided source could not be used (${SOURCE_STATUS_LABELS[record.source_status]}). The verdict is a knowledge-based assessment.`}
        </motion.div>
      )}

      {/* VERDICT HERO */}
      <motion.section
        aria-label="Verdict"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay(0.5), duration: 0.45 }}
        className="mt-8 rounded-xl border border-line bg-surface p-8 shadow-card sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8"
      >
        <div>
          <p className="mb-3 max-w-[600px] font-display text-lg leading-relaxed text-ink-dim">
            &ldquo;{record.claim}&rdquo;
          </p>
          <VerdictCard record={record} />
          {/* Explanation inline */}
          <div
            className="mt-5 rounded-r-lg bg-surface-2 p-4 leading-[1.7] text-sm text-ink"
            style={{ borderLeft: `3px solid ${verdictColor}` }}
          >
            {explanationLines.map((line, index) => (
              <motion.p
                key={`${index}-${line.slice(0, 12)}`}
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay(700 + index * 60), duration: 0.2 }}
                className="mb-1.5 last:mb-0"
              >
                {line}
              </motion.p>
            ))}
          </div>
        </div>
        <div className="mt-6 sm:mt-0">
          <ConfidenceRing confidence={record.confidence} delay={delay(900)} />
        </div>
      </motion.section>

      {/* EVIDENCE */}
      <div className="mt-8">
        <EvidencePanel record={record} />
      </div>

      {/* SOURCE DISCOVERY */}
      <div className="mt-8">
        <SourceDiscovery record={record} />
      </div>

      {/* CONTRADICTION / EVIDENCE DIVERGENCE */}
      <div className="mt-8">
        <ContradictionPanel record={record} />
      </div>

      {/* CONSENSUS */}
      <div className="mt-8">
        <ValidatorConsensus record={record} />
      </div>

      {/* ANALYSIS MATRIX */}
      <div className="mt-8">
        <VerdictMatrix record={record} />
      </div>

      {/* TIMELINE */}
      <div className="mt-8">
        <VerdictTimeline record={record} />
      </div>

      {/* CERTIFICATE */}
      <div className="mt-8">
        <ValidationCertificate record={record} />
      </div>

      {/* ONCHAIN PROOF */}
      <div className="mt-8">
        <OnchainProof record={record} />
      </div>

      {/* SHARE / ACTIONS */}
      <ShareCardActions record={record} />

      <ChallengePanel original={record} />

      {/* Bottom actions */}
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
