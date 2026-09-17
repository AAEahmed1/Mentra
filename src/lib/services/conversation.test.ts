import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createConversation,
  deleteConversation,
  getConversationForUser,
  latestConversationForUser,
  listConversationsForUser,
  startConversation,
} from "@/lib/services/conversation";
import { appendMessages } from "@/lib/services/message";

let userId: string;
let otherUserId: string;

beforeEach(async () => {
  const [user, other] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Test Student",
        email: `test-conv-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-conv-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    }),
  ]);
  userId = user.id;
  otherUserId = other.id;
});

afterEach(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
});

describe("createConversation", () => {
  test("starts an empty thread with no title yet", async () => {
    const conversation = await createConversation(userId);

    expect(conversation).toMatchObject({ userId, title: null });
  });
});

describe("appendMessages", () => {
  test("titles the conversation from the opening question", async () => {
    const conversation = await createConversation(userId);

    await appendMessages(userId, conversation.id, [
      { role: "user", content: "What should I do tonight?" },
      { role: "assistant", content: "Network Lab." },
    ]);

    const stored = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
    });
    expect(stored.title).toBe("What should I do tonight?");
  });

  test("keeps the first title when the conversation goes on", async () => {
    const conversation = await createConversation(userId);

    await appendMessages(userId, conversation.id, [
      { role: "user", content: "First question" },
    ]);
    await appendMessages(userId, conversation.id, [
      { role: "user", content: "Second question" },
    ]);

    const stored = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
    });
    expect(stored.title).toBe("First question");
  });

  test("refuses to write into someone else's conversation", async () => {
    const theirs = await createConversation(otherUserId);

    await expect(
      appendMessages(userId, theirs.id, [{ role: "user", content: "Sneak" }])
    ).rejects.toThrow();

    expect(await prisma.message.count({ where: { conversationId: theirs.id } })).toBe(0);
  });
});

describe("listConversationsForUser", () => {
  test("lists newest first, with enough to recognise each one", async () => {
    const older = await createConversation(userId);
    await appendMessages(userId, older.id, [
      { role: "user", content: "The older chat" },
      { role: "assistant", content: "Answer." },
    ]);

    const newer = await createConversation(userId);
    await appendMessages(userId, newer.id, [
      { role: "user", content: "The newer chat" },
    ]);

    const conversations = await listConversationsForUser(userId);

    expect(conversations.map((c) => c.title)).toEqual([
      "The newer chat",
      "The older chat",
    ]);
    expect(conversations[1].messageCount).toBe(2);
  });

  test("leaves out conversations that were never used", async () => {
    await createConversation(userId);

    expect(await listConversationsForUser(userId)).toEqual([]);
  });

  test("never lists another student's chats", async () => {
    const theirs = await createConversation(otherUserId);
    await appendMessages(otherUserId, theirs.id, [
      { role: "user", content: "Private" },
    ]);

    expect(await listConversationsForUser(userId)).toEqual([]);
  });
});

describe("getConversationForUser", () => {
  test("reads one thread back in the order it was said", async () => {
    const conversation = await createConversation(userId);
    await appendMessages(userId, conversation.id, [
      { role: "user", content: "First" },
      { role: "assistant", content: "Second" },
    ]);

    const found = await getConversationForUser(userId, conversation.id);

    expect(found?.messages.map((m) => m.content)).toEqual(["First", "Second"]);
  });

  test("returns nothing for a conversation that is not theirs", async () => {
    const theirs = await createConversation(otherUserId);

    expect(await getConversationForUser(userId, theirs.id)).toBeNull();
  });
});

describe("latestConversationForUser", () => {
  test("finds the one to carry on with", async () => {
    await createConversation(userId);
    const newest = await createConversation(userId);

    expect((await latestConversationForUser(userId))?.id).toBe(newest.id);
  });

  test("returns nothing when they have never asked anything", async () => {
    expect(await latestConversationForUser(userId)).toBeNull();
  });
});

describe("deleteConversation", () => {
  test("removes the thread and everything said in it", async () => {
    const conversation = await createConversation(userId);
    await appendMessages(userId, conversation.id, [
      { role: "user", content: "Forget this happened" },
    ]);

    expect(await deleteConversation(userId, conversation.id)).toEqual({
      success: true,
    });
    expect(
      await prisma.message.count({ where: { conversationId: conversation.id } })
    ).toBe(0);
  });

  test("will not delete another student's conversation", async () => {
    const theirs = await createConversation(otherUserId);

    expect(await deleteConversation(userId, theirs.id)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(
      await prisma.conversation.findUnique({ where: { id: theirs.id } })
    ).not.toBeNull();
  });
});

describe("startConversation", () => {
  test("makes a thread when the student has none", async () => {
    const conversation = await startConversation(userId);

    expect(conversation).toMatchObject({ userId, title: null });
  });

  test("hands back an unused thread rather than piling up another", async () => {
    const first = await startConversation(userId);
    const second = await startConversation(userId);

    expect(second.id).toBe(first.id);
    expect(await prisma.conversation.count({ where: { userId } })).toBe(1);
  });

  test("makes a new thread once the last one has been spoken into", async () => {
    const used = await startConversation(userId);
    await appendMessages(userId, used.id, [{ role: "user", content: "Hello" }]);

    const next = await startConversation(userId);

    expect(next.id).not.toBe(used.id);
  });

  test("makes the reused thread the latest, as a new one would be", async () => {
    const empty = await createConversation(userId);
    const used = await createConversation(userId);
    await appendMessages(userId, used.id, [{ role: "user", content: "Hello" }]);

    await startConversation(userId);

    expect((await latestConversationForUser(userId))?.id).toBe(empty.id);
  });

  test("never reuses another student's empty thread", async () => {
    const theirs = await createConversation(otherUserId);

    expect((await startConversation(userId)).id).not.toBe(theirs.id);
  });
});
