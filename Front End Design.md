# FRONTEND_DESIGN.md — TruthLock Design System

> Binding visual contract for all UI agents and implementers.
> Every color, type, spacing, and motion decision derives from this file.
> Do not deviate without updating this document.

---

## 1. Design Brief

**Product:** TruthLock — On-Chain Fact Checker
**Audience:** Web3 developers, journalists, researchers, and anyone who needs verifiable proof that a claim was fact-checked without trusting a centralized platform
**The page's single job:** Make it effortless to submit a claim and feel confident in the on-chain verdict
**Aesthetic direction:** Forensic dark — like a terminal crossed with a legal dossier. Not "crypto neon." Not "AI startup purple." Think: the interface a government intelligence analyst would build if they had good taste.

---

## 2. Token System

### 2.1 Color Palette

```
--color-void:        #090C10   ← page background (near-black, slight blue shift)
--color-surface:     #0F1419   ← card / panel backgrounds
--color-border:      #1E2530   ← all borders, dividers
--color-border-dim:  #141820   ← subtle inner borders

--color-ink:         #E8EDF2   ← primary text
--color-ink-dim:     #7A8899   ← secondary / label text
--color-ink-ghost:   #3D4A5C   ← placeholder, disabled

--color-signal:      #00E5A0   ← mint green — TRUE verdict, CTA, active states
--color-danger:      #FF4444   ← FALSE verdict
--color-warn:        #F5A623   ← MISLEADING verdict
--color-mute:        #4A5568   ← UNVERIFIABLE verdict

--color-pending:     #3D8BFF   ← transaction pending state

--color-overlay:     rgba(9,12,16,0.85)   ← modal backdrops
```

**Why this palette:** The void background with blue-shifted black reads as "secure environment" — like a terminal or encrypted document viewer. The mint green `#00E5A0` is the single warm signal color, earned only by a TRUE verdict or an active CTA. Everything else is desaturated. This makes the verdict badge feel like the only thing that matters on the screen.

### 2.2 Typography

```
Display face:   "Space Grotesk"   — variable weight 300–700
                Used for: verdict labels, hero headline, stat numbers
                Character: geometric, technical, slightly quirky — not sterile

Body face:      "Inter"           — weight 400/500
                Used for: body copy, form labels, explanations

Mono face:      "JetBrains Mono"  — weight 400/500
                Used for: URLs, tx hashes, wallet addresses, IDs, confidence %
                Every data value that is machine-generated uses mono

Import:
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
```

**Type Scale:**
```
--text-hero:    clamp(3rem, 6vw, 5.5rem) / Space Grotesk 700
--text-h1:      2rem  / Space Grotesk 600
--text-h2:      1.25rem / Space Grotesk 500
--text-body:    0.9375rem / Inter 400
--text-label:   0.75rem / Inter 500 / letter-spacing: 0.08em / uppercase
--text-mono:    0.875rem / JetBrains Mono 400
--text-mono-sm: 0.75rem  / JetBrains Mono 400
```

### 2.3 Spacing

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  24px
--space-6:  32px
--space-7:  48px
--space-8:  64px
--space-9:  96px
```

### 2.4 Radius & Borders

```
--radius-sm:  4px    ← badges, tags
--radius-md:  8px    ← inputs, small cards
--radius-lg:  12px   ← main cards
--radius-xl:  16px   ← modal panels

