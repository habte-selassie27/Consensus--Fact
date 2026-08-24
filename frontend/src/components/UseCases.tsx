import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Code2, Globe, Landmark } from "lucide-react";

const USE_CASES = [
  {
    icon: BookOpen,
    title: "For researchers",
    detail: "Audit claims with transparent, verifiable evidence trails.",
  },
  {
    icon: Code2,
    title: "For developers",
    detail: "Read verification results from smart contracts in your dApps.",
  },
  {
    icon: Globe,
    title: "For platforms",
    detail: "Embed verifiable fact-checks directly into your content.",
  },
  {
    icon: Landmark,
    title: "For DAOs",
    detail: "Bring external facts into decentralized governance.",
  },
];

export default function UseCases() {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  return (
    <motion.section
      aria-label="Use cases"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(1.0), duration: 0.5 }}
    >
      <h2 className="mb-5 font-display text-sm font-semibold tracking-wide text-ink">
        Who is TruthLock for?
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {USE_CASES.map((uc, i) => {
          const Icon = uc.icon;
          return (
            <motion.div
              key={uc.title}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay(1100 + i * 100), duration: 0.3 }}
              className="rounded-lg border border-line bg-surface p-5 shadow-card"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2">
                <Icon size={16} className="text-signal" />
              </div>
              <p className="font-display text-sm font-semibold text-ink">
                {uc.title}
              </p>
              <p className="mt-1 font-mono text-[0.65rem] leading-relaxed text-ink-dim">
                {uc.detail}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
