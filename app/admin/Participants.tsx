"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Users, Save, Loader2 } from "lucide-react";
import { DEPARTMENTS, COUNTRIES } from "../../lib/work-tags";

type Row = {
  participant_key: string;
  display_name: string;
  owner_email: string;
  is_owner: boolean;
  department: string | null;
  country: string | null;
};

export function Participants() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("participant_profiles")
      .select(
        "participant_key, display_name, owner_email, is_owner, department, country"
      )
      .order("is_owner", { ascending: false })
      .order("display_name", { ascending: true });
    if (error) setMsg(`Load FAILED: ${error.message}`);
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(
    participant_key: string,
    field: "department" | "country",
    value: string | null
  ) {
    setSaving(participant_key + ":" + field);
    setMsg(null);
    const { error } = await supabase
      .from("participant_profiles")
      .update({ [field]: value })
      .eq("participant_key", participant_key);
    setSaving(null);
    if (error) {
      setMsg(`Save FAILED for ${participant_key}: ${error.message}`);
      return;
    }
    setRows((cur) =>
      cur.map((r) =>
        r.participant_key === participant_key ? { ...r, [field]: value } : r
      )
    );
  }

  const taggedCount = rows.filter((r) => r.department && r.country).length;

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-brand-sky" />
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-sky">
            Participants
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {taggedCount} / {rows.length} tagged
        </span>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-4">
        Set department + country for every player so the leaderboard can be
        broken down by team / office. Changes save automatically.
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

      {loading ? (
        <p className="text-slate-500 text-xs">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-600 text-sm">No participants yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest font-mono text-slate-500 border-b border-pitch-line">
                <th className="text-left py-2 pr-2">Name</th>
                <th className="text-left pr-2">Email</th>
                <th className="text-left pr-2">Department</th>
                <th className="text-left pr-2">Country</th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const busy = saving?.startsWith(r.participant_key);
                return (
                  <tr
                    key={r.participant_key}
                    className="border-b border-pitch-line/40"
                  >
                    <td className="py-2 pr-2">
                      <span className="font-bold">{r.display_name}</span>
                      {!r.is_owner && (
                        <span className="ml-2 text-[10px] text-slate-500 font-mono">
                          (kid)
                        </span>
                      )}
                    </td>
                    <td className="pr-2 text-xs text-slate-400 font-mono truncate max-w-[200px]">
                      {r.owner_email}
                    </td>
                    <td className="pr-2">
                      <select
                        value={r.department ?? ""}
                        onChange={(e) =>
                          update(
                            r.participant_key,
                            "department",
                            e.target.value || null
                          )
                        }
                        disabled={busy}
                        className="bg-pitch-bg border border-pitch-line rounded-sm px-2 py-1 text-xs"
                      >
                        <option value="">—</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="pr-2">
                      <select
                        value={r.country ?? ""}
                        onChange={(e) =>
                          update(
                            r.participant_key,
                            "country",
                            e.target.value || null
                          )
                        }
                        disabled={busy}
                        className="bg-pitch-bg border border-pitch-line rounded-sm px-2 py-1 text-xs"
                      >
                        <option value="">—</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {busy ? (
                        <Loader2 size={12} className="animate-spin text-brand-sky" />
                      ) : r.department && r.country ? (
                        <Save size={12} className="text-brand-grass" />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
