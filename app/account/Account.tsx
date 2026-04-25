"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  useActiveParticipant,
  slugify,
  type Profile,
} from "../../components/ActiveParticipant";
import { User, Plus, Trash2, Save, AlertCircle } from "lucide-react";

const PREDICTION_TABLES = [
  "match_predictions",
  "group_predictions",
  "topscorer_picks",
  "tournament_picks",
  "leaderboard_cache",
];

export function Account() {
  const { authEmail, profiles, refresh, activeKey, setActiveKey } =
    useActiveParticipant();
  const [msg, setMsg] = useState<string | null>(null);

  const owner = profiles.find((p) => p.is_owner);
  const kids = profiles.filter((p) => !p.is_owner);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">
          Account
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Signed in as <span className="font-mono">{authEmail}</span>. Manage your
          display name and add play accounts for kids.
        </p>
      </div>

      {msg && (
        <p
          className={`text-xs font-mono rounded-sm p-3 border ${
            msg.startsWith("FAILED")
              ? "text-red-300 bg-red-900/20 border-red-500/40"
              : "text-brand-grass bg-pitch-card border-pitch-line"
          }`}
        >
          {msg}
        </p>
      )}

      {owner && (
        <ProfileEditor
          profile={owner}
          onSaved={async () => {
            await refresh();
            setMsg("Display name updated.");
          }}
          onError={(e) => setMsg(`FAILED: ${e}`)}
          isOwner
        />
      )}

      <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <User size={16} className="text-brand-sky" />
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-sky">
            Kid Accounts
          </h2>
        </div>
        <p className="text-[11px] text-slate-500 font-mono mb-4">
          Add play accounts for kids. Each one has its own predictions and
          leaderboard ranking. Switch who you&apos;re playing as via the dropdown
          in the top nav.
        </p>

        {kids.length === 0 ? (
          <p className="text-slate-600 text-sm mb-4">No kid accounts yet.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {kids.map((p) => (
              <ProfileRow
                key={p.participant_key}
                profile={p}
                onUpdated={async () => {
                  await refresh();
                  setMsg("Kid account updated.");
                }}
                onDeleted={async () => {
                  if (activeKey === p.participant_key) {
                    setActiveKey(authEmail);
                  }
                  await refresh();
                  setMsg("Kid account deleted (predictions wiped).");
                }}
                onError={(e) => setMsg(`FAILED: ${e}`)}
              />
            ))}
          </ul>
        )}

        <AddKidForm
          authEmail={authEmail}
          existingKeys={new Set(profiles.map((p) => p.participant_key))}
          onAdded={async () => {
            await refresh();
            setMsg("Kid account added.");
          }}
          onError={(e) => setMsg(`FAILED: ${e}`)}
        />
      </section>
    </div>
  );
}

function ProfileEditor({
  profile,
  onSaved,
  onError,
  isOwner,
}: {
  profile: Profile;
  onSaved: () => Promise<void>;
  onError: (e: string) => void;
  isOwner: boolean;
}) {
  const [name, setName] = useState(profile.display_name);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("participant_profiles")
      .update({ display_name: name.trim() })
      .eq("participant_key", profile.participant_key);
    setSaving(false);
    if (error) onError(error.message);
    else await onSaved();
  }

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        <User size={16} className="text-brand-gold" />
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-gold">
          {isOwner ? "Your Profile" : "Profile"}
        </h2>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mb-3">
        Shown on the leaderboard.
      </p>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">
            Display name
          </label>
          <input
            type="text"
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-pitch-bg border border-pitch-line rounded-sm py-2 px-3 text-sm"
          />
        </div>
        <button
          onClick={save}
          disabled={saving || name.trim() === profile.display_name || !name.trim()}
          className="bg-brand-sky hover:bg-sky-500 text-pitch-bg font-bold uppercase text-xs px-4 py-2 rounded-sm flex items-center gap-1 disabled:opacity-40"
        >
          <Save size={12} /> Save
        </button>
      </div>
    </section>
  );
}

