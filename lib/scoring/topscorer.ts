export type TopscorerBreakdown = {
  goalPoints: number;
  goldenBootBonus: number;
  total: number;
  perPick: { playerId: number; goals: number; points: number }[];
};

const POINTS_PER_GOAL = 2;
const GOLDEN_BOOT_BONUS = 10;

export function scoreTopscorerPicks(
  picks: number[],
  goalsByPlayer: Record<number, number>,
  goldenBootPlayerIds: number[]
): TopscorerBreakdown {
  const perPick = picks.map((playerId) => {
    const goals = goalsByPlayer[playerId] ?? 0;
    return { playerId, goals, points: goals * POINTS_PER_GOAL };
  });
  const goalPoints = perPick.reduce((s, p) => s + p.points, 0);
  const hasBoot = picks.some((id) => goldenBootPlayerIds.includes(id));
  const goldenBootBonus = hasBoot ? GOLDEN_BOOT_BONUS : 0;
  return {
    goalPoints,
    goldenBootBonus,
    total: goalPoints + goldenBootBonus,
    perPick,
  };
}
