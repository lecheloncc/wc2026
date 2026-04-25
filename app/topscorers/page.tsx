import { SessionGate } from "../../components/SessionGate";
import { Topscorers } from "./Topscorers";

export default function TopscorersPage() {
  return (
    <SessionGate>
      <Topscorers />
    </SessionGate>
  );
}
