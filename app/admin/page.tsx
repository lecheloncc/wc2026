import { SessionGate } from "../../components/SessionGate";
import { Admin } from "./Admin";

export default function AdminPage() {
  return (
    <SessionGate>
      <Admin />
    </SessionGate>
  );
}
