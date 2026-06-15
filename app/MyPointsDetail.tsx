"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useT } from "../components/I18n";
import { ChevronDown, ChevronUp, Calculator } from "lucide-react";
import { scoreMatch, type Stage } from "../lib/scoring/match";
import { scoreGroupOrder } from "../lib/scoring/groups";
import { scoreTopscorerPicks } from "../lib/scoring/topscorer";
import {
  scoreTournamentPicks,
  deriveTournamentResults,
} from "../lib/scoring/tournament";

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

type MatchPredRow = { match_id: number; pred_home: number; pred_away: number };
type GroupPredRow = { group_code: string; order_team_ids: number[] };
type TopscoreRow = { player_ids: number[] };
type TournamentRow = {
  champion_team_id: number | null;
  finalist_a_team_id: number | null;
  finalist_b_team_id: number | null;
  dark_horse_team_id: number | null;
};

/**
 * Player-facing detailed breakdown — shows every prediction the player made
 * with the points they earned (or will earn). Hidden behind a "Show details"
 * toggle so the Dashboard stays compact. Only renders for the active participant.
 */
export function MyPointsDetail({ participantKey }: { participantKey: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reference data
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [groupActuals, setGroupActuals] = useState<
    { group_code: string; order_team_ids: number[] }[]
  >([]);
  const [goalsByPlayer, setGoalsByPlayer] = useState<Record<number, number>>({});
  const [goldenBootIds, setGoldenBootIds] = useState<number[]>([]);

  // Player's own picks
  const [matchPreds, setMatchPreds] = useState<MatchPredRow[]>([]);
  const [groupPreds, setGroupPreds] = useState<GroupPredRow[]>([]);
  const [tsPick, setTsPick] = useState<TopscoreRow | null>(null);
  const [tournPick, setTournPick] = useState<TournamentRow | null>(null);

  useEffect(() => {
    if (!open) return; // Lazy load — only fetch when expanded
    if (matches.length > 0) return; // Already loaded

    (async () => {
      setLoading(true);
      const [
        teamsRes,
        playersRes,
        matchesRes,
        grRes,
        pgRes,
        gbRes,
        mpRes,
        gpRes,
        tsRes,
        tnRes,
      ] = await Promise.all([
        supabase.from("teams").select("id, name, flag_emoji").range(0, 9999),
        supabase.from("players").select("id, name, team_id").range(0, 1499),
        supabase
          .from("matches")
          .select(
            "id, stage, group_code, home_team_id, away_team_id, home_score, away_score, status, kickoff"
          )
          .order("kickoff")
          .range(0, 9999),
        supabase.from("group_results").select("group_code, order_team_ids").range(0, 99),
        supabase.from("player_goals").select("player_id").range(0, 9999),
        supabase.from("golden_boot_winners").select("player_id").range(0, 99),
        supabase
          .from("match_predictions")
          .select("match_id, pred_home, pred_away")
          .eq("user_email", participantKey)
          .range(0, 999),
        supabase
          .from("group_predictions")
          .select("group_code, order_team_ids")
          .eq("user_email", participantKey)
          .range(0, 99),
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

      setTeams(teamsRes.data ?? []);
      setPlayers(playersRes.data ?? []);
      setMatches(matchesRes.data ?? []);
      setGroupActuals(grRes.data ?? []);

      const goalCounts: Record<number, number> = {};
      for (const g of pgRes.data ?? [])
        goalCounts[g.player_id] = (goalCounts[g.player_id] ?? 0) + 1;
      setGoalsByPlayer(goalCounts);
      setGoldenBootIds((gbRes.data ?? []).map((r) => r.player_id));

      setMatchPreds(mpRes.data ?? []);
      setGroupPreds(gpRes.data ?? []);
      setTsPick(tsRes.data ?? null);
      setTournPick(tnRes.data ?? null);
      setLoading(false);
    })();
  }, [open, participantKey, matches.length]);

  const teamById = useMemo(() => new Map(teams.map((tm) => [tm.id, tm])), [teams]);
  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const matchById = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches]);

  // ── Compute scores ────────────────────────────────────────────────────────

  const matchRows = useMemo(() => {
    const rows = matchPreds
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
      .filter(Boolean) as Array<{
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
    }>;
    rows.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    return rows;
  }, [matchPreds, matchById, teamById]);

  const matchTotal = matchRows.reduce((s, r) => s + r.pts, 0);

  const actualsByGroup = useMemo(
    () => new Map(groupActuals.map((g) => [g.group_code, g.order_team_ids])),
    [groupActuals]
  );

  const groupRows = useMemo(() => {
    const rows = groupPreds.map((g) => {
      const actual = actualsByGroup.get(g.group_code);
      const bd = actual ? scoreGroupOrder(g.order_team_ids, actual) : null;
      return {
        code: g.group_code,
        pred: g.order_team_ids.map((id) => teamById.get(id)?.name ?? "?"),
        actual: actual ? actual.map((id) => teamById.get(id)?.name ?? "?") : null,
        correctSlots: bd?.correctSlots ?? 0,
        perfectBonus: bd?.perfectBonus ?? 0,
        pts: bd?.total ?? 0,
        scored: !!actual,
      };
    });
    rows.sort((a, b) => a.code.localeCompare(b.code));
    return rows;
  }, [groupPreds, actualsByGroup, teamById]);

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
      teamName: team?.name ?? "?",
      teamFlag: team?.flag_emoji ?? "",
      goals,
      pts: goals * 2,
      isBoot,
    };
  });
  const tsTotal = tsBd?.total ?? 0;

  const tournamentResults = useMemo(
    () => deriveTournamentResults(matches),
    [matches]
  );
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

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm">
      <button
        onClick={() => setOpen((x) => !x)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-pitch-bg/30 transition-colors"
      >
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono flex items-center gap-2">
          <Calculator size={12} /> {t("See points details")}
        </span>
        {open ? (
          <ChevronUp size={14} className="text-slate-500" />
        ) : (
          <ChevronDown size={14} className="text-slate-500" />
        )}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-3 border-t border-pitch-line">
          {loading ? (
            <p className="text-xs text-slate-500 pt-3">{t("Loading…")}</p>
          ) : (
            <>
              {/* Match predictions */}
              <details open className="bg-pitch-bg border border-pitch-line rounded-sm mt-3">
                <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-widest text-brand-sky">
                  {t("Matches")} ({matchRows.length}) — {matchTotal} {t("pts")}
                </summary>
                <div className="px-3 pb-3">
                  {matchRows.length === 0 ? (
                    <p className="text-[11px] text-slate-600 py-2">
                      {t("No match predictions yet.")}
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-[1fr_60px_60px_40px] gap-2 text-[9px] uppercase tracking-widest font-mono text-slate-500 border-b border-pitch-line pb-1 mb-1">
                        <span>{t("Match")}</span>
                        <span className="text-center">{t("Pred")}</span>
                        <span className="text-center">{t("Actual")}</span>
                        <span className="text-center">{t("Pts")}</span>
                      </div>
                      <div className="max-h-72 overflow-auto">
                        {matchRows.map((r) => (
                          <div
                            key={r.match.id}
                            className="grid grid-cols-[1fr_60px_60px_40px] gap-2 text-[11px] py-1 border-b border-pitch-line/30 items-center"
                          >
                            <span className="truncate text-slate-300">
                              {r.homeFlag} {r.homeName} – {r.awayName} {r.awayFlag}
                            </span>
                            <span className="text-center font-mono text-slate-300">
                              {r.pred}
                            </span>
                            <span className="text-center font-mono text-slate-500">
                              {r.actual}
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
                      </div>
                    </>
                  )}
                </div>
              </details>

              {/* Groups */}
              <details className="bg-pitch-bg border border-pitch-line rounded-sm">
                <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-widest text-brand-sky">
                  {t("Groups")} ({groupRows.length}) — {groupTotal} {t("pts")}
                </summary>
                <div className="px-3 pb-3 space-y-2">
                  {groupRows.length === 0 ? (
                    <p className="text-[11px] text-slate-600">
                      {t("No group predictions yet.")}
                    </p>
                  ) : (
                    groupRows.map((g) => (
                      <div
                        key={g.code}
                        className="border-b border-pitch-line/30 pb-2 text-[11px]"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-brand-sky text-[10px] uppercase tracking-widest">
                            {t("Group")} {g.code}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              !g.scored
                                ? "text-slate-600"
                                : g.pts === 0
                                ? "text-slate-500"
                                : "text-brand-sky"
                            }`}
                          >
                            {g.scored
                              ? `${g.correctSlots}/4${
                                  g.perfectBonus ? " +5" : ""
                                } = ${g.pts} ${t("pts")}`
                              : t("Not scored yet")}
                          </span>
                        </div>
                        <p className="text-slate-400">
                          <span className="text-slate-600">{t("Your pick")}:</span>{" "}
                          {g.pred.join(" · ")}
                        </p>
                        {g.actual && (
                          <p className="text-slate-500">
                            <span className="text-slate-600">{t("Actual")}:</span>{" "}
                            {g.actual.join(" · ")}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </details>

              {/* Topscorers */}
              <details className="bg-pitch-bg border border-pitch-line rounded-sm">
                <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-widest text-brand-sky">
                  {t("Topscorers")} ({tsRows.length}) — {tsTotal} {t("pts")}
                </summary>
                <div className="px-3 pb-3">
                  {tsRows.length === 0 ? (
                    <p className="text-[11px] text-slate-600">
                      {t("No topscorer picks.")}
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-[1fr_50px_50px] gap-2 text-[9px] uppercase tracking-widest font-mono text-slate-500 border-b border-pitch-line pb-1 mb-1">
                        <span>{t("Player")}</span>
                        <span className="text-center">{t("Goals")}</span>
                        <span className="text-center">{t("Pts")}</span>
                      </div>
                      {tsRows.map((p) => (
                        <div
                          key={p.pid}
                          className="grid grid-cols-[1fr_50px_50px] gap-2 text-[11px] py-1 items-center"
                        >
                          <span className="text-slate-300 truncate">
                            {p.teamFlag} {p.name}{" "}
                            <span className="text-slate-600">({p.teamName})</span>
                            {p.isBoot && (
                              <span className="ml-1 text-[9px] text-brand-gold font-bold">
                                🏆
                              </span>
                            )}
                          </span>
                          <span className="text-center font-mono">{p.goals}</span>
                          <span className="text-center font-mono text-brand-sky">
                            {p.pts}
                          </span>
                        </div>
                      ))}
                      {tsBd && tsBd.goldenBootBonus > 0 && (
                        <p className="text-[11px] text-brand-gold mt-2 font-bold">
                          + {t("Golden Boot bonus")}: 10 {t("pts")}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </details>

              {/* Tournament picks */}
              <details className="bg-pitch-bg border border-pitch-line rounded-sm">
                <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-widest text-brand-sky">
                  {t("Bonus")} — {tournTotal} {t("pts")}
                </summary>
                <div className="px-3 pb-3 text-[11px] space-y-1">
                  {!tournPick ? (
                    <p className="text-slate-600">{t("No bonus picks.")}</p>
                  ) : (
                    <>
                      <div className="flex justify-between border-b border-pitch-line/30 py-1">
                        <span className="text-slate-400">
                          {t("Champion")}:{" "}
                          <span className="text-slate-300">
                            {tournPick.champion_team_id
                              ? teamById.get(tournPick.champion_team_id)?.name ?? "?"
                              : "—"}
                          </span>
                        </span>
                        <span className="font-mono text-brand-sky">
                          {tournBd?.championPts ?? 0} {t("pts")}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-pitch-line/30 py-1">
                        <span className="text-slate-400">
                          {t("Finalists")}:{" "}
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
                          {(tournBd?.finalistPts ?? 0) +
                            (tournBd?.finalistBonus ?? 0)}{" "}
                          {t("pts")}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">
                          {t("Dark Horse")}:{" "}
                          <span className="text-slate-300">
                            {tournPick.dark_horse_team_id
                              ? teamById.get(tournPick.dark_horse_team_id)?.name ?? "?"
                              : "—"}
                          </span>
                        </span>
                        <span className="font-mono text-brand-sky">
                          {tournBd?.darkHorsePts ?? 0} {t("pts")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </details>
            </>
          )}
        </div>
      )}
    </section>
  );
}
