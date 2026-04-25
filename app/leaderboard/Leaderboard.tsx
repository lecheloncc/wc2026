"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Trophy } from "lucide-react";
import { useActiveParticipant } from "../../components/ActiveParticipant";
import { useT } from "../../components/I18n";

type Row = {
  user_email: string;
  display_name: string;
  parent_display_name: string | null;
  is_owner: boolean;
  match_points: number;
  group_points: number;
  topscorer_points: number;
  tournament_points: number;
  total: number;
};

const COLS =
  "grid-cols-[28px_1fr_60px_55px_55px_55px_60px] gap-x-2";

export function Leaderboard() {
  const { activeKey } = useActiveParticipant();
  const { t } = useT();
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
      // Map owner-email → owner profile, so kid rows can show the parent's
      // display name (instead of the parent's email local-part).
      const ownerByEmail = new Map(
        (profiles ?? [])
          .filter((p) => p.is_owner)
          .map((p) => [p.owner_email, p])
      );

      setRows(
        (board ?? []).map((r) => {
          const profile = byKey.get(r.user_email);
          const ownerProfile =
            profile && !profile.is_owner
              ? ownerByEmail.get(profile.owner_email)
              : null;
          return {
            user_email: r.user_email,
            display_name: profile?.display_name ?? r.user_email,
            parent_display_name:
              ownerProfile?.display_name ??
              (profile && !profile.is_owner
                ? profile.owner_email.split("@")[0]
                : null),
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
        {t("Leaderboard")}
      </h1>
      <div className="bg-pitch-card border border-pitch-line rounded-sm overflow-hidden">
        <div
          className={`grid ${COLS} text-[10px] uppercase tracking-widest font-mono text-slate-500 border-b border-pitch-line px-3 py-2`}
        >
          <span>#</span>
          <span>{t("Player")}</span>
          <span className="text-right">{t("Match")}</span>
          <span className="text-right">{t("Group")}</span>
          <span className="text-right">{t("Scorer")}</span>
          <span className="text-right">{t("Bonus")}</span>
          <span className="text-right">{t("Total")}</span>
        </div>
        {rows.length === 0 && (
          <p className="text-slate-500 text-xs px-3 py-6 text-center">
            {t("No scores yet. Come back after the opening match!")}
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
                {!r.is_owner && r.parent_display_name && (
                  <span className="ml-2 text-[10px] text-slate-500 font-mono">
                    ({r.parent_display_name}&apos;s)
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
