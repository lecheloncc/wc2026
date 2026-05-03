"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useT } from "./I18n";

export type SavedPred = { pred_home: number; pred_away: number };

/**
 * Compact in-row score editor used by /matches and /bracket. Owns the input
 * state + save handler + error surfacing. Reports back via onSaved so the
 * parent can update its local row state (green pill / saved-score chip)
 * without refetching the whole list.
 */
export function InlineScoreEditor({
  matchId,
  activeKey,
  initialPredHome,
  initialPredAway,
  onSaved,
}: {
  matchId: number;
  activeKey: string;
  initialPredHome: number | null;
  initialPredAway: number | null;
  onSaved: (p: SavedPred) => void;
}) {
  const { t } = useT();
  const [home, setHome] = useState<number>(initialPredHome ?? 0);
  const [away, setAway] = useState<number>(initialPredAway ?? 0);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.MouseEvent | React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    setErr(null);
    const { error } = await supabase.from("match_predictions").upsert({
      user_email: activeKey,
      match_id: matchId,
      pred_home: home,
      pred_away: away,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
    onSaved({ pred_home: home, pred_away: away });
  }

  return (
    <div className="flex items-center gap-2">
      <ScoreInput value={home} onChange={setHome} disabled={saving} />
      <span className="text-slate-500 font-mono">–</span>
      <ScoreInput value={away} onChange={setAway} disabled={saving} />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className={`shrink-0 h-9 px-3 rounded-sm text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 ${
          justSaved
            ? "bg-brand-grass text-pitch-bg"
            : "bg-brand-sky hover:brightness-110 text-pitch-bg disabled:opacity-50"
        }`}
        title={t("Save Prediction")}
      >
        {justSaved ? (
          <>
            <Check size={12} /> {t("Saved!")}
          </>
        ) : (
          <>
            <Save size={12} /> {t("Save")}
          </>
        )}
      </button>
      {err && (
        <span className="text-[10px] text-red-300 font-mono">
          {err.slice(0, 40)}
        </span>
      )}
    </div>
  );
}

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      onClick={(e) => e.stopPropagation()}
      className="w-12 h-9 text-center bg-pitch-bg border border-pitch-line rounded-sm text-base font-bold text-white disabled:opacity-50"
    />
  );
}
