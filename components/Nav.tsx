"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandHeader } from "./BrandHeader";
import { supabase } from "../lib/supabase";
import { LogOut } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/predict", label: "Predict" },
  { href: "/groups", label: "Groups" },
  { href: "/topscorers", label: "Topscorers" },
  { href: "/tournament", label: "Tournament" },
  { href: "/bracket", label: "Bracket" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
];

export function Nav({ email, isAdmin }: { email: string | null; isAdmin: boolean }) {
  const pathname = usePathname();
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
