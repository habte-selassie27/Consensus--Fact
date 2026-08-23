"use client";

import { useEffect, useState } from "react";

export default function ScanLine() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!active) return null;

  return <div className="scan-line" aria-hidden="true" />;
}
