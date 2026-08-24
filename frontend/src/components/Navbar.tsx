import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/stats", label: "Stats" },
  { to: "/history", label: "History" },
  { to: "/developers", label: "Developers" },
] as const;

export default function Navbar() {
  const { pathname } = useLocation();
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  if (mounted && pathname?.startsWith("/embed")) return null;

  function isActive(path: string) {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  }

  async function connectWallet() {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];
        if (accounts[0]) {
          setWallet(accounts[0]);
        }
      } else {
        alert("No Web3 wallet detected. Install MetaMask or another GenLayer-compatible wallet.");
      }
    } catch {
      // user rejected or error
    }
  }

  function truncateAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-void/85 backdrop-blur-xl supports-[backdrop-filter]:bg-void/60">
      <div className="mx-auto flex h-14 max-w-page items-center justify-between px-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-signal/10 text-signal transition-colors group-hover:bg-signal/15">
            <Shield size={15} strokeWidth={2.5} />
          </div>
          <span className="font-display text-base font-bold tracking-wide">
            <span className="text-signal">TRUTH</span>
            <span className="text-ink">LOCK</span>
          </span>
        </Link>

        {/* Nav links — always visible */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "text-ink bg-surface-2"
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
            className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-dim transition-colors hover:text-ink hover:bg-surface-2"
          >
            Docs
          </a>

          <span className="mx-1 h-3 w-px bg-ink-ghost/40" />

          {/* GenLayer pill */}
          <a
            href="https://genlayer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line-bright px-3 py-1.5 font-mono text-xs text-ink-dim transition-all hover:border-signal hover:text-ink"
          >
            GenLayer ↗
          </a>

          {/* Wallet connect */}
          {wallet ? (
            <div className="ml-2 flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              <span className="font-mono text-xs text-ink-dim">
                {truncateAddress(wallet)}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={connectWallet}
              className="ml-2 rounded-lg border border-signal/40 bg-signal/5 px-3 py-1.5 font-mono text-xs font-medium text-signal transition-all hover:bg-signal/10 hover:border-signal/60"
            >
              Connect
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
