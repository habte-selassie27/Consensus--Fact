import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Brain,
  Globe,
  Scale,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import VerdictDonut from "@/components/VerdictDonut";
import { verdictBadgeClass, VERDICT_DOT_CLASSES } from "@/components/verdictStyles";
import { getRecentChecks, getStats } from "@/lib/genlayer";
import { getCredibility } from "@/lib/sourceCredibility";
import { verificationId } from "@/lib/verification";
import type { FactCheckRecord } from "@/lib/types";

const POLL_INTERVAL_MS = 8_000;

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface DomainStats {
  domain: string;
  count: number;
  avgConfidence: number;
  score: number;
}

function computeDomainReliability(checks: FactCheckRecord[]): DomainStats[] {
  const map = new Map<string, { total: number; confSum: number; url: string }>();
  for (const r of checks) {
    const urls = [r.source_url, ...r.sources_checked.filter((s) => s !== r.source_url)].filter(Boolean);
    for (const url of urls) {
      const domain = domainFromUrl(url);
      const existing = map.get(domain) ?? { total: 0, confSum: 0, url };
      existing.total += 1;
      existing.confSum += r.confidence;
      map.set(domain, existing);
    }
  }
  return Array.from(map.entries())
    .map(([domain, data]) => ({
      domain,
      count: data.total,
      avgConfidence: Math.round(data.confSum / data.total),
      score: getCredibility(data.url).score,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function getTrending(recent: FactCheckRecord[]) {
  if (recent.length === 0) return { mostVerified: null, mostDisputed: null, mostRecent: null };

  const sorted = [...recent].sort((a, b) => b.timestamp - a.timestamp);
  const mostRecent = sorted[0];

  const mostVerified = [...recent]
    .filter((r) => r.verdict === "TRUE")
    .sort((a, b) => b.confidence - a.confidence)[0] ?? null;

  const mostDisputed = [...recent]
    .filter((r) => r.verdict === "MISLEADING" || r.verdict === "FALSE")
    .sort((a, b) => a.confidence - b.confidence)[0] ?? null;

  return { mostVerified, mostDisputed, mostRecent };
}

export default function Stats() {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  });

  const recentQuery = useQuery({
    queryKey: ["recent-checks", 50],
    queryFn: () => getRecentChecks(50),
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  });

  const stats = statsQuery.data;
  const recent = recentQuery.data ?? [];
  const total = stats?.total_checks ?? 0;

  const domainReliability = computeDomainReliability(recent);
  const trending = getTrending(recent);

  const trueCount = stats?.verdicts_by_type?.TRUE ?? 0;
  const falseCount = stats?.verdicts_by_type?.FALSE ?? 0;
  const misleadingCount = stats?.verdicts_by_type?.MISLEADING ?? 0;
  const unverifiableCount = stats?.verdicts_by_type?.UNVERIFIABLE ?? 0;
  const sourceVerified = stats?.modes?.SOURCE_VERIFIED ?? 0;
  const knowledgeBased = stats?.modes?.KNOWLEDGE_BASED ?? 0;

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
            TruthLock <span className="text-gradient-signal">network</span>
          </h1>
          <p className="mt-3 max-w-lg text-ink-dim">
            Every verdict recorded on-chain — updated live as validators reach
            consensus.
          </p>
        </motion.div>
      </section>

      {/* Big number cards */}
      <section className="grid gap-4 sm:grid-cols-4" aria-label="Key stats">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay(0.1), duration: 0.45 }}
          className="card"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal">
            <Scale size={17} />
          </div>
          <AnimatedCounter
            value={total}
            className="font-display text-4xl font-bold tracking-tight"
          />
          <p className="label mt-1">Verifications</p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay(0.16), duration: 0.45 }}
          className="card"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal">
            <CheckCircle2 size={17} />
          </div>
          <AnimatedCounter
            value={trueCount}
            className="font-display text-4xl font-bold tracking-tight text-signal"
          />
          <p className="label mt-1">TRUE claims</p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay(0.22), duration: 0.45 }}
          className="card"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10 text-danger">
            <AlertTriangle size={17} />
          </div>
          <AnimatedCounter
            value={falseCount + misleadingCount}
            className="font-display text-4xl font-bold tracking-tight text-danger"
          />
          <p className="label mt-1">FALSE / MISLEADING</p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay(0.28), duration: 0.45 }}
          className="card"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-pending/10 text-pending">
            <Brain size={17} />
          </div>
          <AnimatedCounter
            value={knowledgeBased}
            className="font-display text-4xl font-bold tracking-tight"
          />
          <p className="label mt-1">Knowledge-based</p>
        </motion.div>
      </section>

      {/* Verdict distribution + Mode split */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <motion.section
          aria-label="Verdict distribution"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay(0.34), duration: 0.5 }}
          className="card"
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

        <motion.section
          aria-label="Verification modes"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay(0.4), duration: 0.5 }}
          className="card"
        >
          <h2 className="label mb-4">Verification modes</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-signal-border bg-signal-dim px-4 py-4">
              <p className="flex items-center gap-1.5 font-mono text-[0.6rem] font-semibold tracking-wider text-signal">
                <Globe size={11} /> SOURCE-VERIFIED
              </p>
              <p className="mt-1.5 font-display text-3xl font-bold">
                {sourceVerified}
                <span className="ml-2 font-mono text-sm font-normal text-ink-dim">
                  {total > 0
                    ? `${Math.round((sourceVerified / total) * 100)}%`
                    : ""}
                </span>
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-void">
                <div
                  className="h-full rounded-full bg-signal transition-all"
                  style={{ width: `${total > 0 ? (sourceVerified / total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-pending/30 bg-pending-dim px-4 py-4">
              <p className="flex items-center gap-1.5 font-mono text-[0.6rem] font-semibold tracking-wider text-pending">
                <Brain size={11} /> KNOWLEDGE-BASED
              </p>
              <p className="mt-1.5 font-display text-3xl font-bold">
                {knowledgeBased}
                <span className="ml-2 font-mono text-sm font-normal text-ink-dim">
                  {total > 0
                    ? `${Math.round((knowledgeBased / total) * 100)}%`
                    : ""}
                </span>
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-void">
                <div
                  className="h-full rounded-full bg-pending transition-all"
                  style={{ width: `${total > 0 ? (knowledgeBased / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Source reliability + Trending */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Source reliability map */}
        {domainReliability.length > 0 && (
          <motion.section
            aria-label="Source reliability"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay(0.46), duration: 0.5 }}
            className="card"
          >
            <div className="mb-4 flex items-center gap-2">
              <Globe size={14} className="text-signal" />
              <h2 className="label">Source reliability</h2>
            </div>
            <p className="mb-4 font-mono text-[0.6rem] text-ink-ghost">
              Domains analyzed across recent verifications
            </p>
            <div className="space-y-3">
              {domainReliability.map((d, i) => (
                <motion.div
                  key={d.domain}
                  initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay(500 + i * 60), duration: 0.25 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-28 truncate font-mono text-[0.65rem] text-ink-dim">
                    {d.domain}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-void">
                      <div
                        className="h-full rounded-full bg-signal transition-all"
                        style={{ width: `${d.score}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right font-mono text-[0.6rem] text-ink-ghost">
                    {d.count}x
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Trending claims */}
        <motion.section
          aria-label="Trending"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay(0.52), duration: 0.5 }}
          className="card"
        >
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-signal" />
            <h2 className="label">Trending verifications</h2>
          </div>

          <div className="space-y-4">
            {trending.mostVerified && (
              <TrendingCard
                label="Most verified"
                record={trending.mostVerified}
              />
            )}
            {trending.mostDisputed && (
              <TrendingCard
                label="Most disputed"
                record={trending.mostDisputed}
              />
            )}
            {trending.mostRecent && (
              <TrendingCard
                label="Most recent"
                record={trending.mostRecent}
              />
            )}
          </div>
        </motion.section>
      </div>

      {/* Live feed */}
      <motion.section
        aria-label="Live verdict feed"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay(0.58), duration: 0.5 }}
        className="mt-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-ring" />
          <h2 className="label">Live verdict feed</h2>
        </div>

        {recent.length === 0 ? (
          <div className="card-sm py-8 text-center">
            <p className="text-sm text-ink-dim">Waiting for the first verdict...</p>
            <Link
              to="/"
              className="mt-2 inline-block font-mono text-xs text-signal hover:underline"
            >
              Submit a claim →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.slice(0, 10).map((record, i) => (
              <motion.li
                key={record.id}
                layout
                initial={
                  reduceMotion || i > 0 ? false : { opacity: 0, x: 60 }
                }
                animate={{ opacity: 1, x: 0 }}
              >
                <Link
                  to={`/result/${record.id}`}
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
                  <span className="hidden shrink-0 font-mono text-[0.6rem] tracking-widest text-ink-ghost sm:inline">
                    {verificationId(record.id)}
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

function TrendingCard({
  label,
  record,
}: {
  label: string;
  record: FactCheckRecord;
}) {
  const vid = verificationId(record.id);
  const dotClass = VERDICT_DOT_CLASSES[record.verdict] ?? "bg-mute";

  return (
    <Link
      to={`/result/${record.id}`}
      className="block rounded-lg border border-line bg-surface-2 p-4 transition-colors hover:border-signal/30"
    >
      <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">
        {label}
      </p>
      <p className="truncate text-sm text-ink-dim">
        &ldquo;{record.claim}&rdquo;
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className="font-display text-xs font-bold text-ink">
          {record.verdict}
        </span>
        <span className="font-mono text-[0.6rem] text-ink-ghost">
          {record.confidence}%
        </span>
        <span className="ml-auto font-mono text-[0.55rem] tracking-widest text-ink-ghost">
          {vid}
        </span>
      </div>
    </Link>
  );
}
