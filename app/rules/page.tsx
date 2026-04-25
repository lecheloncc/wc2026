import { SessionGate } from "../../components/SessionGate";
import { Rules } from "./Rules";

export default function RulesPage() {
  return (
    <SessionGate>
      <Rules />
    </SessionGate>
  );
}
