"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, Scale, Timer } from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import VerdictDonut from "@/components/VerdictDonut";
import { verdictBadgeClass, VERDICT_DOT_CLASSES } from "@/components/verdictStyles";
import { getRecentChecks, getStats } from "@/lib/genlayer";

const POLL_INTERVAL_MS = 8_000;

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function StatsPage() {
  const reduceMotion = useReducedMotion();

  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  });

  const recentQuery = useQuery({
    queryKey: ["recent-checks", 10],
    queryFn: () => getRecentChecks(10),
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  });

  const stats = statsQuery.data;
  const recent = recentQuery.data ?? [];
  const total = stats?.total_checks ?? 0;

  const lastActive = stats?.most_recent_timestamp ?? 0;
  const secondsSince = lastActive > 0 ? Math.floor(Date.now() / 1000) - lastActive : null;

  return (
    <div className="mx-auto max-w-page px-5 pb-24">
      {/* Header */}
      <section className="pt-16 pb-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/5 px-4 py-1.5">
            <Activity size={12} className="text-signal" />
            <span className="font-mono text-xs text-signal">Live network stats</span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Protocol <span className="text-gradient-signal">pulse</span>
          </h1>
          <p className="mt-3 max-w-lg text-ink-dim">
            Every verdict recorded by the TruthLock contract — updated live as
            validators reach consensus.
          </p>
        </motion.div>
      </section>

      {/* Stat tiles */}
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Key stats">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="card"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal">
            <Scale size={17} />
          </div>
          <AnimatedCounter
            value={total}
            className="font-display text-4xl font-bold tracking-tight"
          />
          <p className="label mt-1">Total checks</p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          className="card"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-pending/10 text-pending">
            <Timer size={17} />
          </div>
          {secondsSince === null || secondsSince < 0 ? (
            <span className="font-display text-4xl font-bold tracking-tight">—</span>
          ) : (
            <span className="font-display text-4xl font-bold tracking-tight">
              {secondsSince < 60
                ? `${secondsSince}s`
                : `${Math.floor(secondsSince / 60)}m`}
            </span>
          )}
          <p className="label mt-1">Since last verdict</p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.45 }}
          className="card"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-warn/10 text-warn">
            <Activity size={17} />
          </div>
          <AnimatedCounter
            value={Object.keys(stats?.verdicts_by_type ?? {}).length}
            className="font-display text-4xl font-bold tracking-tight"
          />
          <p className="label mt-1">Verdict types seen</p>
        </motion.div>
      </section>

      {/* Donut */}
      <motion.section
        aria-label="Verdict distribution"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34, duration: 0.5 }}
        className="card mt-6"
      >
        <h2 className="label mb-6">Verdict distribution</h2>
        {statsQuery.isError ? (
          <p className="font-mono text-sm text-danger">
            Failed to load stats. Is the contract configured?
          </p>
        ) : (
          <VerdictDonut counts={stats?.verdicts_by_type ?? {}} total={total} />
        )}
      </motion.section>

      {/* Live feed */}
      <motion.section
        aria-label="Live verdict feed"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.5 }}
        className="mt-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-ring" />
          <h2 className="label">Live verdict feed</h2>
        </div>

        {recent.length === 0 ? (
          <div className="card-sm py-8 text-center">
            <p className="text-sm text-ink-dim">Waiting for the first verdict...</p>
            <Link href="/" className="mt-2 inline-block font-mono text-xs text-signal hover:underline">
              Submit a claim →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((record, i) => (
              <motion.li
                key={record.id}
                layout
                initial={
                  reduceMotion || i > 0 ? false : { opacity: 0, x: 60 }
                }
                animate={{ opacity: 1, x: 0 }}
              >
                <Link
                  href={`/result/${record.id}`}
                  className="card-sm group flex items-center gap-4 transition-colors hover:border-ink-ghost"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${VERDICT_DOT_CLASSES[record.verdict]}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`w-28 shrink-0 rounded border px-2 py-1 text-center font-display text-[0.6rem] font-bold tracking-widest ${verdictBadgeClass(record.verdict)}`}
                  >
                    {record.verdict}
                  </span>
                  <span className="flex-1 truncate text-sm text-ink-dim transition-colors group-hover:text-ink">
                    &ldquo;{record.claim}&rdquo;
                  </span>
                  <span className="hidden shrink-0 font-mono text-[0.65rem] text-ink-ghost sm:inline">
                    {formatTimestamp(record.timestamp)}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-ink-dim">
                    {record.confidence}%
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>
    </div>
  );
}
