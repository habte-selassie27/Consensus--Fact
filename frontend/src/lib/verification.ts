import type { Verdict } from "./types";

export interface TxProof {
  txHash: string;
  votes: Record<string, string>;
  agreeCount: number;
  totalVotes: number;
  resultName: string;
  rounds: number;
  savedAt: number;
}

const PROOF_KEY_PREFIX = "truthlock:proof:";
const PROOF_MAX_ENTRIES = 100;

export function verificationId(recordId: string): string {
  if (!recordId) return "TL-000000";
  let hash = 0x811c9dc5;
  for (let i = 0; i < recordId.length; i++) {
    hash ^= recordId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[hash % 32];
    hash = Math.floor(hash / 32) + 0x9e37 * (i + 1);
  }
  return `TL-${out}`;
}

export function saveTxProof(checkId: string, proof: TxProof): void {
  if (!checkId || !proof.txHash) return;
  try {
    window.localStorage.setItem(
      PROOF_KEY_PREFIX + checkId,
      JSON.stringify(proof)
    );
    pruneProofs();
  } catch {
    // storage unavailable (private mode) — proof simply not cached
  }
}

export function loadTxProof(checkId: string): TxProof | null {
  if (!checkId) return null;
  try {
    const raw = window.localStorage.getItem(PROOF_KEY_PREFIX + checkId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TxProof>;
    if (typeof parsed.txHash !== "string" || parsed.txHash.length === 0) {
      return null;
    }
    return {
      txHash: parsed.txHash,
      votes:
        parsed.votes && typeof parsed.votes === "object" ? parsed.votes : {},
      agreeCount: Number(parsed.agreeCount ?? 0),
      totalVotes: Number(parsed.totalVotes ?? 0),
      resultName: String(parsed.resultName ?? ""),
      rounds: Number(parsed.rounds ?? 1),
      savedAt: Number(parsed.savedAt ?? 0),
    };
  } catch {
    return null;
  }
}

function pruneProofs(): void {
  try {
    const entries: { key: string; savedAt: number }[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(PROOF_KEY_PREFIX)) continue;
      try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? (JSON.parse(raw) as Partial<TxProof>) : null;
        entries.push({ key, savedAt: Number(parsed?.savedAt ?? 0) });
      } catch {
        entries.push({ key, savedAt: 0 });
      }
    }
    if (entries.length <= PROOF_MAX_ENTRIES) return;
    entries.sort((a, b) => a.savedAt - b.savedAt);
    for (const entry of entries.slice(0, entries.length - PROOF_MAX_ENTRIES)) {
      window.localStorage.removeItem(entry.key);
    }
  } catch {
    // ignore
  }
}

export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

export function explorerTxUrl(txHash: string): string | null {
  const base = import.meta.env.VITE_EXPLORER_URL as string | undefined;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/tx/${txHash}`;
}

export function agreementTier(confidence: number): {
  label: string;
  pct: number;
} {
  if (confidence >= 75) return { label: "Strong agreement", pct: confidence };
  if (confidence >= 50) return { label: "Partial agreement", pct: confidence };
  if (confidence >= 25) return { label: "Weak agreement", pct: confidence };
  return { label: "Minimal agreement", pct: Math.max(confidence, 8) };
}

export function contradictionLevel(verdict: Verdict): {
  label: string;
  tone: "ok" | "warn" | "bad" | "mute";
} {
  switch (verdict) {
    case "TRUE":
      return { label: "None detected", tone: "ok" };
    case "MISLEADING":
      return { label: "Context omitted / partial", tone: "warn" };
    case "FALSE":
      return { label: "Direct contradiction", tone: "bad" };
    default:
      return { label: "Insufficient evidence", tone: "mute" };
  }
}
