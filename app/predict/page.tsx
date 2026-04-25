import { SessionGate } from "../../components/SessionGate";
import { PredictList } from "./PredictList";

export default function PredictPage() {
  return (
    <SessionGate>
      <PredictList />
    </SessionGate>
  );
}
