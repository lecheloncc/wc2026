// Plain-ESM mirror of generate-fixtures.ts for sandboxes that can't spawn esbuild.
// Keep in sync with scripts/generate-fixtures.ts.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "fixtures-2026.json"), "utf8")
);
const teams = fixtures.teams;
const r32 = fixtures.knockout_bracket_r32 ?? [];

const GROUP_ROUNDS = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
];

function groupKickoff(gi, ri, mi) {
  const d = new Date(Date.UTC(2026, 5, 11, 19, 0));
  d.setUTCDate(d.getUTCDate() + gi + ri * 4);
  d.setUTCHours(19 + mi * 3);
  return d.toISOString();
}
function koKickoff(stageOffset, idx) {
  const d = new Date(Date.UTC(2026, 5, 29, 19, 0));
  d.setUTCDate(d.getUTCDate() + stageOffset);
  d.setUTCHours(19 + (idx % 2) * 3);
  return d.toISOString();
}
const esc = (s) => s.replace(/'/g, "''");

console.log("-- Auto-generated from data/fixtures-2026.json");
console.log("-- Do not edit by hand; regenerate via scripts/generate-fixtures.ts");
console.log("");

console.log("-- TEAMS");
for (const t of teams) {
  console.log(
    `insert into teams (name, group_code, flag_emoji, fifa_code) values ('${esc(t.name)}', '${t.group}', '${t.flag}', '${t.fifa}') on conflict (name) do nothing;`
  );
}

console.log("\n-- GROUP MATCHES (72)");
const groups = [...new Set(teams.map((t) => t.group))].sort();
groups.forEach((g, gi) => {
  const gTeams = teams.filter((t) => t.group === g);
  GROUP_ROUNDS.forEach((round, ri) => {
    round.forEach(([hi, ai], mi) => {
      const kickoff = groupKickoff(gi, ri, mi);
      console.log(
        `insert into matches (stage, group_code, home_team_id, away_team_id, kickoff) values ('group', '${g}', (select id from teams where name='${esc(gTeams[hi].name)}'), (select id from teams where name='${esc(gTeams[ai].name)}'), '${kickoff}');`
      );
    });
  });
});

console.log("\n-- KNOCKOUT SLOTS (team_ids null until admin assigns)");
let koIdx = 0;
for (const s of r32) {
  console.log(
    `insert into matches (stage, knockout_slot, kickoff) values ('R32', '${s.slot}', '${koKickoff(0, koIdx++)}');`
  );
}
const later = [
  { stage: "R16",   count: 8, dayOffset: 6 },
  { stage: "QF",    count: 4, dayOffset: 12 },
  { stage: "SF",    count: 2, dayOffset: 17 },
  { stage: "3rd",   count: 1, dayOffset: 21 },
  { stage: "final", count: 1, dayOffset: 22 },
];
for (const k of later) {
  for (let i = 1; i <= k.count; i++) {
    console.log(
      `insert into matches (stage, knockout_slot, kickoff) values ('${k.stage}', '${k.stage}-${i}', '${koKickoff(k.dayOffset, i)}');`
    );
  }
}
