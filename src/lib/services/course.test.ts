import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import { createSemester } from "@/lib/services/semester";
import {
  createCourse,
  deleteCourse,
  listCoursesForSemester,
  updateCourse,
} from "@/lib/services/course";

let userId: string;
let semesterId: string;

beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-course-${randomUUID()}@example.com`,
      emailVerified: true,
    },
  });
  userId = user.id;

  const semester = await createSemester(userId, {
    name: "Fall 2026",
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-12-15"),
  });
  semesterId = semester.id;
});

afterEach(async () => {
  await prisma.course.deleteMany({ where: { semesterId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("createCourse", () => {
  test("creates a course under a semester owned by the given user", async () => {
    const result = await createCourse(userId, semesterId, {
      name: "Network Security",
      code: "CYBR 301",
      professor: undefined,
      credits: 3,
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toMatchObject({
      semesterId,
      name: "Network Security",
      code: "CYBR 301",
      credits: 3,
    });
  });

  test("refuses to create a course under a semester owned by someone else", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-course-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    const otherSemester = await createSemester(otherUser.id, {
      name: "Spring 2027",
      startDate: new Date("2027-01-15"),
      endDate: new Date("2027-05-01"),
    });

    const result = await createCourse(userId, otherSemester.id, {
      name: "Hijacked Course",
      code: undefined,
      professor: undefined,
      credits: undefined,
    });

    expect(result).toEqual({ success: false, error: "not_found" });

    await prisma.semester.delete({ where: { id: otherSemester.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

describe("listCoursesForSemester", () => {
  test("returns only courses under the given semester", async () => {
    await createCourse(userId, semesterId, {
      name: "Network Security",
      code: undefined,
      professor: undefined,
      credits: undefined,
    });

    const courses = await listCoursesForSemester(userId, semesterId);

    expect(courses).toHaveLength(1);
    expect(courses[0].name).toBe("Network Security");
  });
});

describe("updateCourse", () => {
  test("updates a course owned (via semester) by the given user", async () => {
    const created = await createCourse(userId, semesterId, {
      name: "Network Security",
      code: undefined,
      professor: undefined,
      credits: undefined,
    });
    if (!created.success) throw new Error("fixture creation failed");

    const updated = await updateCourse(userId, created.data.id, {
      name: "Advanced Network Security",
    });

    expect(updated.success).toBe(true);
    expect(updated.success && updated.data.name).toBe(
      "Advanced Network Security"
    );
  });
});

describe("deleteCourse", () => {
  test("deletes a course owned (via semester) by the given user", async () => {
    const created = await createCourse(userId, semesterId, {
      name: "Network Security",
      code: undefined,
      professor: undefined,
      credits: undefined,
    });
    if (!created.success) throw new Error("fixture creation failed");

    const result = await deleteCourse(userId, created.data.id);

    expect(result).toEqual({ success: true });
    const found = await prisma.course.findUnique({
      where: { id: created.data.id },
    });
    expect(found).toBeNull();
  });

  test("refuses to delete a course owned by someone else", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-course-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    const otherSemester = await createSemester(otherUser.id, {
      name: "Spring 2027",
      startDate: new Date("2027-01-15"),
      endDate: new Date("2027-05-01"),
    });
    const otherCourse = await prisma.course.create({
      data: { semesterId: otherSemester.id, name: "Other's Course" },
    });

    const result = await deleteCourse(userId, otherCourse.id);

    expect(result).toEqual({ success: false, error: "not_found" });

    await prisma.course.delete({ where: { id: otherCourse.id } });
    await prisma.semester.delete({ where: { id: otherSemester.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});
