import { motion, useReducedMotion } from "framer-motion";
import {
  Landmark,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRecentChecks } from "@/lib/genlayer";
import { verificationId } from "@/lib/verification";
import { VERDICT_DOT_CLASSES } from "@/components/verdictStyles";

const MOCK_PROPOSALS: {
  id: string;
  title: string;
  status: keyof typeof STATUS_CONFIG;
  claim: string;
  verdict: "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIABLE";
  confidence: number;
  sources: number;
  validators: number;
  checkId: string | null;
}[] = [
  {
    id: "PROP-042",
    title: "Increase protocol revenue allocation to 35% for Q3",
    status: "verified",
    claim: "Protocol revenue increased 35% last quarter compared to the prior period",
    verdict: "TRUE",
    confidence: 88,
    sources: 3,
    validators: 3,
    checkId: null as string | null,
  },
  {
    id: "PROP-043",
    title: "Partner with Chainlink for oracle integration",
    status: "pending",
    claim: "Chainlink has confirmed a partnership with the protocol",
    verdict: "UNVERIFIABLE",
    confidence: 30,
    sources: 2,
    validators: 0,
    checkId: null as string | null,
  },
  {
    id: "PROP-044",
    title: "Community fund grant allocation for developer education",
    status: "disputed",
    claim: "Developer grant program has successfully onboarded 500 new contributors",
    verdict: "MISLEADING",
    confidence: 52,
    sources: 3,
    validators: 3,
    checkId: null as string | null,
  },
];

const STATUS_CONFIG = {
  verified: {
    icon: Check,
    label: "Evidence verified",
    cls: "border-signal/40 bg-signal/10 text-signal",
  },
  pending: {
    icon: AlertTriangle,
    label: "Awaiting verification",
    cls: "border-pending/40 bg-pending/10 text-pending",
  },
  disputed: {
    icon: AlertTriangle,
    label: "Evidence disputed",
    cls: "border-warn/40 bg-warn/10 text-warn",
  },
} as const;

export default function Governance() {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  const { data: recent } = useQuery({
    queryKey: ["gov-recent"],
    queryFn: () => getRecentChecks(5),
    retry: false,
    staleTime: 30_000,
  });

  // Wire real checks into proposals where possible
  const proposals = MOCK_PROPOSALS.map((p) => {
    if (p.checkId) return p;
    const match = recent?.find((r) => r.verdict === p.verdict);
    return { ...p, checkId: match?.id ?? null };
  });

  return (
    <div className="mx-auto max-w-page px-5 pb-24">
      {/* Header */}
      <section className="pt-16 pb-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/5 px-4 py-1.5">
            <Landmark size={12} className="text-signal" />
            <span className="font-mono text-xs text-signal">
              Governance verification
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            DAO <span className="text-gradient-signal">proposals</span>
          </h1>
          <p className="mt-3 max-w-lg text-ink-dim">
            Every proposal backed by an on-chain TruthLock verification. No
            claim passes governance without evidence.
          </p>
        </motion.div>
      </section>

      {/* How it works */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay(0.1), duration: 0.45 }}
        className="mb-6 rounded-xl border border-line bg-surface p-6 shadow-card"
      >
        <h2 className="mb-4 font-display text-sm font-semibold tracking-wide text-ink">
          How governance verification works
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { step: "01", label: "Proposal submitted", detail: "With a factual claim" },
            { step: "02", label: "TruthLock verifies", detail: "Live evidence checked on-chain" },
            { step: "03", label: "Validators vote", detail: "Consensus on the verdict" },
            { step: "04", label: "Badge assigned", detail: "Verified / Disputed / Pending" },
          ].map((s, i) => (
            <div key={s.step} className="text-center">
              <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface-2 font-mono text-xs font-bold text-ink-ghost">
                {s.step}
              </span>
              <p className="font-display text-xs font-semibold text-ink">
                {s.label}
              </p>
              <p className="mt-0.5 font-mono text-[0.6rem] text-ink-ghost">
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Proposals */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay(0.2), duration: 0.45 }}
      >
        <h2 className="mb-4 font-display text-sm font-semibold tracking-wide text-ink">
          Active proposals
        </h2>

        <div className="space-y-4">
          {proposals.map((p, i) => {
            const statusCfg = STATUS_CONFIG[p.status];
            const StatusIcon = statusCfg.icon;
            const dotClass = VERDICT_DOT_CLASSES[p.verdict] ?? "bg-mute";

            return (
              <motion.div
                key={p.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay(300 + i * 120), duration: 0.35 }}
                className="rounded-xl border border-line bg-surface p-6 shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[0.6rem] font-bold tracking-wider text-ink-ghost">
                        {p.id}
                      </span>
                      <span
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[0.55rem] font-bold ${statusCfg.cls}`}
                      >
                        <StatusIcon size={10} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-base font-semibold text-ink">
                      {p.title}
                    </h3>
                    <p className="mt-1 max-w-[600px] font-mono text-xs leading-relaxed text-ink-dim">
                      Claim: &ldquo;{p.claim}&rdquo;
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                      <span className="font-display text-sm font-bold text-ink">
                        {p.verdict}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-ink-dim">
                      {p.confidence}%
                    </span>
                  </div>
                </div>

                {/* Verification details */}
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line-dim pt-4">
                  <span className="flex items-center gap-1.5 font-mono text-[0.65rem] text-ink-dim">
                    <ShieldCheck size={11} className="text-signal" />
                    {p.sources} source{p.sources !== 1 ? "s" : ""}
                  </span>
                  <span className="font-mono text-[0.65rem] text-ink-dim">
                    {p.validators > 0
                      ? `${p.validators} validators`
                      : "Awaiting validators"}
                  </span>
                  {p.checkId && (
                    <Link
                      to={`/result/${p.checkId}`}
                      className="flex items-center gap-1 font-mono text-[0.65rem] text-signal hover:underline"
                    >
                      Inspect evidence
                      <ExternalLink size={9} />
                    </Link>
                  )}
                  <span className="ml-auto font-mono text-[0.55rem] tracking-widest text-ink-ghost">
                    {p.checkId ? verificationId(p.checkId) : "—"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay(0.6), duration: 0.45 }}
        className="mt-8 rounded-xl border border-line bg-surface p-6 text-center shadow-card"
      >
        <p className="text-sm text-ink-dim">
          Want to verify a claim for your DAO proposal?
        </p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-signal/40 bg-signal-dim px-5 py-2.5 font-display text-xs font-semibold text-signal transition-colors hover:border-signal/60"
        >
          Verify a claim
          <ExternalLink size={11} />
        </Link>
      </motion.div>
    </div>
  );
}
