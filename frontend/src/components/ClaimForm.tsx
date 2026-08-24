import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Link2,
  CheckCircle2,
  XCircle,
  Shield,
  Globe,
  Brain,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { CATEGORIES, inferCategory } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import { getRecentChecks } from "@/lib/genlayer";
import { verdictBadgeClass } from "@/components/verdictStyles";
import CustomSelect from "@/components/CustomSelect";

interface ClaimFormProps {
  onSubmit: (claim: string, url: string, category: Category, sourceUrls: string[]) => void;
  isLoading: boolean;
}

const MIN_CLAIM_LENGTH = 10;
const MAX_CLAIM_LENGTH = 500;

const SUGGESTED_SOURCES: { label: string; url: string; tier: "gov" | "encyclopedia" | "news" | "social" | "science" | "content" }[] = [
  // Encyclopedia & Knowledge
  { label: "Wikipedia", url: "https://en.wikipedia.org", tier: "encyclopedia" },
  { label: "Britannica", url: "https://www.britannica.com", tier: "encyclopedia" },
  // Government & Institutional
  { label: "NASA", url: "https://www.nasa.gov", tier: "gov" },
  { label: "WHO", url: "https://www.who.int", tier: "gov" },
  { label: "UN", url: "https://www.un.org", tier: "gov" },
  { label: "NIH", url: "https://www.nih.gov", tier: "gov" },
  { label: "CDC", url: "https://www.cdc.gov", tier: "gov" },
  { label: "EU", url: "https://europa.eu", tier: "gov" },
  { label: "World Bank", url: "https://www.worldbank.org", tier: "gov" },
  { label: "IMF", url: "https://www.imf.org", tier: "gov" },
  // News
  { label: "Reuters", url: "https://www.reuters.com", tier: "news" },
  { label: "BBC", url: "https://www.bbc.com", tier: "news" },
  { label: "AP News", url: "https://apnews.com", tier: "news" },
  { label: "Al Jazeera", url: "https://www.aljazeera.com", tier: "news" },
  { label: "NY Times", url: "https://www.nytimes.com", tier: "news" },
  { label: "Guardian", url: "https://www.theguardian.com", tier: "news" },
  { label: "Bloomberg", url: "https://www.bloomberg.com", tier: "news" },
  { label: "NPR", url: "https://www.npr.org", tier: "news" },
  { label: "DW", url: "https://www.dw.com", tier: "news" },
  { label: "France24", url: "https://www.france24.com", tier: "news" },
  // Science & Research
  { label: "Nature", url: "https://www.nature.com", tier: "science" },
  { label: "Science.org", url: "https://www.science.org", tier: "science" },
  { label: "arXiv", url: "https://arxiv.org", tier: "science" },
  { label: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov", tier: "science" },
  { label: "Sciencedirect", url: "https://www.sciencedirect.com", tier: "science" },
  { label: "Smithsonian", url: "https://www.smithsonianmag.com", tier: "science" },
  { label: "Nat Geo", url: "https://www.nationalgeographic.com", tier: "science" },
  { label: "SciAmerican", url: "https://www.scientificamerican.com", tier: "science" },
  // Social Media & Platforms
  { label: "X / Twitter", url: "https://x.com", tier: "social" },
  { label: "Reddit", url: "https://www.reddit.com", tier: "social" },
  { label: "YouTube", url: "https://www.youtube.com", tier: "social" },
  { label: "LinkedIn", url: "https://www.linkedin.com", tier: "social" },
  { label: "Bluesky", url: "https://bsky.app", tier: "social" },
  { label: "Mastodon", url: "https://mastodon.social", tier: "social" },
  { label: "Threads", url: "https://www.threads.net", tier: "social" },
  // Content Hosting & Dev
  { label: "GitHub", url: "https://github.com", tier: "content" },
  { label: "Medium", url: "https://medium.com", tier: "content" },
  { label: "Substack", url: "https://substack.com", tier: "content" },
  { label: "Notion", url: "https://www.notion.so", tier: "content" },
  { label: "GitLab", url: "https://gitlab.com", tier: "content" },
  { label: "StackOverflow", url: "https://stackoverflow.com", tier: "content" },
  // Fact-Checking
  { label: "Snopes", url: "https://www.snopes.com", tier: "news" },
  { label: "PolitiFact", url: "https://www.politifact.com", tier: "news" },
  { label: "FactCheck.org", url: "https://www.factcheck.org", tier: "news" },
  { label: "Full Fact", url: "https://fullfact.org", tier: "news" },
];

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
  const [extraUrls, setExtraUrls] = useState<string[]>([]);
  const [showMultiSource, setShowMultiSource] = useState(false);
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
  const extraUrlsValid =
    !showMultiSource ||
    extraUrls.every(
      (u) => u === "" || (u.startsWith("https://") && u.length > "https://".length)
    );
  const formValid = claimValid && urlValid && extraUrlsValid;
  const allSourceUrls = showMultiSource ? [url, ...extraUrls].filter((u) => u.trim() !== "") : [];
  const mode =
    allSourceUrls.length > 0
      ? "SOURCE_VERIFIED"
      : url.trim() === ""
        ? "KNOWLEDGE_BASED"
        : "SOURCE_VERIFIED";

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
    onSubmit(claim.trim(), url.trim(), category, allSourceUrls);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (formValid && !isLoading) {
        onSubmit(claim.trim(), url.trim(), category, allSourceUrls);
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
        <div className="mt-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[0.6rem] text-ink-ghost">Quick add source:</span>
            <span className="font-mono text-[0.55rem] text-ink-ghost">click to set as primary URL</span>
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-line bg-surface-2 p-2 scrollbar-thin">
            {/* News & Fact-Checking */}
            <SourceGroup
              label="News & Fact-Checking"
              sources={SUGGESTED_SOURCES.filter((s) => s.tier === "news")}
              activeUrl={url}
              onSelect={(u) => { setUrl(u); setTouched(true); }}
            />
            {/* Government & Institutional */}
            <SourceGroup
              label="Government & Institutional"
              sources={SUGGESTED_SOURCES.filter((s) => s.tier === "gov")}
              activeUrl={url}
              onSelect={(u) => { setUrl(u); setTouched(true); }}
            />
            {/* Science & Research */}
            <SourceGroup
              label="Science & Research"
              sources={SUGGESTED_SOURCES.filter((s) => s.tier === "science")}
              activeUrl={url}
              onSelect={(u) => { setUrl(u); setTouched(true); }}
            />
            {/* Social Media */}
            <SourceGroup
              label="Social Media"
              sources={SUGGESTED_SOURCES.filter((s) => s.tier === "social")}
              activeUrl={url}
              onSelect={(u) => { setUrl(u); setTouched(true); }}
            />
            {/* Content & Dev Platforms */}
            <SourceGroup
              label="Content & Dev Platforms"
              sources={SUGGESTED_SOURCES.filter((s) => s.tier === "content")}
              activeUrl={url}
              onSelect={(u) => { setUrl(u); setTouched(true); }}
            />
            {/* Encyclopedia */}
            <SourceGroup
              label="Knowledge Base"
              sources={SUGGESTED_SOURCES.filter((s) => s.tier === "encyclopedia")}
              activeUrl={url}
              onSelect={(u) => { setUrl(u); setTouched(true); }}
            />
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-ghost">
          {mode === "SOURCE_VERIFIED"
            ? "The contract fetches this URL live and cross-references corroborating sources."
            : "No source: the AI evaluates from its own knowledge. Confidence is capped and the verdict is labeled knowledge-based."}
        </p>

        {/* Multi-source toggle */}
        {url.trim() !== "" && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setShowMultiSource((v) => !v);
                if (!showMultiSource && extraUrls.length === 0) {
                  setExtraUrls([""]);
                }
              }}
              className="font-mono text-[0.6rem] text-signal transition-colors hover:underline"
            >
              {showMultiSource ? "− Remove extra sources" : "+ Add more sources for cross-reference"}
            </button>
          </div>
        )}

        {/* Extra URL inputs */}
        <AnimatePresence>
          {showMultiSource && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2 overflow-hidden"
            >
              <p className="font-mono text-[0.6rem] text-ink-ghost">
                Add up to 3 additional sources to cross-reference against the primary.
              </p>
              {extraUrls.map((eu, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Link2 size={12} className="shrink-0 text-ink-ghost" />
                  <input
                    type="url"
                    value={eu}
                    onChange={(e) => {
                      const updated = [...extraUrls];
                      updated[i] = e.target.value;
                      setExtraUrls(updated);
                    }}
                    placeholder={`Additional source ${i + 1} — https://...`}
                    className="!py-1.5 !text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setExtraUrls((prev) => prev.filter((_, j) => j !== i));
                      if (extraUrls.length <= 1) setShowMultiSource(false);
                    }}
                    className="shrink-0 text-ink-ghost transition-colors hover:text-danger"
                    aria-label="Remove source"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
              {extraUrls.length < 3 && (
                <button
                  type="button"
                  onClick={() => setExtraUrls((prev) => [...prev, ""])}
                  className="font-mono text-[0.6rem] text-ink-ghost transition-colors hover:text-signal"
                >
                  + Add another source
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
        ) : (
          <span className="flex items-center gap-2">
            <Lock size={14} />
            Verify on TruthLock
          </span>
        )}
      </button>

      <div className="mt-3 text-center font-mono text-[0.65rem] text-ink-ghost">
        Ctrl+Enter to submit
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[0.6rem] text-ink-ghost">
          <Globe size={10} /> Live Web
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[0.6rem] text-ink-ghost">
          <Brain size={10} /> AI Reasoning
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[0.6rem] text-ink-ghost">
          <ShieldCheck size={10} /> Consensus
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[0.6rem] text-ink-ghost">
          <Shield size={10} /> Onchain
        </span>
      </div>
    </form>
  );
}

const TIER_DOT_COLORS: Record<string, string> = {
  gov: "bg-signal",
  encyclopedia: "bg-signal",
  news: "bg-pending",
  science: "bg-pending",
  social: "bg-warn",
  content: "bg-mute",
};

function SourceGroup({
  label,
  sources,
  activeUrl,
  onSelect,
}: {
  label: string;
  sources: { label: string; url: string; tier: string }[];
  activeUrl: string;
  onSelect: (url: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-[0.5rem] uppercase tracking-wider text-ink-ghost">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {sources.map((src) => (
          <button
            key={src.label}
            type="button"
            onClick={() => onSelect(src.url)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.6rem] transition-colors ${
              activeUrl === src.url
                ? "border-signal bg-signal-dim text-signal"
                : "border-line text-ink-dim hover:border-signal/40 hover:text-signal"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${TIER_DOT_COLORS[src.tier] ?? "bg-mute"}`} />
            {src.label}
          </button>
        ))}
      </div>
    </div>
  );
}
