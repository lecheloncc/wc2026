"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Trophy } from "lucide-react";
import { useActiveParticipant } from "../../components/ActiveParticipant";
import { useT } from "../../components/I18n";
import { isWerk, COUNTRIES } from "../../lib/work-tags";

type Row = {
  user_email: string;
  display_name: string;
  parent_display_name: string | null;
  is_owner: boolean;
  department: string | null;
  country: string | null;
  match_points: number;
  group_points: number;
  topscorer_points: number;
  tournament_points: number;
  total: number;
};

type Mode = "individual" | "by-department" | "by-country";

const COLS_DEFAULT = "grid-cols-[28px_1fr_60px_55px_55px_55px_60px] gap-x-2";
const COLS_WERK =
  "grid-cols-[28px_1fr_70px_70px_55px_55px_55px_55px_60px] gap-x-2";
const COLS_GROUP = "grid-cols-[28px_1fr_55px_60px] gap-x-2";

type CountryRow = (typeof COUNTRIES)[number];
const COUNTRY_BY_CODE: Map<string, CountryRow> = new Map(
  COUNTRIES.map((c) => [c.code, c])
);

export function Leaderboard() {
  const { activeKey } = useActiveParticipant();
  const { t } = useT();
  const [rows, setRows] = useState<Row[]>([]);
  const [mode, setMode] = useState<Mode>("individual");
  const werk = isWerk();

  useEffect(() => {
    (async () => {
      const [{ data: board }, { data: profilesRaw }] = await Promise.all([
        supabase
          .from("leaderboard_cache")
          .select("*")
          .order("total", { ascending: false }),
        supabase
          .from("participant_profiles")
          .select(
            werk
              ? "participant_key, display_name, owner_email, is_owner, department, country"
              : "participant_key, display_name, owner_email, is_owner"
          ),
      ]);

      type DBProfile = {
        participant_key: string;
        display_name: string;
        owner_email: string;
        is_owner: boolean;
        department?: string | null;
        country?: string | null;
      };
      const profiles = (profilesRaw as unknown as DBProfile[] | null) ?? [];

      const byKey = new Map(profiles.map((p) => [p.participant_key, p]));
      const ownerByEmail = new Map(
        profiles.filter((p) => p.is_owner).map((p) => [p.owner_email, p])
      );

      setRows(
        (board ?? []).map((r) => {
          const profile = byKey.get(r.user_email);
          const ownerProfile =
            profile && !profile.is_owner
              ? ownerByEmail.get(profile.owner_email)
              : null;
          return {
            user_email: r.user_email,
            display_name: profile?.display_name ?? r.user_email,
            parent_display_name:
              ownerProfile?.display_name ??
              (profile && !profile.is_owner
                ? profile.owner_email.split("@")[0]
                : null),
            is_owner: profile?.is_owner ?? true,
            department: profile?.department ?? null,
            country: profile?.country ?? null,
            match_points: r.match_points,
            group_points: r.group_points,
            topscorer_points: r.topscorer_points,
            tournament_points: r.tournament_points ?? 0,
            total: r.total,
          };
        })
      );
    })();
  }, [werk]);

  // Aggregations (only meaningful on werk)
  const byDepartment = useMemo(() => groupAggregate(rows, "department"), [rows]);
  const byCountry = useMemo(() => groupAggregate(rows, "country"), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-black italic uppercase tracking-tighter">
          {t("Leaderboard")}
        </h1>
        {werk && (
          <div className="flex items-center gap-1 bg-pitch-card border border-pitch-line rounded-sm p-0.5">
            <ModeBtn label="Players" active={mode === "individual"} onClick={() => setMode("individual")} />
            <ModeBtn label="Department" active={mode === "by-department"} onClick={() => setMode("by-department")} />
            <ModeBtn label="Country" active={mode === "by-country"} onClick={() => setMode("by-country")} />
          </div>
        )}
      </div>

      {mode === "individual" && (
        <IndividualTable rows={rows} activeKey={activeKey} t={t} werk={werk} />
      )}
      {mode === "by-department" && werk && (
        <GroupTable groups={byDepartment} t={t} kind="dept" />
      )}
      {mode === "by-country" && werk && (
        <GroupTable groups={byCountry} t={t} kind="country" />
      )}
    </div>
  );
}

function ModeBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm transition-colors ${
        active ? "bg-brand-sky text-pitch-bg" : "text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function IndividualTable({
  rows,
  activeKey,
  t,
  werk,
}: {
  rows: Row[];
  activeKey: string;
  t: (k: string) => string;
  werk: boolean;
}) {
  const cols = werk ? COLS_WERK : COLS_DEFAULT;
  return (
    <div className="bg-pitch-card border border-pitch-line rounded-sm overflow-hidden">
      <div
        className={`grid ${cols} text-[10px] uppercase tracking-widest font-mono text-slate-500 border-b border-pitch-line px-3 py-2`}
      >
        <span>#</span>
        <span>{t("Player")}</span>
        {werk && <span>Dept</span>}
        {werk && <span>Country</span>}
        <span className="text-right">{t("Match")}</span>
        <span className="text-right">{t("Group")}</span>
        <span className="text-right">{t("Scorer")}</span>
        <span className="text-right">{t("Bonus")}</span>
        <span className="text-right">{t("Total")}</span>
      </div>
      {rows.length === 0 && (
        <p className="text-slate-500 text-xs px-3 py-6 text-center">
          {t("No scores yet. Come back after the opening match!")}
        </p>
      )}
      {rows.map((r, i) => {
        const isMe = r.user_email === activeKey;
        const country = r.country ? COUNTRY_BY_CODE.get(r.country) : null;
        return (
          <div
            key={r.user_email}
            className={`grid ${cols} items-center px-3 py-2 text-sm border-b border-pitch-line/50 ${
              isMe ? "bg-brand-sky/10" : ""
            }`}
          >
            <span className="font-mono text-slate-500 flex items-center gap-1">
              {i < 3 && <Trophy size={12} className="text-brand-gold" />}
              {i + 1}
            </span>
            <span className="truncate">
              {r.display_name}
              {!r.is_owner && r.parent_display_name && (
                <span className="ml-2 text-[10px] text-slate-500 font-mono">
                  ({r.parent_display_name}&apos;s)
                </span>
              )}
            </span>
            {werk && (
              <span className="text-[11px] text-slate-300 truncate">
                {r.department ?? <span className="text-slate-600">—</span>}
              </span>
            )}
            {werk && (
              <span className="text-[11px] text-slate-300">
                {country ? (
                  <>
                    {country.flag} {country.short}
                  </>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </span>
            )}
            <span className="text-right font-mono text-xs">{r.match_points}</span>
            <span className="text-right font-mono text-xs">{r.group_points}</span>
            <span className="text-right font-mono text-xs">{r.topscorer_points}</span>
            <span className="text-right font-mono text-xs">{r.tournament_points}</span>
            <span className="text-right font-bold">{r.total}</span>
          </div>
        );
      })}
    </div>
  );
}

type GroupAgg = {
  key: string;
  label: string;
  members: number;
  total: number;
  avg: number;
};

function groupAggregate(rows: Row[], field: "department" | "country"): GroupAgg[] {
  const buckets = new Map<string, { total: number; members: number }>();
  for (const r of rows) {
    const v = r[field];
    if (!v) continue;
    const cur = buckets.get(v) ?? { total: 0, members: 0 };
    cur.total += r.total;
    cur.members += 1;
    buckets.set(v, cur);
  }
  return [...buckets.entries()]
    .map(([key, b]) => {
      const country =
        field === "country"
          ? COUNTRIES.find((c) => c.code === key)
          : null;
      const label = country ? `${country.flag} ${country.label}` : key;
      return {
        key,
        label,
        members: b.members,
        total: b.total,
        avg: b.members > 0 ? Math.round(b.total / b.members) : 0,
      };
    })
    .sort((a, b) => b.avg - a.avg);
}

function GroupTable({
  groups,
  t,
  kind,
}: {
  groups: GroupAgg[];
  t: (k: string) => string;
  kind: "dept" | "country";
}) {
  return (
    <div className="bg-pitch-card border border-pitch-line rounded-sm overflow-hidden">
      <div
        className={`grid ${COLS_GROUP} text-[10px] uppercase tracking-widest font-mono text-slate-500 border-b border-pitch-line px-3 py-2`}
      >
        <span>#</span>
        <span>{kind === "dept" ? "Department" : "Country"}</span>
        <span className="text-right">Members</span>
        <span className="text-right">Avg</span>
      </div>
      {groups.length === 0 ? (
        <p className="text-slate-500 text-xs px-3 py-6 text-center">
          No {kind === "dept" ? "departments" : "countries"} tagged yet — set
          tags on /admin first.
        </p>
      ) : (
        groups.map((g, i) => (
          <div
            key={g.key}
            className={`grid ${COLS_GROUP} items-center px-3 py-2 text-sm border-b border-pitch-line/50`}
          >
            <span className="font-mono text-slate-500 flex items-center gap-1">
              {i < 3 && <Trophy size={12} className="text-brand-gold" />}
              {i + 1}
            </span>
            <span className="truncate font-bold">{g.label}</span>
            <span className="text-right font-mono text-xs text-slate-400">
              {g.members}
            </span>
            <span className="text-right font-bold">{g.avg}</span>
          </div>
        ))
      )}
      {groups.length > 0 && (
        <p className="text-[10px] text-slate-500 font-mono px-3 py-2 border-t border-pitch-line">
          Ranked by average points per member · {t("Total")} pool ={" "}
          {groups.reduce((s, g) => s + g.total, 0)} pts across{" "}
          {groups.reduce((s, g) => s + g.members, 0)} players.
        </p>
      )}
    </div>
  );
}
