// Pre-tournament bonus picks: champion, finalists pair, dark horse.
// Designed to be ~95 pts max combined — significant but not overwhelming
// next to the match-prediction stream.

export type TournamentPicks = {
  championTeamId: number | null;
  finalistATeamId: number | null;
  finalistBTeamId: number | null;
  darkHorseTeamId: number | null;
};

export type DarkHorseRound = "GROUP" | "R32" | "R16" | "QF" | "SF" | "F";

export type TournamentResults = {
  // Champion + finalists derived from the final match.
  championTeamId: number | null;
  finalistTeamIds: number[]; // length 0 or 2
  // Map of team_id -> furthest stage that team competed in (regardless of win/loss)
  // We award dark-horse points based on whether the team REACHED a round, not whether they won it.
  // "Reached R16" means they appeared in an R16 match (i.e. won R32). Same for QF/SF.
  maxRoundByTeam: Record<number, DarkHorseRound>;
};

export type TournamentBreakdown = {
  championPts: number;
  finalistPts: number;        // 0–20 (10 per correct finalist)
  finalistBonus: number;      // 0 or 10 (both correct)
  darkHorsePts: number;       // 0–35
  total: number;
};

const CHAMPION_PTS = 30;
const FINALIST_EACH = 10;
const FINALIST_BOTH_BONUS = 10;
const DARK_HORSE_R16 = 10;
const DARK_HORSE_QF = 10;
const DARK_HORSE_SF = 15;

export function scoreTournamentPicks(
  picks: TournamentPicks,
  results: TournamentResults
): TournamentBreakdown {
  // Champion
  let championPts = 0;
  if (
    picks.championTeamId != null &&
    results.championTeamId != null &&
    picks.championTeamId === results.championTeamId
  ) {
    championPts = CHAMPION_PTS;
  }

  // Finalists — order doesn't matter
  let finalistPts = 0;
  let finalistBonus = 0;
  if (results.finalistTeamIds.length === 2) {
    const picked = [picks.finalistATeamId, picks.finalistBTeamId].filter(
      (id): id is number => id != null
    );
    const uniq = new Set(picked);
    let correct = 0;
    for (const id of uniq) {
      if (results.finalistTeamIds.includes(id)) correct++;
    }
    finalistPts = correct * FINALIST_EACH;
    if (correct === 2) finalistBonus = FINALIST_BOTH_BONUS;
  }

  // Dark Horse — tiered on the furthest round their pick reached
  let darkHorsePts = 0;
  if (picks.darkHorseTeamId != null) {
    const round = results.maxRoundByTeam[picks.darkHorseTeamId];
    if (round === "R16" || round === "QF" || round === "SF" || round === "F") {
      darkHorsePts += DARK_HORSE_R16;
    }
    if (round === "QF" || round === "SF" || round === "F") {
      darkHorsePts += DARK_HORSE_QF;
    }
    if (round === "SF" || round === "F") {
      darkHorsePts += DARK_HORSE_SF;
    }
  }

  return {
    championPts,
    finalistPts,
    finalistBonus,
    darkHorsePts,
    total: championPts + finalistPts + finalistBonus + darkHorsePts,
  };
}

// Derive results from the matches table. Pass all matches (any stage/status).
// Stage 'final' produces champion + finalists. R16/QF/SF/'final'/'3rd' presence
// determines max-round per team.
export function deriveTournamentResults(
  matches: {
    stage: string;
    status: string;
    home_team_id: number | null;
    away_team_id: number | null;
    home_score: number | null;
    away_score: number | null;
  }[]
): TournamentResults {
  const finalMatch = matches.find(
    (m) =>
      m.stage === "final" &&
      m.status === "final" &&
      m.home_team_id != null &&
      m.away_team_id != null &&
      m.home_score != null &&
      m.away_score != null
  );

  let championTeamId: number | null = null;
  let finalistTeamIds: number[] = [];
  if (finalMatch) {
    finalistTeamIds = [finalMatch.home_team_id!, finalMatch.away_team_id!];
    championTeamId =
      finalMatch.home_score! > finalMatch.away_score!
        ? finalMatch.home_team_id!
        : finalMatch.away_team_id!;
  }

  // Order matters — later checks overwrite earlier ones for the same team
  const stageRank: Record<string, DarkHorseRound> = {
    R32: "R32",
    R16: "R16",
    QF: "QF",
    SF: "SF",
    "3rd": "SF", // 3rd place match means both teams reached SF
    final: "F",
  };
  const order: DarkHorseRound[] = ["R32", "R16", "QF", "SF", "F"];
  const rank = (r: DarkHorseRound) => order.indexOf(r);

  const maxRoundByTeam: Record<number, DarkHorseRound> = {};
  for (const m of matches) {
    const round = stageRank[m.stage];
    if (!round) continue;
    for (const tid of [m.home_team_id, m.away_team_id]) {
      if (tid == null) continue;
      const cur = maxRoundByTeam[tid];
      if (!cur || rank(round) > rank(cur)) {
        maxRoundByTeam[tid] = round;
      }
    }
  }

  return { championTeamId, finalistTeamIds, maxRoundByTeam };
}
