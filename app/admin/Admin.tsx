"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { computeTotals } from "../../lib/scoring/totals";
import { deriveTournamentResults } from "../../lib/scoring/tournament";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { GoalEntry } from "./GoalEntry";

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();

type Match = {
  id: number;
  stage: string;
  group_code: string | null;
  knockout_slot: string | null;
  kickoff: string;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  home_name: string | null;
  away_name: string | null;
};

export function Admin() {
  const [email, setEmail] = useState("");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [recomputing, setRecomputing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const e = u.user?.email ?? "";
      setEmail(e);
      setAuthorized(e.toLowerCase() === ADMIN_EMAIL);
      if (e.toLowerCase() === ADMIN_EMAIL) await loadMatches();
    })();
  }, []);

  async function loadMatches() {
    const { data } = await supabase
      .from("matches")
      .select(
        "id, stage, group_code, knockout_slot, kickoff, home_team_id, away_team_id, home_score, away_score, status, home:home_team_id(name), away:away_team_id(name)"
      )
      .order("kickoff");
    setMatches(
      (data ?? []).map((m) => ({
        ...m,
        // @ts-expect-error relation
        home_name: m.home?.name ?? null,
        // @ts-expect-error relation
        away_name: m.away?.name ?? null,
      }))
    );
  }

  async function saveResult(m: Match, home: number, away: number) {
    const { error } = await supabase
      .from("matches")
      .update({ home_score: home, away_score: away, status: "final" })
      .eq("id", m.id);
    if (error) {
      setMsg(`Save FAILED for ${m.home_name ?? "?"} vs ${m.away_name ?? "?"}: ${error.message}`);
      return;
    }
    setMsg(`Saved ${m.home_name ?? "?"} ${home}–${away} ${m.away_name ?? "?"}`);
    await loadMatches();
  }

  async function resetResult(m: Match) {
    const { error } = await supabase
      .from("matches")
      .update({ home_score: null, away_score: null, status: "scheduled" })
      .eq("id", m.id);
    if (error) {
      setMsg(`Reset FAILED for ${m.home_name ?? "?"} vs ${m.away_name ?? "?"}: ${error.message}`);
      return;
    }
    setMsg(`Reset ${m.home_name ?? "?"} vs ${m.away_name ?? "?"} (result cleared)`);
    await loadMatches();
  }

  async function recompute() {
    setRecomputing(true);
    setMsg(null);
    try {
      const [
        { data: ms },
        { data: msFull },
        { data: mp },
        { data: gp },
        { data: gr },
        { data: tp },
        { data: pg },
        { data: tn },
      ] = await Promise.all([
        supabase.from("matches").select("id, stage, home_score, away_score"),
        supabase
          .from("matches")
          .select("stage, status, home_team_id, away_team_id, home_score, away_score"),
        supabase.from("match_predictions").select("user_email, match_id, pred_home, pred_away"),
        supabase.from("group_predictions").select("user_email, group_code, order_team_ids"),
        supabase.from("group_results").select("group_code, order_team_ids"),
        supabase.from("topscorer_picks").select("user_email, player_ids"),
        supabase.from("player_goals").select("player_id"),
        supabase.from("tournament_picks").select("*"),
      ]);

      const tournamentResults = deriveTournamentResults(msFull ?? []);
      const tournamentPicks = (tn ?? []).map((row) => ({
        user_email: row.user_email,
        championTeamId: row.champion_team_id,
        finalistATeamId: row.finalist_a_team_id,
        finalistBTeamId: row.finalist_b_team_id,
        darkHorseTeamId: row.dark_horse_team_id,
      }));

      const goalsByPlayer: Record<number, number> = {};
      for (const g of pg ?? []) goalsByPlayer[g.player_id] = (goalsByPlayer[g.player_id] ?? 0) + 1;

      let topGoals = 0;
      for (const n of Object.values(goalsByPlayer)) if (n > topGoals) topGoals = n;
      const goldenBootIds =
        topGoals > 0
          ? Object.keys(goalsByPlayer)
              .filter((k) => goalsByPlayer[Number(k)] === topGoals)
              .map(Number)
          : [];

      const totals = computeTotals({
        matches: (ms ?? []) as Parameters<typeof computeTotals>[0]["matches"],
        matchPredictions: mp ?? [],
        groupPredictions: gp ?? [],
        groupActuals: gr ?? [],
        topscorerPicks: tp ?? [],
        tournamentPicks,
        tournamentResults,
        goalsByPlayer,
        goldenBootPlayerIds: goldenBootIds,
      });

      if (totals.length > 0) {
        await supabase.from("leaderboard_cache").upsert(
          totals.map((t) => ({
            user_email: t.email,
            match_points: t.matchPoints,
            group_points: t.groupPoints,
            topscorer_points: t.topscorerPoints,
            tournament_points: t.tournamentPoints,
            total: t.total,
            updated_at: new Date().toISOString(),
          }))
        );
      }
      setMsg(`Recomputed leaderboard for ${totals.length} user(s).`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Recompute failed");
    } finally {
      setRecomputing(false);
    }
  }

  if (authorized === null) return <p className="text-slate-500">Checking…</p>;
  if (!authorized) {
    return (
      <div className="max-w-md mx-auto bg-pitch-card border border-pitch-line p-6 rounded-sm flex gap-3">
        <AlertCircle className="text-brand-red shrink-0" />
        <div>
          <p className="font-bold">Not authorized</p>
          <p className="text-xs text-slate-400 mt-1">
            Signed in as {email}. Admin access requires {ADMIN_EMAIL || "NEXT_PUBLIC_ADMIN_EMAIL"}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-black italic uppercase tracking-tighter">
          Admin — Results Entry
        </h1>
        <button
          onClick={recompute}
          disabled={recomputing}
          className="bg-brand-gold text-pitch-bg font-bold uppercase text-xs px-4 py-2 rounded-sm flex items-center gap-2 disabled:opacity-50"
        >
          {recomputing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Recompute Leaderboard
        </button>
      </div>

      {msg && (
        <p
          className={`text-xs font-mono rounded-sm p-3 border ${
            msg.includes("FAILED")
              ? "text-red-300 bg-red-900/20 border-red-500/40"
              : "text-brand-grass bg-pitch-card border-pitch-line"
          }`}
        >
          {msg}
        </p>
      )}

      <GoalEntry matches={matches} />

      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">
          Match Results
        </h2>
        <div className="space-y-2">
          {matches.map((m) => (
            <MatchRow key={m.id} m={m} onSave={saveResult} onReset={resetResult} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchRow({
  m,
  onSave,
  onReset,
}: {
  m: Match;
  onSave: (m: Match, h: number, a: number) => Promise<void>;
  onReset: (m: Match) => Promise<void>;
}) {
  const [home, setHome] = useState<number>(m.home_score ?? 0);
  const [away, setAway] = useState<number>(m.away_score ?? 0);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const hasResult = m.home_score != null && m.away_score != null;
  return (
    <div className="bg-pitch-card border border-pitch-line rounded-sm p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
          {m.stage === "group" ? `Group ${m.group_code}` : m.knockout_slot ?? m.stage} ·{" "}
          {new Date(m.kickoff).toLocaleString()}
        </p>
        <p className="text-sm truncate">
          {m.home_name ?? "TBD"}{" "}
          <span className="text-slate-500">vs</span> {m.away_name ?? "TBD"}
        </p>
      </div>
      <input
        type="number"
        min={0}
        value={home}
        onChange={(e) => setHome(Math.max(0, Number(e.target.value) || 0))}
        className="w-14 h-9 text-center bg-pitch-bg border border-pitch-line rounded-sm"
      />
      <span className="text-slate-500">–</span>
      <input
        type="number"
        min={0}
        value={away}
        onChange={(e) => setAway(Math.max(0, Number(e.target.value) || 0))}
        className="w-14 h-9 text-center bg-pitch-bg border border-pitch-line rounded-sm"
      />
      <button
        onClick={async () => {
          setSaving(true);
          await onSave(m, home, away);
          setSaving(false);
        }}
        disabled={saving || !m.home_team_id || !m.away_team_id}
        className={`font-bold uppercase text-[10px] px-3 py-2 rounded-sm ${
          hasResult
            ? "bg-brand-grass/20 text-brand-grass border border-brand-grass/40"
            : "bg-brand-sky text-pitch-bg"
        } disabled:opacity-40`}
      >
        {saving ? "…" : hasResult ? "Update" : "Save"}
      </button>
      {hasResult &&
        (confirmReset ? (
          <>
            <button
              onClick={async () => {
                setSaving(true);
                await onReset(m);
                setSaving(false);
                setConfirmReset(false);
                setHome(0);
                setAway(0);
              }}
              disabled={saving}
              className="font-bold uppercase text-[10px] px-3 py-2 rounded-sm bg-brand-red/20 text-brand-red border border-brand-red/40"
              title="Confirm reset"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="font-bold uppercase text-[10px] px-2 py-2 rounded-sm text-slate-500 hover:text-brand-red border border-pitch-line"
            title="Reset (clear result)"
          >
            Reset
          </button>
        ))}
    </div>
  );
}
