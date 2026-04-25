import { scoreMatch, type Stage } from "./match";
import { scoreGroupOrder } from "./groups";
import { scoreTopscorerPicks } from "./topscorer";

export type UserTotals = {
  email: string;
  matchPoints: number;
  groupPoints: number;
  topscorerPoints: number;
  total: number;
};

export type MatchRow = {
  id: number;
  stage: Stage;
  home_score: number | null;
  away_score: number | null;
};
export type MatchPredictionRow = {
  user_email: string;
  match_id: number;
  pred_home: number;
  pred_away: number;
};
export type GroupPredictionRow = {
  user_email: string;
  group_code: string;
  order_team_ids: number[];
};
export type GroupActual = { group_code: string; order_team_ids: number[] };
export type TopscorerRow = { user_email: string; player_ids: number[] };

export function computeTotals(args: {
  matches: MatchRow[];
  matchPredictions: MatchPredictionRow[];
  groupPredictions: GroupPredictionRow[];
  groupActuals: GroupActual[];
  topscorerPicks: TopscorerRow[];
  goalsByPlayer: Record<number, number>;
  goldenBootPlayerIds: number[];
}): UserTotals[] {
  const byEmail = new Map<string, UserTotals>();
  const ensure = (email: string): UserTotals => {
    let u = byEmail.get(email);
    if (!u) {
      u = {
        email,
        matchPoints: 0,
        groupPoints: 0,
        topscorerPoints: 0,
        total: 0,
      };
      byEmail.set(email, u);
    }
    return u;
  };

  const matchById = new Map(args.matches.map((m) => [m.id, m]));
  for (const p of args.matchPredictions) {
    const m = matchById.get(p.match_id);
    if (!m || m.home_score == null || m.away_score == null) continue;
    const b = scoreMatch(p.pred_home, p.pred_away, m.home_score, m.away_score, m.stage);
    ensure(p.user_email).matchPoints += b.total;
  }

  const actualsByGroup = new Map(
    args.groupActuals.map((g) => [g.group_code, g.order_team_ids])
  );
  for (const g of args.groupPredictions) {
    const actual = actualsByGroup.get(g.group_code);
    if (!actual) continue;
    const b = scoreGroupOrder(g.order_team_ids, actual);
    ensure(g.user_email).groupPoints += b.total;
  }

  for (const t of args.topscorerPicks) {
    const b = scoreTopscorerPicks(
      t.player_ids,
      args.goalsByPlayer,
      args.goldenBootPlayerIds
    );
    ensure(t.user_email).topscorerPoints += b.total;
  }

  for (const u of byEmail.values()) {
    u.total = u.matchPoints + u.groupPoints + u.topscorerPoints;
  }
  return [...byEmail.values()].sort((a, b) => b.total - a.total);
}
