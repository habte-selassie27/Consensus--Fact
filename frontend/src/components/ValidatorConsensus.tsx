import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, Check, Loader2 } from "lucide-react";
import type { FactCheckRecord } from "@/lib/types";
import { VERDICT_DOT_CLASSES } from "@/components/verdictStyles";
import { loadTxProof, truncateAddress } from "@/lib/verification";

interface ValidatorConsensusProps {
  record: FactCheckRecord;
}

export default function ValidatorConsensus({ record }: ValidatorConsensusProps) {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);
  const proof = loadTxProof(record.id);
  const dotClass =
    VERDICT_DOT_CLASSES[record.verdict] ?? "bg-mute";

  if (proof && proof.totalVotes > 0) {
    const entries = Object.entries(proof.votes);
    entries.sort(([, a], [, b]) => {
      if (a === "agree" && b !== "agree") return -1;
      if (a !== "agree" && b === "agree") return 1;
      return 0;
    });

    return (
      <motion.section
        aria-label="Validator consensus"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(0.3), duration: 0.45 }}
      className="rounded-xl border border-line bg-surface p-6 shadow-card"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-signal/10">
          <ShieldCheck size={14} className="text-signal" />
        </span>
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Decentralized consensus
        </h2>
      </div>

      <div className="mb-5 text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-ghost">
          Optimistic Democracy consensus
        </p>
      </div>

      <div className="space-y-2">
        {entries.map(([addr, vote], i) => (
          <motion.div
            key={addr}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: delay(400 + i * 80),
              duration: 0.25,
            }}
              className="flex items-center gap-3 rounded-lg bg-surface-2 px-4 py-2.5"
            >
              <span className="font-mono text-[0.65rem] text-ink-ghost">
                Validator
              </span>
              <span className="flex-1 truncate font-mono text-xs text-ink">
                {truncateAddress(addr, 5, 3)}
              </span>
              <span
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] font-bold tracking-wide ${
                  vote === "agree"
                    ? "border-signal/40 bg-signal/10 text-signal"
                    : "border-line text-ink-ghost"
                }`}
              >
                {vote === "agree" ? (
                  <Check size={10} className="text-signal" />
                ) : (
                  <Loader2 size={10} className="text-ink-ghost" />
                )}
                {vote === "agree" ? "AGREE" : "IDLE"}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 rounded-lg bg-surface-2 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass}`}
            />
            <span className="font-display text-sm font-bold tracking-wide text-ink">
              {proof.agreeCount} / {proof.totalVotes} validators agree
            </span>
          </div>
          <p className="mt-1 font-mono text-[0.6rem] text-ink-ghost">
            Majority consensus reached via Optimistic Democracy
          </p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      aria-label="Validator consensus"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(0.3), duration: 0.45 }}
      className="rounded-xl border border-line bg-surface p-6 shadow-card"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-signal/10">
          <ShieldCheck size={14} className="text-signal" />
        </span>
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Decentralized consensus
        </h2>
      </div>

      <div className="rounded-lg bg-surface-2 px-4 py-5 text-center">
        <p className="text-sm text-ink-dim">
          Validators independently re-executed this verification pipeline and
          voted on the verdict via{" "}
          <span className="font-semibold text-ink">Optimistic Democracy</span>.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass}`}
          />
          <span className="font-display text-sm font-bold text-ink">
            Majority agreed: {record.verdict}
          </span>
        </div>
        <p className="mt-1 font-mono text-[0.6rem] text-ink-ghost">
          Per-validator details are available when submitted from this wallet.
        </p>
      </div>
    </motion.section>
  );
}
