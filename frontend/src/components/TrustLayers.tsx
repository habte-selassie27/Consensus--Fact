import { motion, useReducedMotion } from "framer-motion";
import { Globe, Brain, ShieldCheck, Link2 } from "lucide-react";

const LAYERS = [
  {
    icon: Globe,
    label: "Live Web",
    detail: "Real evidence fetched on-chain",
    color: "text-signal",
    bg: "bg-signal/10",
    border: "border-signal/40",
  },
  {
    icon: Brain,
    label: "AI Reasoning",
    detail: "Independent LLM evaluation",
    color: "text-signal",
    bg: "bg-signal/10",
    border: "border-signal/40",
  },
  {
    icon: ShieldCheck,
    label: "Consensus",
    detail: "Decentralized validator agreement",
    color: "text-signal",
    bg: "bg-signal/10",
    border: "border-signal/40",
  },
  {
    icon: Link2,
    label: "Onchain",
    detail: "Permanent proof recorded",
    color: "text-signal",
    bg: "bg-signal/10",
    border: "border-signal/40",
  },
];

export default function TrustLayers() {
  const reduceMotion = useReducedMotion();
  const delay = (ms: number) => (reduceMotion ? 0 : ms);

  return (
    <motion.section
      aria-label="Trust layers"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay(0.6), duration: 0.5 }}
      className="rounded-xl border border-line bg-surface p-6 shadow-card"
    >
      <h2 className="mb-5 text-center font-display text-sm font-semibold tracking-wide text-ink">
        Why TruthLock?
      </h2>

      <div className="space-y-3">
        {LAYERS.map((layer, i) => {
          const Icon = layer.icon;
          return (
            <motion.div
              key={layer.label}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay(700 + i * 120), duration: 0.3 }}
              className="flex items-center gap-4"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${layer.border} ${layer.bg}`}
              >
                <Icon size={16} className={layer.color} />
              </span>
              <div className="flex-1">
                <p className="font-display text-sm font-semibold text-ink">
                  {layer.label}
                </p>
                <p className="font-mono text-[0.65rem] text-ink-ghost">
                  {layer.detail}
                </p>
              </div>
              {i < LAYERS.length - 1 && (
                <span className="absolute ml-5 mt-10 text-ink-ghost">
                  ↓
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg bg-surface-2 px-4 py-3 text-center">
        <p className="font-display text-xs font-semibold tracking-wide text-ink">
          Four layers of verification. One permanent verdict.
        </p>
      </div>
    </motion.section>
  );
}
