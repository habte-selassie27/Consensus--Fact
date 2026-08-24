import { motion, useReducedMotion } from "framer-motion";
import { Search, Globe, Check, ArrowRight } from "lucide-react";
import type { FactCheckRecord } from "@/lib/types";

interface SourceDiscoveryProps {
  record: FactCheckRecord;
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function SourceDiscovery({ record }: SourceDiscoveryProps) {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const isKB = record.verification_mode === "KNOWLEDGE_BASED";
  if (isKB) return null;

  const primaryUrl = record.source_url;
  const corroborating = record.sources_checked.filter(
    (s) => s !== primaryUrl
  );

  return (
    <motion.section
      aria-label="Source discovery"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(0.6), duration: 0.45 }}
      className="rounded-xl border border-line bg-surface p-6 shadow-card"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-signal/10">
          <Search size={14} className="text-signal" />
        </span>
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Source discovery
        </h2>
      </div>

      <p className="mb-5 font-mono text-[0.65rem] text-ink-ghost">
        The contract automatically extracted corroborating sources from the
        primary page content via LLM.
      </p>

      <div className="relative space-y-0">
        {/* Step 1: Primary source */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay(800), duration: 0.3 }}
          className="relative flex gap-4"
        >
          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-signal/60 bg-signal/10 text-signal">
            <Globe size={13} />
          </div>
          <div className="flex-1 pb-4">
            <p className="font-display text-xs font-semibold text-ink">
              Primary source provided
            </p>
            <p className="mt-0.5 truncate font-mono text-[0.65rem] text-ink-dim">
              {domainFromUrl(primaryUrl)}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-signal/40 bg-signal/10 px-2 py-0.5 font-mono text-[0.5rem] font-bold text-signal">
              <Check size={8} /> FETCHED
            </span>
          </div>
        </motion.div>

        {/* Step 2: LLM extraction */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay(1000), duration: 0.3 }}
          className="relative flex gap-4"
        >
          <div className="absolute left-[15px] top-0 h-full w-px bg-line" aria-hidden="true" />
          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-ghost">
            <Search size={13} />
          </div>
          <div className="flex-1 pb-4">
            <p className="font-display text-xs font-semibold text-ink">
              LLM extracted corroborating URLs
            </p>
            <p className="mt-0.5 font-mono text-[0.65rem] text-ink-ghost">
              Analyzed page content to find {corroborating.length} independent
              source{corroborating.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {corroborating.length > 0 ? (
                corroborating.map((url, i) => (
                  <motion.span
                    key={url}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: delay(1200 + i * 100), duration: 0.2 }}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 font-mono text-[0.55rem] text-ink-dim"
                  >
                    <Globe size={8} />
                    {domainFromUrl(url).slice(0, 24)}
                  </motion.span>
                ))
              ) : (
                <span className="font-mono text-[0.6rem] text-ink-ghost">
                  No additional sources extracted
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Step 3: Verification */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay(1400), duration: 0.3 }}
          className="relative flex gap-4"
        >
          <div className="absolute left-[15px] top-0 h-full w-px bg-line" aria-hidden="true" />
          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-signal/60 bg-signal/10 text-signal">
            <Check size={13} />
          </div>
          <div className="flex-1 pb-2">
            <p className="font-display text-xs font-semibold text-ink">
              Cross-referenced {record.sources_checked.length} sources
            </p>
            <p className="mt-0.5 font-mono text-[0.65rem] text-ink-ghost">
              All evidence evaluated by the LLM to produce the final verdict
            </p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
