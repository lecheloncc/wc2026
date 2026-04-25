import { SessionGate } from "../../components/SessionGate";
import { Groups } from "./Groups";

export default function GroupsPage() {
  return (
    <SessionGate>
      <Groups />
    </SessionGate>
  );
}
