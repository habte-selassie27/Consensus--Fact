"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getRecentChecks } from "@/lib/genlayer";
import { verdictBadgeClass } from "@/components/verdictStyles";

const POLL_INTERVAL_MS = 10_000;

interface RecentChecksTickerProps {
  limit?: number;
}

export default function RecentChecksTicker({
  limit = 5,
}: RecentChecksTickerProps) {
  const { data } = useQuery({
    queryKey: ["recent-checks", limit],
    queryFn: () => getRecentChecks(limit),
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  });

  const records = data ?? [];

  return (
    <section aria-label="Recent checks" className="mt-12">
      <h2 className="label mb-3">Recent Checks</h2>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {records.map((record, i) => (
            <motion.li
              key={record.id}
              layout
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                href={`/result/${record.id}`}
                className="card-sm flex items-center gap-4 transition-colors hover:border-ink-ghost"
              >
                <span
                  className={`w-24 shrink-0 rounded border px-2 py-1 text-center font-display text-[0.6rem] font-bold tracking-widest ${verdictBadgeClass(
                    record.verdict
                  )}`}
                >
                  {record.verdict}
                </span>
                <span className="flex-1 truncate text-sm text-ink-dim">
                  &ldquo;{record.claim}&rdquo;
                </span>
                <span className="shrink-0 font-mono text-xs text-ink-ghost">
                  {record.confidence}%
                </span>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {records.length === 0 && (
        <div className="card-sm flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-ink-dim">No checks recorded yet.</p>
          <p className="mt-1 font-mono text-xs text-ink-ghost">
            Be the first to verify a claim.
          </p>
        </div>
      )}
    </section>
  );
}
