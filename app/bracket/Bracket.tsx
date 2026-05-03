"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useActiveParticipant } from "../../components/ActiveParticipant";
import { useT } from "../../components/I18n";
import { InlineScoreEditor } from "../../components/InlineScoreEditor";

type KnockoutMatch = {
  id: number;
  stage: string;
  knockout_slot: string | null;
  kickoff: string;
  home_team_id: number | null;
  away_team_id: number | null;
  home_name: string | null;
  away_name: string | null;
  home_score: number | null;
  away_score: number | null;
  pred_home: number | null;
  pred_away: number | null;
};

const STAGES = ["R32", "R16", "QF", "SF", "3rd", "final"];

export function Bracket() {
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidePredicted, setHidePredicted] = useState(false);
  const { activeKey } = useActiveParticipant();
  const { t, stageName } = useT();

  useEffect(() => {
    (async () => {
      if (!activeKey) return;

      const { data: ms } = await supabase
        .from("matches")
        .select(
          "id, stage, knockout_slot, kickoff, home_team_id, away_team_id, home_score, away_score, home:home_team_id(name), away:away_team_id(name)"
        )
        .in("stage", STAGES)
        .order("kickoff");

      const { data: preds } = await supabase
        .from("match_predictions")
        .select("match_id, pred_home, pred_away")
        .eq("user_email", activeKey);
      const predMap = new Map(preds?.map((p) => [p.match_id, p]) ?? []);

      setMatches(
        (ms ?? []).map((m) => ({
          id: m.id,
          stage: m.stage,
          knockout_slot: m.knockout_slot,
          kickoff: m.kickoff,
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
    () => matches.filter((m) => m.pred_home != null).length,
    [matches]
  );

  function onSavedRow(matchId: number, pred: { pred_home: number; pred_away: number }) {
    setMatches((cur) =>
      cur.map((m) =>
        m.id === matchId
          ? { ...m, pred_home: pred.pred_home, pred_away: pred.pred_away }
          : m
      )
    );
  }

  if (loading) return <p className="text-slate-500 text-xs">{t("Loading…")}</p>;

  const filtered = hidePredicted
    ? matches.filter((m) => m.pred_home == null)
    : matches;

  const byStage = STAGES.map((s) => ({
    stage: s,
    rows: filtered.filter((m) => m.stage === s),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter">
            {t("Knockout Bracket")}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t("Scoring multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4.")}
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
            style={{
              width: `${(predictedCount / Math.max(matches.length, 1)) * 100}%`,
            }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
          {predictedCount} / {matches.length} {t("voorspeld")}
        </span>
      </div>

      {byStage.map(({ stage, rows }) =>
        rows.length === 0 ? null : (
          <section key={stage}>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">
              {stageName(stage)}
            </h2>
            <div className="grid gap-2 md:grid-cols-2">
              {rows.map((m) => {
                const locked = new Date(m.kickoff).getTime() <= Date.now();
                const hasActual = m.home_score != null && m.away_score != null;
                const hasPred = m.pred_home != null && m.pred_away != null;
                const teamsAssigned =
                  m.home_team_id != null && m.away_team_id != null;
                const editable = !locked && teamsAssigned;
                return (
                  <div
                    key={m.id}
                    className={`bg-pitch-card border rounded-sm p-3 transition-colors ${
                      hasPred ? "border-brand-grass/40" : "border-pitch-line"
                    }`}
                  >
                    <Link
                      href={`/matches/${m.id}`}
                      className="block hover:opacity-90"
                    >
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                        {m.knockout_slot} · {new Date(m.kickoff).toLocaleString()}
                      </p>
                      <p className="text-sm text-white font-bold mt-1">
                        {m.home_name ?? t("TBD")}{" "}
                        <span className="text-slate-500">vs</span>{" "}
                        {m.away_name ?? t("TBD")}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-xs font-mono">
                        <span>
                          {hasPred ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-brand-grass bg-brand-grass/10 border border-brand-grass/40 rounded-sm px-2 py-0.5">
                              <CheckCircle size={10} /> {m.pred_home}–{m.pred_away}
                            </span>
                          ) : (
                            <span className="text-slate-600">{t("No pick")}</span>
                          )}
                        </span>
                        {hasActual && (
                          <span className="text-brand-gold">
                            {m.home_score}–{m.away_score}
                          </span>
                        )}
                        {locked && !hasActual && (
                          <span className="text-slate-500 flex items-center gap-1">
                            <Lock size={10} /> {t("locked")}
                          </span>
                        )}
                      </div>
                    </Link>

                    {editable && (
                      <div className="mt-2 pt-2 border-t border-pitch-line/60 flex items-center justify-end">
                        <InlineScoreEditor
                          matchId={m.id}
                          activeKey={activeKey}
                          initialPredHome={m.pred_home}
                          initialPredAway={m.pred_away}
                          onSaved={(p) => onSavedRow(m.id, p)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}
