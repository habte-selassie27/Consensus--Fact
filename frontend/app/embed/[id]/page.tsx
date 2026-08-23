"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Code2, Copy, Check } from "lucide-react";
import { verdictBadgeClass } from "@/components/verdictStyles";
import { getCheck } from "@/lib/genlayer";

export default function EmbedPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const [copied, setCopied] = useState(false);

  const { data: record, isLoading, isError } = useQuery({
    queryKey: ["check", id],
    queryFn: () => getCheck(id),
    enabled: id.length > 0,
    retry: false,
  });

  const embedCode =
    typeof window !== "undefined"
      ? `<iframe src="${window.location.origin}/embed/${id}" width="520" height="220" frameborder="0" title="TruthLock verdict"></iframe>`
      : `<iframe src="/embed/${id}" width="520" height="220" frameborder="0"></iframe>`;

  async function handleCopy() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[180px] items-center justify-center bg-void p-6">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-signal" />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="flex min-h-[180px] items-center justify-center bg-void p-6">
        <p className="font-mono text-xs text-ink-ghost">Verdict not found.</p>
      </div>
    );
  }

  const isStandalone = typeof window !== "undefined" && window.self === window.top;

  return (
    <div className="min-h-screen bg-void">
      {/* Minimal card — the iframe content */}
      <div className="mx-auto max-w-[520px] p-4">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="flex-1 text-sm leading-relaxed text-ink">
              &ldquo;{record.claim}&rdquo;
            </p>
            <span className="shrink-0 font-mono text-xs text-ink-ghost">
              {record.confidence}%
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span
              className={`rounded border px-2.5 py-1 font-display text-[0.65rem] font-bold tracking-widest ${verdictBadgeClass(record.verdict)}`}
            >
              {record.verdict}
            </span>
            <span className="font-mono text-[0.65rem] text-ink-ghost">
              Verified on GenLayer
            </span>
            <span className="ml-auto font-display text-[0.6rem] font-bold tracking-wide">
              <span className="text-signal">TRUTH</span>
              <span className="text-ink">LOCK</span>
            </span>
          </div>
        </div>

        {/* Copy snippet — only when viewed standalone, not inside iframe */}
        {isStandalone && (
          <div className="mt-6 rounded-lg border border-line bg-surface p-4">
            <h2 className="label mb-2 flex items-center gap-2">
              <Code2 size={13} />
              Embed this verdict
            </h2>
            <p className="mb-3 font-mono text-xs text-ink-dim">
              Paste this HTML to embed the card on any site.
            </p>
            <div className="flex items-stretch gap-2">
              <code className="flex-1 overflow-hidden text-ellipsis rounded-md bg-void px-3 py-2.5 font-mono text-[0.7rem] text-ink-dim">
                {embedCode}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-line px-3 py-2 font-mono text-xs text-ink transition-colors hover:border-signal/40"
              >
                {copied ? <Check size={13} className="text-signal" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
