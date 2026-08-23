"use client";

import { useState } from "react";
import { LinkIcon, FileText, AlertCircle } from "lucide-react";

interface ClaimFormProps {
  onSubmit: (claim: string, url: string) => void;
  isLoading: boolean;
}

const MIN_CLAIM_LENGTH = 10;
const MAX_CLAIM_LENGTH = 500;

export default function ClaimForm({ onSubmit, isLoading }: ClaimFormProps) {
  const [claim, setClaim] = useState("");
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);

  const claimValid =
    claim.trim().length >= MIN_CLAIM_LENGTH &&
    claim.length <= MAX_CLAIM_LENGTH;
  const urlValid = url.startsWith("https://") && url.length > "https://".length;
  const formValid = claimValid && urlValid;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!formValid || isLoading) return;
    onSubmit(claim.trim(), url.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-2xl p-6 sm:p-8 glow-signal"
      noValidate
    >
      {/* Claim field */}
      <div className="mb-6">
        <label
          htmlFor="claim"
          className="label mb-2.5 flex items-center gap-2"
        >
          <FileText size={13} className="text-ink-ghost" />
          Claim
        </label>
        <div className="relative">
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
            className="!rounded-xl"
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs">
          <span className="text-ink-ghost">
            {touched && !claimValid && claim.trim().length > 0 ? (
              <span className="flex items-center gap-1 text-danger">
                <AlertCircle size={11} />
                Minimum {MIN_CLAIM_LENGTH} characters
              </span>
            ) : (
              <span className="text-ink-ghost/50">
                {claim.trim().length > 0
                  ? ""
                  : "Minimum 10 characters"}
              </span>
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

      {/* URL field */}
      <div className="mb-7">
        <label
          htmlFor="source-url"
          className="label mb-2.5 flex items-center gap-2"
        >
          <LinkIcon size={13} className="text-ink-ghost" />
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
          className="!rounded-xl"
        />
        {touched && !urlValid && url.length > 0 && (
          <p className="mt-2 flex items-center gap-1 text-xs text-danger">
            <AlertCircle size={11} />
            Source URL must start with https://
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn-primary"
        disabled={!formValid || isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-void/30 border-t-void" />
            Checking...
          </span>
        ) : (
          "Check this claim"
        )}
      </button>
    </form>
  );
}
