import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createSemester,
  deleteSemester,
  listSemestersForUser,
  updateSemester,
} from "@/lib/services/semester";

let userId: string;

beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-semester-${randomUUID()}@example.com`,
      emailVerified: true,
    },
  });
  userId = user.id;
});

afterEach(async () => {
  await prisma.course.deleteMany({ where: { semester: { userId } } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("createSemester", () => {
  test("creates a semester owned by the given user", async () => {
    const semester = await createSemester(userId, {
      name: "Fall 2026",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-15"),
    });

    expect(semester).toMatchObject({
      userId,
      name: "Fall 2026",
    });
  });
});

describe("listSemestersForUser", () => {
  test("returns only semesters owned by the given user", async () => {
    await createSemester(userId, {
      name: "Fall 2026",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-15"),
    });

    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-semester-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    await createSemester(otherUser.id, {
      name: "Spring 2027",
      startDate: new Date("2027-01-15"),
      endDate: new Date("2027-05-01"),
    });

    const semesters = await listSemestersForUser(userId);

    expect(semesters).toHaveLength(1);
    expect(semesters[0].name).toBe("Fall 2026");

    await prisma.semester.deleteMany({ where: { userId: otherUser.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

describe("updateSemester", () => {
  test("updates a semester owned by the given user", async () => {
    const semester = await createSemester(userId, {
      name: "Fall 2026",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-15"),
    });

    const updated = await updateSemester(userId, semester.id, {
      name: "Autumn 2026",
    });

    expect(updated.success).toBe(true);
    expect(updated.success && updated.data.name).toBe("Autumn 2026");
  });

  test("refuses to update a semester owned by someone else", async () => {
    const otherUser = await prisma.user.create({
      data: {
        name: "Other Student",
        email: `test-semester-other-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    const semester = await createSemester(otherUser.id, {
      name: "Spring 2027",
      startDate: new Date("2027-01-15"),
      endDate: new Date("2027-05-01"),
    });

    const result = await updateSemester(userId, semester.id, {
      name: "Hijacked",
    });

    expect(result).toEqual({ success: false, error: "not_found" });

    await prisma.semester.deleteMany({ where: { userId: otherUser.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

describe("deleteSemester", () => {
  test("deletes a semester with no courses", async () => {
    const semester = await createSemester(userId, {
      name: "Fall 2026",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-15"),
    });

    const result = await deleteSemester(userId, semester.id);

    expect(result).toEqual({ success: true });
    const found = await prisma.semester.findUnique({ where: { id: semester.id } });
    expect(found).toBeNull();
  });

  test("refuses to delete a semester that still has courses", async () => {
    const semester = await createSemester(userId, {
      name: "Fall 2026",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-15"),
    });
    await prisma.course.create({
      data: { semesterId: semester.id, name: "Network Security" },
    });

    const result = await deleteSemester(userId, semester.id);

    expect(result).toEqual({ success: false, error: "has_courses" });
    const found = await prisma.semester.findUnique({ where: { id: semester.id } });
    expect(found).not.toBeNull();
  });
});
