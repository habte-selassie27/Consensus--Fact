import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#090C10",
        surface: "#111820",
        "surface-raised": "#161E28",
        line: "#1E2A38",
        "line-dim": "#161E28",
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
      maxWidth: {
        page: "860px",
      },
    },
  },
  plugins: [],
};

export default config;
