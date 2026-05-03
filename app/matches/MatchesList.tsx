"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useActiveParticipant } from "../../components/ActiveParticipant";
import { useT } from "../../components/I18n";
import { InlineScoreEditor } from "../../components/InlineScoreEditor";

type Row = {
  id: number;
  kickoff: string;
  stage: string;
  group_code: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
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
  const [hidePredicted, setHidePredicted] = useState(false);

  useEffect(() => {
    (async () => {
      if (!activeKey) return;

      // Only group-stage matches here. Knockout predictions live on /bracket
      // so users don't accidentally predict the same match twice.
      const { data: matches } = await supabase
        .from("matches")
        .select(
          "id, kickoff, stage, group_code, home_team_id, away_team_id, home_score, away_score, home:home_team_id(name), away:away_team_id(name)"
        )
        .eq("stage", "group")
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
          home_team_id: m.home_team_id,
          away_team_id: m.away_team_id,
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

  const predictedCount = useMemo(
    () => rows.filter((r) => r.pred_home != null).length,
    [rows]
  );
  const visibleRows = useMemo(
    () => (hidePredicted ? rows.filter((r) => r.pred_home == null) : rows),
    [rows, hidePredicted]
  );

  function onSavedRow(matchId: number, pred: { pred_home: number; pred_away: number }) {
    setRows((cur) =>
      cur.map((r) =>
        r.id === matchId
          ? { ...r, pred_home: pred.pred_home, pred_away: pred.pred_away }
          : r
      )
    );
  }

  if (loading)
    return <p className="text-slate-500 text-xs uppercase">{t("Loading…")}</p>;
  const now = Date.now();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter">
            {t("All Matches")}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t("Group stage. Knockout matches live on the Bracket page.")}
          </p>
        </div>
        <button
          onClick={() => setHidePredicted((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-slate-300 hover:text-white border border-pitch-line rounded-sm px-3 py-1.5"
        >
          {hidePredicted ? <Eye size={12} /> : <EyeOff size={12} />}
          {hidePredicted ? t("Show all") : t("Hide predicted")}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-pitch-line rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-grass transition-all"
            style={{ width: `${(predictedCount / Math.max(rows.length, 1)) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
          {predictedCount} / {rows.length} {t("voorspeld")}
        </span>
      </div>

      <div className="space-y-2 pt-2">
        {visibleRows.length === 0 && (
          <p className="text-slate-500 text-xs px-3 py-6 text-center">
            {hidePredicted
              ? t("All matches predicted!")
              : t("No matches yet.")}
          </p>
        )}
        {visibleRows.map((r) => {
          const locked = new Date(r.kickoff).getTime() <= now;
          const hasActual = r.home_score != null && r.away_score != null;
          const hasPred = r.pred_home != null && r.pred_away != null;
          const teamsAssigned = r.home_team_id != null && r.away_team_id != null;
          const editable = !locked && teamsAssigned;

          return (
            <div
              key={r.id}
              className={`bg-pitch-card border rounded-sm p-3 transition-colors ${
                hasPred ? "border-brand-grass/40" : "border-pitch-line"
              }`}
            >
              <Link
                href={`/matches/${r.id}`}
                className="block hover:opacity-90 transition-opacity"
              >
                <div className="flex items-start justify-between gap-3">
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
                  <div className="text-right shrink-0 text-xs font-mono space-y-0.5">
                    {hasActual && (
                      <p className="text-brand-gold font-bold">
                        {r.home_score}–{r.away_score}
                      </p>
                    )}
                    {hasPred && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-brand-grass bg-brand-grass/10 border border-brand-grass/40 rounded-sm px-2 py-0.5">
                        <CheckCircle size={10} /> {r.pred_home}–{r.pred_away}
                      </span>
                    )}
                    {locked && (
                      <p className="text-slate-500 flex items-center gap-1 justify-end">
                        <Lock size={10} /> {t("locked")}
                      </p>
                    )}
                  </div>
                </div>
              </Link>

              {editable && (
                <div className="mt-2 pt-2 border-t border-pitch-line/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono shrink-0 truncate">
                    {(r.home_name ?? "").slice(0, 3).toUpperCase()} – {(r.away_name ?? "").slice(0, 3).toUpperCase()}
                  </span>
                  <InlineScoreEditor
                    matchId={r.id}
                    activeKey={activeKey}
                    initialPredHome={r.pred_home}
                    initialPredAway={r.pred_away}
                    onSaved={(p) => onSavedRow(r.id, p)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
