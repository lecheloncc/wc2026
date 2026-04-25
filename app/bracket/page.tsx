import { SessionGate } from "../../components/SessionGate";
import { Bracket } from "./Bracket";

export default function BracketPage() {
  return (
    <SessionGate>
      <Bracket />
    </SessionGate>
  );
}
