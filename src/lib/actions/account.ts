"use server";

import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/session";
import { deleteAccount } from "@/lib/services/account";

export type DeleteAccountActionState = {
  error: string | null;
};

export async function deleteAccountAction(
  _prevState: DeleteAccountActionState,
  formData: FormData
): Promise<DeleteAccountActionState> {
  const userId = await requireUserId();
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (confirmation !== "DELETE") {
    return { error: "Type DELETE exactly to confirm." };
  }

  await deleteAccount(userId);

  redirect("/sign-in");
}
