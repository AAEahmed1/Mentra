import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import { createSemester } from "@/lib/services/semester";
import { createCourse } from "@/lib/services/course";
import { createTask } from "@/lib/services/task";
import { createNote } from "@/lib/services/note";
import { createMemory } from "@/lib/services/memory";
import {
  executeToolCall,
  MAX_MEMORY_RESULTS,
  MAX_NOTE_BODY_LENGTH,
  MAX_NOTE_RESULTS,
  MAX_TASK_RESULTS,
} from "@/lib/ai/execute";
import { validateToolCall, type ValidatedToolCall } from "@/lib/ai/tools";

/** Runs a call the way the assistant would: validated first, then executed. */
async function run(userId: string, name: string, args: unknown) {
  const validated = validateToolCall(name, args);
  if (!validated.ok) throw new Error(validated.error);
  return executeToolCall(userId, validated as ValidatedToolCall);
}

let userId: string;
let courseId: string;
let taskId: string;

beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-execute-${randomUUID()}@example.com`,
      emailVerified: true,
    },
  });
  userId = user.id;

  const semester = await createSemester(userId, {
    name: "Autumn 2026",
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-12-18"),
  });
  const course = await createCourse(userId, semester.id, {
    name: "Network Defence",
    code: "CSC 7303",
    professor: undefined,
    credits: 3,
  });
  if (!course.success) throw new Error("fixture failed");
  courseId = course.data.id;

  const task = await createTask(userId, {
    title: "Network Lab",
    description: undefined,
    dueDate: new Date("2026-09-05"),
    priority: "high",
    estimatedDuration: 90,
    type: "task",
    topicsToReview: undefined,
    courseId,
  });
  if (!task.success) throw new Error("fixture failed");
  taskId = task.data.id;
});

afterEach(async () => {
  await prisma.memory.deleteMany({ where: { userId } });
  await prisma.note.deleteMany({ where: { userId } });
  await prisma.task.deleteMany({ where: { userId } });
  await prisma.course.deleteMany({ where: { semester: { userId } } });
  await prisma.semester.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("search_notes — the assistant answering 'does this work have notes?'", () => {
  test("returns only the notes attached to the named piece of work", async () => {
    await createNote(userId, {
      title: "Subnetting refresher",
      body: "Attached to the lab.",
      courseId: undefined,
      taskId,
    });
    await createNote(userId, {
      title: "Unrelated thought",
      body: "Not about the lab.",
      courseId: undefined,
      taskId: undefined,
    });

    const { notes } = (await run(userId, "search_notes", { taskId })) as {
      notes: { title: string }[];
    };

    expect(notes.map((note) => note.title)).toEqual(["Subnetting refresher"]);
  });

  test("reports which work each note belongs to, so the link is visible at all", async () => {
    await createNote(userId, {
      title: "Subnetting refresher",
      body: "Attached to the lab.",
      courseId: undefined,
      taskId,
    });

    const {
      notes: [note],
    } = (await run(userId, "search_notes", {})) as {
      notes: { taskId: string | null }[];
    };

    // Without this the assistant cannot answer "are there notes on this?" at
    // all — it can only see notes, never what they hang off.
    expect(note.taskId).toBe(taskId);
  });

  test("still searches by keyword when no task is named", async () => {
    await createNote(userId, {
      title: "Subnetting refresher",
      body: "A /24 gives 254 usable hosts.",
      courseId: undefined,
      taskId,
    });

    const { notes } = (await run(userId, "search_notes", {
      query: "usable hosts",
    })) as { notes: unknown[] };

    expect(notes).toHaveLength(1);
  });
});

describe("get_tasks — naming the course rather than only its id", () => {
  test("gives the course name, so the assistant need not join ids itself", async () => {
    const {
      tasks: [task],
    } = (await run(userId, "get_tasks", {})) as {
      tasks: { courseName: string | null }[];
    };

    expect(task.courseName).toBe("Network Defence");
  });
});

describe("get_deadlines — naming the course too", () => {
  test("gives the course name alongside the ranking factors", async () => {
    const [entry] = (await run(userId, "get_deadlines", {})) as {
      courseName: string | null;
    }[];

    expect(entry.courseName).toBe("Network Defence");
  });
});

describe("correcting what the assistant already filed", () => {
  test("update_note rewrites a note it got wrong", async () => {
    const note = await createNote(userId, {
      title: "Lab requirements",
      body: "Wrong text.",
      courseId: undefined,
      taskId,
    });
    if (!note.success) throw new Error("fixture failed");

    await run(userId, "update_note", {
      noteId: note.data.id,
      body: "The right text.",
    });

    const stored = await prisma.note.findUniqueOrThrow({
      where: { id: note.data.id },
    });
    expect(stored.body).toBe("The right text.");
    // Only what was named changes; the rest of the note is left alone.
    expect(stored.title).toBe("Lab requirements");
  });

  test("update_note moves a note onto the work it was actually about", async () => {
    const note = await createNote(userId, {
      title: "Loose thought",
      body: "Filed against nothing.",
      courseId: undefined,
      taskId: undefined,
    });
    if (!note.success) throw new Error("fixture failed");

    await run(userId, "update_note", { noteId: note.data.id, taskId });

    const stored = await prisma.note.findUniqueOrThrow({
      where: { id: note.data.id },
    });
    expect(stored.taskId).toBe(taskId);
  });

  test("delete_note removes it, so a wrong note doesn't linger", async () => {
    const note = await createNote(userId, {
      title: "Filed by mistake",
      body: "Should never have been written.",
      courseId: undefined,
      taskId: undefined,
    });
    if (!note.success) throw new Error("fixture failed");

    const result = await run(userId, "delete_note", { noteId: note.data.id });

    expect(result).toEqual({ deleted: true });
    expect(
      await prisma.note.findUnique({ where: { id: note.data.id } })
    ).toBeNull();
  });

  test("delete_task removes work that should not have been created", async () => {
    const result = await run(userId, "delete_task", { taskId });

    expect(result).toEqual({ deleted: true });
    expect(await prisma.task.findUnique({ where: { id: taskId } })).toBeNull();
  });

  test("reports failure rather than pretending, when the note is not theirs", async () => {
    const result = await run(userId, "delete_note", { noteId: "note_nobody" });

    expect(result).toMatchObject({ deleted: false });
  });

  test("reports failure rather than pretending, when the work is not theirs", async () => {
    const result = await run(userId, "update_note", {
      noteId: "note_nobody",
      body: "Nothing to change.",
    });

    expect(result).toMatchObject({ updated: false });
  });
});

describe("get_courses — telling terms apart", () => {
  test("names the term each course runs in", async () => {
    const [course] = (await run(userId, "get_courses", {})) as {
      semesterName: string | null;
    }[];

    expect(course.semesterName).toBe("Autumn 2026");
  });
});

describe("read tools — bounded results", () => {
  test("search_notes returns at most the newest notes, and says it cut the list", async () => {
    for (let index = 0; index < MAX_NOTE_RESULTS + 3; index += 1) {
      await createNote(userId, {
        title: `Note ${index}`,
        body: "Body.",
        courseId: undefined,
        taskId: undefined,
      });
    }

    const result = (await run(userId, "search_notes", {})) as {
      notes: { title: string }[];
      total: number;
      truncated: boolean;
      note?: string;
    };

    expect(result.notes).toHaveLength(MAX_NOTE_RESULTS);
    expect(result.total).toBe(MAX_NOTE_RESULTS + 3);
    expect(result.truncated).toBe(true);
    expect(result.note).toContain(`Showing ${MAX_NOTE_RESULTS} of`);
  });

  test("search_notes says nothing was cut when nothing was", async () => {
    const result = (await run(userId, "search_notes", {})) as {
      truncated: boolean;
      note?: string;
    };

    expect(result.truncated).toBe(false);
    expect(result.note).toBeUndefined();
  });

  test("search_notes shortens a very long body and marks that it did", async () => {
    await createNote(userId, {
      title: "Long",
      body: "x".repeat(MAX_NOTE_BODY_LENGTH + 500),
      courseId: undefined,
      taskId: undefined,
    });

    const {
      notes: [note],
    } = (await run(userId, "search_notes", {})) as {
      notes: { body: string }[];
    };

    expect(note.body.startsWith("x".repeat(MAX_NOTE_BODY_LENGTH))).toBe(true);
    expect(note.body).toContain("[shortened: 500 more characters");
  });

  test("get_tasks caps a long list and says how to see the rest", async () => {
    await prisma.task.createMany({
      data: Array.from({ length: MAX_TASK_RESULTS }, (_, index) => ({
        userId,
        title: `Extra ${index}`,
      })),
    });

    const result = (await run(userId, "get_tasks", {})) as {
      tasks: unknown[];
      total: number;
      truncated: boolean;
      note?: string;
    };

    expect(result.tasks).toHaveLength(MAX_TASK_RESULTS);
    expect(result.total).toBe(MAX_TASK_RESULTS + 1);
    expect(result.truncated).toBe(true);
    expect(result.note).toMatch(/status or courseId/);
  });

  test("search_memory returns every memory below its cap", async () => {
    await createMemory(userId, {
      content: "Works best early",
      type: "behavioral",
      source: "explicit",
    });

    const result = (await run(userId, "search_memory", {})) as {
      memories: { content: string }[];
      total: number;
      truncated: boolean;
    };

    expect(result.memories.map((memory) => memory.content)).toEqual([
      "Works best early",
    ]);
    expect(result).toMatchObject({ total: 1, truncated: false });
    expect(MAX_MEMORY_RESULTS).toBeGreaterThan(40);
  });
});
