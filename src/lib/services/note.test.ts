import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import { createSemester } from "@/lib/services/semester";
import { createCourse } from "@/lib/services/course";
import { createTask } from "@/lib/services/task";
import {
  createNote,
  deleteNote,
  listNotesForUser,
  searchNotesForUser,
  updateNote,
} from "@/lib/services/note";

let userId: string;
let courseId: string;

beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-note-${randomUUID()}@example.com`,
      emailVerified: true,
    },
  });
  userId = user.id;

  const semester = await createSemester(userId, {
    name: "Fall 2026",
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-12-15"),
  });

  const course = await createCourse(userId, semester.id, {
    name: "Network Security",
    code: undefined,
    professor: undefined,
    credits: undefined,
  });
  if (!course.success) throw new Error("fixture creation failed");
  courseId = course.data.id;
});

afterEach(async () => {
  await prisma.note.deleteMany({ where: { userId } });
  await prisma.course.deleteMany({ where: { semester: { userId } } });
  await prisma.semester.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("createNote", () => {
  test("creates a note linked to a course owned by the given user", async () => {
    const result = await createNote(userId, {
      title: "Subnetting cheatsheet",
      body: "A /24 gives 254 usable hosts.",
      courseId,
      taskId: undefined,
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toMatchObject({
      userId,
      courseId,
      title: "Subnetting cheatsheet",
    });
  });

  test("creates a note with no course", async () => {
    const result = await createNote(userId, {
      title: "Random thought",
      body: "Study earlier in the day.",
      courseId: undefined,
      taskId: undefined,
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.courseId).toBeNull();
  });

  test("refuses to link a note to a course owned by someone else", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-note-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    const otherSemester = await createSemester(otherUser.id, {
      name: "Spring 2027",
      startDate: new Date("2027-01-15"),
      endDate: new Date("2027-05-01"),
    });
    const otherCourse = await createCourse(otherUser.id, otherSemester.id, {
      name: "Other's Course",
      code: undefined,
      professor: undefined,
      credits: undefined,
    });
    if (!otherCourse.success) throw new Error("fixture creation failed");

    const result = await createNote(userId, {
      title: "Hijacked note",
      body: "Should not be created.",
      courseId: otherCourse.data.id,
      taskId: undefined,
    });

    expect(result).toEqual({ success: false, error: "course_not_found" });

    await prisma.course.delete({ where: { id: otherCourse.data.id } });
    await prisma.semester.delete({ where: { id: otherSemester.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

describe("listNotesForUser", () => {
  test("returns only notes owned by the given user", async () => {
    await createNote(userId, {
      title: "Subnetting cheatsheet",
      body: "A /24 gives 254 usable hosts.",
      courseId: undefined,
      taskId: undefined,
    });

    const notes = await listNotesForUser(userId);

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("Subnetting cheatsheet");
  });
});

describe("searchNotesForUser", () => {
  test("matches a note by a word in its title", async () => {
    await createNote(userId, {
      title: "Subnetting cheatsheet",
      body: "A /24 gives 254 usable hosts.",
      courseId: undefined,
      taskId: undefined,
    });

    const notes = await searchNotesForUser(userId, "subnetting");

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("Subnetting cheatsheet");
  });

  test("matches a note by a word in its body", async () => {
    await createNote(userId, {
      title: "Subnetting cheatsheet",
      body: "A /24 gives 254 usable hosts.",
      courseId: undefined,
      taskId: undefined,
    });

    const notes = await searchNotesForUser(userId, "usable hosts");

    expect(notes).toHaveLength(1);
  });

  test("matches case-insensitively", async () => {
    await createNote(userId, {
      title: "Subnetting cheatsheet",
      body: "A /24 gives 254 usable hosts.",
      courseId: undefined,
      taskId: undefined,
    });

    const notes = await searchNotesForUser(userId, "SUBNETTING");

    expect(notes).toHaveLength(1);
  });

  test("does not return unrelated notes", async () => {
    await createNote(userId, {
      title: "Subnetting cheatsheet",
      body: "A /24 gives 254 usable hosts.",
      courseId: undefined,
      taskId: undefined,
    });
    await createNote(userId, {
      title: "Cryptography basics",
      body: "RSA uses asymmetric keys.",
      courseId: undefined,
      taskId: undefined,
    });

    const notes = await searchNotesForUser(userId, "subnetting");

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("Subnetting cheatsheet");
  });

  test("does not return notes belonging to another user", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-note-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    await prisma.note.create({
      data: {
        userId: otherUser.id,
        title: "Subnetting cheatsheet",
        body: "Other student's private note.",
      },
    });

    const notes = await searchNotesForUser(userId, "subnetting");

    expect(notes).toHaveLength(0);

    await prisma.note.deleteMany({ where: { userId: otherUser.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  test("returns all of the user's notes for a blank query", async () => {
    await createNote(userId, {
      title: "Subnetting cheatsheet",
      body: "A /24 gives 254 usable hosts.",
      courseId: undefined,
      taskId: undefined,
    });
    await createNote(userId, {
      title: "Cryptography basics",
      body: "RSA uses asymmetric keys.",
      courseId: undefined,
      taskId: undefined,
    });

    const notes = await searchNotesForUser(userId, "   ");

    expect(notes).toHaveLength(2);
  });
});

describe("updateNote unfiling", () => {
  test("clears the course and piece of work when given null", async () => {
    const task = await prisma.task.create({
      data: { userId, title: "Lab report", courseId },
    });
    const created = await createNote(userId, {
      title: "Lab notes",
      body: "Remember the diagram.",
      courseId,
      taskId: task.id,
    });
    if (!created.success) throw new Error("fixture creation failed");

    const updated = await updateNote(userId, created.data.id, {
      courseId: null,
      taskId: null,
    });

    expect(updated.success && updated.data).toMatchObject({
      courseId: null,
      taskId: null,
    });
  });
});

describe("updateNote", () => {
  test("updates a note owned by the given user", async () => {
    const created = await createNote(userId, {
      title: "Subnetting cheatsheet",
      body: "A /24 gives 254 usable hosts.",
      courseId: undefined,
      taskId: undefined,
    });
    if (!created.success) throw new Error("fixture creation failed");

    const updated = await updateNote(userId, created.data.id, {
      title: "Subnetting reference",
    });

    expect(updated.success).toBe(true);
    expect(updated.success && updated.data.title).toBe("Subnetting reference");
  });

  test("refuses to update a note owned by someone else", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-note-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    const otherNote = await prisma.note.create({
      data: {
        userId: otherUser.id,
        title: "Other's note",
        body: "Private.",
      },
    });

    const result = await updateNote(userId, otherNote.id, {
      title: "Hijacked",
    });

    expect(result).toEqual({ success: false, error: "not_found" });

    await prisma.note.delete({ where: { id: otherNote.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

describe("deleteNote", () => {
  test("deletes a note owned by the given user", async () => {
    const created = await createNote(userId, {
      title: "Subnetting cheatsheet",
      body: "A /24 gives 254 usable hosts.",
      courseId: undefined,
      taskId: undefined,
    });
    if (!created.success) throw new Error("fixture creation failed");

    const result = await deleteNote(userId, created.data.id);

    expect(result).toEqual({ success: true });
    const found = await prisma.note.findUnique({
      where: { id: created.data.id },
    });
    expect(found).toBeNull();
  });
});

describe("createNote — attaching to a piece of work", () => {
  test("attaches a note to a task owned by the given user", async () => {
    const task = await createTask(userId, {
      title: "Drug calculations worksheet",
      description: undefined,
      dueDate: undefined,
      priority: "medium",
      estimatedDuration: undefined,
      type: "task",
      topicsToReview: undefined,
      courseId: undefined,
    });
    if (!task.success) throw new Error("fixture creation failed");

    const result = await createNote(userId, {
      title: "Watch the units",
      body: "mg vs mcg is where the mistakes came from.",
      courseId: undefined,
      taskId: task.data.id,
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.taskId).toBe(task.data.id);
  });

  test("refuses to attach a note to another student's task", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-note-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    const otherTask = await prisma.task.create({
      data: { userId: otherUser.id, title: "Other's task" },
    });

    const result = await createNote(userId, {
      title: "Hijacked note",
      body: "Should not attach.",
      courseId: undefined,
      taskId: otherTask.id,
    });

    expect(result).toEqual({ success: false, error: "task_not_found" });

    await prisma.task.delete({ where: { id: otherTask.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  test("keeps the note when the work it was attached to is deleted", async () => {
    const task = await createTask(userId, {
      title: "Ward simulation prep",
      description: undefined,
      dueDate: undefined,
      priority: "medium",
      estimatedDuration: undefined,
      type: "task",
      topicsToReview: undefined,
      courseId: undefined,
    });
    if (!task.success) throw new Error("fixture creation failed");

    const note = await createNote(userId, {
      title: "Handover structure",
      body: "Situation, background, assessment, recommendation.",
      courseId: undefined,
      taskId: task.data.id,
    });
    if (!note.success) throw new Error("fixture creation failed");

    await prisma.task.delete({ where: { id: task.data.id } });

    const survivor = await prisma.note.findUnique({
      where: { id: note.data.id },
    });
    expect(survivor).not.toBeNull();
    expect(survivor?.taskId).toBeNull();
  });
});
