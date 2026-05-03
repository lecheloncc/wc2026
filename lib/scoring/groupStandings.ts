// Compute predicted group standings from a user's match predictions.
//
// FIFA group-stage tiebreakers (in order): points, goal difference,
// goals for. We stop at goals-for and fall back to deterministic id
// ordering for further ties — head-to-head doesn't really make sense
// when the user is the one inventing the scores anyway.

export type PredMatch = {
  home_team_id: number;
  away_team_id: number;
  pred_home: number;
  pred_away: number;
};

export type Standing = {
  team_id: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
};

export function computeGroupStandings(
  teamIds: number[],
  matches: PredMatch[]
): Standing[] {
  const stats = new Map<number, { pts: number; gf: number; ga: number }>();
  for (const id of teamIds) stats.set(id, { pts: 0, gf: 0, ga: 0 });

  for (const m of matches) {
    const h = stats.get(m.home_team_id);
    const a = stats.get(m.away_team_id);
    if (!h || !a) continue;
    h.gf += m.pred_home;
    h.ga += m.pred_away;
    a.gf += m.pred_away;
    a.ga += m.pred_home;
    if (m.pred_home > m.pred_away) h.pts += 3;
    else if (m.pred_home < m.pred_away) a.pts += 3;
    else {
      h.pts += 1;
      a.pts += 1;
    }
  }

  return [...stats.entries()]
    .map(([team_id, s]) => ({
      team_id,
      pts: s.pts,
      gf: s.gf,
      ga: s.ga,
      gd: s.gf - s.ga,
    }))
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team_id - b.team_id;
    });
}
