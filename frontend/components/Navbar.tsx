import Link from "next/link";
import { Shield } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-void/70 backdrop-blur-xl supports-[backdrop-filter]:bg-void/50">
      <div className="mx-auto flex h-14 max-w-page items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-signal/10 text-signal transition-colors group-hover:bg-signal/15">
            <Shield size={15} strokeWidth={2.5} />
          </div>
          <span className="font-display text-base font-bold tracking-wide">
            <span className="text-signal">TRUTH</span>
            <span className="text-ink">LOCK</span>
          </span>
          <span className="hidden font-mono text-[0.6rem] text-ink-ghost sm:inline">
            on-chain fact verification
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/history"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-dim transition-colors hover:bg-line/50 hover:text-ink"
          >
            History
          </Link>
          <a
            href="https://docs.genlayer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-dim transition-colors hover:bg-line/50 hover:text-ink"
          >
            Docs
          </a>
          <a
            href="https://genlayer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 hidden rounded-lg border border-signal/30 bg-signal/5 px-3 py-1.5 font-mono text-xs font-medium text-signal transition-all hover:bg-signal/10 hover:border-signal/50 sm:inline-block"
          >
            GenLayer
          </a>
        </nav>
      </div>
    </header>
  );
}
