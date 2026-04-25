"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Trophy } from "lucide-react";

type Row = {
  user_email: string;
  match_points: number;
  group_points: number;
  topscorer_points: number;
  tournament_points: number;
  total: number;
};

const COLS = "grid-cols-[36px_1fr_50px_50px_50px_50px_60px]";

export function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u.user?.email ?? "");
      const { data } = await supabase
        .from("leaderboard_cache")
        .select("*")
        .order("total", { ascending: false });
      setRows(
        (data ?? []).map((r) => ({
          ...r,
          tournament_points: r.tournament_points ?? 0,
        }))
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
          const isMe = r.user_email === me;
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
              <span className="truncate">{r.user_email}</span>
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
