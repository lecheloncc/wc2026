"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ChevronUp, ChevronDown, Lock, CheckCircle } from "lucide-react";
import { scoreGroupOrder } from "../../lib/scoring/groups";
import { useActiveParticipant } from "../../components/ActiveParticipant";
import { useT } from "../../components/I18n";

type Team = {
  id: number;
  name: string;
  group_code: string;
  flag_emoji: string | null;
  fifa_code: string | null;
};

export function Groups() {
  const { activeKey, activeProfile } = useActiveParticipant();
  const { t } = useT();
  const [teams, setTeams] = useState<Team[]>([]);
  const [predictions, setPredictions] = useState<Record<string, number[]>>({});
  const [savedPredictions, setSavedPredictions] = useState<Record<string, number[]>>({});
  const [actuals, setActuals] = useState<Record<string, number[]>>({});
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  const [savedGroup, setSavedGroup] = useState<string | null>(null);
  const [errorGroup, setErrorGroup] = useState<{ group: string; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (!activeKey) return;

      const [{ data: t }, { data: p }, { data: gr }, { data: firsts }] =
        await Promise.all([
          supabase
            .from("teams")
            .select("id,name,group_code,flag_emoji,fifa_code")
            .order("group_code"),
          supabase
            .from("group_predictions")
            .select("group_code, order_team_ids")
            .eq("user_email", activeKey),
          supabase.from("group_results").select("group_code, order_team_ids"),
          supabase
            .from("matches")
            .select("group_code, kickoff")
            .eq("stage", "group"),
        ]);

      setTeams(t ?? []);
      const preds: Record<string, number[]> = {};
      for (const row of p ?? []) preds[row.group_code] = row.order_team_ids;
      setPredictions(preds);
      setSavedPredictions(preds);

      const acts: Record<string, number[]> = {};
      for (const row of gr ?? []) acts[row.group_code] = row.order_team_ids;
      setActuals(acts);

      // Lock ALL groups at the tournament's opening match — group order picks
      // must be in before the tournament starts (same rule as topscorer picks).
      let openingKickoff: number | null = null;
      for (const m of firsts ?? []) {
        const k = new Date(m.kickoff).getTime();
        if (openingKickoff == null || k < openingKickoff) openingKickoff = k;
      }
      const now = Date.now();
      const tournamentLocked = openingKickoff != null && openingKickoff <= now;
      const locked: Record<string, boolean> = {};
      for (const m of firsts ?? []) {
        if (!m.group_code) continue;
        locked[m.group_code] = tournamentLocked;
      }
      setLocks(locked);
    })();
  }, [activeKey]);

  const grouped = useMemo(() => {
    const byGroup: Record<string, Team[]> = {};
    for (const t of teams) {
      (byGroup[t.group_code] ||= []).push(t);
    }
    return byGroup;
  }, [teams]);

  function setOrder(group: string, order: number[]) {
    setPredictions((p) => ({ ...p, [group]: order }));
  }

  function move(group: string, idx: number, dir: -1 | 1) {
    const cur = predictions[group] ?? grouped[group]?.map((t) => t.id) ?? [];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= cur.length) return;
    const next = [...cur];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setOrder(group, next);
  }

  async function save(group: string) {
    const order = predictions[group];
    if (!order || order.length !== 4) return;
    setErrorGroup(null);
    const { error } = await supabase.from("group_predictions").upsert({
      user_email: activeKey,
      group_code: group,
      order_team_ids: order,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      setErrorGroup({ group, msg: error.message });
    } else {
      setSavedPredictions((prev) => ({ ...prev, [group]: order }));
      setSavedGroup(group);
      setTimeout(() => setSavedGroup(null), 1500);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">
          {t("Group Stage Order")}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {t(
            "Rank 1st → 4th. 3 pts per correct slot · 5 pt bonus for a perfect group. Locks at the opening match."
          )}
        </p>
        {activeProfile && (
          <p className="text-[10px] text-slate-500 font-mono mt-2">
            {t("Saving as")}{" "}
            <span className="text-brand-sky">{activeProfile.display_name}</span>
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-pitch-line rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-grass transition-all"
              style={{
                width: `${(Object.keys(savedPredictions).length / 12) * 100}%`,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
            {Object.keys(savedPredictions).length} / 12 {t("groups predicted")}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.keys(grouped)
          .sort()
          .map((g) => {
            const locked = locks[g];
            const order = predictions[g] ?? grouped[g].map((t) => t.id);
            const actual = actuals[g];
            const breakdown = actual ? scoreGroupOrder(order, actual) : null;
            const savedOrder = savedPredictions[g];
            const isSaved = !!savedOrder;
            const isDirty =
              isSaved &&
              (savedOrder.length !== order.length ||
                savedOrder.some((id, i) => id !== order[i]));
            return (
              <div
                key={g}
                className={`bg-pitch-card border rounded-sm p-4 ${
                  isSaved && !isDirty ? "border-brand-grass/40" : "border-pitch-line"
                }`}
              >
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h2 className="text-lg font-black italic uppercase tracking-tight">
                    {t("Group")} {g}
                  </h2>
                  <div className="flex items-center gap-2">
                    {isSaved && !isDirty && (
                      <span className="text-[10px] uppercase font-bold text-brand-grass flex items-center gap-1 bg-brand-grass/10 border border-brand-grass/40 rounded-sm px-2 py-0.5">
                        <CheckCircle size={10} /> {t("Predicted")}
                      </span>
                    )}
                    {isDirty && (
                      <span className="text-[10px] uppercase font-bold text-brand-gold flex items-center gap-1 bg-brand-gold/10 border border-brand-gold/40 rounded-sm px-2 py-0.5">
                        {t("Unsaved changes")}
                      </span>
                    )}
                    {!isSaved && !locked && (
                      <span className="text-[10px] uppercase font-bold text-slate-500 border border-pitch-line rounded-sm px-2 py-0.5">
                        {t("Open")}
                      </span>
                    )}
                    {locked && (
                      <span className="text-[10px] uppercase text-slate-500 flex items-center gap-1">
                        <Lock size={10} /> {t("locked")}
                      </span>
                    )}
                  </div>
                </div>
                <ol className="space-y-2">
                  {order.map((teamId, idx) => {
                    const team = grouped[g].find((t) => t.id === teamId);
                    if (!team) return null;
                    const correct = actual && actual[idx] === teamId;
                    return (
                      <li
                        key={teamId}
                        className={`flex items-center gap-2 bg-pitch-bg border rounded-sm px-3 py-2 ${
                          actual
                            ? correct
                              ? "border-brand-grass"
                              : "border-brand-red/40"
                            : "border-pitch-line"
                        }`}
                      >
                        <span className="text-brand-sky font-bold text-xs w-4">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-[10px] uppercase text-slate-500 w-9 text-center">
                          {team.fifa_code ?? ""}
                        </span>
                        <span className="flex-1 text-sm">{team.name}</span>
                        {!locked && (
                          <div className="flex flex-col">
                            <button
                              onClick={() => move(g, idx, -1)}
                              disabled={idx === 0}
                              className="text-slate-400 hover:text-white disabled:opacity-20"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => move(g, idx, 1)}
                              disabled={idx === 3}
                              className="text-slate-400 hover:text-white disabled:opacity-20"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
                {!locked && (
                  <button
                    onClick={() => save(g)}
                    className="mt-3 w-full bg-brand-sky hover:brightness-110 text-pitch-bg font-bold uppercase py-2 text-xs rounded-sm"
                  >
                    {savedGroup === g ? t("Saved!") : t("Save Order")}
                  </button>
                )}
                {errorGroup?.group === g && (
                  <p className="mt-2 text-[11px] text-red-300 font-mono bg-red-900/20 border border-red-500/40 rounded-sm p-2">
                    {t("Save failed:")} {errorGroup.msg}
                  </p>
                )}
                {breakdown && (
                  <div className="mt-3 pt-3 border-t border-pitch-line text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>{t("Correct slots")}</span>
                      <span>{breakdown.correctSlots}/4</span>
                    </div>
                    {breakdown.perfectBonus > 0 && (
                      <div className="flex justify-between text-brand-gold">
                        <span>{t("Perfect bonus")}</span>
                        <span>+{breakdown.perfectBonus}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold mt-1">
                      <span>{t("Total")}</span>
                      <span>{breakdown.total}</span>
                    </div>
                    {breakdown.correctSlots === 4 && (
                      <p className="mt-2 text-brand-gold flex items-center gap-1">
                        <CheckCircle size={12} /> {t("Perfect group!")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
