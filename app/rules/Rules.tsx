"use client";

import { useT } from "../../components/I18n";

export function Rules() {
  const { t } = useT();
  return (
    <div className="max-w-2xl mx-auto prose prose-invert space-y-6">
      <h1 className="text-xl font-black italic uppercase tracking-tighter">
        {t("Rules & Scoring")}
      </h1>

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
