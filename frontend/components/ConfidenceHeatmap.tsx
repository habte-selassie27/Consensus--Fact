"use client";

import { VERDICT_COLORS } from "@/components/verdictStyles";
import type { FactCheckRecord, Verdict } from "@/lib/types";

interface HeatmapProps {
  records: FactCheckRecord[];
}

const ORDER: Verdict[] = ["TRUE", "FALSE", "MISLEADING", "UNVERIFIABLE"];

function dateKey(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ConfidenceHeatmap({ records }: HeatmapProps) {
  if (records.length === 0) return null;

  const byDate: Record<string, Partial<Record<Verdict, number>>> = {};
  for (const r of records) {
    const key = dateKey(r.timestamp);
    byDate[key] ??= {};
    byDate[key][r.verdict] = (byDate[key][r.verdict] ?? 0) + 1;
  }

  const dates = Object.keys(byDate).sort().reverse().slice(0, 14);
  const maxCount = Math.max(
    ...dates.flatMap((d) => ORDER.map((v) => byDate[d][v] ?? 0)),
    1
  );

  return (
    <div className="card overflow-x-auto">
      <h3 className="label mb-4">Misinformation pattern — last 14 days</h3>

      <div className="min-w-[520px]">
        {/* Header */}
        <div className="grid grid-cols-[110px_repeat(4,1fr)] gap-1.5">
          <span className="font-mono text-[0.6rem] text-ink-ghost" />
          {ORDER.map((v) => (
            <span
              key={v}
              className="text-center font-display text-[0.6rem] font-bold tracking-widest"
              style={{ color: VERDICT_COLORS[v] }}
            >
              {v}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="mt-2 space-y-1.5">
          {dates.map((date) => (
            <div key={date} className="grid grid-cols-[110px_repeat(4,1fr)] gap-1.5">
              <span className="self-center font-mono text-xs text-ink-dim">
                {date}
              </span>
              {ORDER.map((verdict) => {
                const count = byDate[date][verdict] ?? 0;
                const alpha = count === 0 ? 0.04 : 0.18 + (count / maxCount) * 0.72;
                return (
                  <span
                    key={verdict}
                    className="flex items-center justify-center rounded-md border px-2 py-2 font-mono text-xs font-semibold"
                    style={{
                      backgroundColor: hexWithAlpha(
                        VERDICT_COLORS[verdict],
                        alpha
                      ),
                      borderColor:
                        count === 0 ? "#1E2A38" : hexWithAlpha(VERDICT_COLORS[verdict], 0.4),
                      color: count === 0 ? "#3D4A5C" : "#E8EDF2",
                    }}
                    title={`${count} ${verdict} on ${date}`}
                  >
                    {count}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <p className="mt-3 font-mono text-[0.6rem] text-ink-ghost">
          Darker cell → more verdicts that day. Verdict intensity at a glance.
        </p>
      </div>
    </div>
  );
}
