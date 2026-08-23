"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getRecentChecks } from "@/lib/genlayer";
import { verdictBadgeClass } from "@/components/verdictStyles";
import { Clock, ArrowRight, Search } from "lucide-react";

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
      <div className="mb-4 flex items-center gap-2">
        <Clock size={14} className="text-ink-ghost" />
        <h2 className="label">Recent Checks</h2>
      </div>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {records.map((record, i) => (
            <motion.li
              key={record.id}
              layout
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                href={`/result/${record.id}`}
                className="glass group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all hover:border-line hover:bg-surface-raised/50"
              >
                <span
                  className={`w-24 shrink-0 rounded-md border px-2 py-1 text-center font-display text-[0.6rem] font-bold tracking-widest ${verdictBadgeClass(
                    record.verdict
                  )}`}
                >
                  {record.verdict}
                </span>
                <span className="flex-1 truncate text-sm text-ink-dim transition-colors group-hover:text-ink">
                  &ldquo;{record.claim}&rdquo;
                </span>
                <span className="shrink-0 font-mono text-xs text-ink-ghost">
                  {record.confidence}%
                </span>
                <ArrowRight
                  size={14}
                  className="shrink-0 text-ink-ghost transition-all group-hover:translate-x-0.5 group-hover:text-signal"
                />
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {records.length === 0 && (
        <div className="glass flex flex-col items-center justify-center rounded-xl px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-line/60">
            <Search size={18} className="text-ink-ghost" />
          </div>
          <p className="text-sm text-ink-dim">No checks recorded yet.</p>
          <p className="mt-1 font-mono text-xs text-ink-ghost">
            Be the first to verify a claim.
          </p>
        </div>
      )}
    </section>
  );
}
