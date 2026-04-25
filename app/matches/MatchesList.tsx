"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { Lock } from "lucide-react";
import { useActiveParticipant } from "../../components/ActiveParticipant";
import { useT } from "../../components/I18n";

type Row = {
  id: number;
  kickoff: string;
  stage: string;
  group_code: string | null;
  home_name: string | null;
  away_name: string | null;
  home_score: number | null;
  away_score: number | null;
  pred_home: number | null;
  pred_away: number | null;
};

export function MatchesList() {
  const { activeKey } = useActiveParticipant();
  const { t, stageName } = useT();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!activeKey) return;

      const { data: matches } = await supabase
        .from("matches")
        .select(
          "id, kickoff, stage, group_code, home_score, away_score, home:home_team_id(name), away:away_team_id(name)"
        )
        .order("kickoff", { ascending: true });

      const { data: preds } = await supabase
        .from("match_predictions")
        .select("match_id, pred_home, pred_away")
        .eq("user_email", activeKey);
      const predMap = new Map(preds?.map((p) => [p.match_id, p]) ?? []);

      setRows(
        (matches ?? []).map((m) => ({
          id: m.id,
          kickoff: m.kickoff,
          stage: m.stage,
          group_code: m.group_code,
          // @ts-expect-error relation
          home_name: m.home?.name ?? null,
          // @ts-expect-error relation
          away_name: m.away?.name ?? null,
          home_score: m.home_score,
          away_score: m.away_score,
          pred_home: predMap.get(m.id)?.pred_home ?? null,
          pred_away: predMap.get(m.id)?.pred_away ?? null,
        }))
      );
      setLoading(false);
    })();
  }, [activeKey]);

  if (loading)
    return <p className="text-slate-500 text-xs uppercase">{t("Loading…")}</p>;
  const now = Date.now();

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-black italic uppercase tracking-tighter mb-4">
        {t("All Matches")}
      </h1>
      {rows.map((r) => {
        const locked = new Date(r.kickoff).getTime() <= now;
        const hasActual = r.home_score != null && r.away_score != null;
        const hasPred = r.pred_home != null && r.pred_away != null;
        return (
          <Link
            key={r.id}
            href={`/matches/${r.id}`}
            className="block bg-pitch-card border border-pitch-line rounded-sm p-4 hover:border-brand-sky transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                  {new Date(r.kickoff).toLocaleString()} ·{" "}
                  {r.stage === "group"
                    ? `${t("Group")} ${r.group_code}`
                    : stageName(r.stage)}
                </p>
                <p className="text-white font-bold truncate">
                  {r.home_name ?? t("TBD")}{" "}
                  <span className="text-slate-500">vs</span>{" "}
                  {r.away_name ?? t("TBD")}
                </p>
              </div>
              <div className="text-right shrink-0 text-xs font-mono">
                {hasActual && (
                  <p className="text-brand-gold font-bold">
                    {r.home_score}–{r.away_score}
                  </p>
                )}
                {hasPred ? (
                  <p className="text-brand-sky">
                    {t("Pick:")} {r.pred_home}–{r.pred_away}
                  </p>
                ) : (
                  <p className="text-slate-600">{t("No pick")}</p>
                )}
                {locked && (
                  <p className="text-slate-500 flex items-center gap-1 justify-end mt-1">
                    <Lock size={10} /> {t("locked")}
                  </p>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
