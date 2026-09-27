import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import { createSemester } from "@/lib/services/semester";
import { createCourse } from "@/lib/services/course";
import {
  createMeetings,
  deleteMeeting,
  listMeetingsForUser,
  updateMeeting,
} from "@/lib/services/meeting";

const slot = {
  kind: "lecture" as const,
  weekdays: [1, 3],
  startMinute: 570,
  durationMinutes: 80,
  location: "Room 204",
};

const userIds: string[] = [];

async function studentWithCourse() {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-meeting-${randomUUID()}@example.com`,
      emailVerified: true,
    },
  });
  userIds.push(user.id);
  const semester = await createSemester(user.id, {
    name: "Fall 2026",
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-12-15"),
  });
  const course = await createCourse(user.id, semester.id, {
    name: "Network Security",
    code: "CYBR 301",
    professor: undefined,
    credits: 3,
  });
  if (!course.success) throw new Error("fixture failed");
  return { userId: user.id, courseId: course.data.id };
}

let userId: string;
let courseId: string;

beforeEach(async () => {
  ({ userId, courseId } = await studentWithCourse());
});

afterEach(async () => {
  // Courses restrict their term's deletion, so they go first; meetings
  // cascade with them.
  await prisma.course.deleteMany({
    where: { semester: { userId: { in: userIds } } },
  });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  userIds.length = 0;
});

describe("createMeetings", () => {
  test("creates one row per day ticked", async () => {
    const result = await createMeetings(userId, courseId, slot);

    expect(result.success).toBe(true);
    expect(result.success && result.data.map((m) => m.weekday)).toEqual([1, 3]);
    expect(result.success && result.data[0]).toMatchObject({
      courseId,
      kind: "lecture",
      startMinute: 570,
      durationMinutes: 80,
      location: "Room 204",
    });
  });

  test("refuses a course that belongs to someone else", async () => {
    const other = await studentWithCourse();

    expect(await createMeetings(userId, other.courseId, slot)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await prisma.courseMeeting.count({ where: { courseId: other.courseId } })).toBe(0);
  });
});

describe("listMeetingsForUser", () => {
  test("lists only this student's classes, in week order, with the course", async () => {
    await createMeetings(userId, courseId, { ...slot, weekdays: [3] });
    await createMeetings(userId, courseId, {
      ...slot,
      weekdays: [1],
      startMinute: 840,
    });
    await createMeetings(userId, courseId, { ...slot, weekdays: [1] });
    const other = await studentWithCourse();
    await createMeetings(other.userId, other.courseId, slot);

    const meetings = await listMeetingsForUser(userId);

    expect(meetings.map((m) => [m.weekday, m.startMinute])).toEqual([
      [1, 570],
      [1, 840],
      [3, 570],
    ]);
    expect(meetings[0].course).toEqual({
      id: courseId,
      name: "Network Security",
      code: "CYBR 301",
      semesterId: expect.any(String),
    });
  });
});

describe("updateMeeting and deleteMeeting", () => {
  test("changes a class time", async () => {
    const created = await createMeetings(userId, courseId, { ...slot, weekdays: [1] });
    if (!created.success) throw new Error("fixture failed");
    const [meeting] = created.data;

    const result = await updateMeeting(userId, meeting.id, {
      kind: "lab",
      weekday: 4,
      startMinute: 840,
      durationMinutes: 120,
      location: null,
    });

    expect(result).toEqual({ success: true });
    expect(await prisma.courseMeeting.findUnique({ where: { id: meeting.id } })).toMatchObject({
      kind: "lab",
      weekday: 4,
      startMinute: 840,
      durationMinutes: 120,
      location: null,
    });
  });

  test("will not touch another student's class", async () => {
    const other = await studentWithCourse();
    const created = await createMeetings(other.userId, other.courseId, slot);
    if (!created.success) throw new Error("fixture failed");
    const [theirs] = created.data;

    expect(
      await updateMeeting(userId, theirs.id, {
        kind: "lab",
        weekday: 4,
        startMinute: 0,
        durationMinutes: 60,
        location: null,
      })
    ).toEqual({ success: false, error: "not_found" });
    expect(await deleteMeeting(userId, theirs.id)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await prisma.courseMeeting.findUnique({ where: { id: theirs.id } })).not.toBeNull();
  });

  test("removes a class time", async () => {
    const created = await createMeetings(userId, courseId, { ...slot, weekdays: [1] });
    if (!created.success) throw new Error("fixture failed");

    expect(await deleteMeeting(userId, created.data[0].id)).toEqual({ success: true });
    expect(await listMeetingsForUser(userId)).toEqual([]);
  });

  test("goes when its course goes", async () => {
    await createMeetings(userId, courseId, slot);

    await prisma.course.delete({ where: { id: courseId } });

    expect(await listMeetingsForUser(userId)).toEqual([]);
  });
});
