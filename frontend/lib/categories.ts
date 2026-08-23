export const CATEGORIES = [
  "Science",
  "Politics",
  "Health",
  "Finance",
  "History",
  "Tech",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

const KEYWORDS: Record<Category, string[]> = {
  Science: ["science", "research", "study", "experiment", "climate", "space", "nasa", "dna", "physics", "chemistry", "earth", "mars", "quantum"],
  Politics: ["election", "government", "president", "minister", "parliament", "senate", "vote", "policy", "political", "campaign", "war", "treaty"],
  Health: ["health", "disease", "virus", "vaccine", "covid", "cancer", "doctor", "hospital", "medicine", "drug", "pandemic", "symptom"],
  Finance: ["economy", "market", "stock", "price", "inflation", "crypto", "bitcoin", "gdp", "trade", "investment", "bank", "finance"],
  History: ["history", "ancient", "war", "empire", "king", "queen", "century", "historical", "founded", "origin", "civilization", "revolution"],
  Tech: ["technology", "ai", "software", "internet", "computer", "phone", "app", "algorithm", "robot", "data", "startup", "chip"],
  Other: [],
};

const CATEGORY_STYLES: Record<Category, string> = {
  Science: "border-pending/30 bg-pending/10 text-pending",
  Politics: "border-warn/30 bg-warn/10 text-warn",
  Health: "border-danger/30 bg-danger/10 text-danger",
  Finance: "border-signal/30 bg-signal/10 text-signal",
  History: "border-mute/30 bg-mute/10 text-ink-dim",
  Tech: "border-pending/30 bg-pending/10 text-pending",
  Other: "border-line bg-surface text-ink-ghost",
};

export function inferCategory(claim: string): Category {
  const lower = claim.toLowerCase();
  let best: Category = "Other";
  let bestScore = 0;
  for (const cat of CATEGORIES) {
    if (cat === "Other") continue;
    const score = KEYWORDS[cat].filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return best;
}

export function categoryBadgeClass(category: Category): string {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Other;
}

// localStorage-backed persistence — zero contract change
const STORAGE_KEY = "truthlock:category-by-id";

function loadMap(): Record<string, Category> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Record<string, Category> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if ((CATEGORIES as readonly string[]).includes(v)) out[k] = v as Category;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveCategory(id: string, category: Category): void {
  if (typeof window === "undefined") return;
  const map = loadMap();
  map[id] = category;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getStoredCategory(id: string, fallbackClaim?: string): Category | null {
  const map = loadMap();
  if (map[id]) return map[id];
  if (fallbackClaim) return inferCategory(fallbackClaim);
  return null;
}

export function getAllStoredCategories(): Record<string, Category> {
  return loadMap();
}
