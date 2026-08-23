import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/stats", label: "Stats" },
  { to: "/leaderboard", label: "Top" },
  { to: "/history", label: "History" },
] as const;

export default function Navbar() {
  const { pathname } = useLocation();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (mounted && pathname?.startsWith("/embed")) return null;

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(path + "/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-void/85 backdrop-blur-xl supports-[backdrop-filter]:bg-void/60">
      <div className="mx-auto flex h-14 max-w-page items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5 group">
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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "text-ink border-b-2 border-signal"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <a
            href="https://docs.genlayer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-dim transition-colors hover:text-ink"
          >
            Docs
          </a>

          <span className="mx-1 h-3 w-px bg-ink-ghost/40" />

          <a
            href="https://genlayer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line-bright px-3 py-1.5 font-mono text-xs text-ink-dim transition-all hover:border-signal hover:text-ink"
          >
            GenLayer ↗
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-dim transition-colors hover:text-ink md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-line/40 md:hidden"
          >
            <nav className="flex flex-col gap-1 px-5 py-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? "bg-signal/10 text-signal"
                      : "text-ink-dim hover:text-ink hover:bg-surface-2"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://docs.genlayer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-dim hover:text-ink hover:bg-surface-2"
              >
                Docs ↗
              </a>
              <a
                href="https://genlayer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 rounded-lg border border-line-bright px-3 py-2 text-center font-mono text-xs text-ink-dim"
              >
                GenLayer ↗
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
