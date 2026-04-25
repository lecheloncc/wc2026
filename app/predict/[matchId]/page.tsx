import { SessionGate } from "../../../components/SessionGate";
import { PredictOne } from "./PredictOne";

export default async function PredictMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return (
    <SessionGate>
      <PredictOne matchId={Number(matchId)} />
    </SessionGate>
  );
}