Borders: always 1px solid var(--color-border)
Focus rings: 2px solid var(--color-signal), offset 2px
```

### 2.5 Shadows

```
--shadow-card:  0 0 0 1px var(--color-border), 0 4px 24px rgba(0,0,0,0.4)
--shadow-glow-signal: 0 0 20px rgba(0,229,160,0.15)
--shadow-glow-danger: 0 0 20px rgba(255,68,68,0.15)
```

---

## 3. Signature Element

**The Verdict Reveal Sequence** — this is the one thing users remember.

When a fact-check completes, the result page does NOT just show a card. It plays a reveal sequence:

1. (0ms) Page fades in — dark, empty, only the claim text visible in dim ink
2. (400ms) A thin horizontal scan line sweeps down the screen (top → bottom, 600ms, opacity 0.4, color: `--color-signal`)
3. (1000ms) The verdict badge STAMPS in — scale from 0.6 → 1.05 → 1.0, duration 300ms
4. (1100ms) The badge glows: box-shadow pulses once with the verdict's glow color
5. (1300ms) Confidence ring draws from 0 → value (SVG stroke-dashoffset animation, 800ms ease-out)
6. (2100ms) Explanation text fades in line by line (stagger 80ms per line)
7. (2500ms) Sources panel slides up from below

This sequence must respect `prefers-reduced-motion` — if set, skip to final state immediately.

---

## 4. Page Layouts

### 4.1 Home Page (`/`)

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR                                             │
│  [≡ TruthLock]                [History] [Docs]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  HERO                                               │
│  ┌─────────────────────────────────────────────┐   │
│  │  "Is it true?"              [mono: GenLayer] │   │
│  │  Fact-check any claim.                       │   │
│  │  Results stored on-chain. Permanently.       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  CLAIM FORM PANEL                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │  LABEL: CLAIM                               │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │  textarea (4 rows, max 500 chars)   │   │   │
│  │  │                          [123/500]  │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  │  LABEL: SOURCE URL                          │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │  https://...                        │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  │  [    CHECK THIS CLAIM →   ]               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  TX STATUS BAR (shown when pending)                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  ⟳ Fetching sources & running consensus...  │   │
│  │  Tx: 0x3f8a...b21c                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  RECENT CHECKS (last 5, auto-refresh)              │
│  ┌────────┬────────────────────────────────┬─────┐ │
│  │ TRUE   │ "The Eiffel Tower was built..." │ 98% │ │
│  │ FALSE  │ "Bill Gates owns Twitter..."    │ 94% │ │
│  │ MISLEAD│ "Vaccines contain microchips.." │ 87% │ │
│  └────────┴────────────────────────────────┴─────┘ │
└─────────────────────────────────────────────────────┘
```

**Hero copy:**
```
Eyebrow: POWERED BY GENLAYER INTELLIGENT CONTRACTS
H1:      Is it true?
Subhead: Submit a claim and a source. Our on-chain contract
         cross-references three live sources and stores the
         verdict permanently — no API, no admin, no trust required.
```

### 4.2 Result Page (`/result/[id]`)

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR                                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CLAIM ECHO (dim, small)                            │
│  "The Great Wall of China can be seen from space."  │
│                                                     │
│  ── SCAN LINE SWEEPS ──────────────────────────── │
│                                                     │
│  VERDICT PANEL                                      │
│  ┌──────────────────┬──────────────────────────┐   │
│  │                  │                          │   │
│  │  ████ FALSE ████ │   Confidence Ring 94%    │   │
│  │  (stamped badge) │   (animated SVG arc)     │   │
│  │                  │                          │   │
│  └──────────────────┴──────────────────────────┘   │
│                                                     │
│  EXPLANATION                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │  "NASA astronauts have consistently         │   │
│  │   reported that the Great Wall is not       │   │
│  │   visible from orbit with the naked eye..." │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  SOURCES CHECKED                                    │
│  ┌────────────────────────────────────────────┐    │
│  │  ✓ nasa.gov/faq/moon-myths         Fetched │    │
│  │  ✓ snopes.com/great-wall-space     Fetched │    │
│  │  ✓ nationalgeographic.com/...      Fetched │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  METADATA (mono font, dim)                          │
│  Check ID: 0x3f8a...b21c                           │
│  Submitted: 2026-08-23 14:32 UTC                   │
│  Block: #1,042,881                                  │
│                                                     │
│  [Share this check ↗]  [Check another claim →]     │
└─────────────────────────────────────────────────────┘
```

### 4.3 History Page (`/history`)

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR                                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  H1: On-Chain Fact-Check History                    │
│  Subtext: {n} claims verified. All results          │
│           permanent and publicly verifiable.        │
│                                                     │
│  FILTER BAR                                         │
│  [ALL] [TRUE] [FALSE] [MISLEADING] [UNVERIFIABLE]  │
│                                                     │
│  TABLE                                              │
│  ┌──────────┬────────────────────────┬─────┬──────┐│
│  │ VERDICT  │ CLAIM                  │ %   │ DATE ││
│  ├──────────┼────────────────────────┼─────┼──────┤│
│  │ ● TRUE   │ "Elon Musk founded..." │ 91% │ 8/23 ││
│  │ ● FALSE  │ "NASA faked the..."    │ 99% │ 8/22 ││
│  │ ● MISLEAD│ "Coffee causes cancer" │ 72% │ 8/21 ││
│  └──────────┴────────────────────────┴─────┴──────┘│
│  (click any row → /result/[id])                    │
└─────────────────────────────────────────────────────┘
```

