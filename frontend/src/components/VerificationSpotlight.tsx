import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRecentChecks } from "@/lib/genlayer";
import { VERDICT_DOT_CLASSES } from "@/components/verdictStyles";
import { verificationId } from "@/lib/verification";
import type { FactCheckRecord } from "@/lib/types";

export default function VerificationSpotlight() {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const { data: recent } = useQuery({
    queryKey: ["spotlight-recent"],
    queryFn: () => getRecentChecks(10),
    retry: false,
    staleTime: 30_000,
  });

  const spotlight = recent?.find(
    (r: FactCheckRecord) => r.verification_mode === "SOURCE_VERIFIED"
  ) ?? recent?.[0];

  if (!spotlight) return null;

  const vid = verificationId(spotlight.id);
  const dotClass = VERDICT_DOT_CLASSES[spotlight.verdict] ?? "bg-mute";
  const sourceCount = spotlight.sources_checked.length;

  return (
    <motion.section
      aria-label="Recent verification"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(0.5), duration: 0.5 }}
      className="rounded-xl border border-line bg-surface p-6 shadow-card"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">
          Recent verification
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[0.6rem] text-signal">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
          Live
        </span>
      </div>

      <p className="mb-4 max-w-[520px] font-display text-sm leading-relaxed text-ink-dim">
        &ldquo;{spotlight.claim}&rdquo;
      </p>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
          <span className="font-display text-lg font-bold text-ink">
            {spotlight.verdict}
          </span>
        </div>
        <span className="h-4 w-px bg-line" />
        <span className="font-mono text-xs text-ink-dim">
          {spotlight.confidence}% confidence
        </span>
        <span className="h-4 w-px bg-line" />
        <span className="font-mono text-xs text-ink-dim">
          {sourceCount} source{sourceCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Agreement bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">
            Source agreement
          </span>
          <span className="font-mono text-[0.6rem] text-ink-ghost">
            {spotlight.confidence}%
          </span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-void">
          <motion.div
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${Math.max(spotlight.confidence, 5)}%` }}
            transition={{ delay: delay(700), duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-signal"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.6rem] text-signal">
          ⛓ Onchain verified
        </span>
        <span className="font-mono text-[0.6rem] tracking-widest text-ink-ghost">
          {vid}
        </span>
      </div>

      <Link
        to={`/result/${spotlight.id}`}
        className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-signal/30 bg-signal-dim px-4 py-2.5 font-display text-xs font-semibold text-signal transition-colors hover:border-signal/50"
      >
        Inspect evidence
        <ArrowRight size={12} />
      </Link>
    </motion.section>
  );
}
