"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Trophy } from "lucide-react";
import { useActiveParticipant } from "../../components/ActiveParticipant";

type Row = {
  user_email: string;
  display_name: string;
  parent_email: string | null;
  is_owner: boolean;
  match_points: number;
  group_points: number;
  topscorer_points: number;
  tournament_points: number;
  total: number;
};

const COLS = "grid-cols-[36px_1fr_50px_50px_50px_50px_60px]";

export function Leaderboard() {
  const { activeKey } = useActiveParticipant();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: board }, { data: profiles }] = await Promise.all([
        supabase
          .from("leaderboard_cache")
          .select("*")
          .order("total", { ascending: false }),
        supabase
          .from("participant_profiles")
          .select("participant_key, display_name, owner_email, is_owner"),
      ]);

      const byKey = new Map(
        (profiles ?? []).map((p) => [p.participant_key, p])
      );

      setRows(
        (board ?? []).map((r) => {
          const profile = byKey.get(r.user_email);
          return {
            user_email: r.user_email,
            display_name: profile?.display_name ?? r.user_email,
            parent_email: profile?.is_owner ? null : profile?.owner_email ?? null,
            is_owner: profile?.is_owner ?? true,
            match_points: r.match_points,
            group_points: r.group_points,
            topscorer_points: r.topscorer_points,
            tournament_points: r.tournament_points ?? 0,
            total: r.total,
          };
        })
      );
    })();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-black italic uppercase tracking-tighter mb-4">
        Leaderboard
      </h1>
      <div className="bg-pitch-card border border-pitch-line rounded-sm overflow-hidden">
        <div
          className={`grid ${COLS} text-[10px] uppercase tracking-widest font-mono text-slate-500 border-b border-pitch-line px-3 py-2`}
        >
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Match</span>
          <span className="text-right">Group</span>
          <span className="text-right">Scorer</span>
          <span className="text-right">Bonus</span>
          <span className="text-right">Total</span>
        </div>
        {rows.length === 0 && (
          <p className="text-slate-500 text-xs px-3 py-6 text-center">
            No scores yet. Come back after the opening match!
          </p>
        )}
        {rows.map((r, i) => {
          const isMe = r.user_email === activeKey;
          return (
            <div
              key={r.user_email}
              className={`grid ${COLS} items-center px-3 py-2 text-sm border-b border-pitch-line/50 ${
                isMe ? "bg-brand-sky/10" : ""
              }`}
            >
              <span className="font-mono text-slate-500 flex items-center gap-1">
                {i < 3 && <Trophy size={12} className="text-brand-gold" />}
                {i + 1}
              </span>
              <span className="truncate">
                {r.display_name}
                {!r.is_owner && (
                  <span className="ml-2 text-[10px] text-slate-500 font-mono">
                    ({r.parent_email?.split("@")[0]}&apos;s)
                  </span>
                )}
              </span>
              <span className="text-right font-mono text-xs">{r.match_points}</span>
              <span className="text-right font-mono text-xs">{r.group_points}</span>
              <span className="text-right font-mono text-xs">{r.topscorer_points}</span>
              <span className="text-right font-mono text-xs">{r.tournament_points}</span>
              <span className="text-right font-bold">{r.total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
