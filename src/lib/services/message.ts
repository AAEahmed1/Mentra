import { prisma } from "@/lib/prisma";
import type { Message, MessageRole } from "@/generated/prisma/client";
import { MAX_TITLE_LENGTH } from "@/lib/services/conversation";

/**
 * How much of a conversation is read back. Older lines stay in the table —
 * this is the window the student sees and the assistant is given, not a
 * retention policy.
 */
export const MAX_STORED_HISTORY = 40;

export type MessageInput = {
  role: MessageRole;
  content: string;
};

/**
 * Adds a turn to a conversation.
 *
 * The conversation is looked up by id *and* owner, so naming someone else's
 * thread throws rather than writing into it. Titling happens here because the
 * opening question is the only name a thread ever gets, and it is only known
 * once something has been said.
 */
export async function appendMessages(
  userId: string,
  conversationId: string,
  messages: MessageInput[]
): Promise<void> {
  if (messages.length === 0) return;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true, title: true },
  });

  if (!conversation) {
    throw new Error("That conversation does not exist.");
  }

  const opening = messages.find((message) => message.role === "user");

  await prisma.$transaction([
    prisma.message.createMany({
      data: messages.map((message) => ({ ...message, userId, conversationId })),
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data:
        conversation.title === null && opening
          ? { title: opening.content.slice(0, MAX_TITLE_LENGTH) }
          : // Touched even when the title stands, so the thread sorts as used.
            { updatedAt: new Date() },
    }),
  ]);
}

/**
 * The tail of a conversation, oldest first — the order it is read and replayed
 * in. Ordered by `seq` rather than `createdAt`, which is not unique enough to
 * keep a question above its answer.
 */
export async function listMessagesForConversation(
  userId: string,
  conversationId: string,
  limit: number = MAX_STORED_HISTORY
): Promise<Message[]> {
  const newestFirst = await prisma.message.findMany({
    where: { conversationId, userId },
    orderBy: { seq: "desc" },
    take: limit,
  });

  return newestFirst.reverse();
}

/**
 * How many turns a student has started since `since`, and when the oldest of
 * them was — which is when the count next goes down. Counted across all their
 * conversations, so starting a new chat doesn't reset it.
 */
export async function countTurnsSince(
  userId: string,
  since: Date
): Promise<{ count: number; oldest: Date | null }> {
  const { _count, _min } = await prisma.message.aggregate({
    where: { userId, role: "user", createdAt: { gte: since } },
    _count: { _all: true },
    _min: { createdAt: true },
  });

  return { count: _count._all, oldest: _min.createdAt };
}
