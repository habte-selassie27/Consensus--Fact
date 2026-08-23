"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { verdictBadgeClass } from "@/components/verdictStyles";
import { getRecentChecks } from "@/lib/genlayer";

export default function ClaimOfTheDay() {
  const { data } = useQuery({
    queryKey: ["claim-of-the-day"],
    queryFn: () => getRecentChecks(20),
    refetchInterval: 60 * 60 * 1000, // hourly
    retry: false,
  });

  const records = data ?? [];
  const cutoff = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

  const winner = records
    .filter((r) => r.timestamp >= cutoff)
    .sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.timestamp - a.timestamp;
    })[0];

  if (!winner) return null;

  return (
    <section aria-label="Claim of the day" className="mb-8">
      <div className="mb-2 flex items-center gap-2">
        <Star size={13} className="text-warn" />
        <h2 className="label">Claim of the day</h2>
        <span className="font-mono text-[0.6rem] text-ink-ghost">
          highest confidence · last 24 h
        </span>
      </div>

      <Link
        href={`/result/${winner.id}`}
        className="card group flex items-start gap-4 border-warn/20 bg-warn/[0.04] p-5 transition-colors hover:border-warn/40"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink transition-colors group-hover:text-signal">
            &ldquo;{winner.claim}&rdquo;
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-dim">
            {winner.explanation}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`rounded border px-2 py-1 text-center font-display text-[0.6rem] font-bold tracking-widest ${verdictBadgeClass(winner.verdict)}`}
          >
            {winner.verdict}
          </span>
          <span className="font-mono text-xs font-semibold text-ink">
            {winner.confidence}%
          </span>
        </div>
      </Link>
    </section>
  );
}
