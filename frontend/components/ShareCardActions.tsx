"use client";

import { useState } from "react";
import { Download, Share2, Loader2, Check } from "lucide-react";
import type { FactCheckRecord } from "@/lib/types";
import {
  buildShareText,
  downloadBlob,
  generateVerdictCard,
} from "@/lib/shareCard";

interface ShareCardActionsProps {
  record: FactCheckRecord;
}

type ActionState = "idle" | "generating" | "downloaded" | "shared" | "error";

export default function ShareCardActions({ record }: ShareCardActionsProps) {
  const [state, setState] = useState<ActionState>("idle");

  async function generate(): Promise<Blob> {
    setState("generating");
    try {
      const blob = await generateVerdictCard(record);
      setState("idle");
      return blob;
    } catch {
      setState("error");
      throw new Error("Card generation failed");
    }
  }

  async function handleDownload() {
    try {
      const blob = await generate();
      downloadBlob(blob, `truthlock-verdict-${record.id.slice(0, 8)}.png`);
      setState("downloaded");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // state already set to error in generate()
    }
  }

  async function handleShare() {
    const pageUrl = window.location.href;
    try {
      const blob = await generate();
      const file = new File([blob], `truthlock-verdict-${record.id.slice(0, 8)}.png`, {
        type: "image/png",
      });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: buildShareText(record, pageUrl),
          title: "TruthLock Verdict",
        });
        setState("shared");
      } else {
        downloadBlob(blob, `truthlock-verdict-${record.id.slice(0, 8)}.png`);
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareText(record, pageUrl))}`,
          "_blank",
          "noopener,noreferrer"
        );
        setState("shared");
      }
      setTimeout(() => setState("idle"), 2000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setState("idle");
        return;
      }
      setState("error");
    }
  }

  const shareLabel =
    state === "generating"
      ? "Generating..."
      : state === "shared"
        ? "Shared!"
        : state === "error"
          ? "Failed — retry"
          : "Share on X";

  const downloadLabel =
    state === "generating"
      ? "Generating..."
      : state === "downloaded"
        ? "Saved!"
        : "Download card";

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={handleDownload}
        disabled={state === "generating"}
        className="flex items-center justify-center gap-2 rounded-md border border-line px-4 py-3.5 font-display text-sm font-semibold tracking-wide text-ink transition-colors hover:border-signal/40 disabled:opacity-50 sm:flex-1"
      >
        {state === "generating" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : state === "downloaded" ? (
          <Check size={16} className="text-signal" />
        ) : (
          <Download size={16} />
        )}
        {downloadLabel}
      </button>

      <button
        type="button"
        onClick={handleShare}
        disabled={state === "generating"}
        className="btn-primary flex items-center justify-center gap-2 sm:flex-1"
      >
        {state === "generating" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : state === "shared" ? (
          <Check size={16} />
        ) : (
          <Share2 size={16} />
        )}
        {shareLabel}
      </button>
    </div>
  );
}
