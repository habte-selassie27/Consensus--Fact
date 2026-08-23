"use client";

import { motion, useReducedMotion } from "framer-motion";
import { verdictBadgeClass } from "@/components/verdictStyles";
import type { FactCheckRecord } from "@/lib/types";

interface VerdictCardProps {
  record: FactCheckRecord;
}

export default function VerdictCard({ record }: VerdictCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      role="status"
      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: 0.95,
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      <span className={`badge ${verdictBadgeClass(record.verdict)} inline-block`}>
        {record.verdict}
      </span>
    </motion.div>
  );
}
