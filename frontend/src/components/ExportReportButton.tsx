"use client";

import { FileDown } from "lucide-react";
import type { FactCheckRecord } from "@/lib/types";
import { downloadVerdictPdf } from "@/lib/verdictPdf";

interface ExportReportButtonProps {
  record: FactCheckRecord;
}

export default function ExportReportButton({ record }: ExportReportButtonProps) {
  return (
    <button
      type="button"
      onClick={() => downloadVerdictPdf(record)}
      aria-label="Export verdict report as PDF"
      className="flex items-center justify-center gap-2 rounded-md border border-line px-4 py-3.5 font-display text-sm font-semibold tracking-wide text-ink transition-colors hover:border-signal/40"
    >
      <FileDown size={15} />
      Export report
    </button>
  );
}
