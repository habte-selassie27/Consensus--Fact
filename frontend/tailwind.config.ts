import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#080B10",
        surface: "#0E1318",
        "surface-2": "#141920",
        "surface-3": "#1A2028",
        "surface-raised": "#161E28",
        line: "#1E2530",
        "line-bright": "#2D3748",
        "line-dim": "#141820",
        ink: "#E8EDF2",
        "ink-dim": "#7A8899",
        "ink-ghost": "#3D4A5C",
        signal: "#00E5A0",
        "signal-dim": "rgba(0, 229, 160, 0.12)",
        "signal-border": "rgba(0, 229, 160, 0.25)",
        danger: "#FF4444",
        "danger-dim": "rgba(255, 68, 68, 0.12)",
        warn: "#F5A623",
        mute: "#4A5568",
        pending: "#3D8BFF",
        "pending-dim": "rgba(61, 139, 255, 0.12)",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      maxWidth: {
        page: "1100px",
      },
      boxShadow: {
        card: "0 0 0 1px #1E2530, 0 8px 32px rgba(0,0,0,0.4)",
        "card-hover": "0 0 0 1px rgba(30,37,48,0.8), 0 12px 40px rgba(0,0,0,0.5)",
        "glow-signal": "0 0 20px rgba(0,229,160,0.15)",
        "glow-signal-strong": "0 0 24px rgba(0,229,160,0.25), 0 0 60px rgba(0,229,160,0.1)",
        "glow-danger": "0 0 20px rgba(255,68,68,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
