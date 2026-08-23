import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Link2,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
  Globe,
  Brain,
} from "lucide-react";
import { CATEGORIES, inferCategory } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import { getRecentChecks } from "@/lib/genlayer";
import { verdictBadgeClass } from "@/components/verdictStyles";
import CustomSelect from "@/components/CustomSelect";

interface ClaimFormProps {
  onSubmit: (claim: string, url: string, category: Category) => void;
  isLoading: boolean;
}

const MIN_CLAIM_LENGTH = 10;
const MAX_CLAIM_LENGTH = 500;

const CATEGORY_OPTIONS = CATEGORIES.map((c) => {
  const icons: Record<string, string> = {
    Science: "🔬",
    Health: "💊",
    Finance: "💰",
    Politics: "🏛️",
    History: "📚",
    Tech: "💻",
    Other: "⚙️",
  };
  return { value: c, label: c, icon: icons[c] };
});

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
  const urlValid =
    url === "" || (url.startsWith("https://") && url.length > "https://".length);
  const formValid = claimValid && urlValid;
  const mode = url.trim() === "" ? "KNOWLEDGE_BASED" : "SOURCE_VERIFIED";

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (formValid && !isLoading) {
        onSubmit(claim.trim(), url.trim(), category);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="card" noValidate>
      <div className="mb-5">
        <label htmlFor="claim" className="label mb-2.5 block">
          Claim
        </label>
        <textarea
          id="claim"
          rows={4}
          value={claim}
          maxLength={MAX_CLAIM_LENGTH}
          onChange={(event) => setClaim(event.target.value)}
          onBlur={() => setTouched(true)}
          placeholder='e.g. "The James Webb Space Telescope launched in 2021"'
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
                ? claim.length >= MAX_CLAIM_LENGTH
                  ? "text-danger"
                  : "text-warn"
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
              className="mt-3 rounded-lg border border-pending/30 bg-pending-dim p-3"
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

      {/* Verification mode indicator */}
      <div className="mb-5">
        <div className="mb-2.5 flex items-center justify-between">
          <label htmlFor="source-url" className="label">
            Source URL <span className="normal-case text-ink-ghost">(optional)</span>
          </label>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold tracking-wide ${
              mode === "SOURCE_VERIFIED"
                ? "border-signal-border bg-signal-dim text-signal"
                : "border-pending/30 bg-pending-dim text-pending"
            }`}
          >
            {mode === "SOURCE_VERIFIED" ? (
              <>
                <Globe size={10} /> Source-verified
              </>
            ) : (
              <>
                <Brain size={10} /> Knowledge-based
              </>
            )}
          </span>
        </div>
        <div className="relative">
          <Link2
            size={16}
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${
              touched && urlValid && url ? "text-signal" : "text-ink-ghost"
            } transition-colors`}
          />
          <input
            id="source-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="https://... — leave empty for knowledge-based check"
            aria-invalid={touched && !urlValid}
            className="!pl-10 !pr-10"
          />
          {touched && url.length > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {urlValid ? (
                <CheckCircle2 size={16} className="text-signal" />
              ) : (
                <XCircle size={16} className="text-danger" />
              )}
            </span>
          )}
        </div>
        {touched && !urlValid && url.length > 0 && (
          <p className="mt-2 text-xs text-danger">
            Must start with https:// — or leave empty to skip
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-ink-ghost">
          {mode === "SOURCE_VERIFIED"
            ? "The contract fetches this URL live and cross-references corroborating sources."
            : "No source: the AI evaluates from its own knowledge. Confidence is capped and the verdict is labeled knowledge-based."}
        </p>
      </div>

      <div className="mb-6">
        <CustomSelect
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(v) => setCategory(v as Category)}
          label="Category"
          helperText="Auto-suggested from claim text — change if needed."
        />
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={!formValid || isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-void/30 border-t-void" />
            Verifying on-chain...
          </span>
        ) : mode === "SOURCE_VERIFIED" ? (
          "Verify with source →"
        ) : (
          "Verify from knowledge →"
        )}
      </button>

      <div className="mt-3 text-center font-mono text-[0.65rem] text-ink-ghost">
        Ctrl+Enter to submit
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] text-ink-ghost">
          <Shield size={10} /> On-chain
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] text-ink-ghost">
          <Zap size={10} /> ~30s
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] text-ink-ghost">
          <Globe size={10} /> {mode === "SOURCE_VERIFIED" ? "3 sources" : "AI knowledge"}
        </span>
      </div>
    </form>
  );
}
