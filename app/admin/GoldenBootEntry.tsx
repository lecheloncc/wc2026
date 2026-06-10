"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Award } from "lucide-react";

type PlayerGoalCount = {
  player_id: number;
  player_name: string;
  team_name: string;
  goals: number;
};

/**
 * Shows the current top scorers (derived from player_goals) and lets the admin
 * override the Golden Boot winner(s) if FIFA awards it differently from the
 * raw goal count (e.g. tiebreaker by assists, minutes played).
 *
 * Stores the winner ID(s) in a `golden_boot_winners` table. If no override is
 * set, the recompute function falls back to the automatic "max goals" logic.
 */
export function GoldenBootEntry() {
  const [topScorers, setTopScorers] = useState<PlayerGoalCount[]>([]);
  const [overrideIds, setOverrideIds] = useState<number[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [hasTable, setHasTable] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Load goal counts
    const { data: goals } = await supabase
      .from("player_goals")
      .select("player_id, player:player_id(name, team:team_id(name))");

    const counts = new Map<number, { name: string; team: string; goals: number }>();
    for (const g of goals ?? []) {
      const existing = counts.get(g.player_id);
      if (existing) {
        existing.goals++;
      } else {
        counts.set(g.player_id, {
          // @ts-expect-error relation
          name: g.player?.name ?? "?",
          // @ts-expect-error relation
          team: g.player?.team?.name ?? "?",
          goals: 1,
        });
      }
    }

    const sorted = [...counts.entries()]
      .map(([id, c]) => ({
        player_id: id,
        player_name: c.name,
        team_name: c.team,
        goals: c.goals,
      }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);

    setTopScorers(sorted);

    // Load current override
    const { data: winners, error } = await supabase
      .from("golden_boot_winners")
      .select("player_id");

    if (error && error.code === "42P01") {
      // Table doesn't exist yet — that's fine, show without override
      setHasTable(false);
      return;
    }

    const ids = (winners ?? []).map((w) => w.player_id);
    setOverrideIds(ids);
    setSavedIds(ids);
  }

  function togglePlayer(id: number) {
    setOverrideIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function saveOverride() {
    setSaving(true);
    setMsg(null);

    // Clear existing
    const { error: delErr } = await supabase
      .from("golden_boot_winners")
      .delete()
      .neq("player_id", 0); // delete all rows

    if (delErr) {
      setMsg(`FAILED: ${delErr.message}`);
      setSaving(false);
      return;
    }

    // Insert new
    if (overrideIds.length > 0) {
      const { error: insErr } = await supabase
        .from("golden_boot_winners")
        .insert(overrideIds.map((id) => ({ player_id: id })));
      if (insErr) {
        setMsg(`FAILED: ${insErr.message}`);
        setSaving(false);
        return;
      }
    }

    setSavedIds([...overrideIds]);
    setMsg(
      overrideIds.length > 0
        ? `Golden Boot set to ${overrideIds.length} player(s). Recompute to apply.`
        : "Golden Boot override cleared — will fall back to max goals."
    );
    setSaving(false);
  }

  const maxGoals = topScorers.length > 0 ? topScorers[0].goals : 0;
  const autoWinners = topScorers.filter((p) => p.goals === maxGoals);
  const isDirty = JSON.stringify(overrideIds.sort()) !== JSON.stringify(savedIds.sort());

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        <Award size={16} className="text-brand-gold" />
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-gold">
          Golden Boot
        </h2>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-4">
        Override the Golden Boot winner if FIFA&apos;s tiebreaker differs from raw goal count.
        If no override is set, the player(s) with the most goals win automatically.
      </p>

      {!hasTable && (
        <p className="text-xs text-amber-300 font-mono mb-3 bg-amber-900/20 border border-amber-500/40 rounded-sm p-2">
          The golden_boot_winners table doesn&apos;t exist yet. Run migration 0014 first,
          or the automatic max-goals fallback will be used.
        </p>
      )}

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

      {topScorers.length === 0 ? (
        <p className="text-xs text-slate-600">No goals logged yet.</p>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">
            Top scorers — click to toggle Golden Boot winner
          </p>
          <div className="space-y-1 max-h-80 overflow-auto">
            {topScorers.map((p) => {
              const isSelected = overrideIds.includes(p.player_id);
              const isAutoWinner =
                savedIds.length === 0 && p.goals === maxGoals;
              return (
                <button
                  key={p.player_id}
                  onClick={() => hasTable && togglePlayer(p.player_id)}
                  disabled={!hasTable}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-brand-gold/20 border border-brand-gold"
                      : isAutoWinner
                      ? "bg-brand-gold/10 border border-brand-gold/30"
                      : "bg-pitch-bg border border-pitch-line hover:border-brand-gold/50"
                  } disabled:opacity-60`}
                >
                  <span className="font-mono text-xs text-slate-500 w-8 text-center">
                    {p.goals}g
                  </span>
                  <span className="flex-1 truncate">
                    <span className="font-bold">{p.player_name}</span>{" "}
                    <span className="text-xs text-slate-500">({p.team_name})</span>
                  </span>
                  {isSelected && (
                    <span className="text-[9px] uppercase font-bold text-brand-gold">
                      🏆 Winner
                    </span>
                  )}
                  {!isSelected && isAutoWinner && (
                    <span className="text-[9px] uppercase font-bold text-slate-500">
                      Auto
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {hasTable && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={saveOverride}
                disabled={saving || !isDirty}
                className="bg-brand-gold text-pitch-bg font-bold uppercase text-xs px-4 py-2 rounded-sm disabled:opacity-40"
              >
                {saving ? "…" : "Save Golden Boot"}
              </button>
              {overrideIds.length > 0 && (
                <button
                  onClick={() => setOverrideIds([])}
                  className="text-xs text-slate-500 hover:text-white"
                >
                  Clear override
                </button>
              )}
            </div>
          )}

          <p className="mt-2 text-[10px] text-slate-600 font-mono">
            {savedIds.length > 0
              ? `Override active: ${savedIds.length} winner(s). `
              : `No override — auto: ${autoWinners.length} player(s) with ${maxGoals} goals. `}
            Remember to Recompute Leaderboard after changes.
          </p>
        </>
      )}
    </section>
  );
}
