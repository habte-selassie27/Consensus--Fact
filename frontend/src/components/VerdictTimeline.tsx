"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Globe, GitBranch, ShieldCheck, Check } from "lucide-react";
import type { FactCheckRecord } from "@/lib/types";

interface VerdictTimelineProps {
  record: FactCheckRecord;
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VerdictTimeline({ record }: VerdictTimelineProps) {
  const reduceMotion = useReducedMotion();

  const sourceHost = (() => {
    try {
      return record.source_url
        ? new URL(record.source_url).hostname.replace(/^www\./, "")
        : "Knowledge-based (no source)";
    } catch {
      return record.source_url || "Unknown source";
    }
  })();

  const steps = [
    {
      label: "Primary source",
      detail: sourceHost,
      icon: Globe,
    },
    {
      label: "Corroborating sources",
      detail: `${record.sources_checked.filter((s) => s !== record.source_url).length} sources cross-checked`,
      icon: GitBranch,
    },
    {
      label: "Consensus reached",
      detail: formatTime(record.timestamp),
      icon: ShieldCheck,
    },
  ];

  return (
    <section aria-label="Verdict timeline" className="mt-8">
      <h2 className="label mb-4">How this verdict was reached</h2>

      <div className="card">
        <div className="relative flex items-start justify-between gap-2">
          {/* Connector line */}
          <div className="absolute left-[18px] right-[18px] top-[18px] h-px bg-line sm:left-[28px] sm:right-[28px]" aria-hidden="true" />
          <motion.div
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: reduceMotion ? 0 : 1.2, ease: "easeOut", delay: 0.4 }}
            className="absolute left-[18px] right-[18px] top-[18px] h-px origin-left bg-signal/50 sm:left-[28px] sm:right-[28px]"
            aria-hidden="true"
          />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.label}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.5 + i * 0.15, duration: 0.35 }}
                className="relative flex flex-1 flex-col items-center text-center"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-signal bg-signal/10 text-signal">
                  {i === steps.length - 1 ? <Check size={16} /> : <Icon size={16} />}
                </span>
                <span className="mt-2 font-display text-xs font-semibold tracking-wide text-ink">
                  {step.label}
                </span>
                <span className="mt-1 max-w-[140px] truncate font-mono text-[0.65rem] text-ink-ghost">
                  {step.detail}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
