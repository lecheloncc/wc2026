"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";
import { scoreMatch, type Stage } from "../../lib/scoring/match";
import { scoreGroupOrder } from "../../lib/scoring/groups";
import { scoreTopscorerPicks } from "../../lib/scoring/topscorer";
import {
  scoreTournamentPicks,
  deriveTournamentResults,
  type TournamentResults,
} from "../../lib/scoring/tournament";

type Profile = { participant_key: string; display_name: string };
type Team = { id: number; name: string; flag_emoji: string | null };
type Player = { id: number; name: string; team_id: number };
type MatchRow = {
  id: number;
  stage: string;
  group_code: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  kickoff: string;
};

type CachedRow = {
  user_email: string;
  match_points: number;
  group_points: number;
  topscorer_points: number;
  tournament_points: number;
  total: number;
};

/**
 * Admin reconciliation tool — pick a participant, see every prediction +
 * scored points side-by-side with the cached leaderboard totals.
 *
 * Read-only. Re-computes everything client-side using the same scoring
 * functions as the recompute action, so any discrepancy with leaderboard_cache
 * points at either stale cache (admin forgot Recompute) or a bug.
 */
export function Reconciliation() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Reference data (shared across participants)
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [groupActuals, setGroupActuals] = useState<
    { group_code: string; order_team_ids: number[] }[]
  >([]);
  const [goalsByPlayer, setGoalsByPlayer] = useState<Record<number, number>>({});
  const [goldenBootIds, setGoldenBootIds] = useState<number[]>([]);
  const [tournamentResults, setTournamentResults] = useState<TournamentResults>({
    championTeamId: null,
    finalistTeamIds: [],
    maxRoundByTeam: {},
  });
  const [cachedRows, setCachedRows] = useState<CachedRow[]>([]);

  useEffect(() => {
    (async () => {
      const [
        profilesRes,
        teamsRes,
        playersRes,
        matchesRes,
        grRes,
        pgRes,
        gbRes,
        cacheRes,
      ] = await Promise.all([
        supabase
          .from("participant_profiles")
          .select("participant_key, display_name")
          .order("display_name"),
        supabase.from("teams").select("id, name, flag_emoji"),
        supabase.from("players").select("id, name, team_id").range(0, 1499),
        supabase
          .from("matches")
          .select(
            "id, stage, group_code, home_team_id, away_team_id, home_score, away_score, status, kickoff"
          )
          .order("kickoff"),
        supabase.from("group_results").select("group_code, order_team_ids"),
        supabase.from("player_goals").select("player_id"),
        supabase.from("golden_boot_winners").select("player_id"),
        supabase
          .from("leaderboard_cache")
          .select(
            "user_email, match_points, group_points, topscorer_points, tournament_points, total"
          ),
      ]);

      setProfiles(profilesRes.data ?? []);
      setTeams(teamsRes.data ?? []);
      setPlayers(playersRes.data ?? []);
      setMatches(matchesRes.data ?? []);
      setGroupActuals(grRes.data ?? []);
      setCachedRows(cacheRes.data ?? []);

      const goalCounts: Record<number, number> = {};
      for (const g of pgRes.data ?? [])
        goalCounts[g.player_id] = (goalCounts[g.player_id] ?? 0) + 1;
      setGoalsByPlayer(goalCounts);

      // Golden Boot bonus only applies once admin explicitly sets the winner.
      // No fallback to max-goals — the bonus is a tournament-end award.
      setGoldenBootIds((gbRes.data ?? []).map((r) => r.player_id));

      setTournamentResults(deriveTournamentResults(matchesRes.data ?? []));
      setLoading(false);
    })();
  }, []);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const playerById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );
  const matchById = useMemo(
    () => new Map(matches.map((m) => [m.id, m])),
    [matches]
  );
  const cachedByKey = useMemo(
    () => new Map(cachedRows.map((r) => [r.user_email, r])),
    [cachedRows]
  );

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        <Calculator size={16} className="text-brand-sky" />
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-sky">
          Reconcile Points
        </h2>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-4">
        Pick a participant to see every prediction + scored points side-by-side
        with the cached leaderboard. Discrepancies = stale cache (run Recompute)
        or a scoring bug.
      </p>

      {loading ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : (
        <>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="w-full bg-pitch-bg border border-pitch-line rounded-sm px-3 py-2 text-sm mb-4"
          >
            <option value="">— Select a participant —</option>
            {profiles.map((p) => (
              <option key={p.participant_key} value={p.participant_key}>
                {p.display_name} ({p.participant_key})
              </option>
            ))}
          </select>

          {selectedKey && (
            <ParticipantReport
              participantKey={selectedKey}
              teamById={teamById}
              playerById={playerById}
              matchById={matchById}
              matches={matches}
              groupActuals={groupActuals}
              goalsByPlayer={goalsByPlayer}
              goldenBootIds={goldenBootIds}
              tournamentResults={tournamentResults}
              cached={cachedByKey.get(selectedKey)}
            />
          )}
        </>
      )}
    </section>
  );
}

