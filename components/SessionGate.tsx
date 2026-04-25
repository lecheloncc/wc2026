"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AuthGate from "./AuthGate";
import { Nav } from "./Nav";
import { ActiveParticipantProvider } from "./ActiveParticipant";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-pitch-bg flex items-center justify-center text-slate-500 text-xs uppercase tracking-widest">
        Loading…
      </div>
    );
  }

  if (!email) {
    return <AuthGate />;
  }

  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;

  return (
    <ActiveParticipantProvider authEmail={email}>
      <Nav email={email} isAdmin={isAdmin} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </ActiveParticipantProvider>
  );
}