---

## 5. Component Visual Specs

### 5.1 Verdict Badge

```css
.badge {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 12px 28px;
  border-radius: var(--radius-sm);
  border: 2px solid currentColor;
}

.badge--true         { color: #00E5A0; border-color: #00E5A0; box-shadow: 0 0 24px rgba(0,229,160,0.2); }
.badge--false        { color: #FF4444; border-color: #FF4444; box-shadow: 0 0 24px rgba(255,68,68,0.2); }
.badge--misleading   { color: #F5A623; border-color: #F5A623; box-shadow: 0 0 24px rgba(245,166,35,0.2); }
.badge--unverifiable { color: #4A5568; border-color: #4A5568; }
```

### 5.2 Confidence Ring (SVG)

```
Size: 120px × 120px
Track: stroke-width 8, color: var(--color-border), full circle
Arc:   stroke-width 8, color: verdict color, stroke-linecap: round
       animated via stroke-dashoffset (circumference = 2π×52 ≈ 326.7)
       animation: 800ms ease-out on mount
Center text: "{value}%" in JetBrains Mono 500, 1.5rem
Sub-label:   tier text in Inter 400, 0.7rem, dim ink
             0–30: "Low" | 31–60: "Moderate" | 61–85: "High" | 86–100: "Very High"
```

### 5.3 Claim Form Input

```css
textarea, input[type="url"] {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-ink);
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  padding: 14px 16px;
  width: 100%;
  transition: border-color 150ms ease;
  resize: vertical;
}

textarea:focus, input:focus {
  outline: none;
  border-color: var(--color-signal);
  box-shadow: 0 0 0 3px rgba(0,229,160,0.1);
}

textarea::placeholder, input::placeholder {
  color: var(--color-ink-ghost);
}
```

### 5.4 CTA Button

```css
.btn-primary {
  background: var(--color-signal);
  color: #090C10;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.9375rem;
  letter-spacing: 0.04em;
  padding: 14px 28px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;
  width: 100%;
}

.btn-primary:hover  { opacity: 0.88; }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

### 5.5 Transaction Status Bar

```
Background: var(--color-surface)
Border-top: 1px solid var(--color-border)
Position: fixed bottom-0, full width (mobile) or attached below form (desktop)
Content:
  Left:  spinning loader icon (Lucide Loader2, animate-spin) + status text
  Right: tx hash in JetBrains Mono, dim, truncated (first 6 + last 4 chars)

States:
  pending     → blue spinner + "Fetching sources & running consensus..."
  confirming  → signal spinner + "Validators reaching consensus..."
  done        → checkmark (signal green) + "Verdict recorded on-chain"
  error       → red X + "Transaction failed. Try again."
```

### 5.6 Source Panel Row

```
┌─────────────────────────────────────────────────┐
│  [favicon 16×16]  nasa.gov/faq/...         ✓ Fetched │
└─────────────────────────────────────────────────┘

- favicon: fetched via https://www.google.com/s2/favicons?domain={domain}
- URL: JetBrains Mono 0.8rem, truncated to 48 chars with ellipsis
- Status: "✓ Fetched" in signal green / "✗ Failed" in danger red
- Expand on click: show full URL
```

### 5.7 Navbar

```
Height: 56px
Background: var(--color-void) with border-bottom: 1px solid var(--color-border)
Position: sticky top-0, z-index 50
Blur: backdrop-filter: blur(12px)

