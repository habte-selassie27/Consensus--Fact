"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { getCredibility } from "@/lib/sourceCredibility";

interface SourcePanelProps {
  sources: string[];
}

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

export default function SourcePanel({ sources }: SourcePanelProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <ul className="divide-y divide-line-dim rounded-lg border border-line bg-surface">
      {sources.map((url, index) => {
        const isExpanded = expanded === index;
        const cred = getCredibility(url);
        return (
          <li key={`${url}-${index}`}>
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : index)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-line-dim/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
              <span
                className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[0.6rem] font-semibold tracking-wide ${cred.badgeClass}`}
              >
                {cred.label}
              </span>
              <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-signal">
                <Check size={12} aria-hidden="true" /> Fetched
              </span>
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
