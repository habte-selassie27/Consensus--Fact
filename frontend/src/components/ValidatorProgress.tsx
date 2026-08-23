"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Users,
  Globe,
  GitBranch,
  Brain,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { truncateHash } from "@/lib/genlayer";
import type { TxStatus } from "@/lib/types";

interface ValidatorProgressProps {
  status: TxStatus;
  txHash: string | null;
  errorMessage?: string | null;
}

interface Step {
  id: string;
  label: string;
  icon: React.ElementType;
  estimatedMs: number;
}

const STEPS: Step[] = [
  { id: "submitted", label: "Transaction submitted", icon: Send, estimatedMs: 0 },
  { id: "validators", label: "Validators picking up transaction", icon: Users, estimatedMs: 3000 },
  { id: "fetch-primary", label: "Fetching primary source", icon: Globe, estimatedMs: 8000 },
  { id: "cross-reference", label: "Cross-referencing sources", icon: GitBranch, estimatedMs: 15000 },
  { id: "llm-eval", label: "LLM evaluation in progress", icon: Brain, estimatedMs: 25000 },
  { id: "consensus", label: "Validators reaching consensus", icon: ShieldCheck, estimatedMs: 35000 },
];

export default function ValidatorProgress({
  status,
  txHash,
  errorMessage,
}: ValidatorProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status === "idle" || status === "done" || status === "error") return;
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Date.now() - start), 200);
    return () => clearInterval(interval);
  }, [status]);

  if (status === "idle") return null;

  const activeStepIndex =
    status === "done"
      ? STEPS.length
      : status === "error"
        ? STEPS.findIndex((s) => s.estimatedMs > elapsed)
        : STEPS.findIndex((s) => s.estimatedMs > elapsed);

  function getStepState(index: number): "done" | "active" | "pending" {
    if (status === "done") return "done";
    if (status === "error" && index === activeStepIndex) return "active";
    if (index < activeStepIndex) return "done";
    if (index === activeStepIndex) return "active";
    return "pending";
  }

  return (
    <div className="mt-5 card-sm" role="status">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {status === "done" ? (
            <CheckCircle2 size={16} className="text-signal" />
          ) : status === "error" ? (
            <XCircle size={16} className="text-danger" />
          ) : (
            <Loader2 size={16} className="text-pending animate-spin" />
          )}
          <span className="text-sm font-medium text-ink">
            {status === "done"
              ? "Verdict recorded on-chain"
              : status === "error"
                ? "Transaction failed"
                : "Processing claim..."}
          </span>
        </div>
        {txHash && (
          <span className="font-mono text-xs text-ink-ghost">
            {truncateHash(txHash)}
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const state = getStepState(i);
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-start gap-3">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                    state === "done"
                      ? "border-signal bg-signal/10 text-signal"
                      : state === "active"
                        ? "border-pending bg-pending/10 text-pending"
                        : "border-line bg-transparent text-ink-ghost"
                  }`}
                >
                  {state === "done" ? (
                    <CheckCircle2 size={14} />
                  ) : state === "active" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Icon size={14} />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-px h-5 transition-colors duration-300 ${
                      state === "done" ? "bg-signal/40" : "bg-line"
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs leading-7 transition-colors duration-300 ${
                  state === "done"
                    ? "text-ink-dim"
                    : state === "active"
                      ? "text-ink font-medium"
                      : "text-ink-ghost"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {status === "error" && errorMessage && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 text-xs text-danger font-mono"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