function ProfileRow({
  profile,
  onUpdated,
  onDeleted,
  onError,
}: {
  profile: Profile;
  onUpdated: () => Promise<void>;
  onDeleted: () => Promise<void>;
  onError: (e: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.display_name);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);

  async function rename() {
    setBusy(true);
    const { error } = await supabase
      .from("participant_profiles")
      .update({ display_name: name.trim() })
      .eq("participant_key", profile.participant_key);
    setBusy(false);
    if (error) onError(error.message);
    else {
      setEditing(false);
      await onUpdated();
    }
  }

  async function deleteKid() {
    setBusy(true);
    // Cascade-delete this participant's predictions, then their profile.
    for (const tbl of PREDICTION_TABLES) {
      const { error } = await supabase
        .from(tbl)
        .delete()
        .eq("user_email", profile.participant_key);
      if (error) {
        setBusy(false);
        onError(`${tbl}: ${error.message}`);
        return;
      }
    }
    const { error } = await supabase
      .from("participant_profiles")
      .delete()
      .eq("participant_key", profile.participant_key);
    setBusy(false);
    if (error) onError(error.message);
    else await onDeleted();
  }

  return (
    <li className="bg-pitch-bg border border-pitch-line rounded-sm px-3 py-2">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-pitch-card border border-pitch-line rounded-sm py-1 px-2 text-sm"
          />
          <button
            onClick={rename}
            disabled={busy}
            className="text-brand-sky hover:text-sky-300 text-xs font-bold uppercase"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setName(profile.display_name);
            }}
            className="text-slate-500 hover:text-white text-xs font-bold uppercase"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm font-bold">{profile.display_name}</span>
          <span className="text-[10px] font-mono text-slate-500">
            {profile.participant_key.split("#")[1]}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Rename
          </button>
          {confirmDel ? (
            <>
              <button
                onClick={deleteKid}
                disabled={busy}
                className="text-xs font-bold text-brand-red hover:text-red-400"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className="text-xs text-slate-500"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="text-slate-500 hover:text-brand-red"
              title="Delete (also wipes predictions)"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function AddKidForm({
  authEmail,
  existingKeys,
  onAdded,
  onError,
}: {
  authEmail: string;
  existingKeys: Set<string>;
  onAdded: () => Promise<void>;
  onError: (e: string) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const slug = slugify(name);
  const wouldKey = slug ? `${authEmail}#${slug}` : "";
  const taken = wouldKey && existingKeys.has(wouldKey);

  async function add() {
    if (!name.trim() || !slug || taken) return;
    setBusy(true);
    const { error } = await supabase.from("participant_profiles").insert({
      participant_key: wouldKey,
      owner_email: authEmail,
      display_name: name.trim(),
      is_owner: false,
    });
    setBusy(false);
    if (error) onError(error.message);
    else {
      setName("");
      await onAdded();
    }
  }

  return (
    <div className="border-t border-pitch-line pt-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">
        Add a kid account
      </p>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
            placeholder="Child name (e.g. Alex)"
            className="w-full bg-pitch-bg border border-pitch-line rounded-sm py-2 px-3 text-sm"
          />
          {slug && (
            <p className="text-[10px] font-mono text-slate-500 pl-1">
              Will be saved as: <span className="text-slate-400">{wouldKey}</span>
            </p>
          )}
          {taken && (
            <p className="text-[10px] text-red-300 font-mono flex items-center gap-1 pl-1">
              <AlertCircle size={10} /> A kid with this name already exists.
            </p>
          )}
        </div>
        <button
          onClick={add}
          disabled={busy || !name.trim() || !slug || !!taken}
          className="bg-brand-grass hover:bg-emerald-500 text-pitch-bg font-bold uppercase text-xs px-4 py-2 rounded-sm flex items-center gap-1 disabled:opacity-40"
        >
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}
