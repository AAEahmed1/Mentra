"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/session";
import {
  deleteConversation,
  startConversation,
} from "@/lib/services/conversation";

export async function startConversationAction(): Promise<void> {
  const userId = await requireUserId();

  const conversation = await startConversation(userId);

  // The panel lives in the root layout, so every page is holding a copy of
  // which conversation is current.
  revalidatePath("/", "layout");
  redirect(`/chats/${conversation.id}`);
}

export type DeleteConversationActionState = {
  error: string | null;
  /** The chat was not there to delete, so the client has nothing to restore. */
  alreadyDeleted?: boolean;
};

export async function deleteConversationAction(
  _prevState: DeleteConversationActionState,
  formData: FormData
): Promise<DeleteConversationActionState> {
  const userId = await requireUserId();
  const conversationId = String(formData.get("conversationId") ?? "");

  let result;
  try {
    result = await deleteConversation(userId, conversationId);
  } catch (error) {
    console.error("deleting a conversation failed", error);
    return { error: "That chat couldn't be deleted. Try again in a moment." };
  }

  if (!result.success) {
    // Already gone — deleted in another tab, most likely. Say so rather than
    // leaving the button looking as if it did nothing. Not revalidated: this
    // page would re-render as a 404 and the message would never be seen.
    return {
      error: "That chat was already deleted. Go back to All chats.",
      alreadyDeleted: true,
    };
  }

  revalidatePath("/", "layout");
  redirect("/chats");
}
