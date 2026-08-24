import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Globe, Check, AlertTriangle, Minus } from "lucide-react";
import type { FactCheckRecord } from "@/lib/types";
import { getCredibility } from "@/lib/sourceCredibility";

interface SourceReliabilityDetailProps {
  records: FactCheckRecord[];
}

interface DomainAnalytics {
  domain: string;
  tier: string;
  score: number;
  usedCount: number;
  avgConfidence: number;
  trueRate: number;
  falseRate: number;
  misleadingRate: number;
  unverifiableRate: number;
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function computeDomainAnalytics(records: FactCheckRecord[]): DomainAnalytics[] {
  const map = new Map<
    string,
    {
      url: string;
      count: number;
      confSum: number;
      true: number;
      false: number;
      misleading: number;
      unverifiable: number;
    }
  >();

  for (const r of records) {
    const urls = [
      r.source_url,
      ...r.sources_checked.filter((s) => s !== r.source_url),
    ].filter(Boolean);

    for (const url of urls) {
      const domain = domainFromUrl(url);
      const existing = map.get(domain) ?? {
        url,
        count: 0,
        confSum: 0,
        true: 0,
        false: 0,
        misleading: 0,
        unverifiable: 0,
      };
      existing.count += 1;
      existing.confSum += r.confidence;
      if (r.verdict === "TRUE") existing.true += 1;
      else if (r.verdict === "FALSE") existing.false += 1;
      else if (r.verdict === "MISLEADING") existing.misleading += 1;
      else existing.unverifiable += 1;
      map.set(domain, existing);
    }
  }

  return Array.from(map.entries())
    .map(([domain, data]) => {
      const cred = getCredibility(data.url);
      return {
        domain,
        tier: cred.label,
        score: cred.score,
        usedCount: data.count,
        avgConfidence: Math.round(data.confSum / data.count),
        trueRate: Math.round((data.true / data.count) * 100),
        falseRate: Math.round((data.false / data.count) * 100),
        misleadingRate: Math.round((data.misleading / data.count) * 100),
        unverifiableRate: Math.round(
          (data.unverifiable / data.count) * 100
        ),
      };
    })
    .sort((a, b) => b.usedCount - a.usedCount)
    .slice(0, 12);
}

function tierDistribution(analytics: DomainAnalytics[]) {
  const tiers: Record<string, { count: number; avgScore: number }> = {};
  for (const d of analytics) {
    const existing = tiers[d.tier] ?? { count: 0, avgScore: 0 };
    existing.count += d.usedCount;
    existing.avgScore += d.score * d.usedCount;
    tiers[d.tier] = existing;
  }
  return Object.entries(tiers)
    .map(([tier, data]) => ({
      tier,
      count: data.count,
      avgScore: Math.round(data.avgScore / data.count),
    }))
    .sort((a, b) => b.count - a.count);
}

export default function SourceReliabilityDetail({
  records,
}: SourceReliabilityDetailProps) {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const analytics = useMemo(
    () => computeDomainAnalytics(records),
    [records]
  );
  const tiers = useMemo(() => tierDistribution(analytics), [analytics]);

  const tierColors: Record<string, string> = {
    Authoritative: "text-signal",
    Credible: "text-pending",
    Unknown: "text-ink-ghost",
    Unreliable: "text-danger",
  };

  const hasData = analytics.length > 0;
  const sourceVerifiedCount = records.filter(
    (r) => r.verification_mode === "SOURCE_VERIFIED"
  ).length;
  const knowledgeCount = records.filter(
    (r) => r.verification_mode === "KNOWLEDGE_BASED"
  ).length;

  return (
    <motion.section
      aria-label="Source reliability analytics"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(0.1), duration: 0.45 }}
      className="rounded-xl border border-line bg-surface p-6 shadow-card"
    >
      <div className="mb-5 flex items-center gap-2">
        <Globe size={14} className="text-signal" />
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Source reliability analytics
        </h2>
      </div>

