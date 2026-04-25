"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

export type Profile = {
  participant_key: string;
  owner_email: string;
  display_name: string;
  is_owner: boolean;
};

type Ctx = {
  authEmail: string;
  profiles: Profile[];
  activeKey: string;
  activeProfile: Profile | null;
  setActiveKey: (key: string) => void;
  refresh: () => Promise<void>;
};

const ActiveCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "wc26.active";

function readStored(authEmail: string): string {
  if (typeof window === "undefined") return authEmail;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || authEmail;
  } catch {
    return authEmail;
  }
}

export function ActiveParticipantProvider({
  authEmail,
  children,
}: {
  authEmail: string;
  children: React.ReactNode;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeKey, setActiveKeyState] = useState<string>(() =>
    readStored(authEmail)
  );

  const refresh = useCallback(async () => {
    if (!authEmail) return;
    const { data } = await supabase
      .from("participant_profiles")
      .select("participant_key, owner_email, display_name, is_owner")
      .eq("owner_email", authEmail)
      .order("is_owner", { ascending: false })
      .order("created_at", { ascending: true });

    let list: Profile[] = data ?? [];

    // First-time user: create an owner profile lazily so the rest of the
    // app always has at least one row to show.
    if (list.length === 0) {
      const fallbackName = authEmail.split("@")[0];
      const { error } = await supabase.from("participant_profiles").insert({
        participant_key: authEmail,
        owner_email: authEmail,
        display_name: fallbackName,
        is_owner: true,
      });
      if (!error) {
        list = [
          {
            participant_key: authEmail,
            owner_email: authEmail,
            display_name: fallbackName,
            is_owner: true,
          },
        ];
      }
    }

    setProfiles(list);

    // Make sure the active key is one we actually own; reset to owner if not.
    const owned = new Set(list.map((p) => p.participant_key));
    if (!owned.has(activeKey)) {
      setActiveKeyState(authEmail);
      try {
        window.localStorage.setItem(STORAGE_KEY, authEmail);
      } catch {}
    }
  }, [authEmail, activeKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setActiveKey = useCallback((key: string) => {
    setActiveKeyState(key);
    try {
      window.localStorage.setItem(STORAGE_KEY, key);
    } catch {}
  }, []);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.participant_key === activeKey) ?? null,
    [profiles, activeKey]
  );

  const value = useMemo<Ctx>(
    () => ({
      authEmail,
      profiles,
      activeKey,
      activeProfile,
      setActiveKey,
      refresh,
    }),
    [authEmail, profiles, activeKey, activeProfile, setActiveKey, refresh]
  );

  return <ActiveCtx.Provider value={value}>{children}</ActiveCtx.Provider>;
}

export function useActiveParticipant(): Ctx {
  const ctx = useContext(ActiveCtx);
  if (!ctx) {
    throw new Error(
      "useActiveParticipant must be used inside <ActiveParticipantProvider>"
    );
  }
  return ctx;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}
