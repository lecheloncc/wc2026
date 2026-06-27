"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Swords, Check, Calendar } from "lucide-react";

type Team = { id: number; name: string; flag_emoji: string | null };
type KnockoutMatch = {
  id: number;
  stage: string;
  knockout_slot: string | null;
  kickoff: string;
  home_team_id: number | null;
  away_team_id: number | null;
};

const STAGE_LABEL: Record<string, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  "3rd": "3rd place play-off",
  final: "Final",
};
const STAGE_ORDER = ["R32", "R16", "QF", "SF", "3rd", "final"];

/**
 * Admin UI for assigning teams + kickoff times to all knockout matches.
 * Lists each knockout match grouped by stage, lets the admin pick the home
 * and away team from all 48 teams, and edit the kickoff time inline.
 * Saves per-match.
 */
export function KnockoutBracketEntry() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [tRes, mRes] = await Promise.all([
        supabase.from("teams").select("id, name, flag_emoji").order("name").range(0, 99),
        supabase
          .from("matches")
          .select("id, stage, knockout_slot, kickoff, home_team_id, away_team_id")
          .in("stage", STAGE_ORDER)
          .order("kickoff")
          .range(0, 99),
      ]);
      setTeams(tRes.data ?? []);
      setMatches(mRes.data ?? []);
    })();
  }, []);

  async function saveMatch(
    id: number,
    homeId: number | null,
    awayId: number | null,
    kickoffLocal: string
  ) {
    setSavingId(id);
    setMsg(null);

    // datetime-local input gives a string like "2026-06-28T21:00" in the user's
    // local timezone. Convert to ISO (UTC) for storage.
    const kickoffIso = kickoffLocal
      ? new Date(kickoffLocal).toISOString()
      : null;

    const { error } = await supabase
      .from("matches")
      .update({
        home_team_id: homeId,
        away_team_id: awayId,
        kickoff: kickoffIso,
      })
      .eq("id", id);

    setSavingId(null);
    if (error) {
      setMsg(`FAILED: ${error.message}`);
      return;
    }
    setMsg(`Saved match #${id}.`);
    // Reload to reflect
    const { data } = await supabase
      .from("matches")
      .select("id, stage, knockout_slot, kickoff, home_team_id, away_team_id")
      .in("stage", STAGE_ORDER)
      .order("kickoff")
      .range(0, 99);
    setMatches(data ?? []);
  }

  const matchesByStage: Record<string, KnockoutMatch[]> = {};
  for (const s of STAGE_ORDER) matchesByStage[s] = [];
  for (const m of matches) {
    if (matchesByStage[m.stage]) matchesByStage[m.stage].push(m);
  }

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        <Swords size={16} className="text-brand-sky" />
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-sky">
          Knockout Bracket
        </h2>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-4">
        Assign teams + kickoff times for each knockout match. Empty rows mean
        the bracket page will show &quot;TBD&quot; for that slot until you save.
      </p>

      {msg && (
        <p
          className={`text-xs font-mono rounded-sm p-2 mb-3 border ${
            msg.includes("FAILED")
              ? "text-red-300 bg-red-900/20 border-red-500/40"
              : "text-brand-grass bg-pitch-bg border-pitch-line"
          }`}
        >
          {msg}
        </p>
      )}

      <div className="space-y-4">
        {STAGE_ORDER.map((stage) => {
          const ms = matchesByStage[stage] ?? [];
          if (ms.length === 0) return null;
          const missing = ms.filter(
            (m) => m.home_team_id == null || m.away_team_id == null
          ).length;
          return (
            <details key={stage} open={stage === "R32"} className="bg-pitch-bg border border-pitch-line rounded-sm">
              <summary className="cursor-pointer px-3 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-brand-sky">
                <span>
                  {STAGE_LABEL[stage]} ({ms.length})
                </span>
                {missing > 0 && (
                  <span className="text-amber-400 text-[10px]">
                    {missing} unassigned
                  </span>
                )}
              </summary>
              <div className="px-3 pb-3 space-y-2">
                {ms.map((m) => (
                  <MatchEditor
                    key={m.id}
                    match={m}
                    teams={teams}
                    saving={savingId === m.id}
                    onSave={saveMatch}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function MatchEditor({
  match,
  teams,
  saving,
  onSave,
}: {
  match: KnockoutMatch;
  teams: Team[];
  saving: boolean;
  onSave: (
    id: number,
    homeId: number | null,
    awayId: number | null,
    kickoffLocal: string
  ) => Promise<void>;
}) {
  // Convert the UTC kickoff in the DB to a value the datetime-local input
  // can render (the input expects "YYYY-MM-DDTHH:mm" in local timezone).
  const initialKickoff = match.kickoff
    ? toDatetimeLocal(new Date(match.kickoff))
    : "";

  const [home, setHome] = useState<number | null>(match.home_team_id);
  const [away, setAway] = useState<number | null>(match.away_team_id);
  const [kickoff, setKickoff] = useState<string>(initialKickoff);

  const dirty =
    home !== match.home_team_id ||
    away !== match.away_team_id ||
    kickoff !== initialKickoff;

  const unassigned = match.home_team_id == null || match.away_team_id == null;

  return (
    <div
      className={`grid grid-cols-[80px_1fr_1fr_180px_70px] gap-2 items-center bg-pitch-card border rounded-sm p-2 ${
        unassigned ? "border-amber-500/30" : "border-pitch-line"
      }`}
    >
      <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500">
        {match.knockout_slot ?? `#${match.id}`}
      </div>

      <select
        value={home ?? ""}
        onChange={(e) => setHome(e.target.value ? Number(e.target.value) : null)}
        disabled={saving}
        className="bg-pitch-bg border border-pitch-line rounded-sm px-2 py-1.5 text-xs"
      >
        <option value="">— Home team —</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.flag_emoji ? `${t.flag_emoji} ` : ""}{t.name}
          </option>
        ))}
      </select>

      <select
        value={away ?? ""}
        onChange={(e) => setAway(e.target.value ? Number(e.target.value) : null)}
        disabled={saving}
        className="bg-pitch-bg border border-pitch-line rounded-sm px-2 py-1.5 text-xs"
      >
        <option value="">— Away team —</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.flag_emoji ? `${t.flag_emoji} ` : ""}{t.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <Calendar size={11} className="text-slate-500 shrink-0" />
        <input
          type="datetime-local"
          value={kickoff}
          onChange={(e) => setKickoff(e.target.value)}
          disabled={saving}
          className="bg-pitch-bg border border-pitch-line rounded-sm px-2 py-1.5 text-xs w-full"
        />
      </div>

      <button
        onClick={() => onSave(match.id, home, away, kickoff)}
        disabled={saving || !dirty}
        className={`font-bold uppercase text-[10px] px-2 py-1.5 rounded-sm ${
          dirty
            ? "bg-brand-sky text-pitch-bg"
            : "bg-brand-grass/20 text-brand-grass border border-brand-grass/40"
        } disabled:opacity-40`}
      >
        {saving ? "…" : dirty ? "Save" : <Check size={11} className="inline" />}
      </button>
    </div>
  );
}

/** Convert a Date to "YYYY-MM-DDTHH:mm" in the user's local timezone. */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
