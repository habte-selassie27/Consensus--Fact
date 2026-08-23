"use client";

import { useEffect, useState } from "react";

interface ConfidenceRingProps {
  confidence: number;
  delay?: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function tierText(confidence: number): string {
  if (confidence <= 30) return "Low";
  if (confidence <= 60) return "Moderate";
  if (confidence <= 85) return "High";
  return "Very High";
}

function ringColor(confidence: number): string {
  if (confidence <= 50) {
    return interpolate("#FF4444", "#F5A623", confidence / 50);
  }
  return interpolate("#F5A623", "#00E5A0", (confidence - 50) / 50);
}

function interpolate(from: string, to: string, t: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const r = clamp(a.r + (b.r - a.r) * t);
  const g = clamp(a.g + (b.g - a.g) * t);
  const bl = clamp(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export default function ConfidenceRing({
  confidence,
  delay = 0,
}: ConfidenceRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(confidence)));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setProgress(clamped), delay);
    return () => clearTimeout(timeout);
  }, [clamped, delay]);

  const offset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        role="img"
        aria-label={`Confidence: ${clamped}%`}
      >
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="#1E2530"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke={ringColor(clamped)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 800ms ease-out" }}
        />
        <text
          x="60"
          y="66"
          textAnchor="middle"
          className="fill-ink font-mono"
          fontSize="24"
          fontWeight="500"
        >
          {clamped}%
        </text>
      </svg>
      <span className="text-xs text-ink-dim">{tierText(clamped)}</span>
    </div>
  );
}