Left:
  Logo: "TRUTH" in Space Grotesk 700 signal-colored + "LOCK" in ink
  Tagline: "on-chain fact verification" in mono 0.65rem dim (hidden on mobile)

Right:
  [History]  — Inter 500, ink-dim, hover: ink
  [Docs ↗]   — Inter 500, ink-dim, hover: ink
  [GenLayer] — small badge, border: signal, text: signal
```

---

## 6. Motion Choreography

### 6.1 Page Transitions
```
Enter: opacity 0 → 1, translateY 8px → 0, duration 250ms ease-out
Exit:  opacity 1 → 0, duration 150ms ease-in
```

### 6.2 Recent Checks Ticker
```
New item entering: slide in from right (translateX 100% → 0), 300ms
Old item leaving:  slide out to left (translateX 0 → -100%), 300ms
Auto-refresh: poll getRecentChecks() every 10 seconds
```

### 6.3 Scan Line (Result Page Signature)
```css
@keyframes scan {
  from { transform: translateY(0); opacity: 0.5; }
  to   { transform: translateY(100vh); opacity: 0; }
}
.scan-line {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00E5A0, transparent);
  animation: scan 600ms ease-in forwards;
}
```

### 6.4 Verdict Stamp
```css
@keyframes stamp {
  0%   { transform: scale(0.6); opacity: 0; }
  70%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1.0); opacity: 1; }
}
.verdict-badge { animation: stamp 300ms 950ms cubic-bezier(0.34,1.56,0.64,1) both; }
```

### 6.5 Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Responsive Breakpoints

```
Mobile:  < 640px  — single column, full-width cards
Tablet:  640–1024px — single column, max-width 680px centered
Desktop: > 1024px — max-width 860px centered, verdict panel splits into 2 cols
```

**Mobile-specific:**
- Navbar: hide tagline, keep logo + icons
- Hero: `--text-hero` clamps down to 2.5rem
- Verdict panel: stack badge and ring vertically
- Sources: always truncate URL to 32 chars

---

## 8. Empty & Error States

### No results (History page empty)
```
Icon: Lucide FileSearch (48px, ink-ghost)
Title: "No checks yet"
Body:  "Submit your first claim on the home page."
CTA:   "Check a claim →" (link to /)
```

### Transaction failed
```
Icon: Lucide XCircle (24px, danger)
Title: "Transaction failed"
Body:  Show raw error message in mono font, small, dim
CTA:   "Try again" (resets form, keeps claim text)
```

### Claim not found (404 on /result/[id])
```
Icon: Lucide Search (48px, ink-ghost)
Title: "Claim not found"
Body:  "This check ID doesn't exist on-chain. It may have been submitted on a different network."
CTA:   "← Back to history"
```

---

## 9. Accessibility

- All interactive elements: visible `:focus-visible` ring (2px signal, 2px offset)
- Color is never the only indicator — badge always includes text label
- Confidence ring: `aria-label="Confidence: {n}%"` on SVG
- Verdict badge: `role="status"` announced when stamped in
- Scan line: `aria-hidden="true"` (decorative)
- All inputs: proper `<label>` elements, never placeholder-only
- Keyboard: tab order follows visual reading order

---

## 10. Design Anti-Patterns to Avoid

These are explicitly forbidden:

- ❌ Gradient backgrounds (purple, blue-to-purple, rainbow)
- ❌ "Glassmorphism" blur cards with colorful background bleed
- ❌ Neon glow on text (only on badge borders, never body copy)
- ❌ Emoji in UI copy
- ❌ Sans-serif everywhere — mono MUST be used for all machine-generated data
- ❌ Spinning globe or blockchain node graph animations
- ❌ "Powered by AI" badges larger than 12px
- ❌ White backgrounds or light mode (dark only)
- ❌ Border-radius > 16px on cards
- ❌ More than 2 accent colors visible at once on any single page
