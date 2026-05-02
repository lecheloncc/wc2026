import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "../components/I18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// Instance theme: "werk" → green accents; default (unset / anything else) → blue.
// Set NEXT_PUBLIC_INSTANCE_THEME=werk on the work Vercel project.
const INSTANCE_THEME = process.env.NEXT_PUBLIC_INSTANCE_THEME ?? "";
const IS_WERK = INSTANCE_THEME === "werk";

const PWA_TITLE = IS_WERK ? "WK 2026 Werk" : "WK 2026";
const APP_NAME = IS_WERK
  ? "WK 2026 Werk — Prediction Game"
  : "WK 2026 — Prediction Game";

export const metadata: Metadata = {
  title: `${APP_NAME}`,
  description: "Predict the World Cup 2026. Results, group order, topscorers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: PWA_TITLE,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: IS_WERK ? "#16A34A" : "#00A3E0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${mono.variable} font-sans bg-pitch-bg text-slate-200 antialiased ${
          IS_WERK ? "theme-werk" : ""
        }`}
      >
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
