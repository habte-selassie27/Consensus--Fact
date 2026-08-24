import { motion, useReducedMotion } from "framer-motion";
import {
  Send,
  Globe,
  Brain,
  ShieldCheck,
  Check,
  FileCheck,
} from "lucide-react";
import type { FactCheckRecord } from "@/lib/types";

interface VerdictTimelineProps {
  record: FactCheckRecord;
}

interface TimelineStep {
  time: string;
  label: string;
  detail: string;
  icon: React.ElementType;
  tone: "default" | "signal" | "pending";
}

function formatTime(ts: number, offsetSec: number = 0): string {
  return new Date((ts + offsetSec) * 1000).toISOString().slice(11, 19);
}

export default function VerdictTimeline({ record }: VerdictTimelineProps) {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const isKB = record.verification_mode === "KNOWLEDGE_BASED";
  const sourceCount = record.sources_checked.length;
  const verdictLabel =
    record.verdict === "TRUE"
      ? "TRUE"
      : record.verdict === "FALSE"
        ? "FALSE"
        : record.verdict === "MISLEADING"
          ? "MISLEADING"
          : "UNVERIFIABLE";

  const baseTs = record.timestamp - (isKB ? 8 : 16);

  const steps: TimelineStep[] = [
    {
      time: formatTime(baseTs, 0),
      label: "Claim submitted",
      detail: isKB
        ? "Knowledge-based mode"
        : "Source URL provided",
      icon: Send,
      tone: "default",
    },
    {
      time: formatTime(baseTs, 2),
      label: isKB ? "Knowledge lookup" : "Primary source retrieved",
      detail: isKB
        ? "Evaluating from internal knowledge"
        : record.source_url
          ? (() => {
              try {
                return new URL(record.source_url).hostname.replace(/^www\./, "");
              } catch {
                return "Source fetched";
              }
            })()
          : "Source fetched",
      icon: Globe,
      tone: isKB ? "pending" : "signal",
    },
    ...(!isKB
      ? [
          {
            time: formatTime(baseTs, 4),
            label: `${sourceCount - 1} corroborating sources`,
            detail: "Cross-referencing independent evidence",
            icon: Globe,
            tone: "signal" as const,
          },
        ]
      : []),
    {
      time: formatTime(baseTs, isKB ? 6 : 7),
      label: "Validators reasoning",
      detail: "Independent AI evaluation by each validator",
      icon: Brain,
      tone: "default" as const,
    },
    {
      time: formatTime(baseTs, isKB ? 10 : 13),
      label: "Consensus reached",
      detail: "Majority agreement via Optimistic Democracy",
      icon: ShieldCheck,
      tone: "signal" as const,
    },
    {
      time: formatTime(baseTs, isKB ? 12 : 15),
      label: "Verdict committed",
      detail: "Stored permanently on-chain",
      icon: FileCheck,
      tone: "signal" as const,
    },
    {
      time: formatTime(baseTs, isKB ? 13 : 16),
      label: `${verdictLabel} · ${record.confidence}%`,
      detail: "Final verification result",
      icon: Check,
      tone: "signal" as const,
    },
  ];

  return (
    <motion.section
      aria-label="Verification timeline"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(2.0), duration: 0.45 }}
      className="rounded-xl border border-line bg-surface p-6 shadow-card"
    >
      <h2 className="mb-5 font-display text-sm font-semibold tracking-wide text-ink">
        Verification timeline
      </h2>

      <div className="relative space-y-0">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === steps.length - 1;
          return (
            <motion.div
              key={`${step.label}-${i}`}
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: delay(2200 + i * 120),
                duration: 0.3,
              }}
              className="relative flex gap-4"
            >
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className="absolute left-[14px] top-[32px] w-px bg-line"
                  style={{ height: "calc(100% - 8px)" }}
                  aria-hidden="true"
                />
              )}

              {/* Node */}
              <div
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                  step.tone === "signal"
                    ? "border-signal/60 bg-signal/10 text-signal"
                    : step.tone === "pending"
                      ? "border-pending/60 bg-pending/10 text-pending"
                      : "border-line bg-surface-2 text-ink-ghost"
                }`}
              >
                {isLast ? (
                  <Check size={12} />
                ) : (
                  <Icon size={12} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.6rem] text-ink-ghost">
                    {step.time}
                  </span>
                  <span className="font-display text-xs font-semibold tracking-wide text-ink">
                    {step.label}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[0.6rem] text-ink-ghost">
                  {step.detail}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
