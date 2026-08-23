import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, ArrowRight, Radar } from "lucide-react";
import { getRecentChecks } from "@/lib/genlayer";
import { verdictBadgeClass } from "@/components/verdictStyles";
import { SkeletonList } from "@/components/Skeleton";

const POLL_INTERVAL_MS = 10_000;

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface RecentChecksTickerProps {
  limit?: number;
}

export default function RecentChecksTicker({
  limit = 5,
}: RecentChecksTickerProps) {
  const { data, isLoading } = useQuery({
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
        <div className="ml-2 h-px flex-1 bg-line" />
      </div>

      {isLoading && <SkeletonList count={3} />}

      {!isLoading && records.length > 0 && (
        <ul className="space-y-1">
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
                  to={`/result/${record.id}`}
                  className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all hover:border-line hover:bg-surface-2"
                >
                  <span
                    className={`w-20 shrink-0 rounded border px-1.5 py-0.5 text-center font-display text-[0.55rem] font-bold tracking-widest ${verdictBadgeClass(
                      record.verdict
                    )}`}
                  >
                    {record.verdict}
                  </span>
                  <span className="flex-1 truncate text-sm text-ink-dim transition-colors group-hover:text-ink">
                    &ldquo;{record.claim}&rdquo;
                  </span>
                  <span className="shrink-0 font-mono text-xs font-semibold text-ink">
                    {record.confidence}%
                  </span>
                  <span className="hidden shrink-0 font-mono text-[0.65rem] text-ink-ghost sm:inline">
                    {timeAgo(record.timestamp)}
                  </span>
                  <ArrowRight
                    size={12}
                    className="shrink-0 text-ink-ghost transition-all group-hover:translate-x-0.5 group-hover:text-signal"
                  />
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {!isLoading && records.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-line/60">
            <Radar size={18} className="text-ink-ghost" />
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
