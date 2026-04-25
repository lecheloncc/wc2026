"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { Calendar, Target, Trophy, Users } from "lucide-react";

type NextMatch = {
  id: number;
  kickoff: string;
  home: string | null;
  away: string | null;
  stage: string;
  group_code: string | null;
};

export function Dashboard() {
  const [email, setEmail] = useState<string>("");
  const [totals, setTotals] = useState<{ total: number; rank: number | null }>({
    total: 0,
    rank: null,
  });
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const e = userData.user?.email ?? "";
      setEmail(e);

      const { data: board } = await supabase
        .from("leaderboard_cache")
        .select("user_email,total")
        .order("total", { ascending: false });
      if (board) {
        const idx = board.findIndex((r) => r.user_email === e);
        const mine = board.find((r) => r.user_email === e);
        setTotals({
          total: mine?.total ?? 0,
          rank: idx >= 0 ? idx + 1 : null,
        });
      }

      const { data: m } = await supabase
        .from("matches")
        .select(
          "id, kickoff, stage, group_code, home:home_team_id(name), away:away_team_id(name)"
        )
        .gt("kickoff", new Date().toISOString())
        .order("kickoff", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (m) {
        setNextMatch({
          id: m.id,
          kickoff: m.kickoff,
          stage: m.stage,
          group_code: m.group_code,
          // @ts-expect-error supabase infers relation as array; we selected one row
          home: m.home?.name ?? null,
          // @ts-expect-error see above
          away: m.away?.name ?? null,
        });
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <section className="bg-pitch-card border border-pitch-line rounded-sm p-6">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1">
          Welcome back
        </p>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">
          {email}
        </h1>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Stat label="Total Points" value={totals.total} />
          <Stat label="Rank" value={totals.rank ?? "—"} />
        </div>
      </section>

      {nextMatch && (
        <section className="bg-pitch-card border border-pitch-line rounded-sm p-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2 flex items-center gap-2">
            <Calendar size={12} /> Next Match
          </p>
          <p className="text-white font-bold">
            {nextMatch.home ?? "TBD"} <span className="text-slate-500">vs</span>{" "}
            {nextMatch.away ?? "TBD"}
          </p>
          <p className="text-slate-400 text-xs font-mono mt-1">
            {new Date(nextMatch.kickoff).toLocaleString()} ·{" "}
            {nextMatch.stage === "group"
              ? `Group ${nextMatch.group_code}`
              : nextMatch.stage}
          </p>
          <Link
            href={`/predict/${nextMatch.id}`}
            className="mt-4 inline-block bg-brand-sky hover:bg-sky-500 text-pitch-bg font-bold uppercase text-xs px-4 py-2 rounded-sm"
          >
            Enter Prediction
          </Link>
        </section>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickCard href="/predict" icon={<Target size={16} />} label="All Matches" />
        <QuickCard href="/groups" icon={<Users size={16} />} label="Group Order" />
        <QuickCard href="/topscorers" icon={<Trophy size={16} />} label="Topscorers" />
        <QuickCard href="/leaderboard" icon={<Trophy size={16} />} label="Leaderboard" />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-pitch-bg border border-pitch-line rounded-sm p-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
        {label}
      </p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="bg-pitch-card border border-pitch-line rounded-sm p-4 hover:border-brand-sky transition-colors flex items-center gap-3"
    >
      <span className="text-brand-sky">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </Link>
  );
}
