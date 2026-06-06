import { SessionGate } from "../../components/SessionGate";
import { Stats } from "./Stats";

export default function StatsPage() {
  return (
    <SessionGate>
      <Stats />
    </SessionGate>
  );
}
