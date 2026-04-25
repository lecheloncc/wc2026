import { SessionGate } from "../../components/SessionGate";
import { Account } from "./Account";

export default function AccountPage() {
  return (
    <SessionGate>
      <Account />
    </SessionGate>
  );
}
