"use client";

import { useMemo, useState } from "react";
import { Search, X, Goal } from "lucide-react";
import { useT } from "../../components/I18n";

export type Player = {
  id: number;
  name: string;
  team_name: string;
  team_flag: string | null;
  team_code: string | null;
};

export function TopscorerPicks({
  players,
  goalsByPlayer,
  picks,
  setPicks,
  locked,
}: {
  players: Player[];
  goalsByPlayer: Record<number, number>;
  picks: number[];
  setPicks: (next: number[]) => void;
  locked: boolean;
}) {
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Unique team chips derived from the seeded player pool. Sorted alphabetically.
  const teams = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string; flag: string | null }
    >();
    for (const p of players) {
      if (p.team_code && !map.has(p.team_code)) {
        map.set(p.team_code, {
          code: p.team_code,
          name: p.team_name,
          flag: p.team_flag,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = players.filter((p) => {
      if (selectedTeam && p.team_code !== selectedTeam) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.team_name.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    // With a country filter the list is small enough to show in full.
    return list.slice(0, selectedTeam ? 100 : 50);
  }, [players, query, selectedTeam]);

  function toggle(id: number) {
    if (locked) return;
    if (picks.includes(id)) {
      setPicks(picks.filter((x) => x !== id));
    } else if (picks.length < 3) {
      setPicks([...picks, id]);
    }
  }

  const pickedPlayers = picks
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => !!p);
  const totalGoals = picks.reduce((s, id) => s + (goalsByPlayer[id] ?? 0), 0);

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        <Goal size={16} className="text-brand-gold" />
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-gold">
          {t("Topscorer Picks")}
        </h2>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-3">
        {t(
          "Pick 3 players. 2 pts per goal · +10 if one of your picks wins the Golden Boot."
        )}
      </p>

      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">
        {t("Your picks")} ({picks.length}/3)
      </p>
      {pickedPlayers.length === 0 ? (
        <p className="text-slate-600 text-sm">{t("No players selected yet.")}</p>
      ) : (
        <ul className="space-y-1">
          {pickedPlayers.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 bg-pitch-bg border border-pitch-line rounded-sm px-3 py-2"
            >
              <span className="font-mono text-[10px] uppercase text-slate-500 w-9 text-center shrink-0">
                {p.team_code ?? ""}
              </span>
              <span className="flex-1 text-sm">{p.name}</span>
              <span className="text-xs text-slate-500">{p.team_name}</span>
              <span className="text-xs text-brand-gold font-bold">
                {goalsByPlayer[p.id] ?? 0}g
              </span>
              {!locked && (
                <button
                  onClick={() => toggle(p.id)}
                  className="text-slate-500 hover:text-brand-red"
                  aria-label="Remove pick"
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {picks.length === 3 && (
        <p className="mt-2 text-xs text-slate-400">
          {t("Combined goals so far:")}{" "}
          <span className="text-white font-bold">{totalGoals}</span> (
          {totalGoals * 2} {t("pts)")}
        </p>
      )}

      {!locked && (
        <div className="mt-4 pt-4 border-t border-pitch-line">
          {/* Country quick-filter */}
          <div className="flex flex-wrap gap-1 mb-2">
            <button
              onClick={() => setSelectedTeam(null)}
              className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border transition-colors ${
                selectedTeam === null
                  ? "bg-brand-sky text-pitch-bg border-brand-sky"
                  : "bg-pitch-bg text-slate-400 border-pitch-line hover:text-white"
              }`}
            >
              {t("All")}
            </button>
            {teams.map((tm) => (
              <button
                key={tm.code}
                onClick={() =>
                  setSelectedTeam(selectedTeam === tm.code ? null : tm.code)
                }
                title={tm.name}
                className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border transition-colors ${
                  selectedTeam === tm.code
                    ? "bg-brand-sky text-pitch-bg border-brand-sky"
                    : "bg-pitch-bg text-slate-400 border-pitch-line hover:text-white"
                }`}
              >
                {tm.code}
              </button>
            ))}
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search player or team…")}
              className="w-full bg-pitch-bg border border-pitch-line rounded-sm py-2 pl-10 pr-4 text-sm"
            />
          </div>
          <ul className="space-y-1 max-h-96 overflow-auto">
            {filtered.map((p) => {
              const selected = picks.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => toggle(p.id)}
                    disabled={!selected && picks.length >= 3}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-left text-sm transition-colors ${
                      selected
                        ? "bg-brand-sky/20 border border-brand-sky"
                        : "bg-pitch-bg border border-pitch-line hover:border-brand-sky/50 disabled:opacity-30"
                    }`}
                  >
                    <span className="font-mono text-[10px] uppercase text-slate-500 w-9 text-center shrink-0">
                      {p.team_code ?? ""}
                    </span>
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs text-slate-500">{p.team_name}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="text-xs text-slate-500 py-4 text-center">
                {t("No players match.")}
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
