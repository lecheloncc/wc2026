import { SessionGate } from "../../../components/SessionGate";
import { MatchOne } from "./MatchOne";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return (
    <SessionGate>
      <MatchOne matchId={Number(matchId)} />
    </SessionGate>
  );
}
