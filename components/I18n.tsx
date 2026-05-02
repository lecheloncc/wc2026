"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { tFor, stageLabel, type Lang } from "../lib/i18n/translations";

const STORAGE_KEY = "wc26.lang";
// Default language is configurable per deployment via NEXT_PUBLIC_DEFAULT_LANG.
// Family deployment leaves it unset → "nl". Work deployment sets it to "en".
const DEFAULT_LANG: Lang =
  process.env.NEXT_PUBLIC_DEFAULT_LANG === "en" ? "en" : "nl";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  stageName: (stage: string | null | undefined) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

function readStored(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "en" || v === "nl" ? v : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    setLangState(readStored());
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  };

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: (key: string) => tFor(lang, key),
      stageName: (stage: string | null | undefined) => stageLabel(lang, stage),
    }),
    [lang]
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useT() {
  const ctx = useContext(I18nCtx);
  if (!ctx) {
    // Render-safe fallback: return identity until provider mounts.
    return {
      lang: DEFAULT_LANG,
      setLang: () => {},
      t: (key: string) => tFor(DEFAULT_LANG, key),
      stageName: (stage: string | null | undefined) =>
        stageLabel(DEFAULT_LANG, stage),
    };
  }
  return ctx;
}
