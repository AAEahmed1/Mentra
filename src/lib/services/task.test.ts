import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import { createSemester } from "@/lib/services/semester";
import { createCourse } from "@/lib/services/course";
import {
  completeTask,
  createTask,
  deleteTask,
  listTasksForUser,
  updateTask,
} from "@/lib/services/task";

let userId: string;
let courseId: string;

beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-task-${randomUUID()}@example.com`,
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
  await prisma.task.deleteMany({ where: { userId } });
  await prisma.course.deleteMany({ where: { semester: { userId } } });
  await prisma.semester.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("createTask", () => {
  test("creates a task linked to a course owned by the given user", async () => {
    const result = await createTask(userId, {
      title: "Finish lab",
      description: undefined,
      dueDate: undefined,
      priority: "high",
      estimatedDuration: 55,
      type: "task",
      topicsToReview: undefined,
      courseId,
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toMatchObject({
      userId,
      courseId,
      title: "Finish lab",
      priority: "high",
      estimatedDuration: 55,
      status: "not_started",
    });
  });

  test("creates a task with no course", async () => {
    const result = await createTask(userId, {
      title: "Read chapter 3",
      description: undefined,
      dueDate: undefined,
      priority: "medium",
      estimatedDuration: undefined,
      type: "task",
      topicsToReview: undefined,
      courseId: undefined,
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.courseId).toBeNull();
  });

  test("refuses to link a task to a course owned by someone else", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-task-other-${randomUUID()}@example.com`,
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

    const result = await createTask(userId, {
      title: "Hijacked task",
      description: undefined,
      dueDate: undefined,
      priority: "medium",
      estimatedDuration: undefined,
      type: "task",
      topicsToReview: undefined,
      courseId: otherCourse.data.id,
    });

    expect(result).toEqual({ success: false, error: "course_not_found" });

    await prisma.course.delete({ where: { id: otherCourse.data.id } });
    await prisma.semester.delete({ where: { id: otherSemester.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

describe("listTasksForUser", () => {
  test("returns only tasks owned by the given user", async () => {
    await createTask(userId, {
      title: "Finish lab",
      description: undefined,
      dueDate: undefined,
      priority: "medium",
      estimatedDuration: undefined,
      type: "task",
      topicsToReview: undefined,
      courseId: undefined,
    });

    const tasks = await listTasksForUser(userId);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Finish lab");
  });
});

describe("updateTask", () => {
  test("updates a task owned by the given user", async () => {
    const created = await createTask(userId, {
      title: "Finish lab",
      description: undefined,
      dueDate: undefined,
      priority: "medium",
      estimatedDuration: undefined,
      type: "task",
      topicsToReview: undefined,
      courseId: undefined,
    });
    if (!created.success) throw new Error("fixture creation failed");

    const updated = await updateTask(userId, created.data.id, {
      title: "Finish network security lab",
      status: "in_progress",
    });

    expect(updated.success).toBe(true);
    expect(updated.success && updated.data).toMatchObject({
      title: "Finish network security lab",
      status: "in_progress",
    });
  });

  test("refuses to update a task owned by someone else", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-task-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    const otherTask = await prisma.task.create({
      data: { userId: otherUser.id, title: "Other's task" },
    });

    const result = await updateTask(userId, otherTask.id, {
      title: "Hijacked",
    });

    expect(result).toEqual({ success: false, error: "not_found" });

    await prisma.task.delete({ where: { id: otherTask.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

describe("updateTask links and clearing", () => {
  test("clears the course and optional fields when given null", async () => {
    const created = await createTask(userId, {
      title: "Finish lab",
      description: "Parts 1 to 3",
      dueDate: new Date("2026-09-20"),
      priority: "medium",
      estimatedDuration: 60,
      type: "task",
      topicsToReview: "Subnetting",
      courseId,
    });
    if (!created.success) throw new Error("fixture creation failed");

    const updated = await updateTask(userId, created.data.id, {
      courseId: null,
      dueDate: null,
      description: null,
      estimatedDuration: null,
      topicsToReview: null,
    });

    expect(updated.success && updated.data).toMatchObject({
      courseId: null,
      dueDate: null,
      description: null,
      estimatedDuration: null,
      topicsToReview: null,
    });
  });

  test("refuses to file a task under another student's course", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-task-course-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    const otherSemester = await createSemester(otherUser.id, {
      name: "Their term",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-15"),
    });
    const otherCourse = await createCourse(otherUser.id, otherSemester.id, {
      name: "Their course",
      code: undefined,
      professor: undefined,
      credits: undefined,
    });
    if (!otherCourse.success) throw new Error("fixture creation failed");

    try {
      const created = await createTask(userId, {
        title: "Mine",
        description: undefined,
        dueDate: undefined,
        priority: "medium",
        estimatedDuration: undefined,
        type: "task",
        topicsToReview: undefined,
        courseId: undefined,
      });
      if (!created.success) throw new Error("fixture creation failed");

      const result = await updateTask(userId, created.data.id, {
        courseId: otherCourse.data.id,
      });

      expect(result).toEqual({ success: false, error: "course_not_found" });
      const stored = await prisma.task.findUniqueOrThrow({
        where: { id: created.data.id },
      });
      expect(stored.courseId).toBeNull();
    } finally {
      await prisma.course.deleteMany({ where: { semesterId: otherSemester.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
  });
});

describe("completeTask", () => {
  test("marks a task completed without recording actual duration when none is given", async () => {
    const created = await createTask(userId, {
      title: "Finish lab",
      description: undefined,
      dueDate: undefined,
      priority: "medium",
      estimatedDuration: 55,
      type: "task",
      topicsToReview: undefined,
      courseId: undefined,
    });
    if (!created.success) throw new Error("fixture creation failed");

    const result = await completeTask(userId, created.data.id);

    expect(result.success).toBe(true);
    expect(result.success && result.data).toMatchObject({
      status: "completed",
      actualDuration: null,
    });
  });

  test("records actual duration when the student provides one", async () => {
    const created = await createTask(userId, {
      title: "Finish lab",
      description: undefined,
      dueDate: undefined,
      priority: "medium",
      estimatedDuration: 55,
      type: "task",
      topicsToReview: undefined,
      courseId: undefined,
    });
    if (!created.success) throw new Error("fixture creation failed");

    const result = await completeTask(userId, created.data.id, 90);

    expect(result.success).toBe(true);
    expect(result.success && result.data).toMatchObject({
      status: "completed",
      actualDuration: 90,
    });
  });
});

describe("deleteTask", () => {
  test("deletes a task owned by the given user", async () => {
    const created = await createTask(userId, {
      title: "Finish lab",
      description: undefined,
      dueDate: undefined,
      priority: "medium",
      estimatedDuration: undefined,
      type: "task",
      topicsToReview: undefined,
      courseId: undefined,
    });
    if (!created.success) throw new Error("fixture creation failed");

    const result = await deleteTask(userId, created.data.id);

    expect(result).toEqual({ success: true });
    const found = await prisma.task.findUnique({
      where: { id: created.data.id },
    });
    expect(found).toBeNull();
  });
});
