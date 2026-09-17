import { prisma } from "@/lib/prisma";
import type { Conversation, Message } from "@/generated/prisma/client";

/** How much of an opening line is kept as the thread's name. */
export const MAX_TITLE_LENGTH = 80;

export type ConversationSummary = {
  id: string;
  title: string | null;
  messageCount: number;
  updatedAt: Date;
};

export function createConversation(userId: string): Promise<Conversation> {
  return prisma.conversation.create({ data: { userId } });
}

/**
 * A student's threads, most recently used first.
 *
 * Empty ones are left out: New chat creates a conversation before anything is
 * said in it, and one that was never spoken into is not a chat, it is a false
 * start.
 */
export async function listConversationsForUser(
  userId: string
): Promise<ConversationSummary[]> {
  const conversations = await prisma.conversation.findMany({
    where: { userId, messages: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    messageCount: conversation._count.messages,
    updatedAt: conversation.updatedAt,
  }));
}

export function getConversationForUser(
  userId: string,
  conversationId: string
): Promise<(Conversation & { messages: Message[] }) | null> {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { seq: "asc" } } },
  });
}

/**
 * A fresh thread for New chat: the student's most recent one that nothing was
 * ever said in, if there is one, otherwise a new row.
 *
 * Reusing it means pressing New chat twice, or opening a chat and walking away,
 * doesn't pile up empty conversations. It is touched either way, so it becomes
 * the latest thread exactly as a newly created one would.
 */
export async function startConversation(userId: string): Promise<Conversation> {
  const empty = await prisma.conversation.findFirst({
    where: { userId, messages: { none: {} } },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (!empty) return createConversation(userId);

  return prisma.conversation.update({
    where: { id: empty.id },
    data: { updatedAt: new Date() },
  });
}

/** The thread to carry on with when the panel opens. */
export function latestConversationForUser(
  userId: string
): Promise<Conversation | null> {
  return prisma.conversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export type DeleteConversationResult =
  | { success: true }
  | { success: false; error: "not_found" };

export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<DeleteConversationResult> {
  const { count } = await prisma.conversation.deleteMany({
    where: { id: conversationId, userId },
  });

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  return { success: true };
}
