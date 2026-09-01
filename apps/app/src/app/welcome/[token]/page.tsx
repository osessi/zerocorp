import { notFound } from "next/navigation";
import { getAssessmentService } from "../../../server/container";
import { Welcome } from "./Welcome";

export const metadata = { title: "Create your account — ZeroCorp" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let data;
  try {
    data = await getAssessmentService().get(token);
  } catch {
    notFound();
  }

  if (!data.plan) notFound();

  return <Welcome token={token} planTitle={data.plan.proposal.title} />;
}
