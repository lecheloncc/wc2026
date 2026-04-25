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
            <li>Locks at each group&apos;s opening kickoff</li>
          </ul>
        </Section>

        <Section title="Topscorer picks (pick 3)">
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
            <li><b>2 pts</b> per goal scored by any of your three picks</li>
            <li><b>+10 pt bonus</b> if one of your picks wins the Golden Boot</li>
            <li>Locks at the opening match of the tournament</li>
          </ul>
        </Section>

        <Section title="Deadlines">
          <p className="text-sm text-slate-300">
            Every prediction locks at the relevant kickoff. You can change any pick
            freely until then.
          </p>
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
