export const VERDICTS = ["TRUE", "FALSE", "MISLEADING", "UNVERIFIABLE"] as const;

export type Verdict = (typeof VERDICTS)[number];

export interface FactCheckRecord {
  id: string;
  claim: string;
  source_url: string;
  verdict: Verdict;
  confidence: number;
  explanation: string;
  sources_checked: string[];
  timestamp: number;
  submitter: string;
}

export interface ContractStats {
  total_checks: number;
  verdicts_by_type: Partial<Record<Verdict, number>>;
  most_recent_timestamp: number;
}

export type TxStatus = "idle" | "pending" | "confirming" | "done" | "error";

export function isVerdict(value: unknown): value is Verdict {
  return typeof value === "string" && (VERDICTS as readonly string[]).includes(value);
}
