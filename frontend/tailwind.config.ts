import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#090C10",
        surface: "#0F1419",
        "surface-raised": "#131A22",
        line: "#1E2530",
        "line-dim": "#141820",
        ink: "#E8EDF2",
        "ink-dim": "#7A8899",
        "ink-ghost": "#3D4A5C",
        signal: "#00E5A0",
        danger: "#FF4444",
        warn: "#F5A623",
        mute: "#4A5568",
        pending: "#3D8BFF",
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
      boxShadow: {
        card: "0 0 0 1px #1E2530, 0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 0 0 1px rgba(30,37,48,0.8), 0 8px 40px rgba(0,0,0,0.5)",
        "glow-signal": "0 0 20px rgba(0,229,160,0.15)",
        "glow-signal-strong": "0 0 24px rgba(0,229,160,0.25), 0 0 60px rgba(0,229,160,0.1)",
        "glow-danger": "0 0 20px rgba(255,68,68,0.15)",
      },
      maxWidth: {
        page: "860px",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
