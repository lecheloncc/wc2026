import { SessionGate } from "../../components/SessionGate";
import { Predictions } from "./Predictions";

export default function PredictionsPage() {
  return (
    <SessionGate>
      <Predictions />
    </SessionGate>
  );
}
