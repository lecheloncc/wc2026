import { SessionGate } from "../../components/SessionGate";
import { Tournament } from "./Tournament";

export default function TournamentPage() {
  return (
    <SessionGate>
      <Tournament />
    </SessionGate>
  );
}
