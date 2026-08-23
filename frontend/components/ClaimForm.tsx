"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, inferCategory } from "@/lib/categories";
import type { Category } from "@/lib/categories";

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
