"use client";

import { AlertCircle, Trophy } from "lucide-react";
import { useT } from "../../components/I18n";
import { isWerk } from "../../lib/work-tags";

const PRIZE_SPLITS_WERK = [
  { place: 1, pct: 42.5 },
  { place: 2, pct: 27.5 },
  { place: 3, pct: 15 },
  { place: 4, pct: 10 },
  { place: 5, pct: 5 },
];
const PRIZE_SPLITS_FAMILIE = [
  { place: 1, pct: 50 },
  { place: 2, pct: 30 },
  { place: 3, pct: 20 },
];

function placeLabel(place: number, t: (k: string) => string): string {
  switch (place) {
    case 1:
      return `🥇 ${t("1st place")}`;
    case 2:
      return `🥈 ${t("2nd place")}`;
    case 3:
      return `🥉 ${t("3rd place")}`;
    case 4:
      return t("4th place");
    case 5:
      return t("5th place");
    default:
      return `${place}.`;
  }
}

export function Rules() {
  const { t } = useT();
  const splits = isWerk() ? PRIZE_SPLITS_WERK : PRIZE_SPLITS_FAMILIE;
  return (
    <div className="max-w-2xl mx-auto prose prose-invert space-y-6">
      <h1 className="text-xl font-black italic uppercase tracking-tighter">
        {t("Rules & Scoring")}
      </h1>

      {/* Rules of engagement / payment — placeholder, edit the bank line below */}
      <section className="bg-brand-gold/10 border border-brand-gold/40 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={16} className="text-brand-gold" />
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-gold">
            {t("Rules of engagement")}
          </h2>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          <b>{t("Entry fee: € 10 per player.")}</b>{" "}
          {t(
            "Transfer to NL06RABO 0174 3180 65 (account holder: Robin Franken) before the tournament kicks off on 11 June 2026. Mention your display name in the description so I can match the payment."
          )}
        </p>
        <p className="text-sm text-slate-200 mt-3 leading-relaxed">
          {t(
            "Accounts that haven't paid by kickoff will be removed (kindly). All paid players play for the prize pool."
          )}
        </p>
        <p className="text-sm text-slate-200 mt-3 leading-relaxed">
          {t(
            "International players: trouble transferring to a Dutch IBAN? Reach out in time and we'll find an alternative (Wise, Revolut, PayPal, etc.). Don't leave it to the last minute."
          )}
        </p>
        <p className="text-[11px] text-slate-500 font-mono mt-3">
          {t("Payment status is shown on the leaderboard.")}
        </p>
      </section>

      {/* Prize pool — placeholder split, may shift with final headcount */}
      <section className="bg-pitch-card border border-brand-grass/40 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-brand-grass" />
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-grass">
            {t("Prize pool")}
          </h2>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed mb-3">
          {t(
            "The prize pool is the total of all entry fees (number of paid players × € 10). It's split among the top finishers."
          )}
        </p>
        <ul className="space-y-1 text-sm text-slate-300">
          {splits.map((s) => (
            <li
              key={s.place}
              className="flex items-center justify-between bg-pitch-bg border border-pitch-line rounded-sm px-3 py-2"
            >
              <span>{placeLabel(s.place, t)}</span>
              <span className="font-mono font-bold text-brand-gold">
                {s.pct.toString().replace(".", ",")}%
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-slate-500 font-mono mt-3 leading-relaxed">
          {t(
            "Placeholder split — the exact percentages may still shift depending on how many players join, but this is the direction."
          )}
        </p>
      </section>

      <Section title={t("Match predictions (all 104 matches)")}>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
          <li>
            {t("Correct outcome (Win/Draw/Loss):")} <b>{t("3 pts")}</b>
          </li>
          <li>
            {t("Correct goal difference:")} <b>{t("+2 pts")}</b>
          </li>
          <li>
            {t("One team's score exact:")} <b>{t("+1 pt")}</b>
          </li>
          <li>
            {t("Fully exact score:")} <b>{t("+5 pt bonus")}</b>
          </li>
          <li>
            {t("Perfect pick = 3 + 2 + 1 + 5 =")} <b>{t("11 pts")}</b>
          </li>
          <li>{t("Knockout multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4")}</li>
        </ul>
      </Section>

      <Section title={t("Group-stage order (12 groups)")}>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
          <li>
            <b>{t("3 pts")}</b> {t("per team placed in the correct slot (1st–4th)")}
          </li>
          <li>
            <b>{t("+5 pt bonus")}</b> {t("if all four slots are perfect")}
          </li>
          <li>
            {t(
              "Locks at the tournament's opening kickoff (same as topscorer picks)"
            )}
          </li>
        </ul>
      </Section>

      <Section title={t("Tournament picks (all bonus)")}>
        <p className="text-xs text-slate-400 mb-3">
          {t("Set-and-forget pre-tournament predictions, all on the")}{" "}
          <b>/predictions</b> {t("tab. Lock at the opening match.")}
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
          <li>{t("Champion: 30 pts if your pick wins the trophy")}</li>
          <li>
            {t(
              "Finalists pair: 10 pts per correct finalist · +10 if both right (max 30)"
            )}
          </li>
          <li>
            {t(
              "Dark Horse (Pot 3 or Pot 4 team): 10 if reaches R16 · +10 QF · +15 SF (max 35)"
            )}
          </li>
          <li>
            {t(
              "Topscorer picks (3 players): 2 pts per goal · +10 Golden Boot bonus"
            )}
          </li>
        </ul>
      </Section>

      <Section title={t("Deadlines")}>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
          <li>
            <b>{t("Group order & topscorers")}</b>:{" "}
            {t(
              "lock at the tournament's opening kickoff. Set them before the World Cup starts."
            )}
          </li>
          <li>
            <b>{t("Match predictions")}</b>:{" "}
            {t(
              "lock individually at each match's kickoff. Change any unfinished pick freely until then."
            )}
          </li>
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-pitch-card border border-pitch-line rounded-sm p-5">
      <h2 className="text-sm font-black uppercase tracking-widest text-brand-sky mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}
