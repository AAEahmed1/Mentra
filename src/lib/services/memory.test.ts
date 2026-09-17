import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createMemory,
  deleteMemory,
  listMemoriesForUser,
  listRecentMemoriesForUser,
} from "@/lib/services/memory";

let userId: string;

beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-memory-${randomUUID()}@example.com`,
      emailVerified: true,
    },
  });
  userId = user.id;
});

afterEach(async () => {
  await prisma.memory.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("createMemory", () => {
  test("creates a memory owned by the given user", async () => {
    const memory = await createMemory(userId, {
      content: "Student struggles with subnetting.",
      type: "learning_state",
      source: "explicit",
    });

    expect(memory).toMatchObject({
      userId,
      content: "Student struggles with subnetting.",
      type: "learning_state",
      source: "explicit",
    });
  });
});

describe("listMemoriesForUser", () => {
  test("returns only memories owned by the given user", async () => {
    await createMemory(userId, {
      content: "Student is studying Cybersecurity.",
      type: "profile",
      source: "explicit",
    });

    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-memory-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    await createMemory(otherUser.id, {
      content: "Other student's private memory.",
      type: "profile",
      source: "explicit",
    });

    const memories = await listMemoriesForUser(userId);

    expect(memories).toHaveLength(1);
    expect(memories[0].content).toBe("Student is studying Cybersecurity.");

    await prisma.memory.deleteMany({ where: { userId: otherUser.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

describe("deleteMemory", () => {
  test("deletes a memory owned by the given user", async () => {
    const memory = await createMemory(userId, {
      content: "Student struggles with subnetting.",
      type: "learning_state",
      source: "explicit",
    });

    const result = await deleteMemory(userId, memory.id);

    expect(result).toEqual({ success: true });
    const found = await prisma.memory.findUnique({ where: { id: memory.id } });
    expect(found).toBeNull();
  });

  test("refuses to delete a memory owned by someone else", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-memory-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    const otherMemory = await createMemory(otherUser.id, {
      content: "Other student's private memory.",
      type: "profile",
      source: "explicit",
    });

    const result = await deleteMemory(userId, otherMemory.id);

    expect(result).toEqual({ success: false, error: "not_found" });

    await prisma.memory.deleteMany({ where: { userId: otherUser.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

describe("listRecentMemoriesForUser", () => {
  test("loads only as many as asked for, and says how many there are", async () => {
    for (let index = 0; index < 5; index += 1) {
      await createMemory(userId, {
        content: `Fact ${index}`,
        type: "profile",
        source: "inferred",
      });
    }

    const { memories, total } = await listRecentMemoriesForUser(userId, 3);

    expect(memories).toHaveLength(3);
    expect(total).toBe(5);
  });

  test("returns nothing, and a total of zero, for a student with no memories", async () => {
    expect(await listRecentMemoriesForUser(userId, 3)).toEqual({
      memories: [],
      total: 0,
    });
  });
});
