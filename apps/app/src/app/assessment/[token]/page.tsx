import { notFound, redirect } from "next/navigation";
import { getInterviewService } from "../../../server/container";
import { Conversation, type Turn } from "./Conversation";

export const metadata = {
  title: "Your business assessment · ZeroCorp",
};

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let state;
  try {
    state = await getInterviewService().state(token);
  } catch {
    notFound();
  }

  // Every slot filled and nothing left to ask: the analysis has run or is due, and the
  // plan is where they belong. Landing on a conversation with no question is a dead end.
  if (state.card === null && state.complete) redirect(`/assessment/${token}/plan`);

  const turns: Turn[] = state.turns.map((t) => ({
    position: t.position,
    question: t.question.question,
    answer: t.answer,
    slot: t.question.slot,
  }));

  return (
    <Conversation
      token={token}
      initialCard={state.card}
      initialTurns={turns}
      initialSlots={state.slots}
    />
  );
}
