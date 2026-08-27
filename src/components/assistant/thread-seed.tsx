"use client";

import { seedThread, seedThreadIfEmpty } from "@/lib/assistant-thread";
import type { ChatMessage } from "@/lib/assistant-thread";

/**
 * Hands the server's copy of a conversation to the store.
 *
 * Renders nothing. Seeding happens during render rather than in an effect so
 * the transcript is on screen in the same paint as the page — `seedThread` is
 * idempotent, so re-rendering the same thread is a no-op.
 */
export function ThreadSeed({
  conversationId,
  messages,
  onlyIfEmpty = false,
}: {
  conversationId: string | null;
  messages: ChatMessage[];
  onlyIfEmpty?: boolean;
}) {
  if (onlyIfEmpty) {
    seedThreadIfEmpty(conversationId, messages);
  } else {
    seedThread(conversationId, messages);
  }

  return null;
}
