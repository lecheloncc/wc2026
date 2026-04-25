import { SessionGate } from "../../components/SessionGate";
import { Leaderboard } from "./Leaderboard";

export default function LeaderboardPage() {
  return (
    <SessionGate>
      <Leaderboard />
    </SessionGate>
  );
}
