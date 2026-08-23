export const VERDICTS = ["TRUE", "FALSE", "MISLEADING", "UNVERIFIABLE"] as const;

export type Verdict = (typeof VERDICTS)[number];

export const VERIFICATION_MODES = [
  "SOURCE_VERIFIED",
  "KNOWLEDGE_BASED",
] as const;

export type VerificationMode = (typeof VERIFICATION_MODES)[number];

export const SOURCE_STATUSES = [
  "NOT_PROVIDED",
  "FETCHED",
  "EMPTY",
  "BLOCKED",
  "TIMEOUT",
  "INVALID",
  "ERROR",
] as const;

export type SourceStatus = (typeof SOURCE_STATUSES)[number];

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
  verification_mode: VerificationMode;
  source_status: SourceStatus;
}

export interface ContractStats {
  total_checks: number;
  verdicts_by_type: Partial<Record<Verdict, number>>;
  modes?: Partial<Record<VerificationMode, number>>;
  most_recent_timestamp: number;
}

export type TxStatus =
  | "idle"
  | "wallet"
  | "pending"
  | "confirming"
  | "done"
  | "error";

export function isVerdict(value: unknown): value is Verdict {
  return typeof value === "string" && (VERDICTS as readonly string[]).includes(value);
}

export function isVerificationMode(value: unknown): value is VerificationMode {
  return (
    typeof value === "string" &&
    (VERIFICATION_MODES as readonly string[]).includes(value)
  );
}

export function isSourceStatus(value: unknown): value is SourceStatus {
  return (
    typeof value === "string" &&
    (SOURCE_STATUSES as readonly string[]).includes(value)
  );
}

export const SOURCE_STATUS_LABELS: Record<SourceStatus, string> = {
  NOT_PROVIDED: "No source provided",
  FETCHED: "Retrieved",
  EMPTY: "Empty page",
  BLOCKED: "Blocked / 403",
  TIMEOUT: "Timed out",
  INVALID: "Invalid URL",
  ERROR: "Fetch error",
};
