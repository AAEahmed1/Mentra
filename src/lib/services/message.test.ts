import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  appendMessages,
  listMessagesForUser,
  MAX_STORED_HISTORY,
} from "@/lib/services/message";

let userId: string;
let otherUserId: string;

beforeEach(async () => {
  const [user, other] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Test Student",
        email: `test-message-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-message-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    }),
  ]);
  userId = user.id;
  otherUserId = other.id;
});

afterEach(async () => {
  await prisma.message.deleteMany({
    where: { userId: { in: [userId, otherUserId] } },
  });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
});

describe("appendMessages", () => {
  test("stores a turn so it can be read back after a reload", async () => {
    await appendMessages(userId, [
      { role: "user", content: "What's overdue?" },
      { role: "assistant", content: "Network Lab, due Saturday." },
    ]);

    const stored = await listMessagesForUser(userId);

    expect(stored.map((message) => [message.role, message.content])).toEqual([
      ["user", "What's overdue?"],
      ["assistant", "Network Lab, due Saturday."],
    ]);
  });

  test("keeps the two halves of a turn in the order they were said", async () => {
    // Both rows land in one call, so an ordering that relied on the clock alone
    // could show the answer above the question.
    await appendMessages(userId, [
      { role: "user", content: "First" },
      { role: "assistant", content: "Second" },
    ]);
    await appendMessages(userId, [
      { role: "user", content: "Third" },
      { role: "assistant", content: "Fourth" },
    ]);

    const stored = await listMessagesForUser(userId);

    expect(stored.map((message) => message.content)).toEqual([
      "First",
      "Second",
      "Third",
      "Fourth",
    ]);
  });
});

describe("listMessagesForUser", () => {
  test("returns nothing for a student who has never asked anything", async () => {
    expect(await listMessagesForUser(userId)).toEqual([]);
  });

  test("never returns another student's conversation", async () => {
    await appendMessages(otherUserId, [
      { role: "user", content: "My private question" },
    ]);

    expect(await listMessagesForUser(userId)).toEqual([]);
  });

  test("returns the most recent messages, oldest first, when history is long", async () => {
    const turns = Array.from({ length: MAX_STORED_HISTORY + 4 }, (_, index) => ({
      role: "user" as const,
      content: `Message ${index}`,
    }));
    await appendMessages(userId, turns);

    const stored = await listMessagesForUser(userId);

    expect(stored).toHaveLength(MAX_STORED_HISTORY);
    // The oldest are dropped, not the newest, and what survives reads forwards.
    expect(stored[0].content).toBe("Message 4");
    expect(stored[stored.length - 1].content).toBe(
      `Message ${MAX_STORED_HISTORY + 3}`
    );
  });
});
