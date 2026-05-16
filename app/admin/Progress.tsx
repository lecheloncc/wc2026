"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Activity,
  Check,
  Circle,
  Copy,
  Loader2,
} from "lucide-react";

type ProgressRow = {
  participant_key: string;
  display_name: string;
  owner_email: string;
  is_owner: boolean;
  group_count: number;
  tournament_done: boolean;
  topscorer_done: boolean;
  total_done: number; // 0–3 across the three categories
};

const COLS =
  "grid-cols-[1fr_70px_70px_70px_28px] gap-x-2";

export function Progress() {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [
        { data: profiles },
        { data: groupPreds },
        { data: tournPreds },
        { data: tsPreds },
      ] = await Promise.all([
        supabase
          .from("participant_profiles")
          .select("participant_key, display_name, owner_email, is_owner"),
        supabase
          .from("group_predictions")
          .select("user_email, group_code"),
        supabase
          .from("tournament_picks")
          .select(
            "user_email, champion_team_id, finalist_a_team_id, finalist_b_team_id, dark_horse_team_id"
          ),
        supabase.from("topscorer_picks").select("user_email, player_ids"),
      ]);

      // Group count per participant — use Set to dedupe in case of duplicates
      const groupByKey = new Map<string, Set<string>>();
      for (const g of groupPreds ?? []) {
        const s = groupByKey.get(g.user_email) ?? new Set<string>();
        s.add(g.group_code);
        groupByKey.set(g.user_email, s);
      }

      const tournByKey = new Map<string, boolean>();
      for (const t of tournPreds ?? []) {
        const done =
          t.champion_team_id != null &&
          t.finalist_a_team_id != null &&
          t.finalist_b_team_id != null &&
          t.dark_horse_team_id != null;
        tournByKey.set(t.user_email, done);
      }

      const tsByKey = new Map<string, boolean>();
      for (const t of tsPreds ?? []) {
        tsByKey.set(t.user_email, (t.player_ids?.length ?? 0) === 3);
      }

      const built: ProgressRow[] = (profiles ?? []).map((p) => {
        const groupCount = groupByKey.get(p.participant_key)?.size ?? 0;
        const tournamentDone = tournByKey.get(p.participant_key) ?? false;
        const topscorerDone = tsByKey.get(p.participant_key) ?? false;
        const groupFull = groupCount === 12;
        const totalDone =
          (groupFull ? 1 : 0) +
          (tournamentDone ? 1 : 0) +
          (topscorerDone ? 1 : 0);
        return {
          participant_key: p.participant_key,
          display_name: p.display_name,
          owner_email: p.owner_email,
          is_owner: p.is_owner,
          group_count: groupCount,
          tournament_done: tournamentDone,
          topscorer_done: topscorerDone,
          total_done: totalDone,
        };
      });

      // Sort: incomplete first (chase candidates), within that
      // started-but-not-done before not-started, then alphabetical.
      built.sort((a, b) => {
        if (a.total_done !== b.total_done) return a.total_done - b.total_done;
        // Same completion count — prefer started over zero (more useful to chase)
        const aHasAny =
          a.group_count > 0 || a.tournament_done || a.topscorer_done;
        const bHasAny =
          b.group_count > 0 || b.tournament_done || b.topscorer_done;
        if (aHasAny !== bHasAny) return aHasAny ? -1 : 1;
        return a.display_name.localeCompare(b.display_name);
      });

      setRows(built);
      setLoading(false);
    })();
  }, []);

  const fullyReady = useMemo(
    () => rows.filter((r) => r.total_done === 3).length,
    [rows]
  );

  function copyEmail(email: string) {
    void navigator.clipboard
      .writeText(email)
      .then(() => {
        setCopied(email);
        setTimeout(() => setCopied(null), 1500);
      })
      .catch(() => {});
  }

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-brand-sky" />
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-sky">
            Pre-tournament progress
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {fullyReady} / {rows.length} fully ready
        </span>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-4">
        Incomplete participants surface first so you know who to chase before
        the lock.
      </p>

      {loading ? (
        <p className="text-slate-500 text-xs">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-600 text-sm">No participants yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <div
            className={`grid ${COLS} text-[10px] uppercase tracking-widest font-mono text-slate-500 border-b border-pitch-line pb-2 mb-1`}
          >
            <span>Name</span>
            <span className="text-center">Groups</span>
            <span className="text-center">Tour.</span>
            <span className="text-center">Topsc.</span>
            <span />
          </div>
          {rows.map((r) => {
            const groupFull = r.group_count === 12;
            const groupStarted = r.group_count > 0 && !groupFull;
            return (
              <div
                key={r.participant_key}
                className={`grid ${COLS} items-center py-2 border-b border-pitch-line/40 text-sm ${
                  r.total_done === 3 ? "opacity-60" : ""
                }`}
              >
                <span className="min-w-0 truncate">
                  <span className="font-bold">{r.display_name}</span>
                  {!r.is_owner && (
                    <span className="ml-2 text-[10px] text-slate-500 font-mono">
                      (kid)
                    </span>
                  )}
                  <span className="ml-2 text-[10px] text-slate-500 font-mono">
                    {r.owner_email}
                  </span>
                </span>
                <span
                  className={`text-center font-mono text-xs font-bold ${
                    groupFull
                      ? "text-brand-grass"
                      : groupStarted
                      ? "text-brand-gold"
                      : "text-slate-500"
                  }`}
                  title="Group order picks (need 12 for full)"
                >
                  {r.group_count} / 12
                </span>
                <span className="flex items-center justify-center" title="Champion / Finalists / Dark Horse">
                  {r.tournament_done ? (
                    <Check size={14} className="text-brand-grass" />
                  ) : (
                    <Circle size={10} className="text-slate-600" />
                  )}
                </span>
                <span className="flex items-center justify-center" title="3 topscorer picks">
                  {r.topscorer_done ? (
                    <Check size={14} className="text-brand-grass" />
                  ) : (
                    <Circle size={10} className="text-slate-600" />
                  )}
                </span>
                <button
                  onClick={() => copyEmail(r.owner_email)}
                  className="text-slate-500 hover:text-white"
                  title={`Copy ${r.owner_email}`}
                >
                  {copied === r.owner_email ? (
                    <Loader2 size={12} className="text-brand-grass" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
