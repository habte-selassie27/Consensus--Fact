import type { Verdict } from "@/lib/types";

export const VERDICT_COLORS: Record<Verdict, string> = {
  TRUE: "#00E5A0",
  FALSE: "#FF4444",
  MISLEADING: "#F5A623",
  UNVERIFIABLE: "#4A5568",
};

export const VERDICT_GLOWS: Record<Verdict, string> = {
  TRUE: "rgba(0,229,160,0.2)",
  FALSE: "rgba(255,68,68,0.2)",
  MISLEADING: "rgba(245,166,35,0.2)",
  UNVERIFIABLE: "transparent",
};

export function verdictBadgeClass(verdict: Verdict): string {
  return `badge--${verdict.toLowerCase()}`;
}

export const VERDICT_DOT_CLASSES: Record<Verdict, string> = {
  TRUE: "bg-signal",
  FALSE: "bg-danger",
  MISLEADING: "bg-warn",
  UNVERIFIABLE: "bg-mute",
};
