"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Lock } from "lucide-react";
import { useActiveParticipant } from "../../components/ActiveParticipant";

type KnockoutMatch = {
  id: number;
  stage: string;
  knockout_slot: string | null;
  kickoff: string;
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
  const { activeKey } = useActiveParticipant();

  useEffect(() => {
    (async () => {
      if (!activeKey) return;

      const { data: ms } = await supabase
        .from("matches")
        .select(
          "id, stage, knockout_slot, kickoff, home_score, away_score, home:home_team_id(name), away:away_team_id(name)"
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

  if (loading) return <p className="text-slate-500 text-xs">Loading…</p>;

  const byStage = STAGES.map((s) => ({
    stage: s,
    rows: matches.filter((m) => m.stage === s),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">
          Knockout Bracket
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scoring multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4.
        </p>
      </div>
      {byStage.map(({ stage, rows }) =>
        rows.length === 0 ? null : (
          <section key={stage}>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">
              {stage}
            </h2>
            <div className="grid gap-2 md:grid-cols-2">
              {rows.map((m) => {
                const locked = new Date(m.kickoff).getTime() <= Date.now();
                const hasActual = m.home_score != null && m.away_score != null;
                return (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="bg-pitch-card border border-pitch-line rounded-sm p-3 hover:border-brand-sky"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                      {m.knockout_slot} · {new Date(m.kickoff).toLocaleString()}
                    </p>
                    <p className="text-sm text-white font-bold mt-1">
                      {m.home_name ?? "TBD"}{" "}
                      <span className="text-slate-500">vs</span>{" "}
                      {m.away_name ?? "TBD"}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs font-mono">
                      <span className="text-brand-sky">
                        {m.pred_home != null
                          ? `Pick ${m.pred_home}–${m.pred_away}`
                          : "No pick"}
                      </span>
                      {hasActual && (
                        <span className="text-brand-gold">
                          {m.home_score}–{m.away_score}
                        </span>
                      )}
                      {locked && !hasActual && (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Lock size={10} /> locked
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}
