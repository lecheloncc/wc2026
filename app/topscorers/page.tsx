import { redirect } from "next/navigation";

export default function TopscorersRedirect() {
  redirect("/predictions");
}
