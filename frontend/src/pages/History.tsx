import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import HistoryTable, {
  type SortDir,
  type SortField,
} from "@/components/HistoryTable";
import ConfidenceHeatmap from "@/components/ConfidenceHeatmap";
import { EmptyHistoryState } from "@/components/States";
import { SkeletonList } from "@/components/Skeleton";
import { CATEGORIES, getStoredCategory } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import { getRecentChecks } from "@/lib/genlayer";
import { VERDICTS, type Verdict } from "@/lib/types";

type VerdictFilter = "ALL" | Verdict;

const FILTERS: VerdictFilter[] = ["ALL", ...VERDICTS];

const VERDICT_DOT_COLORS: Record<Verdict, string> = {
  TRUE: "bg-signal",
  FALSE: "bg-danger",
  MISLEADING: "bg-warn",
  UNVERIFIABLE: "bg-mute",
};

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

      {isLoading && <div className="mt-8"><SkeletonList count={4} /></div>}

      {!isError && !isLoading && records.length > 0 && (
        <>
          {/* Search */}
          <div className="relative mt-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-ghost" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search claims..."
              aria-label="Search claims"
              className="!pl-10"
            />
          </div>

          {/* Verdict filter pills */}
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by verdict">
            {FILTERS.map((option) => {
              const count = option === "ALL"
                ? records.length
                : records.filter((r) => r.verdict === option).length;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  aria-pressed={filter === option}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs tracking-wide transition-colors ${
                    filter === option
                      ? "border-signal bg-signal/10 text-signal"
                      : "border-line text-ink-dim hover:border-line-bright hover:text-ink"
                  }`}
                >
                  {option !== "ALL" && (
                    <span className={`h-1.5 w-1.5 rounded-full ${VERDICT_DOT_COLORS[option as Verdict]}`} />
                  )}
                  {option}
                  <span className="text-[0.6rem] opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Category filter pills */}
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {(["ALL", ...CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat as Category | "ALL")}
                aria-pressed={categoryFilter === cat}
                className={`rounded-full border px-3 py-1.5 font-mono text-xs tracking-wide transition-colors ${
                  categoryFilter === cat
                    ? "border-pending bg-pending/10 text-pending"
                    : "border-line text-ink-dim hover:border-line-bright hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Heatmap */}
          <div className="mt-6">
            <ConfidenceHeatmap records={records} />
          </div>

          {/* Table */}
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
