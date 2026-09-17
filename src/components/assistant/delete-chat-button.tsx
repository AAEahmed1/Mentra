"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteConversationAction,
  type DeleteConversationActionState,
} from "@/lib/actions/conversation";
import { forgetThread } from "@/lib/assistant-thread";
import { Button } from "@/components/ui/button";

const initialState: DeleteConversationActionState = { error: null };

/**
 * Deletes a chat and lets go of it in the shared thread store.
 *
 * The store is cleared before the server is asked, so from the moment the
 * student presses Delete a new message goes to a new thread rather than into
 * the one disappearing. If the delete fails the page is refreshed, and its
 * ThreadSeed hands the conversation back; if the chat was already gone, there
 * is nothing to hand back.
 */
export function DeleteChatButton({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (previous: DeleteConversationActionState, formData: FormData) => {
      forgetThread(conversationId);
      // On success the action redirects and this never returns.
      const result = await deleteConversationAction(previous, formData);
      if (result.error && !result.alreadyDeleted) router.refresh();
      return result;
    },
    initialState
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="conversationId" value={conversationId} />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
        {isPending ? "Deleting…" : "Delete"}
      </Button>
    </form>
  );
}
