import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import { createConversation } from "@/lib/services/conversation";
import {
  appendMessages,
  countTurnsSince,
  listMessagesForConversation,
  MAX_STORED_HISTORY,
} from "@/lib/services/message";

let userId: string;
let conversationId: string;

beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-message-${randomUUID()}@example.com`,
      emailVerified: true,
    },
  });
  userId = user.id;
  conversationId = (await createConversation(userId)).id;
});

afterEach(async () => {
  await prisma.user.delete({ where: { id: userId } });
});

describe("listMessagesForConversation", () => {
  test("reads a turn back after a reload", async () => {
    await appendMessages(userId, conversationId, [
      { role: "user", content: "What's overdue?" },
      { role: "assistant", content: "Network Lab, due Saturday." },
    ]);

    const stored = await listMessagesForConversation(userId, conversationId);

    expect(stored.map((message) => [message.role, message.content])).toEqual([
      ["user", "What's overdue?"],
      ["assistant", "Network Lab, due Saturday."],
    ]);
  });

  test("keeps the two halves of a turn in the order they were said", async () => {
    // Both rows land in one call, so an ordering that relied on the clock alone
    // could show the answer above the question.
    await appendMessages(userId, conversationId, [
      { role: "user", content: "First" },
      { role: "assistant", content: "Second" },
    ]);
    await appendMessages(userId, conversationId, [
      { role: "user", content: "Third" },
      { role: "assistant", content: "Fourth" },
    ]);

    const stored = await listMessagesForConversation(userId, conversationId);

    expect(stored.map((message) => message.content)).toEqual([
      "First",
      "Second",
      "Third",
      "Fourth",
    ]);
  });

  test("returns nothing for a thread nobody has spoken into", async () => {
    expect(await listMessagesForConversation(userId, conversationId)).toEqual([]);
  });

  test("returns the most recent messages, oldest first, when a thread is long", async () => {
    await appendMessages(
      userId,
      conversationId,
      Array.from({ length: MAX_STORED_HISTORY + 4 }, (_, index) => ({
        role: "user" as const,
        content: `Message ${index}`,
      }))
    );

    const stored = await listMessagesForConversation(userId, conversationId);

    expect(stored).toHaveLength(MAX_STORED_HISTORY);
    // The oldest are dropped, not the newest, and what survives reads forwards.
    expect(stored[0].content).toBe("Message 4");
    expect(stored[stored.length - 1].content).toBe(
      `Message ${MAX_STORED_HISTORY + 3}`
    );
  });
});

describe("countTurnsSince", () => {
  const hourAgo = () => new Date(Date.now() - 60 * 60 * 1000);

  test("counts the questions a student asked, not the answers", async () => {
    await appendMessages(userId, conversationId, [
      { role: "user", content: "One" },
      { role: "assistant", content: "Answer" },
      { role: "user", content: "Two" },
      { role: "assistant", content: "Answer" },
    ]);

    const { count, oldest } = await countTurnsSince(userId, hourAgo());

    expect(count).toBe(2);
    expect(oldest).toBeInstanceOf(Date);
  });

  test("counts across every conversation, so a new chat doesn't reset it", async () => {
    const other = await createConversation(userId);
    await appendMessages(userId, conversationId, [
      { role: "user", content: "Here" },
    ]);
    await appendMessages(userId, other.id, [{ role: "user", content: "There" }]);

    expect((await countTurnsSince(userId, hourAgo())).count).toBe(2);
  });

  test("leaves out questions from before the window", async () => {
    await appendMessages(userId, conversationId, [
      { role: "user", content: "Long ago" },
    ]);
    await prisma.message.updateMany({
      where: { conversationId },
      data: { createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    });
    await appendMessages(userId, conversationId, [
      { role: "user", content: "Just now" },
    ]);

    const { count, oldest } = await countTurnsSince(userId, hourAgo());

    expect(count).toBe(1);
    expect(oldest!.getTime()).toBeGreaterThan(hourAgo().getTime());
  });

  test("never counts another student's questions", async () => {
    const other = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-message-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    const theirs = await createConversation(other.id);
    await appendMessages(other.id, theirs.id, [
      { role: "user", content: "Theirs" },
    ]);

    expect(await countTurnsSince(userId, hourAgo())).toEqual({
      count: 0,
      oldest: null,
    });

    await prisma.user.delete({ where: { id: other.id } });
  });
});