type MatchPredRow = {
  match_id: number;
  pred_home: number;
  pred_away: number;
};
type GroupPredRow = { group_code: string; order_team_ids: number[] };
type TopscoreRow = { player_ids: number[] };
type TournamentRow = {
  champion_team_id: number | null;
  finalist_a_team_id: number | null;
  finalist_b_team_id: number | null;
  dark_horse_team_id: number | null;
};

function ParticipantReport({
  participantKey,
  teamById,
  playerById,
  matchById,
  matches,
  groupActuals,
  goalsByPlayer,
  goldenBootIds,
  tournamentResults,
  cached,
}: {
  participantKey: string;
  teamById: Map<number, Team>;
  playerById: Map<number, Player>;
  matchById: Map<number, MatchRow>;
  matches: MatchRow[];
  groupActuals: { group_code: string; order_team_ids: number[] }[];
  goalsByPlayer: Record<number, number>;
  goldenBootIds: number[];
  tournamentResults: TournamentResults;
  cached: CachedRow | undefined;
}) {
  const [loading, setLoading] = useState(true);
  const [matchPreds, setMatchPreds] = useState<MatchPredRow[]>([]);
  const [groupPreds, setGroupPreds] = useState<GroupPredRow[]>([]);
  const [tsPick, setTsPick] = useState<TopscoreRow | null>(null);
  const [tournPick, setTournPick] = useState<TournamentRow | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [mpRes, gpRes, tsRes, tnRes] = await Promise.all([
        supabase
          .from("match_predictions")
          .select("match_id, pred_home, pred_away")
          .eq("user_email", participantKey),
        supabase
          .from("group_predictions")
          .select("group_code, order_team_ids")
          .eq("user_email", participantKey),
        supabase
          .from("topscorer_picks")
          .select("player_ids")
          .eq("user_email", participantKey)
          .maybeSingle(),
        supabase
          .from("tournament_picks")
          .select(
            "champion_team_id, finalist_a_team_id, finalist_b_team_id, dark_horse_team_id"
          )
          .eq("user_email", participantKey)
          .maybeSingle(),
      ]);
      setMatchPreds(mpRes.data ?? []);
      setGroupPreds(gpRes.data ?? []);
      setTsPick(tsRes.data ?? null);
      setTournPick(tnRes.data ?? null);
      setLoading(false);
    })();
  }, [participantKey]);

  if (loading) return <p className="text-xs text-slate-500">Loading picks…</p>;

  // ── Compute scores ────────────────────────────────────────────────────────

  const matchRows = matchPreds
    .map((p) => {
      const m = matchById.get(p.match_id);
      if (!m) return null;
      const hasResult = m.home_score != null && m.away_score != null;
      const bd = hasResult
        ? scoreMatch(
            p.pred_home,
            p.pred_away,
            m.home_score!,
            m.away_score!,
            m.stage as Stage
          )
        : null;
      const home = m.home_team_id ? teamById.get(m.home_team_id) : null;
      const away = m.away_team_id ? teamById.get(m.away_team_id) : null;
      return {
        match: m,
        homeName: home?.name ?? "TBD",
        homeFlag: home?.flag_emoji ?? "",
        awayName: away?.name ?? "TBD",
        awayFlag: away?.flag_emoji ?? "",
        pred: `${p.pred_home}–${p.pred_away}`,
        actual: hasResult ? `${m.home_score}–${m.away_score}` : "—",
        pts: bd?.total ?? 0,
        scored: hasResult,
        kickoff: m.kickoff,
      };
    })
    .filter(Boolean) as {
    match: MatchRow;
    homeName: string;
    homeFlag: string;
    awayName: string;
    awayFlag: string;
    pred: string;
    actual: string;
    pts: number;
    scored: boolean;
    kickoff: string;
  }[];

  matchRows.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const matchTotal = matchRows.reduce((s, r) => s + r.pts, 0);

  const actualsByGroup = new Map(groupActuals.map((g) => [g.group_code, g.order_team_ids]));
  const groupRows = groupPreds.map((g) => {
    const actual = actualsByGroup.get(g.group_code);
    const bd = actual ? scoreGroupOrder(g.order_team_ids, actual) : null;
    return {
      code: g.group_code,
      pred: g.order_team_ids.map((id) => teamById.get(id)?.name ?? "?").join(", "),
      actual: actual ? actual.map((id) => teamById.get(id)?.name ?? "?").join(", ") : "—",
      correctSlots: bd?.correctSlots ?? 0,
      perfectBonus: bd?.perfectBonus ?? 0,
      pts: bd?.total ?? 0,
      scored: !!actual,
    };
  });
  groupRows.sort((a, b) => a.code.localeCompare(b.code));
  const groupTotal = groupRows.reduce((s, r) => s + r.pts, 0);

  const tsBd = tsPick
    ? scoreTopscorerPicks(tsPick.player_ids ?? [], goalsByPlayer, goldenBootIds)
    : null;
  const tsRows = (tsPick?.player_ids ?? []).map((pid) => {
    const pl = playerById.get(pid);
    const team = pl ? teamById.get(pl.team_id) : null;
    const goals = goalsByPlayer[pid] ?? 0;
    const isBoot = goldenBootIds.includes(pid);
    return {
      pid,
      name: pl?.name ?? `#${pid}`,
      team: team?.name ?? "?",
      goals,
      pts: goals * 2,
      isBoot,
    };
  });
  const tsTotal = tsBd?.total ?? 0;

  const tournBd = tournPick
    ? scoreTournamentPicks(
        {
          championTeamId: tournPick.champion_team_id,
          finalistATeamId: tournPick.finalist_a_team_id,
          finalistBTeamId: tournPick.finalist_b_team_id,
          darkHorseTeamId: tournPick.dark_horse_team_id,
        },
        tournamentResults
      )
    : null;
  const tournTotal = tournBd?.total ?? 0;

  const computedTotal = matchTotal + groupTotal + tsTotal + tournTotal;

  // Discrepancy check
  const checks = [
    { label: "Match", computed: matchTotal, cached: cached?.match_points ?? 0 },
    { label: "Group", computed: groupTotal, cached: cached?.group_points ?? 0 },
    { label: "Topscorer", computed: tsTotal, cached: cached?.topscorer_points ?? 0 },
    { label: "Tournament", computed: tournTotal, cached: cached?.tournament_points ?? 0 },
    { label: "TOTAL", computed: computedTotal, cached: cached?.total ?? 0 },
  ];
  const anyMismatch = checks.some((c) => c.computed !== c.cached);

  return (
    <div className="space-y-4">
      {/* ── Summary / reconciliation ── */}
      <div
        className={`rounded-sm border p-3 ${
          anyMismatch
            ? "bg-amber-900/20 border-amber-500/40"
            : "bg-brand-grass/10 border-brand-grass/40"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {anyMismatch ? (
            <AlertTriangle size={14} className="text-amber-400" />
          ) : (
            <CheckCircle2 size={14} className="text-brand-grass" />
          )}
          <p className="text-xs font-bold uppercase tracking-widest">
            {anyMismatch ? "MISMATCH — run Recompute" : "All categories match cache"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="text-slate-500 uppercase tracking-widest text-[9px]">Category</div>
          <div className="text-slate-500 uppercase tracking-widest text-[9px] text-center">
            Computed
          </div>
          <div className="text-slate-500 uppercase tracking-widest text-[9px] text-center">
            Cached
          </div>
          {checks.map((c) => {
            const match = c.computed === c.cached;
            return (
              <div key={c.label} className="contents">
                <div className={c.label === "TOTAL" ? "font-bold text-white" : "text-slate-300"}>
                  {c.label}
                </div>
                <div
                  className={`text-center ${
                    match ? "text-slate-300" : "text-amber-300 font-bold"
                  }`}
                >
                  {c.computed}
                </div>
                <div
                  className={`text-center ${
                    match ? "text-slate-300" : "text-amber-300 font-bold"
                  }`}
                >
                  {c.cached}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Match predictions ── */}
      <details open className="bg-pitch-bg border border-pitch-line rounded-sm">
        <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-widest text-brand-sky">
          Match predictions ({matchPreds.length}) — {matchTotal} pts
        </summary>
        <div className="px-3 pb-3">
          <div className="grid grid-cols-[1fr_70px_70px_50px_50px] gap-2 text-[9px] uppercase tracking-widest font-mono text-slate-500 border-b border-pitch-line pb-1 mb-1">
            <span>Match</span>
            <span className="text-center">Pred</span>
            <span className="text-center">Actual</span>
            <span className="text-center">Stage</span>
            <span className="text-center">Pts</span>
          </div>
          <div className="max-h-80 overflow-auto">
            {matchRows.map((r) => (
              <div
                key={r.match.id}
                className="grid grid-cols-[1fr_70px_70px_50px_50px] gap-2 text-[11px] py-1 border-b border-pitch-line/30 items-center"
              >
                <span className="truncate text-slate-300">
                  {r.homeFlag} {r.homeName} – {r.awayName} {r.awayFlag}
                </span>
                <span className="text-center font-mono text-slate-300">{r.pred}</span>
                <span className="text-center font-mono text-slate-500">{r.actual}</span>
                <span className="text-center font-mono text-[9px] text-slate-500">
                  {r.match.stage}
                </span>
                <span
                  className={`text-center font-mono font-bold ${
                    !r.scored
                      ? "text-slate-600"
                      : r.pts === 0
                      ? "text-slate-500"
                      : r.pts >= 11
                      ? "text-brand-gold"
                      : "text-brand-sky"
                  }`}
                >
                  {r.scored ? r.pts : "—"}
                </span>
              </div>
            ))}
            {matchRows.length === 0 && (
              <p className="text-[11px] text-slate-600 py-2">No match predictions.</p>
            )}
          </div>
        </div>
      </details>

      {/* ── Group predictions ── */}
      <details className="bg-pitch-bg border border-pitch-line rounded-sm">
        <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-widest text-brand-sky">
          Group order ({groupPreds.length}) — {groupTotal} pts
        </summary>
        <div className="px-3 pb-3 space-y-2">
          {groupRows.map((g) => (
            <div
              key={g.code}
              className="border-b border-pitch-line/30 pb-2 text-[11px]"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-brand-sky text-[10px] uppercase tracking-widest">
                  Group {g.code}
                </span>
                <span
                  className={`font-mono font-bold ${
                    !g.scored ? "text-slate-600" : g.pts === 0 ? "text-slate-500" : "text-brand-sky"
                  }`}
                >
                  {g.scored
                    ? `${g.correctSlots}/4 slots${g.perfectBonus ? " +5 perfect" : ""} = ${g.pts} pts`
                    : "Not scored yet"}
                </span>
              </div>
              <p className="text-slate-400">
                <span className="text-slate-600">Pred:</span> {g.pred}
              </p>
              <p className="text-slate-500">
                <span className="text-slate-600">Actual:</span> {g.actual}
              </p>
            </div>
          ))}
          {groupRows.length === 0 && (
            <p className="text-[11px] text-slate-600">No group predictions.</p>
          )}
        </div>
      </details>

      {/* ── Topscorer picks ── */}
      <details className="bg-pitch-bg border border-pitch-line rounded-sm">
        <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-widest text-brand-sky">
          Topscorer picks ({tsRows.length}) — {tsTotal} pts
        </summary>
        <div className="px-3 pb-3">
          {tsRows.length === 0 ? (
            <p className="text-[11px] text-slate-600">No topscorer picks.</p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_60px_60px] gap-2 text-[9px] uppercase tracking-widest font-mono text-slate-500 border-b border-pitch-line pb-1 mb-1">
                <span>Player</span>
                <span className="text-center">Goals</span>
                <span className="text-center">Pts</span>
              </div>
              {tsRows.map((p) => (
                <div
                  key={p.pid}
                  className="grid grid-cols-[1fr_60px_60px] gap-2 text-[11px] py-1 items-center"
                >
                  <span className="text-slate-300 truncate">
                    {p.name} <span className="text-slate-600">({p.team})</span>
                    {p.isBoot && (
                      <span className="ml-1 text-[9px] text-brand-gold font-bold">
                        🏆 GB
                      </span>
                    )}
                  </span>
                  <span className="text-center font-mono">{p.goals}</span>
                  <span className="text-center font-mono text-brand-sky">{p.pts}</span>
                </div>
              ))}
              {tsBd && tsBd.goldenBootBonus > 0 && (
                <p className="text-[11px] text-brand-gold mt-2 font-bold">
                  + Golden Boot bonus: 10 pts
                </p>
              )}
            </>
          )}
        </div>
      </details>

      {/* ── Tournament picks ── */}
      <details className="bg-pitch-bg border border-pitch-line rounded-sm">
        <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-widest text-brand-sky">
          Tournament picks — {tournTotal} pts
        </summary>
        <div className="px-3 pb-3 text-[11px] space-y-1">
          {!tournPick ? (
            <p className="text-slate-600">No tournament picks.</p>
          ) : (
            <>
              <div className="flex justify-between border-b border-pitch-line/30 py-1">
                <span className="text-slate-400">
                  Champion:{" "}
                  <span className="text-slate-300">
                    {tournPick.champion_team_id
                      ? teamById.get(tournPick.champion_team_id)?.name ?? "?"
                      : "—"}
                  </span>
                </span>
                <span className="font-mono text-brand-sky">{tournBd?.championPts ?? 0} pts</span>
              </div>
              <div className="flex justify-between border-b border-pitch-line/30 py-1">
                <span className="text-slate-400">
                  Finalists:{" "}
                  <span className="text-slate-300">
                    {tournPick.finalist_a_team_id
                      ? teamById.get(tournPick.finalist_a_team_id)?.name ?? "?"
                      : "—"}{" "}
                    +{" "}
                    {tournPick.finalist_b_team_id
                      ? teamById.get(tournPick.finalist_b_team_id)?.name ?? "?"
                      : "—"}
                  </span>
                </span>
                <span className="font-mono text-brand-sky">
                  {(tournBd?.finalistPts ?? 0) + (tournBd?.finalistBonus ?? 0)} pts
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">
                  Dark Horse:{" "}
                  <span className="text-slate-300">
                    {tournPick.dark_horse_team_id
                      ? teamById.get(tournPick.dark_horse_team_id)?.name ?? "?"
                      : "—"}
                  </span>
                </span>
                <span className="font-mono text-brand-sky">{tournBd?.darkHorsePts ?? 0} pts</span>
              </div>
              <p className="text-[10px] text-slate-600 font-mono mt-2">
                Champion derived:{" "}
                {tournamentResults.championTeamId
                  ? teamById.get(tournamentResults.championTeamId)?.name ?? "?"
                  : "—"}{" "}
                · Finalists:{" "}
                {tournamentResults.finalistTeamIds
                  .map((id) => teamById.get(id)?.name ?? "?")
                  .join(", ") || "—"}
              </p>
            </>
          )}
        </div>
      </details>
    </div>
  );
}
