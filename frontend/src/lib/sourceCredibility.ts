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
  // Government & Institutional
  "gov", "edu", "ac",
  "wikipedia.org", "britannica.com",
  "nasa.gov", "nih.gov", "cdc.gov", "fda.gov", "noaa.gov", "nsf.gov", "defense.gov", "state.gov",
  "who.int", "un.org", "worldbank.org", "imf.org", "iaea.org", "icao.int",
  "europa.eu", "consilium.europa.eu", "ec.europa.eu",
  "gov.uk", "canada.ca", "australia.gov.au", "gov.in", "gov.br",
  // News & Wire Services
  "bbc.com", "bbc.co.uk", "reuters.com", "apnews.com", "ap.org", "afp.com",
  // Science & Research
  "nature.com", "science.org", "pubmed.ncbi.nlm.nih.gov", "sciencedirect.com",
  "arxiv.org", "biorxiv.org", "medrxiv.org", "springer.com", "wiley.com",
  "smithsonianmag.com", "nationalgeographic.com", "pesna.org",
]);

const CREDIBLE_DOMAINS = new Set([
  // Major Newspapers
  "nytimes.com", "washingtonpost.com", "wsj.com", "ft.com", "economist.com",
  "theguardian.com", "theatlantic.com", "newyorker.com", "bloomberg.com",
  "politico.com", "thehill.com", "axios.com", "vox.com", "vice.com",
  // Broadcast & Wire
  "cnn.com", "npr.org", "pbs.org", "cbc.ca", "abc.net.au",
  "aljazeera.com", "dw.com", "france24.com", "africanews.com",
  // Tech & Science
  "techcrunch.com", "arstechnica.com", "wired.com", "theverge.com",
  "mittechreview.com", "scientificamerican.com", "statnews.com",
  "arstechnica.com", "ieee.org", "acm.org",
  // Fact-Checking
  "snopes.com", "politifact.com", "factcheck.org", "fullfact.org",
  "africacheck.org", "leadstories.com",
  // Research & Academic
  "scholar.google.com", "researchgate.net", "academia.edu",
  // Platforms & Content
  "github.com", "stackoverflow.com", "gitlab.com",
  "medium.com", "substack.com",
]);

const UNRELIABLE_HINTS = [
  "blogspot.", "wordpress.com/@", "medium.com/@",
  "facebook.com", "tiktok.com", "instagram.com",
  "4chan.org", "8kun.top", "bitchute.com", "rumble.com",
  "naturalnews.com", "infowars.com", "breitbart.com",
  "dailymail.co.uk", "mirror.co.uk",
];

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
