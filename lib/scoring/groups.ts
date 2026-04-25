export type GroupBreakdown = {
  correctSlots: number;
  perfectBonus: number;
  total: number;
};

const PER_SLOT = 3;
const PERFECT_BONUS = 5;

export function scoreGroupOrder(
  predicted: number[],
  actual: number[]
): GroupBreakdown {
  if (predicted.length !== 4 || actual.length !== 4) {
    return { correctSlots: 0, perfectBonus: 0, total: 0 };
  }
  let correctSlots = 0;
  for (let i = 0; i < 4; i++) {
    if (predicted[i] === actual[i]) correctSlots++;
  }
  const perfectBonus = correctSlots === 4 ? PERFECT_BONUS : 0;
  return {
    correctSlots,
    perfectBonus,
    total: correctSlots * PER_SLOT + perfectBonus,
  };
}
