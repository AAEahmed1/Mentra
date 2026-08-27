import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import { createSemester } from "@/lib/services/semester";
import { createCourse } from "@/lib/services/course";
import { createTask } from "@/lib/services/task";
import { createNote } from "@/lib/services/note";
import { createMemory } from "@/lib/services/memory";
import { appendMessages } from "@/lib/services/message";
import { deleteAccount } from "@/lib/services/account";

let userId: string;
let survivorId: string;

/**
 * Builds a user who owns at least one row in every table that references them,
 * so a cascade that misses a table shows up as an orphan.
 */
async function seedFullAccount(label: string): Promise<string> {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-account-${label}-${randomUUID()}@example.com`,
      emailVerified: true,
    },
  });

  const semester = await createSemester(user.id, {
    name: "Fall 2026",
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-12-15"),
  });

  const course = await createCourse(user.id, semester.id, {
    name: "Network Security",
    code: undefined,
    professor: undefined,
    credits: undefined,
  });
  if (!course.success) throw new Error("fixture creation failed");

  await createTask(user.id, {
    title: "Finish lab",
    description: undefined,
    dueDate: undefined,
    priority: "medium",
    estimatedDuration: undefined,
    type: "task",
    topicsToReview: undefined,
    courseId: course.data.id,
  });

  await createNote(user.id, {
    title: "Subnetting cheatsheet",
    body: "A /24 gives 254 usable hosts.",
    courseId: course.data.id,
  });

  await appendMessages(user.id, [
    { role: "user", content: "What should I do tonight?" },
    { role: "assistant", content: "Finish lab." },
  ]);

  await createMemory(user.id, {
    content: "Student struggles with subnetting.",
    type: "learning_state",
    source: "explicit",
  });

  // Better Auth rows — these hang off the user too and must go with it.
  await prisma.session.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 86_400_000),
      updatedAt: new Date(),
    },
  });
  await prisma.account.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      issuer: "local:credential",
      accountId: randomUUID(),
      providerId: "credential",
      updatedAt: new Date(),
    },
  });

  return user.id;
}

beforeEach(async () => {
  userId = await seedFullAccount("target");
  survivorId = await seedFullAccount("survivor");
});

afterEach(async () => {
  for (const id of [userId, survivorId]) {
    await prisma.note.deleteMany({ where: { userId: id } });
    await prisma.task.deleteMany({ where: { userId: id } });
    await prisma.memory.deleteMany({ where: { userId: id } });
    await prisma.course.deleteMany({ where: { semester: { userId: id } } });
    await prisma.semester.deleteMany({ where: { userId: id } });
    await prisma.user.deleteMany({ where: { id } });
  }
});

describe("deleteAccount", () => {
  test("removes the user record itself", async () => {
    await deleteAccount(userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user).toBeNull();
  });

  test("leaves no orphaned rows in any table referencing the user", async () => {
    await deleteAccount(userId);

    const [
      notes,
      tasks,
      memories,
      messages,
      courses,
      semesters,
      sessions,
      accounts,
    ] = await Promise.all([
        prisma.note.count({ where: { userId } }),
        prisma.task.count({ where: { userId } }),
        prisma.memory.count({ where: { userId } }),
        prisma.message.count({ where: { userId } }),
        prisma.course.count({ where: { semester: { userId } } }),
        prisma.semester.count({ where: { userId } }),
        prisma.session.count({ where: { userId } }),
        prisma.account.count({ where: { userId } }),
      ]);

    expect({
      notes,
      tasks,
      memories,
      messages,
      courses,
      semesters,
      sessions,
      accounts,
    }).toEqual({
      notes: 0,
      tasks: 0,
      memories: 0,
      messages: 0,
      courses: 0,
      semesters: 0,
      sessions: 0,
      accounts: 0,
    });
  });

  test("leaves another student's data untouched", async () => {
    await deleteAccount(userId);

    const [user, notes, tasks, memories, courses, semesters] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: survivorId } }),
        prisma.note.count({ where: { userId: survivorId } }),
        prisma.task.count({ where: { userId: survivorId } }),
        prisma.memory.count({ where: { userId: survivorId } }),
        prisma.course.count({ where: { semester: { userId: survivorId } } }),
        prisma.semester.count({ where: { userId: survivorId } }),
      ]);

    expect(user).not.toBeNull();
    expect({ notes, tasks, memories, courses, semesters }).toEqual({
      notes: 1,
      tasks: 1,
      memories: 1,
      courses: 1,
      semesters: 1,
    });
  });
});
