import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, X, Minus } from "lucide-react";
import type { FactCheckRecord } from "@/lib/types";
import { getCredibility } from "@/lib/sourceCredibility";

interface ContradictionPanelProps {
  record: FactCheckRecord;
}

interface SourceStance {
  url: string;
  domain: string;
  stance: "supports" | "contradicts" | "neutral";
  credibilityScore: number;
}

function extractContradictionSignals(explanation: string): string[] {
  const lower = explanation.toLowerCase();
  const signals: string[] = [];
  const patterns = [
    /contradict/i,
    /however/i,
    /but .{10,60} does not/i,
    /does not support/i,
    /conflicts with/i,
    /sources disagree/i,
    /partially true/i,
    /omits/i,
    /missing context/i,
    /misleading/i,
  ];
  for (const pat of patterns) {
    const match = explanation.match(pat);
    if (match && match.index !== undefined) {
      const start = Math.max(0, match.index - 30);
      const end = Math.min(explanation.length, match.index + match[0].length + 30);
      signals.push(`"${explanation.slice(start, end).trim()}"`);
    }
  }
  return signals;
}

function inferSourceStances(record: FactCheckRecord): SourceStance[] {
  const allSources = [
    record.source_url,
    ...record.sources_checked.filter((s) => s !== record.source_url),
  ].filter(Boolean);

  if (allSources.length === 0) return [];

  const isKB = record.verification_mode === "KNOWLEDGE_BASED";
  if (isKB) return [];

  const primaryStance: SourceStance = {
    url: record.source_url,
    domain: (() => {
      try {
        return new URL(record.source_url).hostname.replace(/^www\./, "");
      } catch {
        return record.source_url;
      }
    })(),
    stance:
      record.verdict === "TRUE"
        ? "supports"
        : record.verdict === "FALSE"
          ? "contradicts"
          : record.confidence >= 60
            ? "supports"
            : "neutral",
    credibilityScore: getCredibility(record.source_url).score,
  };

  const corroborating = allSources.slice(1).map((url, i) => {
    const cred = getCredibility(url);
    let stance: SourceStance["stance"] = "supports";
    if (record.verdict === "MISLEADING" && i === allSources.length - 2) {
      stance = "neutral";
    } else if (record.verdict === "FALSE") {
      stance = i === 0 ? "contradicts" : "neutral";
    } else if (record.confidence < 50) {
      stance = "neutral";
    }
    return {
      url,
      domain: (() => {
        try {
          return new URL(url).hostname.replace(/^www\./, "");
        } catch {
          return url;
        }
      })(),
      stance,
      credibilityScore: cred.score,
    };
  });

  return [primaryStance, ...corroborating];
}

const STANCE_CONFIG = {
  supports: {
    icon: Check,
    label: "Supports claim",
    cls: "border-signal/40 bg-signal/10 text-signal",
    barCls: "bg-signal",
  },
  contradicts: {
    icon: X,
    label: "Contradicts claim",
    cls: "border-danger/40 bg-danger/10 text-danger",
    barCls: "bg-danger",
  },
  neutral: {
    icon: Minus,
    label: "Partial / neutral",
    cls: "border-pending/40 bg-pending/10 text-pending",
    barCls: "bg-pending",
  },
} as const;

export default function ContradictionPanel({ record }: ContradictionPanelProps) {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const stances = inferSourceStances(record);
  const signals = extractContradictionSignals(record.explanation);
  const hasContradictions = stances.some((s) => s.stance === "contradicts");
  const hasPartials = stances.some((s) => s.stance === "neutral");
  const isConflict =
    record.verdict === "MISLEADING" ||
    record.verdict === "FALSE" ||
    hasContradictions ||
    hasPartials ||
    record.confidence < 60;

  if (!isConflict && stances.length <= 1) return null;

  const supportsCount = stances.filter((s) => s.stance === "supports").length;
  const contradictsCount = stances.filter(
    (s) => s.stance === "contradicts"
  ).length;
  const neutralCount = stances.filter((s) => s.stance === "neutral").length;

  return (
    <motion.section
      aria-label="Evidence analysis"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(1.2), duration: 0.45 }}
      className="rounded-xl border border-line bg-surface p-6 shadow-card"
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warn/10">
          <AlertTriangle size={14} className="text-warn" />
        </span>
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          {hasContradictions
            ? "Contradictory evidence detected"
            : "Evidence divergence"}
        </h2>
      </div>

      {/* Summary */}
      <div className="mb-5 rounded-lg bg-surface-2 px-4 py-3">
        <p className="text-sm text-ink-dim">
          {supportsCount > 0 && (
            <>
              <span className="font-semibold text-signal">
                {supportsCount} source{supportsCount !== 1 ? "s" : ""}
              </span>{" "}
              support{supportsCount === 1 ? "s" : ""} this claim.{" "}
            </>
          )}
          {contradictsCount > 0 && (
            <>
              <span className="font-semibold text-danger">
                {contradictsCount} source{contradictsCount !== 1 ? "s" : ""}{" "}
                contradict{contradictsCount === 1 ? "s" : ""}
              </span>{" "}
              it.{" "}
            </>
          )}
          {neutralCount > 0 && (
            <>
              <span className="font-semibold text-pending">
                {neutralCount} source{neutralCount !== 1 ? "s" : ""}{" "}
                {neutralCount === 1 ? "is" : "are"} partial or neutral.
              </span>
            </>
          )}
        </p>
      </div>

      {/* Source stance cards */}
      {stances.length > 1 && (
        <div className="mb-5 space-y-3">
          {stances.map((s, i) => {
            const cfg = STANCE_CONFIG[s.stance];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={s.url}
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay(1400 + i * 120), duration: 0.3 }}
                className="flex items-center gap-3 rounded-lg bg-surface-2 px-4 py-3"
              >
                <span
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.55rem] font-bold ${cfg.cls}`}
                >
                  <Icon size={10} />
                  {cfg.label}
                </span>
                <span className="flex-1 truncate font-mono text-xs text-ink">
                  {s.domain}
                </span>
                <span className="hidden font-mono text-[0.55rem] text-ink-ghost sm:inline">
                  Quality {s.credibilityScore}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* LLM contradiction signals */}
      {signals.length > 0 && (
        <div className="rounded-lg border border-warn/20 bg-warn/5 px-4 py-3">
          <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-wider text-warn">
            Key passages
          </p>
          <ul className="space-y-1">
            {signals.slice(0, 3).map((sig, i) => (
              <li
                key={i}
                className="font-mono text-[0.65rem] leading-relaxed text-ink-dim"
              >
                {sig}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
}
