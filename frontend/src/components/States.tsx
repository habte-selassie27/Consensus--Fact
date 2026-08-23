import { Link } from "react-router-dom";
import { FileSearch, Search, XCircle } from "lucide-react";

interface StateProps {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}

function StateShell({ icon, title, body, ctaLabel, ctaHref }: StateProps & { icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-6 py-14 text-center">
      {icon}
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-sm text-sm text-ink-dim">{body}</p>
      {ctaLabel && ctaHref && (
        <Link
          to={ctaHref}
          className="mt-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-signal transition-colors hover:border-signal/40"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

export function EmptyHistoryState() {
  return (
    <StateShell
      icon={<FileSearch size={48} className="text-ink-ghost" aria-hidden="true" />}
      title="No checks yet"
      body="Submit your first claim on the home page."
      ctaLabel="Check a claim →"
      ctaHref="/"
    />
  );
}

export function ClaimNotFoundState() {
  return (
    <StateShell
      icon={<Search size={48} className="text-ink-ghost" aria-hidden="true" />}
      title="Claim not found"
      body="This check ID doesn't exist on-chain. It may have been submitted on a different network."
      ctaLabel="← Back to history"
      ctaHref="/history"
    />
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-surface px-6 py-8">
      <XCircle size={24} className="text-danger" aria-hidden="true" />
      <h2 className="font-display text-lg font-semibold">Transaction failed</h2>
      <p className="max-w-xl break-all font-mono text-xs text-ink-dim">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-md border border-line px-4 py-2 text-sm font-medium text-signal transition-colors hover:border-signal/40"
        >
          Try again
        </button>
      )}
    </div>
  );
}
