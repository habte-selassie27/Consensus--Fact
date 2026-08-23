"use client";

import { motion, useReducedMotion } from "framer-motion";
import { VERDICT_COLORS } from "@/components/verdictStyles";
import type { Verdict } from "@/lib/types";

interface VerdictDonutProps {
  counts: Partial<Record<Verdict, number>>;
  total: number;
}

const ORDER: Verdict[] = ["TRUE", "FALSE", "MISLEADING", "UNVERIFIABLE"];
const SIZE = 240;
const STROKE = 28;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function VerdictDonut({ counts, total }: VerdictDonutProps) {
  const reduceMotion = useReducedMotion();
  const segments = ORDER.filter((v) => (counts[v] ?? 0) > 0).map((verdict) => ({
    verdict,
    count: counts[verdict] ?? 0,
    fraction: total > 0 ? (counts[verdict] ?? 0) / total : 0,
  }));

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label="Verdict distribution donut chart"
        className="-rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#161E28"
          strokeWidth={STROKE}
        />
        {segments.map(({ verdict, fraction }) => {
          const dash = fraction * CIRCUMFERENCE;
          const el = (
            <motion.circle
              key={verdict}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={VERDICT_COLORS[verdict]}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
              initial={reduceMotion ? false : { strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: -offset }}
              transition={{ duration: reduceMotion ? 0 : 1, ease: "easeOut", delay: 0.3 }}
            />
          );
          offset += dash;
          return el;
        })}
        {/* center label */}
        <text
          x={SIZE / 2}
          y={SIZE / 2 + 14}
          textAnchor="middle"
          transform={`rotate(90 ${SIZE / 2} ${SIZE / 2})`}
          style={{
            fill: "#E8EDF2",
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 700,
            fontSize: "40px",
          }}
        >
          {total}
        </text>
      </svg>

      <ul className="space-y-3">
        {ORDER.map((verdict) => (
          <li key={verdict} className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: VERDICT_COLORS[verdict] }}
            />
            <span className="w-28 font-display text-sm font-semibold tracking-wide text-ink">
              {verdict}
            </span>
            <span className="font-mono text-sm text-ink-dim">
              {counts[verdict] ?? 0}
            </span>
            <span className="font-mono text-xs text-ink-ghost">
              {total > 0
                ? `${Math.round(((counts[verdict] ?? 0) / total) * 100)}%`
                : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
