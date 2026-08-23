"use client";

import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { verdictBadgeClass, VERDICT_DOT_CLASSES } from "@/components/verdictStyles";
import type { FactCheckRecord } from "@/lib/types";

export type SortField = "timestamp" | "confidence";
export type SortDir = "asc" | "desc";

interface HistoryTableProps {
  records: FactCheckRecord[];
  sortField: SortField;
  sortDir: SortDir;
  onSortChange: (field: SortField) => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
  });
}

export default function HistoryTable({
  records,
  sortField,
  sortDir,
  onSortChange,
}: HistoryTableProps) {
  function headerButton(field: SortField, label: string) {
    const active = sortField === field;
    return (
      <button
        type="button"
        onClick={() => onSortChange(field)}
        className={`inline-flex items-center gap-1 text-[0.65rem] font-medium uppercase tracking-[0.08em] transition-colors ${
          active ? "text-signal" : "text-ink-dim hover:text-ink"
        }`}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <ArrowUpDown
          size={11}
          aria-hidden="true"
          className={active && sortDir === "asc" ? "rotate-180" : ""}
        />
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="px-4 py-3">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-ink-dim">
                Verdict
              </span>
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-ink-dim">
                Claim
              </span>
            </th>
            <th scope="col" className="px-4 py-3">
              {headerButton("confidence", "%")}
            </th>
            <th scope="col" className="px-4 py-3">
              {headerButton("timestamp", "Date")}
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-b border-line-dim transition-colors last:border-b-0 hover:bg-line-dim/30"
            >
              <td className="px-4 py-3">
                <Link href={`/result/${record.id}`} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`inline-block h-2 w-2 rounded-full ${
                      VERDICT_DOT_CLASSES[record.verdict]
                    }`}
                  />
                  <span
                    className={`font-mono text-xs font-bold tracking-wide ${verdictBadgeClass(
                      record.verdict
                    )}`}
                  >
                    {record.verdict.slice(0, 8)}
                  </span>
                </Link>
              </td>
              <td className="max-w-0 px-4 py-3">
                <Link href={`/result/${record.id}`}>
                  <span className="block truncate text-sm text-ink">
                    &ldquo;{record.claim}&rdquo;
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-ink-dim">
                {record.confidence}%
              </td>
              <td className="px-4 py-3 font-mono text-xs text-ink-dim">
                {formatDate(record.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
