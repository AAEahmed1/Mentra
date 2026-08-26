"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/session";
import { parseMemoryInput } from "@/lib/memory";
import { createMemory, deleteMemory } from "@/lib/services/memory";
import { deleteAccount } from "@/lib/services/account";

export type MemoryActionState = {
  errors: string[];
};

export async function createMemoryAction(
  _prevState: MemoryActionState,
  formData: FormData
): Promise<MemoryActionState> {
  const userId = await requireUserId();

  const result = parseMemoryInput({
    content: formData.get("content"),
    type: formData.get("type"),
    source: formData.get("source"),
  });

  if (!result.success) {
    return { errors: result.errors };
  }

  await createMemory(userId, result.data);

  revalidatePath("/privacy");
  return { errors: [] };
}

export async function deleteMemoryAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const memoryId = String(formData.get("memoryId") ?? "");

  await deleteMemory(userId, memoryId);
  revalidatePath("/privacy");
}

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
    return { error: 'Type DELETE exactly to confirm.' };
  }

  await deleteAccount(userId);

  redirect("/sign-in");
}
