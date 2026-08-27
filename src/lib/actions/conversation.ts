"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/session";
import {
  createConversation,
  deleteConversation,
} from "@/lib/services/conversation";

export async function startConversationAction(): Promise<void> {
  const userId = await requireUserId();

  const conversation = await createConversation(userId);

  // The panel lives in the root layout, so every page is holding a copy of
  // which conversation is current.
  revalidatePath("/", "layout");
  redirect(`/chats/${conversation.id}`);
}

export async function deleteConversationAction(
  formData: FormData
): Promise<void> {
  const userId = await requireUserId();
  const conversationId = String(formData.get("conversationId") ?? "");

  const result = await deleteConversation(userId, conversationId);

  revalidatePath("/", "layout");

  if (result.success) {
    redirect("/chats");
  }
}
