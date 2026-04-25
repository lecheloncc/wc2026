import { SessionGate } from "../../components/SessionGate";

export default function RulesPage() {
  return (
    <SessionGate>
      <div className="max-w-2xl mx-auto prose prose-invert space-y-6">
        <h1 className="text-xl font-black italic uppercase tracking-tighter">
          Rules &amp; Scoring
        </h1>

        <Section title="Match predictions (all 104 matches)">
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
            <li>Correct outcome (Win/Draw/Loss): <b>3 pts</b></li>
            <li>Correct goal difference: <b>+2 pts</b></li>
            <li>One team&apos;s score exact: <b>+1 pt</b></li>
            <li>Fully exact score: <b>+5 pt bonus</b></li>
            <li>Perfect pick = 3 + 2 + 1 + 5 = <b>11 pts</b></li>
            <li>Knockout multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4</li>
          </ul>
        </Section>

        <Section title="Group-stage order (12 groups)">
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
            <li><b>3 pts</b> per team placed in the correct slot (1st–4th)</li>
            <li><b>+5 pt bonus</b> if all four slots are perfect</li>
            <li>Locks at the tournament&apos;s opening kickoff (same as topscorer picks)</li>
          </ul>
        </Section>

        <Section title="Topscorer picks (pick 3)">
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
            <li><b>2 pts</b> per goal scored by any of your three picks</li>
            <li><b>+10 pt bonus</b> if one of your picks wins the Golden Boot</li>
            <li>Locks at the opening match of the tournament</li>
          </ul>
        </Section>

        <Section title="Tournament picks (bonus)">
          <p className="text-xs text-slate-400 mb-3">
            Three set-and-forget pre-tournament predictions. Up to 95 pts on the line.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
            <li><b>Champion</b>: 30 pts if your pick wins the trophy</li>
            <li><b>Finalists pair</b>: 10 pts per correct finalist · +10 if both right (max 30)</li>
            <li><b>Dark Horse</b> (Pot 3 or Pot 4 team): 10 if reaches R16 · +10 QF · +15 SF (max 35)</li>
            <li>Locks at the opening match of the tournament</li>
          </ul>
        </Section>

        <Section title="Deadlines">
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
            <li><b>Group order &amp; topscorers</b>: lock at the tournament&apos;s opening kickoff. Set them before the World Cup starts.</li>
            <li><b>Match predictions</b>: lock individually at each match&apos;s kickoff. Change any unfinished pick freely until then.</li>
          </ul>
        </Section>
      </div>
    </SessionGate>
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
