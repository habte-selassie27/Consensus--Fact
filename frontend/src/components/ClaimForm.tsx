import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CATEGORIES, inferCategory } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import { getRecentChecks } from "@/lib/genlayer";
import { verdictBadgeClass } from "@/components/verdictStyles";

interface ClaimFormProps {
  onSubmit: (claim: string, url: string, category: Category) => void;
  isLoading: boolean;
}

const MIN_CLAIM_LENGTH = 10;
const MAX_CLAIM_LENGTH = 500;

export default function ClaimForm({ onSubmit, isLoading }: ClaimFormProps) {
  const [claim, setClaim] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (claim.trim().length >= 8) {
      const inferred = inferCategory(claim);
      if (category === "Other" && inferred !== "Other") setCategory(inferred);
    }
  }, [claim, category]);

  const claimValid =
    claim.trim().length >= MIN_CLAIM_LENGTH &&
    claim.length <= MAX_CLAIM_LENGTH;
  const urlValid = url.startsWith("https://") && url.length > "https://".length;
  const formValid = claimValid && urlValid;

  const { data: recent } = useQuery({
    queryKey: ["recent-claim-autocomplete"],
    queryFn: () => getRecentChecks(50),
    enabled: claim.trim().length >= 6,
    retry: false,
  });

  const suggestions = useMemo(() => {
    const q = claim.trim().toLowerCase();
    if (q.length < 6 || !recent) return [];
    return recent
      .filter((r) => r.claim.toLowerCase().includes(q) && r.claim.toLowerCase() !== q)
      .slice(0, 3);
  }, [claim, recent]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!formValid || isLoading) return;
    onSubmit(claim.trim(), url.trim(), category);
  }

  return (
    <form onSubmit={handleSubmit} className="card" noValidate>
      <div className="mb-5">
        <label htmlFor="claim" className="label mb-2 block">
          Claim
        </label>
        <textarea
          id="claim"
          rows={4}
          value={claim}
          maxLength={MAX_CLAIM_LENGTH}
          onChange={(event) => setClaim(event.target.value)}
          onBlur={() => setTouched(true)}
          placeholder='e.g. "The Great Wall of China is visible from space with the naked eye."'
          aria-invalid={touched && !claimValid}
          required
        />
        <div className="mt-2 flex justify-between font-mono text-xs">
          <span className="text-ink-ghost">
            {touched && !claimValid && claim.trim().length > 0 && (
              <span className="text-danger">Min {MIN_CLAIM_LENGTH} chars</span>
            )}
          </span>
          <span
            className={
              claim.length > MAX_CLAIM_LENGTH - 50
                ? "text-warn"
                : "text-ink-ghost"
            }
          >
            {claim.length}/{MAX_CLAIM_LENGTH}
          </span>
        </div>

        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 rounded-lg border border-pending/30 bg-pending/5 p-3"
            >
              <p className="mb-2 font-mono text-[0.65rem] font-semibold tracking-wide text-pending">
                Did someone already check this?
              </p>
              <ul className="space-y-2">
                {suggestions.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/result/${r.id}`}
                      className="flex items-center gap-2 rounded-md border border-line bg-void px-3 py-2 transition-colors hover:border-signal/40"
                    >
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 font-display text-[0.55rem] font-bold tracking-widest ${verdictBadgeClass(r.verdict)}`}
                      >
                        {r.verdict}
                      </span>
                      <span className="flex-1 truncate font-mono text-xs text-ink-dim">
                        &ldquo;{r.claim}&rdquo;
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-6">
        <label htmlFor="source-url" className="label mb-2 block">
          Source URL
        </label>
        <input
          id="source-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="https://..."
          aria-invalid={touched && !urlValid}
          required
        />
        {touched && !urlValid && url.length > 0 && (
          <p className="mt-2 text-xs text-danger">
            Must start with https://
          </p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="category" className="label mb-2 block">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="w-full rounded-[10px] border border-line bg-void px-3 py-3.5 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/10"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="mt-1.5 font-mono text-[0.65rem] text-ink-ghost">
          Auto-suggested from claim text — change if needed.
        </p>
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={!formValid || isLoading}
      >
        {isLoading ? "Checking..." : "Check this claim"}
      </button>
    </form>
  );
}
