import { redirect } from "next/navigation";

export default async function PredictMatchRedirect({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  redirect(`/matches/${matchId}`);
}
