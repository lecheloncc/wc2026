import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          bg: "#0B1220",
          card: "#141E33",
          line: "#1F2A44",
        },
        brand: {
          // brand.sky resolves via CSS var so the work instance can swap it
          // to green at runtime — see body.theme-werk in globals.css
          sky: "var(--color-brand-sky)",
          gold: "#F2C94C",
          grass: "#22C55E",
          red: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
