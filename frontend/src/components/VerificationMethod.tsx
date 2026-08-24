import { Brain, Globe, ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from "lucide-react";
import type { SourceStatus, VerificationMode } from "@/lib/types";
import { SOURCE_STATUS_LABELS } from "@/lib/types";

interface VerificationMethodProps {
  mode: VerificationMode;
  sourceStatus: SourceStatus;
  sourceUrl: string;
  compact?: boolean;
}

const STATUS_ICON = {
  FETCHED: ShieldCheck,
  NOT_PROVIDED: Brain,
  EMPTY: ShieldAlert,
  BLOCKED: ShieldX,
  TIMEOUT: ShieldAlert,
  INVALID: ShieldX,
  ERROR: ShieldX,
} as const;

const STATUS_CLASS: Record<SourceStatus, string> = {
  FETCHED: "border-signal-border bg-signal-dim text-signal",
  NOT_PROVIDED: "border-pending/30 bg-pending-dim text-pending",
  EMPTY: "border-warn/30 bg-warn/10 text-warn",
  BLOCKED: "border-warn/30 bg-warn/10 text-warn",
  TIMEOUT: "border-warn/30 bg-warn/10 text-warn",
  INVALID: "border-warn/30 bg-warn/10 text-warn",
  ERROR: "border-warn/30 bg-warn/10 text-warn",
};

export default function VerificationMethod({
  mode,
  sourceStatus,
  sourceUrl,
  compact = false,
}: VerificationMethodProps) {
  const isSourceVerified = mode === "SOURCE_VERIFIED" && sourceStatus === "FETCHED";
  const Icon = isSourceVerified ? Globe : STATUS_ICON[sourceStatus] ?? HelpCircle;
  const cls = isSourceVerified
    ? STATUS_CLASS.FETCHED
    : STATUS_CLASS[sourceStatus] ?? STATUS_CLASS.ERROR;

  const label = isSourceVerified
    ? "Source-verified"
    : sourceStatus === "NOT_PROVIDED"
      ? "Knowledge-based"
      : sourceStatus === "ERROR" || sourceStatus === "BLOCKED" || sourceStatus === "TIMEOUT"
        ? "Knowledge-based · Source unreachable"
        : `Knowledge-based · ${SOURCE_STATUS_LABELS[sourceStatus]}`;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[0.6rem] font-medium tracking-wide ${cls}`}
        title={sourceUrl || "No source URL"}
      >
        <Icon size={10} />
        {isSourceVerified ? "Source-verified" : "Knowledge-based"}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${cls}`}>
      <Icon size={15} />
      <div className="flex flex-col">
        <span className="font-display text-xs font-bold tracking-wide">{label}</span>
        {!compact && sourceUrl && (
          <span className="max-w-[320px] truncate font-mono text-[0.6rem] opacity-70">
            {sourceUrl}
          </span>
        )}
      </div>
    </div>
  );
}
