"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Lock, Trophy, Crown, Sparkles } from "lucide-react";
import {
  scoreTournamentPicks,
  deriveTournamentResults,
  type TournamentPicks,
} from "../../lib/scoring/tournament";
import { TopscorerPicks, type Player } from "./TopscorerPicks";

type Team = {
  id: number;
  name: string;
  group_code: string;
  flag_emoji: string | null;
  pot: number | null;
};

type MatchRow = {
  stage: string;
  status: string;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
};

export function Tournament() {
  const [email, setEmail] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [goalsByPlayer, setGoalsByPlayer] = useState<Record<number, number>>({});
  const [picks, setPicks] = useState<TournamentPicks>({
    championTeamId: null,
    finalistATeamId: null,
    finalistBTeamId: null,
    darkHorseTeamId: null,
  });
  const [topscorerPicks, setTopscorerPicks] = useState<number[]>([]);
  const [lockTime, setLockTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const e = u.user?.email ?? "";
      setEmail(e);

      const [
        { data: t },
        { data: ms },
        { data: mine },
        { data: firstMatch },
        { data: pl },
        { data: tsMine },
        { data: goals },
      ] = await Promise.all([
        supabase
          .from("teams")
          .select("id, name, group_code, flag_emoji, pot")
          .order("group_code"),
        supabase
          .from("matches")
          .select("stage, status, home_team_id, away_team_id, home_score, away_score"),
        supabase.from("tournament_picks").select("*").eq("user_email", e).maybeSingle(),
        supabase
          .from("matches")
          .select("kickoff")
          .order("kickoff", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("players")
          .select("id, name, team:team_id(name, flag_emoji)")
          .order("name"),
        supabase
          .from("topscorer_picks")
          .select("player_ids")
          .eq("user_email", e)
          .maybeSingle(),
        supabase.from("player_goals").select("player_id"),
      ]);

      setTeams(t ?? []);
      setMatches(ms ?? []);
      if (mine) {
        setPicks({
          championTeamId: mine.champion_team_id,
          finalistATeamId: mine.finalist_a_team_id,
          finalistBTeamId: mine.finalist_b_team_id,
          darkHorseTeamId: mine.dark_horse_team_id,
        });
      }
      setLockTime(firstMatch ? new Date(firstMatch.kickoff).getTime() : null);

      setPlayers(
        (pl ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          // @ts-expect-error relation
          team_name: p.team?.name ?? "",
          // @ts-expect-error relation
          team_flag: p.team?.flag_emoji ?? null,
        }))
      );
      setTopscorerPicks(tsMine?.player_ids ?? []);
      const counts: Record<number, number> = {};
      for (const g of goals ?? [])
        counts[g.player_id] = (counts[g.player_id] ?? 0) + 1;
      setGoalsByPlayer(counts);

      setLoading(false);
    })();
  }, []);

  const locked = lockTime != null && lockTime <= Date.now();
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const allTeams = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name)),
    [teams]
  );
  const darkHorseTeams = useMemo(
    () => allTeams.filter((t) => t.pot === 3 || t.pot === 4),
    [allTeams]
  );

  const results = useMemo(() => deriveTournamentResults(matches), [matches]);
  const breakdown = useMemo(
    () => scoreTournamentPicks(picks, results),
    [picks, results]
  );
  const tournamentFinished = results.championTeamId != null;

  const topscorerComplete = topscorerPicks.length === 3;
  const tournamentComplete =
    picks.championTeamId != null &&
    picks.finalistATeamId != null &&
    picks.finalistBTeamId != null &&
    picks.darkHorseTeamId != null;

  async function saveAll() {
    setSaveError(null);
    setSaved(false);
    setSaving(true);

    const errors: string[] = [];
    if (tournamentComplete) {
      const { error } = await supabase.from("tournament_picks").upsert({
        user_email: email,
        champion_team_id: picks.championTeamId,
        finalist_a_team_id: picks.finalistATeamId,
        finalist_b_team_id: picks.finalistBTeamId,
        dark_horse_team_id: picks.darkHorseTeamId,
        updated_at: new Date().toISOString(),
      });
      if (error) errors.push(`Tournament: ${error.message}`);
    }
    if (topscorerComplete) {
      const { error } = await supabase.from("topscorer_picks").upsert({
        user_email: email,
        player_ids: topscorerPicks,
        updated_at: new Date().toISOString(),
      });
      if (error) errors.push(`Topscorer: ${error.message}`);
    }

    setSaving(false);
    if (errors.length > 0) {
      setSaveError(errors.join(" · "));
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  if (loading) return <p className="text-slate-500 text-xs uppercase">Loading…</p>;

  const finalistAOptions = allTeams.filter((t) => t.id !== picks.finalistBTeamId);
  const finalistBOptions = allTeams.filter((t) => t.id !== picks.finalistATeamId);

  const nothingComplete = !tournamentComplete && !topscorerComplete;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">
          Tournament Picks
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Bonus pre-tournament predictions. Locks at the opening match. Up to{" "}
          <b>95 pts</b> on the line — significant but not dominant.
        </p>
      </header>

      <PickSection
        icon={<Crown size={16} className="text-brand-gold" />}
        title="Champion"
        subtitle="30 pts if your pick lifts the trophy"
        teams={allTeams}
        value={picks.championTeamId}
        onChange={(id) => setPicks((p) => ({ ...p, championTeamId: id }))}
        teamById={teamById}
        locked={locked}
      />

      <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={16} className="text-brand-sky" />
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-sky">
            Finalists
          </h2>
        </div>
        <p className="text-[11px] text-slate-500 font-mono mb-3">
          10 pts per correct team · +10 bonus if both right (max 30). Order doesn&apos;t
          matter.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <TeamSelect
            label="Finalist A"
            teams={finalistAOptions}
            value={picks.finalistATeamId}
            onChange={(id) => setPicks((p) => ({ ...p, finalistATeamId: id }))}
            disabled={locked}
            teamById={teamById}
          />
          <TeamSelect
            label="Finalist B"
            teams={finalistBOptions}
            value={picks.finalistBTeamId}
            onChange={(id) => setPicks((p) => ({ ...p, finalistBTeamId: id }))}
            disabled={locked}
            teamById={teamById}
          />
        </div>
      </section>

      <PickSection
        icon={<Sparkles size={16} className="text-brand-grass" />}
        title="Dark Horse"
        subtitle="One Pot 3 / Pot 4 team. R16 = 10 · QF = +10 · SF = +15 (max 35)"
        teams={darkHorseTeams}
        value={picks.darkHorseTeamId}
        onChange={(id) => setPicks((p) => ({ ...p, darkHorseTeamId: id }))}
        teamById={teamById}
        locked={locked}
      />

      <TopscorerPicks
        players={players}
        goalsByPlayer={goalsByPlayer}
        picks={topscorerPicks}
        setPicks={setTopscorerPicks}
        locked={locked}
      />

      <div className="bg-pitch-card border border-pitch-line rounded-sm p-5">
        {locked ? (
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Lock size={12} /> Picks locked at tournament kickoff
          </p>
        ) : (
          <>
            <button
              onClick={saveAll}
              disabled={saving || nothingComplete}
              className="w-full bg-brand-sky hover:bg-sky-500 text-pitch-bg font-bold uppercase py-3 rounded-sm disabled:opacity-40"
            >
              {saved ? "Saved!" : saving ? "Saving…" : "Save Picks"}
            </button>
            <p className="mt-2 text-[10px] text-slate-500 font-mono text-center">
              Saves all completed sections (Champion · Finalists · Dark Horse · Topscorer).
              Sections that aren&apos;t fully filled in are skipped.
            </p>
          </>
        )}
        {saveError && (
          <p className="mt-3 text-xs text-red-300 font-mono bg-red-900/20 border border-red-500/40 rounded-sm p-3">
            Save failed: {saveError}
          </p>
        )}

        {tournamentFinished && (
          <div className="mt-4 pt-4 border-t border-pitch-line text-xs font-mono space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              Your bonus score
            </p>
            <Row k="Champion" v={breakdown.championPts} />
            <Row k="Finalists" v={breakdown.finalistPts} />
            <Row k="Both finalists bonus" v={breakdown.finalistBonus} />
            <Row k="Dark Horse" v={breakdown.darkHorsePts} />
            <Row k="Total" v={breakdown.total} bold />
          </div>
        )}
      </div>
    </div>
  );
}

