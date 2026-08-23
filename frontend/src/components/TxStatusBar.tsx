"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { truncateHash } from "@/lib/genlayer";
import type { TxStatus } from "@/lib/types";

interface TxStatusBarProps {
  status: TxStatus;
  txHash: string | null;
  errorMessage?: string | null;
}

const STATUS_TEXT: Record<Exclude<TxStatus, "idle">, string> = {
  wallet: "Waiting for wallet confirmation...",
  pending: "Fetching sources & running consensus...",
  confirming: "Validators reaching consensus...",
  done: "Verdict recorded on-chain",
  error: "Transaction failed. Try again.",
};

export default function TxStatusBar({
  status,
  txHash,
  errorMessage,
}: TxStatusBarProps) {
  if (status === "idle") return null;

  const spinnerColor =
    status === "error"
      ? "text-danger"
      : status === "pending"
        ? "text-pending"
        : "text-signal";

  return (
    <div
      role="status"
      className="mt-5 card-sm flex items-center justify-between gap-4 border-t-2"
    >
      <div className="flex items-center gap-3">
        {status === "done" ? (
          <CheckCircle2 size={18} className="text-signal" aria-hidden="true" />
        ) : status === "error" ? (
          <XCircle size={18} className="text-danger" aria-hidden="true" />
        ) : (
          <Loader2 size={18} className={`animate-spin ${spinnerColor}`} aria-hidden="true" />
        )}
        <span className="text-sm text-ink">{STATUS_TEXT[status]}</span>
      </div>
      {txHash && (
        <span className="font-mono text-xs text-ink-dim">
          {truncateHash(txHash)}
        </span>
      )}
      {status === "error" && errorMessage && (
        <span className="hidden max-w-[280px] truncate font-mono text-xs text-ink-dim md:inline">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
