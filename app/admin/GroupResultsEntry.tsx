"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Trophy, Check, ArrowUp, ArrowDown } from "lucide-react";

type Team = { id: number; name: string; group_code: string; flag_emoji: string | null };
type GroupResult = { group_code: string; order_team_ids: number[] };

const GROUPS = "ABCDEFGHIJKL".split("");

export function GroupResultsEntry() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Map<string, number[]>>(new Map());
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Local draft state per group — initially loaded from DB
  const [drafts, setDrafts] = useState<Map<string, number[]>>(new Map());

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: gr }] = await Promise.all([
        supabase.from("teams").select("id, name, group_code, flag_emoji").order("group_code"),
        supabase.from("group_results").select("group_code, order_team_ids"),
      ]);
      setTeams(t ?? []);
      const resMap = new Map<string, number[]>();
      const draftMap = new Map<string, number[]>();
      for (const r of gr ?? []) {
        resMap.set(r.group_code, r.order_team_ids);
        draftMap.set(r.group_code, [...r.order_team_ids]);
      }
      // Init drafts for groups without results yet
      const teamsByGroup = new Map<string, Team[]>();
      for (const tm of t ?? []) {
        const list = teamsByGroup.get(tm.group_code) ?? [];
        list.push(tm);
        teamsByGroup.set(tm.group_code, list);
      }
      for (const g of GROUPS) {
        if (!draftMap.has(g)) {
          const groupTeams = teamsByGroup.get(g) ?? [];
          draftMap.set(g, groupTeams.map((t) => t.id));
        }
      }
      setResults(resMap);
      setDrafts(draftMap);
    })();
  }, []);

  const teamById = new Map(teams.map((t) => [t.id, t]));

  function moveDraft(group: string, index: number, dir: -1 | 1) {
    const order = [...(drafts.get(group) ?? [])];
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= order.length) return;
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    setDrafts(new Map(drafts).set(group, order));
  }

  async function saveGroup(group: string) {
    const order = drafts.get(group);
    if (!order || order.length !== 4) return;
    setSaving(group);
    setMsg(null);

    const existing = results.has(group);
    let error;
    if (existing) {
      ({ error } = await supabase
        .from("group_results")
        .update({ order_team_ids: order, finalized_at: new Date().toISOString() })
        .eq("group_code", group));
    } else {
      ({ error } = await supabase.from("group_results").insert({
        group_code: group,
        order_team_ids: order,
        finalized_at: new Date().toISOString(),
      }));
    }

    setSaving(null);
    if (error) {
      setMsg(`FAILED Group ${group}: ${error.message}`);
    } else {
      setMsg(`Saved Group ${group} final standings.`);
      setResults(new Map(results).set(group, [...order]));
    }
  }

  const savedCount = results.size;

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={16} className="text-brand-sky" />
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-sky">
          Group Final Standings
        </h2>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-4">
        Set the final 1st–4th order for each group after group stage completes.
        Used for group-order scoring. {savedCount} / 12 saved.
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GROUPS.map((g) => {
          const order = drafts.get(g) ?? [];
          const isSaved = results.has(g);
          const savedOrder = results.get(g);
          const isDirty =
            !isSaved || JSON.stringify(order) !== JSON.stringify(savedOrder);
          return (
            <div
              key={g}
              className={`bg-pitch-bg border rounded-sm p-3 ${
                isSaved && !isDirty
                  ? "border-brand-grass/40"
                  : "border-pitch-line"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-bold">
                  Group {g}
                </p>
                {isSaved && !isDirty && (
                  <Check size={12} className="text-brand-grass" />
                )}
              </div>
              <ul className="space-y-1">
                {order.map((teamId, idx) => {
                  const tm = teamById.get(teamId);
                  return (
                    <li
                      key={teamId}
                      className="flex items-center gap-1 text-sm"
                    >
                      <span className="text-[10px] font-mono text-slate-500 w-5 text-center">
                        {idx + 1}.
                      </span>
                      <span className="flex-1 truncate">
                        {tm?.flag_emoji ? `${tm.flag_emoji} ` : ""}
                        {tm?.name ?? `ID ${teamId}`}
                      </span>
                      <button
                        onClick={() => moveDraft(g, idx, -1)}
                        disabled={idx === 0}
                        className="text-slate-500 hover:text-white disabled:opacity-20 p-0.5"
                        title="Move up"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => moveDraft(g, idx, 1)}
                        disabled={idx === order.length - 1}
                        className="text-slate-500 hover:text-white disabled:opacity-20 p-0.5"
                        title="Move down"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => saveGroup(g)}
                disabled={saving === g}
                className={`mt-2 w-full font-bold uppercase text-[10px] px-3 py-1.5 rounded-sm ${
                  isDirty
                    ? "bg-brand-sky text-pitch-bg"
                    : "bg-brand-grass/20 text-brand-grass border border-brand-grass/40"
                } disabled:opacity-40`}
              >
                {saving === g ? "…" : isDirty ? "Save" : "Saved ✓"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
