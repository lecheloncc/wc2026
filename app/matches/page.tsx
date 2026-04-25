import { SessionGate } from "../../components/SessionGate";
import { MatchesList } from "./MatchesList";

export default function MatchesPage() {
  return (
    <SessionGate>
      <MatchesList />
    </SessionGate>
  );
}
