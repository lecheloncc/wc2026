"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandHeader } from "./BrandHeader";
import { supabase } from "../lib/supabase";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useActiveParticipant } from "./ActiveParticipant";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
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

  const showSwitcher = profiles.length > 1;
  const displayName =
    activeProfile?.display_name ?? email?.split("@")[0] ?? "";

  return (
    <header className="border-b border-pitch-line bg-pitch-bg/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <BrandHeader />
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
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
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-brand-gold text-pitch-bg"
                  : "text-brand-gold hover:text-yellow-300"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {showSwitcher && (
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white border border-pitch-line rounded-sm px-2 py-1"
                title="Playing as"
              >
                <User size={12} />
                <span className="max-w-[100px] truncate">{displayName}</span>
                <ChevronDown size={12} />
              </button>
              {open && (
                <ul className="absolute right-0 mt-1 bg-pitch-card border border-pitch-line rounded-sm shadow-2xl py-1 min-w-[160px] z-30">
                  {profiles.map((p) => (
                    <li key={p.participant_key}>
                      <button
                        onClick={() => {
                          setActiveKey(p.participant_key);
                          setOpen(false);
                          // Reload so every page re-fetches data for the new participant.
                          window.location.reload();
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                          p.participant_key === activeKey
                            ? "bg-brand-sky/20 text-brand-sky"
                            : "text-slate-300 hover:bg-pitch-bg"
                        }`}
                      >
                        {p.display_name}
                        {p.is_owner && (
                          <span className="ml-2 text-[9px] text-slate-500 font-mono">
                            (you)
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <Link
            href="/account"
            className={`hidden md:inline text-[10px] uppercase tracking-widest font-bold transition-colors ${
              pathname === "/account"
                ? "text-brand-sky"
                : "text-slate-500 hover:text-white"
            }`}
            title="Account"
          >
            Account
          </Link>
          {email && (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-brand-red transition-colors"
              title={email}
            >
              <LogOut size={14} /> Sign Out
            </button>
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
          <Link
            href="/account"
            className={`shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors ${
              pathname === "/account"
                ? "bg-brand-sky text-pitch-bg"
                : "text-slate-400"
            }`}
          >
            Account
          </Link>
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
