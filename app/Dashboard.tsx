"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useActiveParticipant } from "../components/ActiveParticipant";
import { useT } from "../components/I18n";
import {
  Calendar,
  Target,
  Trophy,
  Users,
  Crown,
  Clock,
  CheckCircle,
} from "lucide-react";

type NextMatch = {
  id: number;
  kickoff: string;
  home: string | null;
  away: string | null;
  stage: string;
  group_code: string | null;
  pred_home: number | null;
  pred_away: number | null;
};

type DeadlineState = {
  openingKickoff: string | null;
  hasGroupPicks: boolean;
  hasTopscorerPicks: boolean;
  hasTournamentPicks: boolean;
};

export function Dashboard() {
  const { activeKey, activeProfile } = useActiveParticipant();
  const { t, stageName } = useT();
  const [totals, setTotals] = useState<{ total: number; rank: number | null }>({
    total: 0,
    rank: null,
  });
  const [upcomingMatches, setUpcomingMatches] = useState<NextMatch[]>([]);
  const [deadline, setDeadline] = useState<DeadlineState>({
    openingKickoff: null,
    hasGroupPicks: false,
    hasTopscorerPicks: false,
    hasTournamentPicks: false,
  });

  useEffect(() => {
    (async () => {
      if (!activeKey) return;
      const e = activeKey;

      const { data: board } = await supabase
        .from("leaderboard_cache")
        .select("user_email,total")
        .order("total", { ascending: false });
      if (board) {
        const idx = board.findIndex((r) => r.user_email === e);
        const mine = board.find((r) => r.user_email === e);
        setTotals({
          total: mine?.total ?? 0,
          rank: idx >= 0 ? idx + 1 : null,
        });
      }

      const [
        { data: ms },
        { data: opening },
        { data: gp },
        { data: tsp },
        { data: tp },
      ] = await Promise.all([
        supabase
          .from("matches")
          .select(
            "id, kickoff, stage, group_code, home:home_team_id(name), away:away_team_id(name)"
          )
          .gt("kickoff", new Date().toISOString())
          .order("kickoff", { ascending: true })
          .limit(4),
        supabase
          .from("matches")
          .select("kickoff")
          .order("kickoff", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("group_predictions")
          .select("group_code")
          .eq("user_email", e),
        supabase
          .from("topscorer_picks")
          .select("player_ids")
          .eq("user_email", e)
          .maybeSingle(),
        supabase
          .from("tournament_picks")
          .select("champion_team_id, finalist_a_team_id, finalist_b_team_id, dark_horse_team_id")
          .eq("user_email", e)
          .maybeSingle(),
      ]);

      const upcomingIds = (ms ?? []).map((m) => m.id);
      let predMap = new Map<number, { pred_home: number; pred_away: number }>();
      if (upcomingIds.length > 0) {
        const { data: preds } = await supabase
          .from("match_predictions")
          .select("match_id, pred_home, pred_away")
          .eq("user_email", e)
          .in("match_id", upcomingIds);
        predMap = new Map(
          (preds ?? []).map((p) => [
            p.match_id,
            { pred_home: p.pred_home, pred_away: p.pred_away },
          ])
        );
      }

      setUpcomingMatches(
        (ms ?? []).map((m) => {
          const pred = predMap.get(m.id);
          return {
            id: m.id,
            kickoff: m.kickoff,
            stage: m.stage,
            group_code: m.group_code,
            // @ts-expect-error relation
            home: m.home?.name ?? null,
            // @ts-expect-error relation
            away: m.away?.name ?? null,
            pred_home: pred?.pred_home ?? null,
            pred_away: pred?.pred_away ?? null,
          };
        })
      );

      const tournamentDone =
        !!tp &&
        tp.champion_team_id != null &&
        tp.finalist_a_team_id != null &&
        tp.finalist_b_team_id != null &&
        tp.dark_horse_team_id != null;

      setDeadline({
        openingKickoff: opening?.kickoff ?? null,
        hasGroupPicks: (gp ?? []).length === 12,
        hasTopscorerPicks: (tsp?.player_ids?.length ?? 0) === 3,
        hasTournamentPicks: tournamentDone,
      });
    })();
  }, [activeKey]);

  const displayName =
    activeProfile?.display_name ?? activeKey?.split("@")[0] ?? "";

  return (
    <div className="space-y-6">
      <section className="bg-pitch-card border border-pitch-line rounded-sm p-6">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1">
          {t("Welcome back")}
        </p>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">
          {displayName}
        </h1>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Stat label={t("Total Points")} value={totals.total} />
          <Stat label={t("Rank")} value={totals.rank ?? "—"} />
        </div>
      </section>

      <DeadlineCard state={deadline} />

      {upcomingMatches.length > 0 && (
        <section className="bg-pitch-card border border-pitch-line rounded-sm p-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-3 flex items-center gap-2">
            <Calendar size={12} /> {t("Next Matches")}
          </p>
          <ul className="space-y-2">
            {upcomingMatches.map((m) => {
              const hasPred = m.pred_home != null && m.pred_away != null;
              return (
                <li key={m.id}>
                  <Link
                    href={`/matches/${m.id}`}
                    className={`flex items-center gap-3 bg-pitch-bg border rounded-sm px-3 py-2 hover:border-brand-sky transition-colors ${
                      hasPred
                        ? "border-brand-grass/40"
                        : "border-pitch-line"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                        {new Date(m.kickoff).toLocaleString()} ·{" "}
                        {m.stage === "group"
                          ? `${t("Group")} ${m.group_code}`
                          : stageName(m.stage)}
                      </p>
                      <p className="text-sm text-white font-bold truncate">
                        {m.home ?? t("TBD")}{" "}
                        <span className="text-slate-500">vs</span>{" "}
                        {m.away ?? t("TBD")}
                      </p>
                    </div>
                    {hasPred ? (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] uppercase font-bold text-brand-grass bg-brand-grass/10 border border-brand-grass/40 rounded-sm px-2 py-1">
                        <CheckCircle size={10} /> {m.pred_home}–{m.pred_away}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] uppercase font-bold text-brand-sky border border-brand-sky rounded-sm px-2 py-1">
                        {t("Predict")}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickCard href="/matches" icon={<Target size={16} />} label={t("All Matches")} />
        <QuickCard href="/groups" icon={<Users size={16} />} label={t("Group Order")} />
        <QuickCard href="/predictions" icon={<Crown size={16} />} label={t("Predictions")} />
        <QuickCard href="/leaderboard" icon={<Trophy size={16} />} label={t("Leaderboard")} />
      </section>
    </div>
  );
}

function DeadlineCard({ state }: { state: DeadlineState }) {
  const { t } = useT();
  if (!state.openingKickoff) return null;
  const opening = new Date(state.openingKickoff);
  const ms = opening.getTime() - Date.now();
  const locked = ms <= 0;

  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-6">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2 flex items-center gap-2">
        <Clock size={12} /> {t("Pre-tournament Deadline")}
      </p>
      <p className="text-white font-bold">
        {locked ? (
          <>{t("Locked — tournament has started")}</>
        ) : (
          <>
            <span className="text-brand-sky">{formatCountdown(ms)}</span>{" "}
            <span className="text-slate-400 font-normal">{t("left")}</span>
          </>
        )}
      </p>
      <p className="text-slate-400 text-xs font-mono mt-1">
        {t("Opening kickoff")}: {opening.toLocaleString()}
      </p>

      <div className="mt-4 grid sm:grid-cols-3 gap-2">
        <DeadlineLink
          href="/groups"
          label={t("Group Order")}
          done={state.hasGroupPicks}
          locked={locked}
        />
        <DeadlineLink
          href="/predictions"
          label={t("Champion / Finalists / Dark Horse")}
          done={state.hasTournamentPicks}
          locked={locked}
        />
        <DeadlineLink
          href="/predictions"
          label={t("Topscorer Picks")}
          done={state.hasTopscorerPicks}
          locked={locked}
        />
      </div>
    </section>
  );
}

function DeadlineLink({
  href,
  label,
  done,
  locked,
}: {
  href: string;
  label: string;
  done: boolean;
  locked: boolean;
}) {
  const dimmed = locked && !done;
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-xs font-bold uppercase tracking-wider transition-colors ${
        done
          ? "bg-brand-grass/10 border-brand-grass/40 text-brand-grass"
          : dimmed
          ? "bg-pitch-bg border-pitch-line text-slate-600"
          : "bg-pitch-bg border-pitch-line text-slate-200 hover:border-brand-sky"
      }`}
    >
      {done ? <CheckCircle size={12} /> : <Clock size={12} />}
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

function formatCountdown(ms: number): string {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-pitch-bg border border-pitch-line rounded-sm p-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
        {label}
      </p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="bg-pitch-card border border-pitch-line rounded-sm p-4 hover:border-brand-sky transition-colors flex items-center gap-3"
    >
      <span className="text-brand-sky">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </Link>
  );
}
