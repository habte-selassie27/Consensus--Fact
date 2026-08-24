import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Code2, Copy, Check, ShieldCheck, ExternalLink } from "lucide-react";
import { VERDICT_DOT_CLASSES } from "@/components/verdictStyles";
import { getCheck } from "@/lib/genlayer";
import { verificationId } from "@/lib/verification";

export default function Embed() {
  const { id } = useParams<{ id: string }>();
  const checkId = typeof id === "string" ? id : "";
  const [copied, setCopied] = useState(false);

  const {
    data: record,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["check", checkId],
    queryFn: () => getCheck(checkId),
    enabled: checkId.length > 0,
    retry: false,
  });

  const embedCode =
    typeof window !== "undefined"
      ? `<iframe src="${window.location.origin}/embed/${checkId}" width="520" height="320" frameborder="0" title="TruthLock verification"></iframe>`
      : `<iframe src="/embed/${checkId}" width="520" height="320" frameborder="0"></iframe>`;

  async function handleCopy() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center bg-void p-6">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-signal" />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="flex min-h-[200px] items-center justify-center bg-void p-6">
        <p className="font-mono text-xs text-ink-ghost">Verification not found.</p>
      </div>
    );
  }

  const vid = verificationId(record.id);
  const isStandalone =
    typeof window !== "undefined" && window.self === window.top;
  const dotClass = VERDICT_DOT_CLASSES[record.verdict] ?? "bg-mute";
  const sourceCount = record.sources_checked.length;

  return (
    <div className="min-h-screen bg-void">
      <div className="mx-auto max-w-[540px] p-4">
        {/* Certificate card */}
        <div className="rounded-xl border-2 border-signal/30 bg-surface p-6 text-center shadow-card">
          <div className="mb-3 flex items-center justify-center gap-2">
            <ShieldCheck size={16} className="text-signal" />
            <span className="font-display text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-ghost">
              TruthLock Verified
            </span>
          </div>

          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-signal/10">
            <Check size={24} className="text-signal" />
          </div>

          <p className="font-display text-xl font-bold text-signal">
            {record.verdict}
          </p>

          <p className="mt-1 font-mono text-sm text-ink-dim">
            {record.confidence}% confidence
          </p>

          <div className="mx-auto my-3 h-px w-24 bg-line" />

          <p className="max-w-[440px] px-2 text-sm leading-relaxed text-ink-dim">
            &ldquo;{record.claim}&rdquo;
          </p>

          <div className="mx-auto my-3 h-px w-24 bg-line" />

          <div className="flex items-center justify-center gap-4 font-mono text-[0.65rem] text-ink-dim">
            <span>
              {sourceCount} Source{sourceCount !== 1 ? "s" : ""}
            </span>
            <span className="text-ink-ghost">&bull;</span>
            <span className="text-signal">Onchain verified</span>
          </div>

          <p className="mt-3 font-mono text-[0.55rem] tracking-widest text-ink-ghost">
            {vid}
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <span
              className={`h-2 w-2 rounded-full ${dotClass}`}
            />
            <span className="font-display text-xs font-bold text-ink">
              {record.verdict}
            </span>
            <span className="font-mono text-[0.6rem] text-ink-ghost">
              {record.verification_mode === "SOURCE_VERIFIED"
                ? "Source-verified"
                : "Knowledge-based"}
            </span>
          </div>
        </div>

        {/* Embed code (standalone only) */}
        {isStandalone && (
          <div className="mt-6 rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-ink">
              <Code2 size={14} />
              Embed this verification
            </h2>
            <p className="mb-3 font-mono text-xs text-ink-dim">
              Paste this HTML to embed the verification card on any website.
            </p>
            <div className="flex items-stretch gap-2">
              <code className="flex-1 overflow-hidden text-ellipsis rounded-md bg-void px-3 py-2.5 font-mono text-[0.65rem] text-ink-dim">
                {embedCode}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-line px-3 py-2 font-mono text-xs text-ink transition-colors hover:border-signal/40"
              >
                {copied ? (
                  <Check size={13} className="text-signal" />
                ) : (
                  <Copy size={13} />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <Link
              to={`/result/${record.id}`}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-signal/30 bg-signal-dim px-4 py-2.5 font-display text-xs font-semibold text-signal transition-colors hover:border-signal/50"
            >
              View full verification
              <ExternalLink size={11} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