function PickSection({
  icon,
  title,
  subtitle,
  teams,
  value,
  onChange,
  teamById,
  locked,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  teams: Team[];
  value: number | null;
  onChange: (id: number | null) => void;
  teamById: Map<number, Team>;
  locked: boolean;
}) {
  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-sm font-black uppercase tracking-widest">{title}</h2>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-3">{subtitle}</p>
      <TeamSelect
        teams={teams}
        value={value}
        onChange={onChange}
        disabled={locked}
        teamById={teamById}
      />
    </section>
  );
}

function TeamSelect({
  label,
  teams,
  value,
  onChange,
  disabled,
  teamById,
}: {
  label?: string;
  teams: Team[];
  value: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
  teamById: Map<number, Team>;
}) {
  const selected = value != null ? teamById.get(value) : null;
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-pitch-bg border border-pitch-line rounded-sm py-2.5 pl-3 pr-4 text-sm appearance-none disabled:opacity-60"
        >
          <option value="">— Select team —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.flag_emoji ? `${t.flag_emoji} ` : ""}
              {t.name} (Group {t.group_code})
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <p className="text-[11px] text-slate-500 font-mono pl-1">
          Picked: {selected.flag_emoji} {selected.name}
        </p>
      )}
    </div>
  );
}

function Row({
  k,
  v,
  bold,
}: {
  k: string;
  v: number | string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "text-white font-bold pt-1 border-t border-pitch-line" : "text-slate-300"}`}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
