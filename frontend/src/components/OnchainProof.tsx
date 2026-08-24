import { Link, ExternalLink, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { FactCheckRecord } from "@/lib/types";
import { CONTRACT_ADDRESS } from "@/lib/genlayer";
import {
  verificationId,
  loadTxProof,
  truncateAddress,
  explorerTxUrl,
} from "@/lib/verification";

interface OnchainProofProps {
  record: FactCheckRecord;
}

export default function OnchainProof({ record }: OnchainProofProps) {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const proof = loadTxProof(record.id);
  const vid = verificationId(record.id);
  const contractShort = CONTRACT_ADDRESS
    ? truncateAddress(CONTRACT_ADDRESS, 6, 4)
    : null;
  const txShort = proof ? truncateAddress(proof.txHash, 8, 4) : null;
  const explorerUrl = proof ? explorerTxUrl(proof.txHash) : null;

  return (
    <motion.section
      aria-label="Onchain proof"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(1.6), duration: 0.45 }}
      className="rounded-xl border border-line bg-surface p-6 shadow-card"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-signal/10">
          <Check size={14} className="text-signal" />
        </span>
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Permanently recorded
        </h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-ghost">
            Verification ID
          </span>
          <span className="rounded bg-surface-2 px-2 py-1 font-mono text-sm font-bold tracking-widest text-signal">
            {vid}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-ghost">
            Verdict
          </span>
          <span className="font-mono text-sm font-bold text-ink">
            {record.verdict}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-ghost">
            Confidence
          </span>
          <span className="font-mono text-sm font-semibold text-ink">
            {record.confidence}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-ghost">
            Timestamp
          </span>
          <span className="font-mono text-xs text-ink">
            {new Date(record.timestamp * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-ghost">
            Contract
          </span>
          {contractShort ? (
            <span className="font-mono text-xs text-ink" title={CONTRACT_ADDRESS}>
              {contractShort}
            </span>
          ) : (
            <span className="font-mono text-xs text-ink-ghost">—</span>
          )}
        </div>

        {txShort && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-ghost">
              Tx Hash
            </span>
            <span
              className="font-mono text-xs text-ink"
              title={proof?.txHash}
            >
              {txShort}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-ghost">
            Submitter
          </span>
          <span
            className="font-mono text-xs text-ink"
            title={record.submitter}
          >
            {truncateAddress(record.submitter, 6, 4)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-ghost">
            Network
          </span>
          <span className="font-mono text-xs text-signal">
            GenLayer Studio
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-2 font-display text-xs font-semibold text-ink-dim transition-colors hover:border-signal/40 hover:text-ink"
          >
            <ExternalLink size={12} />
            View on Explorer
          </a>
        )}
        <Link
          to={`/embed/${record.id}`}
          className="flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-2 font-display text-xs font-semibold text-ink-dim transition-colors hover:border-signal/40 hover:text-ink"
        >
          <Link size={12} />
          Embed
        </Link>
      </div>
    </motion.section>
  );
}
