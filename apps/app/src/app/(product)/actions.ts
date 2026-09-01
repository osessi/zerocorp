"use server";

import { redirect } from "next/navigation";
import { endSession } from "../../server/session";

export async function signOut(): Promise<never> {
  await endSession();
  redirect("/");
}
