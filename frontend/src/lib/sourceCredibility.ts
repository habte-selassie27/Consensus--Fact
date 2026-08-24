export type CredibilityTier =
  | "AUTHORITATIVE"
  | "CREDIBLE"
  | "UNKNOWN"
  | "UNRELIABLE";

export interface Credibility {
  tier: CredibilityTier;
  label: string;
  score: number;
  dotClass: string;
  badgeClass: string;
}

const AUTHORITATIVE_DOMAINS = new Set([
  "gov",
  "edu",
  "wikipedia.org",
  "bbc.com",
  "bbc.co.uk",
  "reuters.com",
  "apnews.com",
  "nature.com",
  "science.org",
  "nasa.gov",
  "who.int",
  "nih.gov",
  "cdc.gov",
  "un.org",
  "britannica.com",
  "smithsonianmag.com",
  "nationalgeographic.com",
  "pesna.org",
]);

const CREDIBLE_DOMAINS = new Set([
  "nytimes.com",
  "theguardian.com",
  "wsj.com",
  "ft.com",
  "economist.com",
  "afp.com",
  "bloomberg.com",
  "washingtonpost.com",
  "theatlantic.com",
  "newyorker.com",
  "africanews.com",
  "aljazeera.com",
  "dw.com",
  "france24.com",
  "cnn.com",
  "npr.org",
  "pbs.org",
  "ap.org",
  "statnews.com",
  "scientificamerican.com",
]);

const UNRELIABLE_HINTS = ["blogspot.", "wordpress.", "medium.com/@" , "facebook.com", "tiktok.com", "instagram.com"];

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function matchesDomain(host: string, domain: string): boolean {
  if (domain.startsWith(".")) return host.endsWith(domain);
  return host === domain || host.endsWith(`.${domain}`);
}

export function getCredibility(url: string): Credibility {
  const host = hostFromUrl(url);
  const tld = host.split(".").pop() ?? "";

  // gov / edu TLDs are authoritative
  if (tld === "gov" || tld === "edu" || tld === "ac") {
    return {
      tier: "AUTHORITATIVE",
      label: "Authoritative",
      score: 95,
      dotClass: "bg-signal",
      badgeClass: "border-signal/40 bg-signal/10 text-signal",
    };
  }

  for (const d of AUTHORITATIVE_DOMAINS) {
    if (matchesDomain(host, d)) {
      return {
        tier: "AUTHORITATIVE",
        label: "Authoritative",
        score: 95,
        dotClass: "bg-signal",
        badgeClass: "border-signal/40 bg-signal/10 text-signal",
      };
    }
  }

  for (const d of CREDIBLE_DOMAINS) {
    if (matchesDomain(host, d)) {
      return {
        tier: "CREDIBLE",
        label: "Credible",
        score: 85,
        dotClass: "bg-pending",
        badgeClass: "border-pending/40 bg-pending/10 text-pending",
      };
    }
  }

  for (const hint of UNRELIABLE_HINTS) {
    if (host.includes(hint) || url.toLowerCase().includes(hint)) {
      return {
        tier: "UNRELIABLE",
        label: "Unreliable",
        score: 30,
        dotClass: "bg-danger",
        badgeClass: "border-danger/40 bg-danger/10 text-danger",
      };
    }
  }

  return {
    tier: "UNKNOWN",
    label: "Unknown",
    score: 50,
    dotClass: "bg-mute",
    badgeClass: "border-line bg-surface text-ink-ghost",
  };
}