      {/* Mode summary */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-2 px-3 py-3">
          <p className="font-mono text-[0.55rem] uppercase tracking-wider text-ink-ghost">
            Source-verified
          </p>
          <p className="mt-1 font-display text-xl font-bold text-signal">
            {sourceVerifiedCount}
          </p>
        </div>
        <div className="rounded-lg bg-surface-2 px-3 py-3">
          <p className="font-mono text-[0.55rem] uppercase tracking-wider text-ink-ghost">
            Knowledge-based
          </p>
          <p className="mt-1 font-display text-xl font-bold text-pending">
            {knowledgeCount}
          </p>
        </div>
      </div>

      {/* Tier distribution */}
      <div className="mb-6">
        <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">
          Quality tier distribution
        </p>
        {hasData ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiers.map((t, i) => (
              <motion.div
                key={t.tier}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay(200 + i * 80), duration: 0.3 }}
                className="rounded-lg bg-surface-2 px-3 py-3"
              >
                <p
                  className={`font-display text-xs font-semibold ${tierColors[t.tier] ?? "text-ink-ghost"}`}
                >
                  {t.tier}
                </p>
                <p className="mt-1 font-display text-xl font-bold text-ink">
                  {t.count}
                </p>
                <p className="mt-0.5 font-mono text-[0.55rem] text-ink-ghost">
                  Avg quality {t.avgScore}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-surface-2 px-4 py-6 text-center">
            <Globe size={20} className="mx-auto mb-2 text-ink-ghost" />
            <p className="font-mono text-xs text-ink-ghost">
              No source-verified checks yet. Submit a claim with a source URL to see domain analytics.
            </p>
          </div>
        )}
      </div>

      {/* Domain breakdown */}
      <div>
        <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-wider text-ink-ghost">
          Domain breakdown
        </p>
        {analytics.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <th className="px-3 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-ink-ghost">
                    Domain
                  </th>
                  <th className="px-3 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-ink-ghost">
                    Quality
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[0.55rem] uppercase tracking-wider text-ink-ghost">
                    Used
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[0.55rem] uppercase tracking-wider text-ink-ghost">
                    Avg conf
                  </th>
                  <th className="hidden px-3 py-2 text-right font-mono text-[0.55rem] uppercase tracking-wider text-ink-ghost sm:table-cell">
                    TRUE%
                  </th>
                  <th className="hidden px-3 py-2 text-right font-mono text-[0.55rem] uppercase tracking-wider text-ink-ghost sm:table-cell">
                    FALSE%
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-dim">
                {analytics.map((d, i) => (
                  <motion.tr
                    key={d.domain}
                    initial={reduceMotion ? false : { opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: delay(400 + i * 50),
                      duration: 0.2,
                    }}
                    className="transition-colors hover:bg-line-dim/30"
                  >
                    <td className="px-3 py-2 font-mono text-[0.65rem] text-ink">
                      {d.domain}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`font-mono text-[0.6rem] font-semibold ${tierColors[d.tier] ?? "text-ink-ghost"}`}
                      >
                        {d.tier} ({d.score})
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[0.65rem] text-ink-dim">
                      {d.usedCount}x
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[0.65rem] text-ink-dim">
                      {d.avgConfidence}%
                    </td>
                    <td className="hidden px-3 py-2 text-right font-mono text-[0.65rem] text-signal sm:table-cell">
                      {d.trueRate}%
                    </td>
                    <td className="hidden px-3 py-2 text-right font-mono text-[0.65rem] text-danger sm:table-cell">
                      {d.falseRate}%
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-surface-2 px-4 py-6 text-center">
            <p className="font-mono text-xs text-ink-ghost">
              Domain data will appear once source-verified checks are completed.
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 font-mono text-[0.6rem] text-ink-ghost">
        Quality scores reflect historical agreement with TruthLock verification
        outcomes, not objective truthfulness.
      </p>
    </motion.section>
  );
}
