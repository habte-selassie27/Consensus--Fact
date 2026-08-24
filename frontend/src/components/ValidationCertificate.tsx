import { motion, useReducedMotion } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";
import type { FactCheckRecord } from "@/lib/types";
import { VERDICT_COLORS } from "@/components/verdictStyles";
import { verificationId, loadTxProof } from "@/lib/verification";

interface ValidationCertificateProps {
  record: FactCheckRecord;
}

export default function ValidationCertificate({
  record,
}: ValidationCertificateProps) {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const vid = verificationId(record.id);
  const proof = loadTxProof(record.id);
  const color = VERDICT_COLORS[record.verdict] ?? "#6B7280";
  const sourceCount = record.sources_checked.length;
  const validatorCount = proof?.totalVotes ?? 0;

  return (
    <motion.section
      aria-label="Verification certificate"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(2.2), duration: 0.45 }}
      className="rounded-xl border-2 bg-surface p-8 text-center shadow-card"
      style={{ borderColor: color + "40" }}
    >
      <div className="mb-4 flex items-center justify-center gap-2">
        <ShieldCheck size={18} style={{ color }} />
        <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-ghost">
          TruthLock Verified
        </span>
      </div>

      <div
        className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: color + "15" }}
      >
        <Check size={28} style={{ color }} />
      </div>

      <p
        className="font-display text-2xl font-bold tracking-tight"
        style={{ color }}
      >
        {record.verdict}
      </p>

      <p className="mt-1 font-mono text-sm text-ink-dim">
        {record.confidence}% confidence
      </p>

      <div className="mx-auto mt-4 h-px w-32 bg-line" />

      <div className="mt-4 flex items-center justify-center gap-4 font-mono text-xs text-ink-dim">
        <span>
          {sourceCount} Source{sourceCount !== 1 ? "s" : ""}
        </span>
        <span className="text-ink-ghost">&bull;</span>
        <span>
          {validatorCount > 0
            ? `${validatorCount} Validator${validatorCount !== 1 ? "s" : ""}`
            : "Validators"}
        </span>
        <span className="text-ink-ghost">&bull;</span>
        <span className="text-signal">Onchain</span>
      </div>

      <p className="mt-3 font-mono text-[0.6rem] tracking-widest text-ink-ghost">
        {vid}
      </p>
    </motion.section>
  );
}
