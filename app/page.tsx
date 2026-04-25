import { SessionGate } from "../components/SessionGate";
import { Dashboard } from "./Dashboard";

export default function HomePage() {
  return (
    <SessionGate>
      <Dashboard />
    </SessionGate>
  );
}
