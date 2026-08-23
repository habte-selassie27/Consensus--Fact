import { VERDICT_COLORS } from "@/components/verdictStyles";
import type { FactCheckRecord } from "./types";

const CARD_W = 1200;
const CARD_H = 630;
const BG = "#090C10";
const SURFACE = "#111820";
const INK = "#E8EDF2";
const INK_DIM = "#7A8899";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] =
      last.length > 3 ? `${last.slice(0, last.length - 3).trimEnd()}...` : `${last}...`;
  }
  return lines;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function generateVerdictCard(record: FactCheckRecord): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  try {
    await document.fonts.ready;
  } catch {
    // proceed with fallback fonts
  }

  const accent = VERDICT_COLORS[record.verdict];

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Accent glow top-left
  const glow = ctx.createRadialGradient(180, 120, 20, 180, 120, 500);
  glow.addColorStop(0, hexToRgba(accent, 0.14));
  glow.addColorStop(1, hexToRgba(accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Border
  ctx.strokeStyle = "#1E2A38";
  ctx.lineWidth = 2;
  drawRoundRect(ctx, 24, 24, CARD_W - 48, CARD_H - 48, 20);
  ctx.stroke();

  // Accent top bar inside card frame
  ctx.fillStyle = accent;
  drawRoundRect(ctx, 72, 72, 88, 6, 3);
  ctx.fill();

  // Header brand
  ctx.textBaseline = "alphabetic";
  ctx.font = '600 26px "Space Grotesk", sans-serif';
  ctx.fillStyle = accent;
  ctx.fillText("TRUTH", 72, 132);
  const truthW = ctx.measureText("TRUTH").width;
  ctx.fillStyle = INK;
  ctx.fillText("LOCK", 72 + truthW, 132);

  ctx.font = '400 20px "JetBrains Mono", monospace';
  ctx.fillStyle = INK_DIM;
  ctx.fillText("on-chain fact verification", 72 + truthW + 96 + 12, 131);

  // Verdict badge
  const badgeLabel = record.verdict;
  ctx.font = '700 34px "Space Grotesk", sans-serif';
  const badgeTextW = ctx.measureText(badgeLabel).width;
  const badgeX = 72;
  const badgeY = 176;
  const badgeW = badgeTextW + 56;
  const badgeH = 64;

  ctx.fillStyle = hexToRgba(accent, 0.08);
  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillText(badgeLabel, badgeX + 28, badgeY + 45);

  // Claim text
  ctx.font = '500 44px "Space Grotesk", sans-serif';
  ctx.fillStyle = INK;
  const claimLines = wrapText(ctx, `"${record.claim}"`, CARD_W - 420, 4);
  let claimY = 330;
  for (const line of claimLines) {
    ctx.fillText(line, 72, claimY);
    claimY += 58;
  }

  // Confidence arc (bottom-right area)
  const cx = CARD_W - 200;
  const cy = 300;
  const radius = 110;
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const progress = Math.min(100, Math.max(0, record.confidence)) / 100;

  ctx.lineCap = "round";
  ctx.lineWidth = 18;
  ctx.strokeStyle = SURFACE;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.stroke();

  const arcGradient = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
  arcGradient.addColorStop(0, accent);
  arcGradient.addColorStop(1, hexToRgba(accent, 0.55));
  ctx.strokeStyle = arcGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, startAngle + (endAngle - startAngle) * progress);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = '700 52px "Space Grotesk", sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText(`${record.confidence}%`, cx, cy + 12);
  ctx.font = '500 17px "Space Grotesk", sans-serif';
  ctx.fillStyle = INK_DIM;
  ctx.fillText("CONFIDENCE", cx, cy + 42);
  ctx.textAlign = "left";

  // Footer
  ctx.font = '400 20px "JetBrains Mono", monospace';
  ctx.fillStyle = INK_DIM;
  ctx.fillText(
    `Verified on GenLayer · Check #${record.id.slice(0, 12)}`,
    72,
    CARD_H - 76
  );
  ctx.fillStyle = hexToRgba(accent, 0.9);
  const footerLabel = "truthlock — consensus of validators, not opinions";
  ctx.fillText(footerLabel, 72, CARD_H - 46);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to encode card image"));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildShareText(record: FactCheckRecord, url: string): string {
  const claim = record.claim.length > 140 ? `${record.claim.slice(0, 137)}...` : record.claim;
  return `"${claim}"\n\nVerdict: ${record.verdict} (${record.confidence}% confidence)\nVerified on-chain with GenLayer\n${url}`;
}
