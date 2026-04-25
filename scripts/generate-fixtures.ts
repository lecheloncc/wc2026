/**
 * Generate SQL insert statements for teams + group-stage matches + empty knockout slots
 * based on data/fixtures-2026.json.
 *
 * Usage:
 *   node node_modules/tsx/dist/cli.mjs scripts/generate-fixtures.ts > supabase/migrations/0002_seed.sql
 *
 * After FIFA publishes the full match schedule, update the placeholder kickoff times
 * below (or swap in real timestamps via a kickoff-override map). Knockout slot team_ids
 * are left null; admin fills them via /admin after group stage concludes.
 */
import fixtures from "../data/fixtures-2026.json";

type Team = { group: string; name: string; fifa: string; flag: string };
type R32Slot = { slot: string; home_hint: string; away_hint: string };

const teams = fixtures.teams as Team[];
const r32 = (fixtures.knockout_bracket_r32 ?? []) as R32Slot[];

// FIFA group schedule: R1 1v2, 3v4 · R2 1v3, 2v4 · R3 1v4, 2v3
const GROUP_ROUNDS: [number, number][][] = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
];

// Placeholder kickoff — adjust once FIFA releases the real schedule.
function placeholderGroupKickoff(groupIdx: number, round: number, matchIdx: number): string {
  const d = new Date(Date.UTC(2026, 5, 11, 19, 0));
  d.setUTCDate(d.getUTCDate() + groupIdx + round * 4);
  d.setUTCHours(19 + matchIdx * 3);
  return d.toISOString();
}
function placeholderKnockoutKickoff(stageOffset: number, idx: number): string {
  const d = new Date(Date.UTC(2026, 5, 29, 19, 0));
  d.setUTCDate(d.getUTCDate() + stageOffset);
  d.setUTCHours(19 + (idx % 2) * 3);
  return d.toISOString();
}

const sqlEscape = (s: string) => s.replace(/'/g, "''");

console.log("-- Auto-generated from data/fixtures-2026.json");
console.log("-- Do not edit by hand; regenerate via scripts/generate-fixtures.ts");
console.log("");

console.log("-- TEAMS");
for (const t of teams) {
  console.log(
    `insert into teams (name, group_code, flag_emoji, fifa_code) values ('${sqlEscape(t.name)}', '${t.group}', '${t.flag}', '${t.fifa}') on conflict (name) do nothing;`
  );
}

console.log("\n-- GROUP MATCHES (72)");
const groups = [...new Set(teams.map((t) => t.group))].sort();
groups.forEach((g, gi) => {
  const gTeams = teams.filter((t) => t.group === g);
  GROUP_ROUNDS.forEach((round, ri) => {
    round.forEach(([hi, ai], mi) => {
      const home = gTeams[hi].name;
      const away = gTeams[ai].name;
      const kickoff = placeholderGroupKickoff(gi, ri, mi);
      console.log(
        `insert into matches (stage, group_code, home_team_id, away_team_id, kickoff) values ('group', '${g}', (select id from teams where name='${sqlEscape(home)}'), (select id from teams where name='${sqlEscape(away)}'), '${kickoff}');`
      );
    });
  });
});

console.log("\n-- KNOCKOUT SLOTS (team_ids null until admin assigns)");
// R32 from fixtures JSON
let koIdx = 0;
for (const s of r32) {
  const kickoff = placeholderKnockoutKickoff(0, koIdx++);
  console.log(
    `insert into matches (stage, knockout_slot, kickoff) values ('R32', '${s.slot}', '${kickoff}');`
  );
}
// R16–Final
const later: { stage: string; count: number; dayOffset: number }[] = [
  { stage: "R16",   count: 8, dayOffset: 6 },
  { stage: "QF",    count: 4, dayOffset: 12 },
  { stage: "SF",    count: 2, dayOffset: 17 },
  { stage: "3rd",   count: 1, dayOffset: 21 },
  { stage: "final", count: 1, dayOffset: 22 },
];
for (const k of later) {
  for (let i = 1; i <= k.count; i++) {
    const kickoff = placeholderKnockoutKickoff(k.dayOffset, i);
    console.log(
      `insert into matches (stage, knockout_slot, kickoff) values ('${k.stage}', '${k.stage}-${i}', '${kickoff}');`
    );
  }
}
