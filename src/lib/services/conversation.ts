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
 * Empty ones are left out: a conversation is created the moment the panel is
 * opened, and one that was never spoken into is not a chat, it is a false start.
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
