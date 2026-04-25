export type Stage =
  | "group"
  | "R32"
  | "R16"
  | "QF"
  | "SF"
  | "3rd"
  | "final";

export type MatchBreakdown = {
  outcome: number;
  goalDiff: number;
  oneSide: number;
  exactBonus: number;
  subtotal: number;
  multiplier: number;
  total: number;
  exact: boolean;
  correctOutcome: boolean;
};

const STAGE_MULTIPLIER: Record<Stage, number> = {
  group: 1,
  R32: 1,
  R16: 1.5,
  QF: 2,
  SF: 3,
  "3rd": 4,
  final: 4,
};

const OUTCOME_PTS = 3;
const GOAL_DIFF_PTS = 2;
const ONE_SIDE_PTS = 1;
const EXACT_BONUS = 5;

function outcome(h: number, a: number): "H" | "D" | "A" {
  if (h > a) return "H";
  if (h < a) return "A";
  return "D";
}

export function scoreMatch(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  stage: Stage = "group"
): MatchBreakdown {
  const correctOutcome = outcome(predHome, predAway) === outcome(actualHome, actualAway);
  const correctGD = predHome - predAway === actualHome - actualAway;
  const homeExact = predHome === actualHome;
  const awayExact = predAway === actualAway;
  const fullExact = homeExact && awayExact;

  // One-side bonus: awarded whenever at least one team's goals are correct.
  // Stacks with the exact-score bonus so a perfect pick = 3+2+1+5 = 11.
  const oneSide = homeExact || awayExact ? ONE_SIDE_PTS : 0;

  const outcomePts = correctOutcome ? OUTCOME_PTS : 0;
  const gdPts = correctOutcome && correctGD ? GOAL_DIFF_PTS : 0;
  const exactPts = fullExact ? EXACT_BONUS : 0;

  const subtotal = outcomePts + gdPts + oneSide + exactPts;
  const multiplier = STAGE_MULTIPLIER[stage];
  const total = Math.round(subtotal * multiplier);

  return {
    outcome: outcomePts,
    goalDiff: gdPts,
    oneSide,
    exactBonus: exactPts,
    subtotal,
    multiplier,
    total,
    exact: fullExact,
    correctOutcome,
  };
}
