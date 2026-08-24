import { useState } from "react";
import { Brain, Check, ChevronDown, Globe, X } from "lucide-react";
import { getCredibility } from "@/lib/sourceCredibility";
import type { SourceStatus } from "@/lib/types";
import { SOURCE_STATUS_LABELS } from "@/lib/types";

interface SourcePanelProps {
  sources: string[];
  primaryStatus?: SourceStatus;
}

const STATUS_BADGE: Record<SourceStatus, { label: string; ok: boolean; cls: string }> = {
  NOT_PROVIDED: { label: "Not provided", ok: false, cls: "border-line text-ink-ghost" },
  FETCHED: { label: "Fetched", ok: true, cls: "border-signal/40 text-signal" },
  EMPTY: { label: "Empty", ok: false, cls: "border-warn/40 text-warn" },
  BLOCKED: { label: "Blocked", ok: false, cls: "border-danger/40 text-danger" },
  TIMEOUT: { label: "Timeout", ok: false, cls: "border-warn/40 text-warn" },
  INVALID: { label: "Invalid", ok: false, cls: "border-danger/40 text-danger" },
  ERROR: { label: "Error", ok: false, cls: "border-danger/40 text-danger" },
};

function domainOf(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname !== "/" ? parsed.pathname : ""}`;
  } catch {
    return url;
  }
}

function faviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return "";
  }
}

export default function SourcePanel({ sources, primaryStatus = "FETCHED" }: SourcePanelProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <ul className="divide-y divide-line-dim rounded-lg border border-line bg-surface">
      {sources.map((url, index) => {
        const isExpanded = expanded === index;
        const isPrimary = index === 0;
        const cred = getCredibility(url);
        const status: SourceStatus = isPrimary ? primaryStatus : "FETCHED";
        const badge = STATUS_BADGE[status];
        return (
          <li key={`${url}-${index}`}>
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : index)}
              aria-expanded={isExpanded}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-line-dim/40"
            >
              <img
                src={faviconUrl(url)}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 shrink-0 rounded-sm"
              />
              <span className="flex-1 truncate font-mono text-[0.8rem] text-ink">
                {isExpanded ? url : domainOf(url).slice(0, 48)}
              </span>
              {isPrimary && (
                <span className="shrink-0 rounded border border-signal-border bg-signal-dim px-1.5 py-0.5 font-mono text-[0.55rem] font-bold tracking-widest text-signal">
                  PRIMARY
                </span>
              )}
              <span
                className={`hidden shrink-0 rounded border px-2 py-0.5 font-mono text-[0.6rem] font-semibold tracking-wide sm:inline ${cred.badgeClass}`}
                title={`Source quality: ${cred.score}/100`}
              >
                {cred.label} · {cred.score}
              </span>
              <span
                className={`flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 font-mono text-[0.6rem] ${badge.cls}`}
              >
                {badge.ok ? <Check size={11} /> : <X size={11} />}
                {badge.label}
              </span>
              <ChevronDown
                size={13}
                className={`shrink-0 text-ink-ghost transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>
          </li>
        );
      })}
      {sources.length === 0 && (
        <li className="flex items-center gap-2 px-4 py-3 text-sm text-ink-dim">
          <X size={14} className="text-danger" aria-hidden="true" />
          No sources could be fetched for this check.
        </li>
      )}
    </ul>
  );
}

export function KnowledgeEvidenceNote() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-2 px-4 py-4">
      <Brain size={16} className="mt-0.5 shrink-0 text-pending" />
      <div>
        <p className="text-sm font-medium text-ink">Knowledge-based verification</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-dim">
          No external sources were fetched. The verdict reflects the AI model's own
          knowledge, with confidence capped at 85. Submit with a source URL for a
          source-verified verdict.
        </p>
      </div>
    </div>
  );
}

export function SourceStatusLegend() {
  return (
    <p className="mt-2 flex items-center gap-1.5 font-mono text-[0.6rem] text-ink-ghost">
      <Globe size={10} />
      Status reflects the on-chain fetch result recorded at verification time.
    </p>
  );
}
