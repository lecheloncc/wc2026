"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandHeader } from "./BrandHeader";
import { supabase } from "../lib/supabase";
import { LogOut, User, ChevronDown, Settings } from "lucide-react";
import { useActiveParticipant } from "./ActiveParticipant";
import { useState } from "react";

// Brand logo doubles as the home link, so no separate Home tab here.
const LINKS = [
  { href: "/matches", label: "Matches" },
  { href: "/groups", label: "Groups" },
  { href: "/predictions", label: "Predictions" },
  { href: "/bracket", label: "Bracket" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
];

export function Nav({ email, isAdmin }: { email: string | null; isAdmin: boolean }) {
  const pathname = usePathname();
  const { profiles, activeKey, activeProfile, setActiveKey } = useActiveParticipant();
  const [open, setOpen] = useState(false);

  const displayName =
    activeProfile?.display_name ?? email?.split("@")[0] ?? "";

  return (
    <header className="border-b border-pitch-line bg-pitch-bg/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <BrandHeader />
        <nav className="hidden md:flex items-center gap-0.5 min-w-0">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide rounded-sm transition-colors whitespace-nowrap ${
                  active
                    ? "bg-brand-sky text-pitch-bg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide rounded-sm transition-colors whitespace-nowrap ${
                pathname.startsWith("/admin")
                  ? "bg-brand-gold text-pitch-bg"
                  : "text-brand-gold hover:text-yellow-300"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2 shrink-0 relative">
          <button
            onClick={() => setOpen((o) => !o)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-300 hover:text-white border border-pitch-line rounded-sm px-2.5 py-1.5"
            title="Profile menu"
          >
            <User size={12} />
            <span className="max-w-[140px] truncate">{displayName}</span>
            <ChevronDown size={12} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 bg-pitch-card border border-pitch-line rounded-sm shadow-2xl py-1 min-w-[200px] z-30">
              {profiles.length > 1 && (
                <>
                  <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-widest text-slate-500 font-mono">
                    Playing as
                  </p>
                  <ul>
                    {profiles.map((p) => (
                      <li key={p.participant_key}>
                        <button
                          onClick={() => {
                            setActiveKey(p.participant_key);
                            setOpen(false);
                            window.location.reload();
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-2 ${
                            p.participant_key === activeKey
                              ? "bg-brand-sky/20 text-brand-sky"
                              : "text-slate-300 hover:bg-pitch-bg"
                          }`}
                        >
                          <User size={10} />
                          <span className="flex-1 truncate">{p.display_name}</span>
                          {p.is_owner && (
                            <span className="text-[9px] text-slate-500 font-mono">
                              (you)
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="my-1 border-t border-pitch-line" />
                </>
              )}
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-300 hover:bg-pitch-bg"
              >
                <Settings size={10} /> Account
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-brand-red hover:bg-pitch-bg"
                title={email ?? undefined}
              >
                <LogOut size={10} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="md:hidden border-t border-pitch-line">
        <div className="max-w-6xl mx-auto px-2 py-2 flex items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors ${
                  active
                    ? "bg-brand-sky text-pitch-bg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm text-brand-gold"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
