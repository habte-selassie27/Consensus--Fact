import { motion, useReducedMotion } from "framer-motion";

const STEPS = [
  { num: "01", label: "Submit claim", detail: "Provide a claim and optional source URL" },
  { num: "02", label: "Fetch live evidence", detail: "Contract retrieves primary + corroborating sources" },
  { num: "03", label: "Independent AI reasoning", detail: "Each validator evaluates the evidence separately" },
  { num: "04", label: "Decentralized consensus", detail: "Validators vote via Optimistic Democracy" },
  { num: "05", label: "Permanent onchain verdict", detail: "Result recorded immutably on-chain" },
];

export default function HowItWorks() {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  return (
    <motion.section
      aria-label="How it works"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(0.8), duration: 0.5 }}
    >
      <h2 className="mb-5 font-display text-sm font-semibold tracking-wide text-ink">
        How it works
      </h2>

      <div className="relative space-y-0">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay(900 + i * 100), duration: 0.3 }}
            className="relative flex gap-4"
          >
            {!i && (
              <div
                className="absolute left-[14px] top-[32px] w-px bg-line"
                style={{ height: "calc(100% - 40px)" }}
                aria-hidden="true"
              />
            )}
            {i > 0 && i < STEPS.length - 1 && (
              <div
                className="absolute left-[14px] top-[32px] w-px bg-line"
                style={{ height: "calc(100% - 0px)" }}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 font-mono text-[0.6rem] font-bold text-ink-ghost">
              {step.num}
            </span>
            <div className="flex-1 pb-4">
              <p className="font-display text-sm font-semibold text-ink">
                {step.label}
              </p>
              <p className="font-mono text-[0.65rem] text-ink-ghost">
                {step.detail}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
