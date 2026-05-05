"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Users, Save, Loader2, Check, Circle } from "lucide-react";
import { DEPARTMENTS, COUNTRIES, isWerk } from "../../lib/work-tags";

type Row = {
  participant_key: string;
  display_name: string;
  owner_email: string;
  is_owner: boolean;
  department: string | null;
  country: string | null;
  paid: boolean;
};

export function Participants() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const werk = isWerk();

  async function load() {
    const profileSelect = werk
      ? "participant_key, display_name, owner_email, is_owner, department, country"
      : "participant_key, display_name, owner_email, is_owner";
    const [{ data, error }, paymentsRes] = await Promise.all([
      supabase
        .from("participant_profiles")
        .select(profileSelect)
        .order("is_owner", { ascending: false })
        .order("display_name", { ascending: true }),
      supabase.from("participant_payments").select("participant_key, paid"),
    ]);
    if (error) setMsg(`Load FAILED: ${error.message}`);
    const paidByKey = new Map(
      (paymentsRes.data ?? []).map((p) => [p.participant_key, p.paid])
    );
    type DBProfile = {
      participant_key: string;
      display_name: string;
      owner_email: string;
      is_owner: boolean;
      department?: string | null;
      country?: string | null;
    };
    const list = (data as unknown as DBProfile[] | null) ?? [];
    setRows(
      list.map((p) => ({
        participant_key: p.participant_key,
        display_name: p.display_name,
        owner_email: p.owner_email,
        is_owner: p.is_owner,
        department: p.department ?? null,
        country: p.country ?? null,
        paid: paidByKey.get(p.participant_key) ?? false,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function togglePaid(participant_key: string, next: boolean) {
    setSaving(participant_key + ":paid");
    setMsg(null);
    const { error } = await supabase
      .from("participant_payments")
      .upsert({
        participant_key,
        paid: next,
        paid_at: next ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      });
    setSaving(null);
    if (error) {
      setMsg(`Paid toggle FAILED for ${participant_key}: ${error.message}`);
      return;
    }
    setRows((cur) =>
      cur.map((r) =>
        r.participant_key === participant_key ? { ...r, paid: next } : r
      )
    );
  }

  const taggedCount = werk
    ? rows.filter((r) => r.department && r.country).length
    : rows.length;
  const paidCount = rows.filter((r) => r.paid).length;

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-brand-sky" />
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-sky">
            Participants
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
          <span>{paidCount} / {rows.length} paid</span>
          {werk && <span>·</span>}
          {werk && <span>{taggedCount} / {rows.length} tagged</span>}
        </div>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-4">
        {werk
          ? "Set department + country + payment status for each player. Changes save automatically."
          : "Toggle Paid as you receive entry-fee transfers. Changes save automatically."}
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
                {werk && <th className="text-left pr-2">Department</th>}
                {werk && <th className="text-left pr-2">Country</th>}
                <th className="text-center pr-2">Paid</th>
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
                    {werk && (
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
                    )}
                    {werk && (
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
                    )}
                    <td className="pr-2 text-center">
                      <button
                        onClick={() => togglePaid(r.participant_key, !r.paid)}
                        disabled={busy}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-sm border transition-colors ${
                          r.paid
                            ? "bg-brand-grass/20 border-brand-grass/50 text-brand-grass"
                            : "bg-pitch-bg border-pitch-line text-slate-500 hover:border-brand-grass/50"
                        } disabled:opacity-50`}
                        title={r.paid ? "Mark unpaid" : "Mark paid"}
                      >
                        {busy && saving?.endsWith(":paid") ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : r.paid ? (
                          <Check size={14} />
                        ) : (
                          <Circle size={10} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!werk && (
        <p className="text-[10px] text-slate-500 font-mono mt-3">
          Tip: Ctrl-F here to find by name, then click the circle to mark paid.
        </p>
      )}
    </section>
  );
}
