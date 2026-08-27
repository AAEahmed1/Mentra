import { prisma } from "@/lib/prisma";
import type { Message, MessageRole } from "@/generated/prisma/client";

/**
 * How much of the conversation is read back. Older lines stay in the table —
 * this is the window the student sees and the assistant is given, not a
 * retention policy.
 */
export const MAX_STORED_HISTORY = 40;

export type MessageInput = {
  role: MessageRole;
  content: string;
};

export async function appendMessages(
  userId: string,
  messages: MessageInput[]
): Promise<void> {
  if (messages.length === 0) return;

  await prisma.message.createMany({
    data: messages.map((message) => ({ ...message, userId })),
  });
}

/**
 * The tail of a student's conversation, oldest first — the order it is read and
 * replayed in. Ordered by `seq` rather than `createdAt`, which is not unique
 * enough to keep a question above its answer.
 */
export async function listMessagesForUser(
  userId: string,
  limit: number = MAX_STORED_HISTORY
): Promise<Message[]> {
  const newestFirst = await prisma.message.findMany({
    where: { userId },
    orderBy: { seq: "desc" },
    take: limit,
  });

  return newestFirst.reverse();
}
