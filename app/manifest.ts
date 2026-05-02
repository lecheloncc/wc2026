import type { MetadataRoute } from "next";

const IS_WERK = process.env.NEXT_PUBLIC_INSTANCE_THEME === "werk";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: IS_WERK
      ? "WC 2026 — Prediction Game"
      : "World Cup 2026 — Prediction Game",
    short_name: IS_WERK ? "WC 2026" : "WK 2026",
    description: IS_WERK
      ? "Predict the World Cup 2026: matches, groups, topscorers."
      : "Voorspel het WK 2026: wedstrijden, groepsvolgorde, topscoorders.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0B1220",
    theme_color: IS_WERK ? "#16A34A" : "#00A3E0",
    orientation: "portrait",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
