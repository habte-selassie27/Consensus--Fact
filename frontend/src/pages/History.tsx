import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HistoryTable, {
  type SortDir,
  type SortField,
} from "@/components/HistoryTable";
import ConfidenceHeatmap from "@/components/ConfidenceHeatmap";
import { EmptyHistoryState } from "@/components/States";
import { CATEGORIES, getStoredCategory } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import { getRecentChecks } from "@/lib/genlayer";
import { VERDICTS, type Verdict } from "@/lib/types";

type VerdictFilter = "ALL" | Verdict;

const FILTERS: VerdictFilter[] = ["ALL", ...VERDICTS];

export default function History() {
  const [filter, setFilter] = useState<VerdictFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<Category | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data, isError, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => getRecentChecks(50),
    retry: false,
  });

  const records = data ?? [];

  const visibleRecords = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const byQuery = lowered
      ? records.filter((r) => r.claim.toLowerCase().includes(lowered))
      : records;
    const byVerdict =
      filter === "ALL"
        ? byQuery
        : byQuery.filter((record) => record.verdict === filter);
    const byCategory =
      categoryFilter === "ALL"
        ? byVerdict
        : byVerdict.filter(
            (r) => (getStoredCategory(r.id, r.claim) ?? "Other") === categoryFilter
          );
    return [...byCategory].sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortDir === "asc" ? diff : -diff;
    });
  }, [records, query, filter, categoryFilter, sortField, sortDir]);

  function handleSortChange(field: SortField) {
    if (field === sortField) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  return (
    <div className="mx-auto max-w-page px-5 pb-24 pt-12">
      <h1 className="font-display text-2xl font-semibold">On-Chain Fact-Check History</h1>
      <p className="mt-2 text-sm text-ink-dim">
        {isLoading
          ? "Loading on-chain checks..."
          : `${records.length} claim${records.length === 1 ? "" : "s"} verified. All results permanent and publicly verifiable.`}
      </p>

      {!isError && records.length > 0 && (
        <>
          <div className="mt-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search claims…"
              aria-label="Search claims"
              className="w-full rounded-lg border border-line bg-void px-4 py-2.5 font-mono text-sm text-ink placeholder:text-ink-ghost focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/10"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by verdict">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
                className={`rounded-sm border px-3 py-1.5 font-mono text-xs tracking-wide transition-colors ${
                  filter === option
                    ? "border-signal bg-signal/10 text-signal"
                    : "border-line text-ink-dim hover:border-line/60 hover:text-ink"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {(["ALL", ...CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat as Category | "ALL")}
                aria-pressed={categoryFilter === cat}
                className={`rounded-sm border px-3 py-1.5 font-mono text-xs tracking-wide transition-colors ${
                  categoryFilter === cat
                    ? "border-pending bg-pending/10 text-pending"
                    : "border-line text-ink-dim hover:border-line/60 hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <ConfidenceHeatmap records={records} />
          </div>

          <div className="mt-5">
            <HistoryTable
              records={visibleRecords}
              sortField={sortField}
              sortDir={sortDir}
              onSortChange={handleSortChange}
            />
          </div>
        </>
      )}

      {!isError && !isLoading && records.length === 0 && <div className="mt-8"><EmptyHistoryState /></div>}

      {isError && (
        <p className="mt-8 rounded-lg border border-line bg-surface px-4 py-3 font-mono text-xs text-danger">
          Could not reach the contract. Verify VITE_CONTRACT_ADDRESS and VITE_GENLAYER_RPC in .env.
        </p>
      )}
    </div>
  );
}
