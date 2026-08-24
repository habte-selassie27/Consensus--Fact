import { motion, useReducedMotion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import type { FactCheckRecord } from "@/lib/types";
import { getCredibility } from "@/lib/sourceCredibility";
import {
  loadTxProof,
  contradictionLevel,
} from "@/lib/verification";

interface VerdictMatrixProps {
  record: FactCheckRecord;
}

interface Dimension {
  label: string;
  value: string;
  tone: "ok" | "warn" | "bad" | "mute";
}

function toneClass(tone: Dimension["tone"]): string {
  switch (tone) {
    case "ok":
      return "text-signal";
    case "warn":
      return "text-warn";
    case "bad":
      return "text-danger";
    default:
      return "text-ink-ghost";
  }
}

export default function VerdictMatrix({ record }: VerdictMatrixProps) {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const proof = loadTxProof(record.id);
  const isKB = record.verification_mode === "KNOWLEDGE_BASED";

  const sourcesFetched = isKB
    ? "Knowledge only"
    : `${record.sources_checked.length} / 3`;

  const evidenceFound: Dimension = {
    label: "Evidence found",
    value: sourcesFetched,
    tone: isKB ? "mute" : record.sources_checked.length >= 2 ? "ok" : "warn",
  };

  const sourcesAgree: Dimension = {
    label: "Sources agree",
    value: record.confidence >= 70
      ? "High"
      : record.confidence >= 40
        ? "Partial"
        : "Low",
    tone:
      record.confidence >= 70
        ? "ok"
        : record.confidence >= 40
          ? "warn"
          : "bad",
  };

  const contradiction = contradictionLevel(record.verdict);
  const contradictingEvidence: Dimension = {
    label: "Contradicting evidence",
    value: contradiction.label,
    tone: contradiction.tone,
  };

  const primaryCred = record.source_url
    ? getCredibility(record.source_url)
    : null;
  const avgQuality = primaryCred ? primaryCred.label : "Unknown";
  const qualityTone: Dimension["tone"] = primaryCred
    ? primaryCred.score >= 80
      ? "ok"
      : primaryCred.score >= 50
        ? "warn"
        : "mute"
    : "mute";

  const sourceQuality: Dimension = {
    label: "Source quality",
    value: avgQuality,
    tone: qualityTone,
  };

  let validatorAgreement: Dimension;
  if (proof && proof.totalVotes > 0) {
    const agreePct = Math.round(
      (proof.agreeCount / proof.totalVotes) * 100
    );
    validatorAgreement = {
      label: "Validator agreement",
      value: `${proof.agreeCount} / ${proof.totalVotes} (${agreePct}%)`,
      tone: agreePct >= 67 ? "ok" : agreePct >= 34 ? "warn" : "bad",
    };
  } else {
    validatorAgreement = {
      label: "Validator agreement",
      value: "Majority (Optimistic Democracy)",
      tone: "ok",
    };
  }

  const finalConfidence: Dimension = {
    label: "Final confidence",
    value: `${record.confidence}%`,
    tone:
      record.confidence >= 70
        ? "ok"
        : record.confidence >= 40
          ? "warn"
          : "bad",
  };

  const dimensions: Dimension[] = [
    evidenceFound,
    sourcesAgree,
    contradictingEvidence,
    sourceQuality,
    validatorAgreement,
    finalConfidence,
  ];

  return (
    <motion.section
      aria-label="Claim analysis"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(1.4), duration: 0.45 }}
      className="rounded-xl border border-line bg-surface p-6 shadow-card"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-signal/10">
          <BarChart3 size={14} className="text-signal" />
        </span>
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Claim analysis
        </h2>
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              <th className="px-4 py-2.5 font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">
                Dimension
              </th>
              <th className="px-4 py-2.5 text-right font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-dim">
            {dimensions.map((dim, i) => (
              <motion.tr
                key={dim.label}
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: delay(1600 + i * 80),
                  duration: 0.25,
                }}
                className="transition-colors hover:bg-line-dim/30"
              >
                <td className="px-4 py-2.5 font-mono text-xs text-ink-dim">
                  {dim.label}
                </td>
                <td className={`px-4 py-2.5 text-right font-mono text-xs font-semibold ${toneClass(dim.tone)}`}>
                  {dim.value}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
