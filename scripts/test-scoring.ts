import { scoreMatch } from "../lib/scoring/match";
import { scoreGroupOrder } from "../lib/scoring/groups";
import { scoreTopscorerPicks } from "../lib/scoring/topscorer";

let failed = 0;
function assertEq(label: string, got: number, want: number) {
  const ok = got === want;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: got ${got}, want ${want}`);
  if (!ok) failed++;
}

// Match scoring
assertEq("2-1 vs 2-1 exact", scoreMatch(2, 1, 2, 1, "group").total, 11);
assertEq("2-1 vs 3-1 away-exact + wrong GD", scoreMatch(2, 1, 3, 1, "group").total, 4);
assertEq("2-1 vs 1-2 wrong outcome", scoreMatch(2, 1, 1, 2, "group").total, 0);
assertEq("0-0 vs 0-0 exact draw", scoreMatch(0, 0, 0, 0, "group").total, 11);
assertEq("1-1 vs 2-2 draw, same GD (0)", scoreMatch(1, 1, 2, 2, "group").total, 5);
assertEq("1-0 vs 2-0 home-exact wrong? actually away-exact", scoreMatch(1, 0, 2, 0, "group").total, 4);
assertEq("2-0 vs 3-1 correct outcome+GD, no exact", scoreMatch(2, 0, 3, 1, "group").total, 5);
assertEq("R16 exact 2-1 vs 2-1 ×1.5", scoreMatch(2, 1, 2, 1, "R16").total, Math.round(11 * 1.5));
assertEq("Final exact 2-1 vs 2-1 ×4", scoreMatch(2, 1, 2, 1, "final").total, 44);

// Group order
assertEq("Group ABCD vs ABDC (2 correct)", scoreGroupOrder([1, 2, 3, 4], [1, 2, 4, 3]).total, 6);
assertEq("Group all correct", scoreGroupOrder([1, 2, 3, 4], [1, 2, 3, 4]).total, 17);
assertEq("Group none correct", scoreGroupOrder([4, 3, 2, 1], [1, 2, 3, 4]).total, 0);

// Topscorer
assertEq(
  "3 picks, 5 goals combined, no boot",
  scoreTopscorerPicks([10, 20, 30], { 10: 2, 20: 3, 30: 0 }, [99]).total,
  10
);
assertEq(
  "Golden boot bonus",
  scoreTopscorerPicks([10, 20, 30], { 10: 6, 20: 1, 30: 0 }, [10]).total,
  14 + 10
);

if (failed > 0) {
  console.error(`\n${failed} test(s) FAILED`);
  process.exit(1);
}
console.log("\nAll scoring tests passed.");
