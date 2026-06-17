"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useT } from "../../components/I18n";
import { StatsBarChart } from "../../components/stats/StatsBarChart";
import {
  Users,
  BarChart2,
  Trophy,
  Target,
  Star,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Minus,
} from "lucide-react";
import { scoreMatch, type Stage } from "../../lib/scoring/match";

// ── Types ─────────────────────────────────────────────────────────────────────

type Team = {
  id: number;
  name: string;
  group_code: string;
  flag_emoji: string | null;
  pot: number | null;
};

type Player = {
  id: number;
  name: string;
  team_id: number;
};

type MatchRow = {
  id: number;
  stage: string;
  group_code: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  kickoff: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

type TournamentPick = {
  user_email: string;
  champion_team_id: number | null;
  finalist_a_team_id: number | null;
  finalist_b_team_id: number | null;
  dark_horse_team_id: number | null;
};

type GroupPred = {
  user_email: string;
  group_code: string;
  order_team_ids: number[];
};

type MatchPred = {
  user_email: string;
  match_id: number;
  pred_home: number;
  pred_away: number;
};

type TopscorePick = {
  user_email: string;
  player_ids: number[];
};

type PlayerGoal = {
  player_id: number;
};

type LeaderboardRow = {
  match_points: number;
  group_points: number;
  topscorer_points: number;
  tournament_points: number;
  total: number;
};

type Profile = {
  participant_key: string;
  display_name: string;
};

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-pitch-card border border-pitch-line rounded-xl p-4 space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-sky">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function pct(n: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

// ── Main component ────────────────────────────────────────────────────────────

export function Stats() {
  const { t } = useT();

  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [tournamentPicks, setTournamentPicks] = useState<TournamentPick[]>([]);
  const [groupPreds, setGroupPreds] = useState<GroupPred[]>([]);
  const [matchPreds, setMatchPreds] = useState<MatchPred[]>([]);
  const [tsPicks, setTsPicks] = useState<TopscorePick[]>([]);
  const [playerGoals, setPlayerGoals] = useState<PlayerGoal[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // topscorer ownership sort toggle
  const [tsSort, setTsSort] = useState<"ownership" | "goals">("ownership");
  // group consensus expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // match accuracy expanded matches
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      const [
        teamsRes,
        playersRes,
        matchesRes,
        tournRes,
        groupRes,
        matchPredRes,
        tsRes,
        goalsRes,
        boardRes,
        profilesRes,
      ] = await Promise.all([
        supabase.from("teams").select("id, name, group_code, flag_emoji, pot"),
        supabase.from("players").select("id, name, team_id"),
        supabase
          .from("matches")
          .select("id, stage, group_code, home_team_id, away_team_id, kickoff, home_score, away_score, status")
          .order("kickoff", { ascending: false }),
        supabase.from("tournament_picks").select("user_email, champion_team_id, finalist_a_team_id, finalist_b_team_id, dark_horse_team_id"),
        supabase.from("group_predictions").select("user_email, group_code, order_team_ids"),
        supabase.from("match_predictions").select("user_email, match_id, pred_home, pred_away"),
        supabase.from("topscorer_picks").select("user_email, player_ids"),
        supabase.from("player_goals").select("player_id"),
        supabase.from("leaderboard_cache").select("match_points, group_points, topscorer_points, tournament_points, total"),
        supabase.from("participant_profiles").select("participant_key, display_name"),
      ]);

      setTeams(teamsRes.data ?? []);
      setPlayers(playersRes.data ?? []);
      setMatches(matchesRes.data ?? []);
      setTournamentPicks(tournRes.data ?? []);
      setGroupPreds(groupRes.data ?? []);
      setMatchPreds(matchPredRes.data ?? []);
      setTsPicks(tsRes.data ?? []);
      setPlayerGoals(goalsRes.data ?? []);
      setLeaderboard(boardRes.data ?? []);
      const profileData = profilesRes.data ?? [];
      setProfiles(profileData);
      setParticipantCount(profileData.length);
      setLoading(false);
    })();
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const profileByKey = useMemo(() => new Map(profiles.map((p) => [p.participant_key, p.display_name])), [profiles]);

  const firstKickoff = useMemo(() => {
    if (!matches.length) return null;
    return matches.reduce((min, m) => (m.kickoff < min ? m.kickoff : min), matches[0].kickoff);
  }, [matches]);

  const tournamentStarted = firstKickoff ? new Date() >= new Date(firstKickoff) : false;
  const playedMatches = matches.filter((m) => m.status === "final");
  const hasResults = playedMatches.length > 0;

  // Goals per player
  const goalsByPlayer = useMemo(() => {
    const map = new Map<number, number>();
    for (const g of playerGoals) {
      map.set(g.player_id, (map.get(g.player_id) ?? 0) + 1);
    }
    return map;
  }, [playerGoals]);

  // Topscorer ownership counts
  const tsOwnership = useMemo(() => {
    const map = new Map<number, number>();
    for (const pick of tsPicks) {
      for (const pid of pick.player_ids) {
        map.set(pid, (map.get(pid) ?? 0) + 1);
      }
    }
    return map;
  }, [tsPicks]);

  // Champion pick counts
  const championCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of tournamentPicks) {
      if (p.champion_team_id) {
        map.set(p.champion_team_id, (map.get(p.champion_team_id) ?? 0) + 1);
      }
    }
    return map;
  }, [tournamentPicks]);

  // Finalist pick counts (combine a + b)
  const finalistCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of tournamentPicks) {
      if (p.finalist_a_team_id) {
        map.set(p.finalist_a_team_id, (map.get(p.finalist_a_team_id) ?? 0) + 1);
      }
      if (p.finalist_b_team_id) {
        map.set(p.finalist_b_team_id, (map.get(p.finalist_b_team_id) ?? 0) + 1);
      }
    }
    return map;
  }, [tournamentPicks]);

  // Dark horse pick counts
  const darkHorseCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of tournamentPicks) {
      if (p.dark_horse_team_id) {
        map.set(p.dark_horse_team_id, (map.get(p.dark_horse_team_id) ?? 0) + 1);
      }
    }
    return map;
  }, [tournamentPicks]);

  // Group consensus: per group, per position, most popular pick
  const groupConsensus = useMemo(() => {
    const result: Record<string, { pos: number; teamId: number; count: number; pct: number }[]> = {};
    const groupCodes = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    for (const code of groupCodes) {
      const preds = groupPreds.filter((g) => g.group_code === code);
      if (!preds.length) {
        result[code] = [];
        continue;
      }
      const positions: { teamId: number; count: number; pct: number }[] = [];
      for (let pos = 0; pos < 4; pos++) {
        const counts = new Map<number, number>();
        for (const pred of preds) {
          const teamId = pred.order_team_ids[pos];
          if (teamId) counts.set(teamId, (counts.get(teamId) ?? 0) + 1);
        }
        const [[topTeam, topCount]] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        positions.push({ teamId: topTeam, count: topCount, pct: Math.round((topCount / preds.length) * 100) });
      }
      result[code] = positions.map((p, i) => ({ pos: i + 1, ...p }));
    }
    return result;
  }, [groupPreds]);

  // Match accuracy for played matches
  const matchAccuracy = useMemo(() => {
    return playedMatches.map((m) => {
      const preds = matchPreds.filter((p) => p.match_id === m.id);
      const total = preds.length;
      if (!total || m.home_score == null || m.away_score == null) return null;
      const actualHome = m.home_score;
      const actualAway = m.away_score;
      const actualOutcome = actualHome > actualAway ? "H" : actualHome < actualAway ? "A" : "D";

      let exact = 0;
      let correctOutcome = 0;
      let wrong = 0;

      for (const p of preds) {
        const predOutcome = p.pred_home > p.pred_away ? "H" : p.pred_home < p.pred_away ? "A" : "D";
        if (p.pred_home === actualHome && p.pred_away === actualAway) {
          exact++;
        } else if (predOutcome === actualOutcome) {
          correctOutcome++;
        } else {
          wrong++;
        }
      }
      return { match: m, total, exact, correctOutcome, wrong };
    }).filter(Boolean) as {
      match: MatchRow;
      total: number;
      exact: number;
      correctOutcome: number;
      wrong: number;
    }[];
  }, [playedMatches, matchPreds]);

  // Per-match participant breakdown (computed on demand for expanded matches)
  const getMatchDetail = useMemo(() => {
    const cache = new Map<number, { name: string; pred: string; pts: number; category: "exact" | "correct" | "wrong" }[]>();
    return (matchId: number) => {
      if (cache.has(matchId)) return cache.get(matchId)!;
      const m = playedMatches.find((x) => x.id === matchId);
      if (!m || m.home_score == null || m.away_score == null) return [];
      const preds = matchPreds.filter((p) => p.match_id === matchId);
      const stage = (m.stage ?? "group") as Stage;
      const rows = preds.map((p) => {
        const bd = scoreMatch(p.pred_home, p.pred_away, m.home_score!, m.away_score!, stage);
        const category: "exact" | "correct" | "wrong" = bd.exact ? "exact" : bd.correctOutcome ? "correct" : "wrong";
        const name = profileByKey.get(p.user_email) ?? p.user_email.split("@")[0];
        return { name, pred: `${p.pred_home}–${p.pred_away}`, pts: bd.total, category };
      });
      // Sort: exact first, then correct, then wrong. Within each, by points desc, then name asc.
      const order = { exact: 0, correct: 1, wrong: 2 };
      rows.sort((a, b) => order[a.category] - order[b.category] || b.pts - a.pts || a.name.localeCompare(b.name));
      cache.set(matchId, rows);
      return rows;
    };
  }, [playedMatches, matchPreds, profileByKey]);

  // Avg points by category
  const avgPoints = useMemo(() => {
    if (!leaderboard.length) return null;
    return {
      match: Math.round(avg(leaderboard.map((r) => r.match_points))),
      group: Math.round(avg(leaderboard.map((r) => r.group_points))),
      topscorer: Math.round(avg(leaderboard.map((r) => r.topscorer_points))),
      tournament: Math.round(avg(leaderboard.map((r) => r.tournament_points))),
      total: Math.round(avg(leaderboard.map((r) => r.total))),
    };
  }, [leaderboard]);

  // ── Loading / not-started gate ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-slate-400 text-sm">
        {t("Loading…")}
      </div>
    );
  }

  if (!tournamentStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-3">
        <BarChart2 size={36} className="mx-auto text-slate-600" />
        <p className="text-slate-400 text-sm">{t("Stats available after tournament kickoff.")}</p>
        {firstKickoff && (
          <p className="text-slate-600 text-xs font-mono">
            {new Date(firstKickoff).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  // ── Bar chart data builders ───────────────────────────────────────────────

  const championItems = [...championCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([id, count]) => {
      const team = teamById.get(id);
      return { label: `${team?.flag_emoji ?? ""} ${team?.name ?? id}`, value: count };
    });

  const finalistItems = [...finalistCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([id, count]) => {
      const team = teamById.get(id);
      return { label: `${team?.flag_emoji ?? ""} ${team?.name ?? id}`, value: count };
    });

  const darkHorseItems = [...darkHorseCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => {
      const team = teamById.get(id);
      return {
        label: `${team?.flag_emoji ?? ""} ${team?.name ?? id}`,
        value: count,
      };
    });

  // Topscorer ownership items
  const allPickedPlayers = [...tsOwnership.keys()];
  const tsItems = allPickedPlayers
    .map((pid) => {
      const player = playerById.get(pid);
      const team = player ? teamById.get(player.team_id) : undefined;
      return {
        pid,
        label: player?.name ?? `#${pid}`,
        sublabel: team?.flag_emoji ? `${team.flag_emoji} ${team.name}` : undefined,
        ownership: tsOwnership.get(pid) ?? 0,
        goals: goalsByPlayer.get(pid) ?? 0,
      };
    })
    .sort((a, b) =>
      tsSort === "ownership" ? b.ownership - a.ownership : b.goals - a.goals
    );

  const tsBarItems = tsItems.map((p) => ({
    label: p.label,
    sublabel: p.sublabel,
    value: tsSort === "ownership" ? p.ownership : p.goals,
  }));

  // Points by category items
  const pointsCategoryItems = avgPoints
    ? [
        { label: `⚽ ${t("Match")}`, value: avgPoints.match },
        { label: `🏆 ${t("Groups")}`, value: avgPoints.group },
        { label: `👟 ${t("Scorer")}`, value: avgPoints.topscorer },
        { label: `✨ ${t("Bonus")}`, value: avgPoints.tournament },
      ]
    : [];

  // Top scoring players (actual goals)
  const topScoringPlayers = [...goalsByPlayer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pid, goals]) => {
      const player = playerById.get(pid);
      const team = player ? teamById.get(player.team_id) : undefined;
      const ownership = tsOwnership.get(pid) ?? 0;
      return { pid, name: player?.name ?? `#${pid}`, team, goals, ownership };
    });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-white">
          {t("Stats")}
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          {t("Aggregate metrics across N participants")
            .replace("N", String(participantCount))}
        </p>
      </div>

      {/* ── 1. Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("Participants"), value: participantCount, icon: <Users size={14} className="text-brand-sky" /> },
          { label: t("Predictions made"), value: matchPreds.length, icon: <Target size={14} className="text-brand-sky" /> },
          { label: `${t("Matches played")} / 104`, value: playedMatches.length, icon: <BarChart2 size={14} className="text-brand-sky" /> },
          { label: t("Avg score"), value: avgPoints?.total ?? "—", icon: <Star size={14} className="text-brand-gold" /> },
        ].map((card) => (
          <div key={card.label} className="bg-pitch-card border border-pitch-line rounded-xl p-4 text-center space-y-1">
            <div className="flex justify-center">{card.icon}</div>
            <div className="text-2xl font-black text-white tabular-nums">{card.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono leading-tight">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Match prediction accuracy (top section) ── */}
      {hasResults && (
        <Section icon={<Target size={14} />} title={t("Match prediction accuracy")}>
          <p className="text-[10px] text-slate-500 -mt-1">{t("Tap a match to see everyone's predictions")}</p>
          <div className="space-y-0 mt-1">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-1 pb-1 text-[9px] uppercase tracking-widest text-slate-500 font-mono border-b border-pitch-line">
              <span>{t("Match")}</span>
              <span className="text-center w-12">{t("Exact")}</span>
              <span className="text-center w-14">{t("Correct outcome")}</span>
              <span className="text-center w-10">{t("Wrong")}</span>
            </div>
            {matchAccuracy.map(({ match, total, exact, correctOutcome, wrong }) => {
              const home = teamById.get(match.home_team_id!);
              const away = teamById.get(match.away_team_id!);
              const isExpanded = expandedMatches.has(match.id);
              const detail = isExpanded ? getMatchDetail(match.id) : [];
              const exactRows = detail.filter((d) => d.category === "exact");
              const correctRows = detail.filter((d) => d.category === "correct");
              const wrongRows = detail.filter((d) => d.category === "wrong");
              return (
                <div key={match.id}>
                  <button
                    onClick={() =>
                      setExpandedMatches((prev) => {
                        const next = new Set(prev);
                        next.has(match.id) ? next.delete(match.id) : next.add(match.id);
                        return next;
                      })
                    }
                    className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-1 py-1.5 text-xs border-b border-pitch-line/40 items-center hover:bg-pitch-bg/50 transition-colors cursor-pointer text-left"
                  >
                    <div className="min-w-0 flex items-center gap-1">
                      {isExpanded ? <ChevronUp size={10} className="text-slate-500 shrink-0" /> : <ChevronDown size={10} className="text-slate-500 shrink-0" />}
                      <span className="text-slate-300 truncate text-[11px]">
                        {home?.flag_emoji} {home?.name ?? "?"} {match.home_score}–{match.away_score} {away?.name ?? "?"} {away?.flag_emoji}
                      </span>
                    </div>
                    <div className="w-12 text-center">
                      <span className="text-xs font-mono font-bold text-brand-gold">{pct(exact, total)}</span>
                    </div>
                    <div className="w-14 text-center">
                      <span className="text-xs font-mono text-brand-sky">{pct(correctOutcome, total)}</span>
                    </div>
                    <div className="w-10 text-center">
                      <span className="text-xs font-mono text-slate-500">{pct(wrong, total)}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="bg-pitch-bg border-x border-b border-pitch-line/40 px-3 py-2 space-y-2">
                      {exactRows.length > 0 && (
                        <div>
                          <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-brand-gold mb-1">🎯 {t("Exact score")} ({exactRows.length})</p>
                          <div className="space-y-0.5">
                            {exactRows.map((r) => (
                              <div key={r.name} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-200">{r.name}</span>
                                <span className="font-mono text-brand-gold">{r.pred} · {r.pts} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {correctRows.length > 0 && (
                        <div>
                          <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-brand-sky mb-1">✓ {t("Correct outcome")} ({correctRows.length})</p>
                          <div className="space-y-0.5">
                            {correctRows.map((r) => (
                              <div key={r.name} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-300">{r.name}</span>
                                <span className="font-mono text-brand-sky">{r.pred} · {r.pts} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {wrongRows.length > 0 && (
                        <div>
                          <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-slate-500 mb-1">✗ {t("Wrong")} ({wrongRows.length})</p>
                          <div className="space-y-0.5">
                            {wrongRows.map((r) => (
                              <div key={r.name} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">{r.name}</span>
                                <span className="font-mono text-slate-600">{r.pred} · {r.pts} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {detail.length === 0 && (
                        <p className="text-[10px] text-slate-600">{t("No predictions for this match")}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── 2 + 3. Champion & Finalist picks (side by side on md+) ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section icon={<Trophy size={14} />} title={t("Champion picks")}>
          <StatsBarChart
            items={championItems}
            valueLabel={(v) => String(v)}
            emptyText={t("No picks yet.")}
          />
        </Section>

        <Section icon={<Trophy size={14} />} title={t("Finalist picks")}>
          <p className="text-[10px] text-slate-500 -mt-1">{t("Combined finalist appearances per team")}</p>
          <StatsBarChart
            items={finalistItems}
            valueLabel={(v) => String(v)}
            emptyText={t("No picks yet.")}
          />
        </Section>
      </div>

      {/* ── 4. Dark Horse picks ── */}
      <Section icon={<Star size={14} />} title={t("Dark horse picks")}>
        <p className="text-[10px] text-slate-500 -mt-1">{t("Only low-ranked teams eligible")}</p>
        <StatsBarChart
          items={darkHorseItems}
          barColor="bg-brand-sky"
          valueLabel={(v) => String(v)}
          emptyText={t("No picks yet.")}
        />
      </Section>

      {/* ── 5. Topscorer ownership ── */}
      <Section icon={<Users size={14} />} title={t("Topscorer ownership")}>
        <div className="flex items-center justify-between -mt-1 mb-1">
          <p className="text-[10px] text-slate-500">{t("3 picks per participant")}</p>
          <div className="flex rounded-sm overflow-hidden border border-pitch-line text-[10px] font-bold uppercase tracking-wide">
            <button
              onClick={() => setTsSort("ownership")}
              className={`px-2 py-1 transition-colors ${tsSort === "ownership" ? "bg-brand-sky text-pitch-bg" : "text-slate-400 hover:text-white"}`}
            >
              {t("By ownership")}
            </button>
            {playerGoals.length > 0 && (
              <button
                onClick={() => setTsSort("goals")}
                className={`px-2 py-1 transition-colors ${tsSort === "goals" ? "bg-brand-sky text-pitch-bg" : "text-slate-400 hover:text-white"}`}
              >
                {t("By goals")}
              </button>
            )}
          </div>
        </div>
        <StatsBarChart
          items={tsBarItems}
          barColor="bg-brand-sky"
          valueLabel={(v) => String(v)}
          emptyText={t("No topscorer picks yet.")}
        />
      </Section>

      {/* ── 6. Group order consensus ── */}
      <Section icon={<Layers size={14} />} title={t("Group order consensus")}>
        <p className="text-[10px] text-slate-500 -mt-1">{t("Most popular pick per position in each group")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
          {["A","B","C","D","E","F","G","H","I","J","K","L"].map((code) => {
            const preds = groupPreds.filter((g) => g.group_code === code);
            const consensus = groupConsensus[code] ?? [];
            const isExpanded = expandedGroups.has(code);

            return (
              <div key={code} className="bg-pitch-bg border border-pitch-line rounded-lg p-2 text-xs">
                <div
                  className="flex items-center justify-between cursor-pointer mb-1.5"
                  onClick={() =>
                    setExpandedGroups((prev) => {
                      const next = new Set(prev);
                      if (next.has(code)) next.delete(code);
                      else next.add(code);
                      return next;
                    })
                  }
                >
                  <span className="font-bold text-brand-sky uppercase tracking-widest text-[10px]">
                    {t("Group")} {code}
                  </span>
                  <span className="text-slate-500 text-[9px] flex items-center gap-0.5">
                    {preds.length}×
                    {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </span>
                </div>
                {consensus.length === 0 ? (
                  <p className="text-slate-600 text-[10px]">—</p>
                ) : (
                  <div className="space-y-1">
                    {(isExpanded ? consensus : consensus.slice(0, 2)).map((c) => {
                      const team = teamById.get(c.teamId);
                      return (
                        <div key={c.pos} className="flex items-center gap-1 min-w-0">
                          <span className="text-slate-500 w-4 shrink-0 font-mono text-[9px]">{c.pos}.</span>
                          <span className="text-slate-300 truncate flex-1 text-[10px] leading-tight">
                            {team?.flag_emoji} {team?.name ?? "?"}
                          </span>
                          <span className="text-slate-500 text-[9px] font-mono shrink-0">{c.pct}%</span>
                        </div>
                      );
                    })}
                    {!isExpanded && consensus.length > 2 && (
                      <p className="text-slate-600 text-[9px] text-center">+2 more</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 8. Points by category ── */}
      {hasResults && avgPoints && (
        <Section icon={<BarChart2 size={14} />} title={t("Points by category")}>
          <p className="text-[10px] text-slate-500 -mt-1">{t("Average points per participant")}</p>
          <StatsBarChart
            items={pointsCategoryItems}
            valueLabel={(v) => `${v} pts`}
            barColor="bg-brand-sky"
          />
        </Section>
      )}

      {/* ── 9. Top scoring players (actual goals) ── */}
      {playerGoals.length > 0 && (
        <Section icon={<Trophy size={14} />} title={t("Top scoring players")}>
          <p className="text-[10px] text-slate-500 -mt-1">{t("Goals scored — with topscorer pick ownership")}</p>
          <div className="space-y-0 mt-1">
            {/* Header */}
            <div className="grid grid-cols-[24px_1fr_auto_auto] gap-x-2 px-1 pb-1 text-[9px] uppercase tracking-widest text-slate-500 font-mono border-b border-pitch-line">
              <span>#</span>
              <span>{t("Player")}</span>
              <span className="w-12 text-center">{t("Goals")}</span>
              <span className="w-12 text-center">{t("Owned")}</span>
            </div>
            {topScoringPlayers.map((p, idx) => (
              <div
                key={p.pid}
                className="grid grid-cols-[24px_1fr_auto_auto] gap-x-2 px-1 py-1.5 text-xs border-b border-pitch-line/40 items-center"
              >
                <span className="text-slate-500 font-mono text-[10px]">{idx + 1}</span>
                <div className="min-w-0">
                  <span className="text-slate-300 text-[11px]">
                    {p.team?.flag_emoji} {p.name}
                  </span>
                  {p.team && (
                    <span className="text-slate-600 text-[10px] ml-1">{p.team.name}</span>
                  )}
                </div>
                <div className="w-12 text-center">
                  <span className="text-brand-gold font-bold font-mono">{p.goals}</span>
                </div>
                <div className="w-12 text-center">
                  <span className="text-brand-sky font-mono text-[10px]">
                    {pct(p.ownership, participantCount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
