"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { scoreMatch, type Stage } from "../../../lib/scoring/match";
import { Lock, CheckCircle } from "lucide-react";
import { useActiveParticipant } from "../../../components/ActiveParticipant";
import { useT } from "../../../components/I18n";

type Match = {
  id: number;
  stage: Stage;
  group_code: string | null;
  kickoff: string;
  home_name: string | null;
  away_name: string | null;
  home_score: number | null;
  away_score: number | null;
};

export function MatchOne({ matchId }: { matchId: number }) {
  const router = useRouter();
  const { activeKey, activeProfile } = useActiveParticipant();
  const { t, stageName } = useT();
  const [match, setMatch] = useState<Match | null>(null);
  const [predHome, setPredHome] = useState<number>(0);
  const [predAway, setPredAway] = useState<number>(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!activeKey) return;
      const { data: m } = await supabase
        .from("matches")
        .select(
          "id, stage, group_code, kickoff, home_score, away_score, home:home_team_id(name), away:away_team_id(name)"
        )
        .eq("id", matchId)
        .maybeSingle();
      if (m) {
        setMatch({
          id: m.id,
          stage: m.stage,
          group_code: m.group_code,
          kickoff: m.kickoff,
          home_score: m.home_score,
          away_score: m.away_score,
          // @ts-expect-error relation
          home_name: m.home?.name ?? null,
          // @ts-expect-error relation
          away_name: m.away?.name ?? null,
        });
      }

      const { data: p } = await supabase
        .from("match_predictions")
        .select("pred_home, pred_away")
        .eq("user_email", activeKey)
        .eq("match_id", matchId)
        .maybeSingle();
      if (p) {
        setPredHome(p.pred_home);
        setPredAway(p.pred_away);
      } else {
        setPredHome(0);
        setPredAway(0);
      }
      setLoading(false);
    })();
  }, [matchId, activeKey]);

  if (loading || !match) return <p className="text-slate-500 text-xs">{t("Loading…")}</p>;

  const locked = new Date(match.kickoff).getTime() <= Date.now();
  const hasActual = match.home_score != null && match.away_score != null;
  const breakdown = hasActual
    ? scoreMatch(predHome, predAway, match.home_score!, match.away_score!, match.stage)
    : null;

  async function save() {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    const { error } = await supabase.from("match_predictions").upsert({
      user_email: activeKey,
      match_id: matchId,
      pred_home: predHome,
      pred_away: predAway,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setSaveError(error.message);
    } else {
      setSaved(true);
      setTimeout(() => router.push("/matches"), 600);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
          {match.stage === "group"
            ? `${t("Group")} ${match.group_code}`
            : stageName(match.stage)}{" "}
          · {new Date(match.kickoff).toLocaleString()}
        </p>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white mt-2">
          {match.home_name ?? t("TBD")} <span className="text-slate-500">vs</span>{" "}
          {match.away_name ?? t("TBD")}
        </h1>
        {activeProfile && (
          <p className="text-[10px] text-slate-500 font-mono mt-2">
            {t("Saving as")} {activeProfile.display_name}
          </p>
        )}
      </div>

      <div className="bg-pitch-card border border-pitch-line rounded-sm p-6">
        <div className="flex items-center justify-center gap-4">
          <ScoreInput
            label={match.home_name ?? t("Home")}
            value={predHome}
            onChange={setPredHome}
            disabled={locked}
          />
          <span className="text-slate-500 text-xl font-mono">–</span>
          <ScoreInput
            label={match.away_name ?? t("Away")}
            value={predAway}
            onChange={setPredAway}
            disabled={locked}
          />
        </div>

        {locked ? (
          <p className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Lock size={12} /> {t("Locked at kickoff")}
          </p>
        ) : (
          <>
            <button
              onClick={save}
              disabled={saving}
              className="mt-6 w-full bg-brand-sky hover:brightness-110 text-pitch-bg font-bold uppercase py-3 rounded-sm disabled:opacity-50"
            >
              {saved
                ? t("Saved!")
                : saving
                ? t("Saving…")
                : t("Save Prediction")}
            </button>
            {saveError && (
              <p className="mt-3 text-xs text-red-400 font-mono bg-red-900/20 border border-red-500/40 rounded-sm p-3">
                {t("Save failed:")} {saveError}
              </p>
            )}
          </>
        )}

        {hasActual && breakdown && (
          <div className="mt-6 pt-4 border-t border-pitch-line">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">
              {t("Result:")} {match.home_score}–{match.away_score}
            </p>
            <div className="text-xs font-mono text-slate-300 space-y-1">
              <Row k={t("Correct outcome")} v={breakdown.outcome} />
              <Row k={t("Goal difference")} v={breakdown.goalDiff} />
              <Row k={t("One side exact")} v={breakdown.oneSide} />
              <Row k={t("Exact bonus")} v={breakdown.exactBonus} />
              {breakdown.multiplier !== 1 && (
                <Row
                  k={`× ${breakdown.multiplier} (${stageName(match.stage)})`}
                  v={""}
                />
              )}
              <Row k={t("Total")} v={breakdown.total} bold />
            </div>
            {breakdown.exact && (
              <p className="mt-3 text-brand-gold text-xs flex items-center gap-2">
                <CheckCircle size={14} /> {t("Perfect score!")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono text-center max-w-[80px] truncate">
        {label}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled}
          className="w-8 h-8 rounded-sm bg-pitch-bg border border-pitch-line text-white disabled:opacity-40"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-14 h-12 text-center bg-pitch-bg border border-pitch-line rounded-sm text-2xl font-black text-white disabled:opacity-60"
        />
        <button
          onClick={() => onChange(value + 1)}
          disabled={disabled}
          className="w-8 h-8 rounded-sm bg-pitch-bg border border-pitch-line text-white disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: number | string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-white font-bold" : ""}`}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
