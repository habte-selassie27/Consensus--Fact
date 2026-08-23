"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/embed")) return null;
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-void/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-page items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Shield size={18} className="text-signal" strokeWidth={2.5} />
          <span className="font-display text-sm font-bold tracking-wide">
            <span className="text-signal">TRUTH</span>
            <span className="text-ink">LOCK</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/stats"
            className="text-sm text-ink-dim hover:text-ink transition-colors"
          >
            Stats
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm text-ink-dim hover:text-ink transition-colors"
          >
            Top
          </Link>
          <Link
            href="/history"
            className="text-sm text-ink-dim hover:text-ink transition-colors"
          >
            History
          </Link>
          <a
            href="https://docs.genlayer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-dim hover:text-ink transition-colors"
          >
            Docs
          </a>
          <a
            href="https://genlayer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-signal/30 px-3 py-1 font-mono text-xs text-signal hover:bg-signal/10 transition-colors"
          >
            GenLayer
          </a>
        </nav>
      </div>
    </header>
  );
}
