"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Trash2, Goal } from "lucide-react";

type Match = {
  id: number;
  kickoff: string;
  home_team_id: number | null;
  away_team_id: number | null;
  home_name: string | null;
  away_name: string | null;
  status: string;
};

type Player = { id: number; name: string; team_id: number; team_name: string };

type GoalRow = {
  id: number;
  player_id: number;
  match_id: number;
  minute: number | null;
  player_name: string;
  team_name: string;
};

export function GoalEntry({ matches }: { matches: Match[] }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [matchId, setMatchId] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [minute, setMinute] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: pl } = await supabase
        .from("players")
        .select("id, name, team_id, team:team_id(name)")
        .order("name");
      setPlayers(
        (pl ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          team_id: p.team_id,
          // @ts-expect-error relation
          team_name: p.team?.name ?? "",
        }))
      );
      await loadGoals();
    })();
  }, []);

  async function loadGoals() {
    const { data } = await supabase
      .from("player_goals")
      .select("id, player_id, match_id, minute, player:player_id(name, team:team_id(name))")
      .order("id", { ascending: false });
    setGoals(
      (data ?? []).map((g) => ({
        id: g.id,
        player_id: g.player_id,
        match_id: g.match_id,
        minute: g.minute,
        // @ts-expect-error relation
        player_name: g.player?.name ?? "?",
        // @ts-expect-error relation
        team_name: g.player?.team?.name ?? "?",
      }))
    );
  }

  const selectedMatch = matches.find((m) => m.id === matchId) ?? null;

  const eligiblePlayers = useMemo(() => {
    if (!selectedMatch) return [] as Player[];
    return players.filter(
      (p) =>
        p.team_id === selectedMatch.home_team_id ||
        p.team_id === selectedMatch.away_team_id
    );
  }, [players, selectedMatch]);

  const goalsForMatch = useMemo(
    () => goals.filter((g) => g.match_id === matchId),
    [goals, matchId]
  );

  async function logGoal() {
    if (!matchId || !playerId) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from("player_goals").insert({
      player_id: playerId,
      match_id: matchId,
      minute: minute ? Number(minute) : null,
    });
    setSaving(false);
    if (error) {
      setMsg(`FAILED: ${error.message}`);
      return;
    }
    setMsg("Goal logged.");
    setMinute("");
    await loadGoals();
  }

  async function deleteGoal(id: number) {
    const { error } = await supabase.from("player_goals").delete().eq("id", id);
    if (error) {
      setMsg(`FAILED: ${error.message}`);
    } else {
      await loadGoals();
    }
  }

  // Only matches with both teams assigned + a final result make sense for goal logging.
  const finalisedMatches = matches.filter(
    (m) => m.home_team_id && m.away_team_id && m.status === "final"
  );

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Goal size={16} className="text-brand-gold" />
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-gold">
          Goal Log
        </h2>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-4">
        Log each goal individually — powers topscorer scoring + Golden Boot. Only finalised
        matches appear in the picker.
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

      <div className="grid md:grid-cols-[1fr_1fr_80px_100px] gap-2">
        <select
          value={matchId ?? ""}
          onChange={(e) => {
            setMatchId(e.target.value ? Number(e.target.value) : null);
            setPlayerId(null);
          }}
          className="bg-pitch-bg border border-pitch-line rounded-sm px-3 py-2 text-sm"
        >
          <option value="">Select match…</option>
          {finalisedMatches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.home_name} vs {m.away_name}
            </option>
          ))}
        </select>

        <select
          value={playerId ?? ""}
          onChange={(e) => setPlayerId(e.target.value ? Number(e.target.value) : null)}
          disabled={!selectedMatch}
          className="bg-pitch-bg border border-pitch-line rounded-sm px-3 py-2 text-sm disabled:opacity-40"
        >
          <option value="">Select player…</option>
          {eligiblePlayers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.team_name})
            </option>
          ))}
        </select>

        <input
          type="number"
          min={1}
          max={130}
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          placeholder="min"
          className="bg-pitch-bg border border-pitch-line rounded-sm px-3 py-2 text-sm"
        />

        <button
          onClick={logGoal}
          disabled={!matchId || !playerId || saving}
          className="bg-brand-gold text-pitch-bg font-bold uppercase text-xs px-3 py-2 rounded-sm flex items-center justify-center gap-1 disabled:opacity-40"
        >
          <Plus size={12} /> Log
        </button>
      </div>

      {selectedMatch && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">
            Goals in {selectedMatch.home_name} vs {selectedMatch.away_name} (
            {goalsForMatch.length})
          </p>
          {goalsForMatch.length === 0 ? (
            <p className="text-xs text-slate-600">None logged yet.</p>
          ) : (
            <ul className="space-y-1">
              {goalsForMatch.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center gap-2 bg-pitch-bg border border-pitch-line rounded-sm px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-slate-500 w-10">
                    {g.minute ? `${g.minute}'` : "—"}
                  </span>
                  <span className="flex-1">
                    <span className="font-bold">{g.player_name}</span>{" "}
                    <span className="text-slate-500 text-xs">({g.team_name})</span>
                  </span>
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="text-slate-500 hover:text-brand-red"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
