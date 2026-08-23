import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Trophy, Flame } from "lucide-react";
import { verdictBadgeClass } from "@/components/verdictStyles";
import { getRecentChecks } from "@/lib/genlayer";
import type { FactCheckRecord } from "@/lib/types";

function normalize(claim: string): string {
  return claim.trim().toLowerCase().replace(/\s+/g, " ");
}

interface Group {
  key: string;
  claim: string;
  count: number;
  latest: FactCheckRecord;
  verdicts: Record<string, number>;
}

export default function Leaderboard() {
  const reduceMotion = useReducedMotion();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => getRecentChecks(50),
    refetchInterval: 30_000,
    retry: false,
  });

  const groups: Group[] = (() => {
    const records = data ?? [];
    const map = new Map<string, Group>();
    for (const r of records) {
      const key = normalize(r.claim);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          claim: r.claim,
          count: 1,
          latest: r,
          verdicts: { [r.verdict]: 1 },
        });
      } else {
        existing.count += 1;
        existing.verdicts[r.verdict] = (existing.verdicts[r.verdict] ?? 0) + 1;
        if (r.timestamp > existing.latest.timestamp) existing.latest = r;
      }
    }
    return [...map.values()]
      .filter((g) => g.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  })();

  return (
    <div className="mx-auto max-w-page px-5 pb-24">
      <section className="pt-16 pb-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-warn/20 bg-warn/5 px-4 py-1.5">
            <Trophy size={12} className="text-warn" />
            <span className="font-mono text-xs text-warn">Community contested</span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Leader<span className="text-gradient-signal">board</span>
          </h1>
          <p className="mt-3 max-w-lg text-ink-dim">
            The most re-checked claims on TruthLock — ranked by how many times
            the community has put them to the test. Same claim text, multiple
            independent verifications.
          </p>
        </motion.div>
      </section>

      {isLoading && (
        <div className="card animate-pulse">
          <div className="h-6 w-48 rounded bg-line" />
          <div className="mt-4 h-24 rounded bg-line/50" />
        </div>
      )}

      {isError && (
        <p className="rounded-lg border border-line bg-surface px-4 py-3 font-mono text-xs text-danger">
          Could not load leaderboard. Verify contract configuration.
        </p>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <div className="card-sm py-10 text-center">
          <Flame size={20} className="mx-auto text-ink-ghost" />
          <p className="mt-3 text-sm text-ink-dim">No contested claims yet.</p>
          <p className="mt-1 font-mono text-xs text-ink-ghost">
            Re-submit the same claim with a different source to create a contest.
          </p>
        </div>
      )}

      {groups.length > 0 && (
        <ol className="space-y-3">
          {groups.map((group, i) => (
            <motion.li
              key={group.key}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <Link
                to={`/result/${group.latest.id}`}
                className="card group flex items-start gap-4 p-5 transition-colors hover:border-ink-ghost"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-line font-display text-sm font-bold text-ink">
                  #{i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink transition-colors group-hover:text-signal">
                    &ldquo;{group.claim}&rdquo;
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[0.65rem] text-ink-ghost">
                    <span className="flex items-center gap-1">
                      <Flame size={11} className="text-warn" />
                      {group.count} checks
                    </span>
                    <span>·</span>
                    <span
                      className={`rounded border px-1.5 py-0.5 font-display text-[0.55rem] font-bold tracking-widest ${verdictBadgeClass(group.latest.verdict)}`}
                    >
                      {group.latest.verdict}
                    </span>
                    <span className="hidden sm:inline">
                      {group.latest.confidence}% ·
                      {Object.entries(group.verdicts)
                        .map(([v, c]) => `${v}×${c}`)
                        .join(" ")}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}
