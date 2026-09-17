import { prisma } from "@/lib/prisma";
import type { Note } from "@/generated/prisma/client";
import type { NoteInput } from "@/lib/note";
import { isForeignKeyViolation } from "@/lib/services/prisma-errors";

export type CreateNoteResult =
  | { success: true; data: Note }
  | { success: false; error: "course_not_found" | "task_not_found" };

/**
 * A note may name a course and a task, and neither may belong to anyone else.
 * The ids arrive from a form the student controls, so ownership is proven here
 * rather than trusted.
 */
async function rejectForeignLinks(
  userId: string,
  data: { courseId?: string | null; taskId?: string | null }
): Promise<"course_not_found" | "task_not_found" | null> {
  if (data.courseId) {
    const course = await prisma.course.findFirst({
      where: { id: data.courseId, semester: { userId } },
    });
    if (!course) return "course_not_found";
  }

  if (data.taskId) {
    const task = await prisma.task.findFirst({
      where: { id: data.taskId, userId },
    });
    if (!task) return "task_not_found";
  }

  return null;
}

export async function createNote(
  userId: string,
  data: NoteInput
): Promise<CreateNoteResult> {
  const rejection = await rejectForeignLinks(userId, data);
  if (rejection) {
    return { success: false, error: rejection };
  }

  try {
    const note = await prisma.note.create({
      data: { ...data, userId },
    });
    return { success: true, data: note };
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { success: false, error: linkedRowGone(data) };
    }
    throw error;
  }
}

export function listNotesForUser(userId: string): Promise<Note[]> {
  return prisma.note.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function searchNotesForUser(
  userId: string,
  query: string
): Promise<Note[]> {
  const term = query.trim();

  if (term === "") {
    return listNotesForUser(userId);
  }

  return prisma.note.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { body: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * The fields an update may change. `undefined` leaves a field as it is; `null`
 * unfiles the note from its course or piece of work.
 */
export type NoteUpdate = {
  title?: string;
  body?: string;
  courseId?: string | null;
  taskId?: string | null;
};

/** Which link vanished when a write lost a race with a delete. */
function linkedRowGone(data: {
  courseId?: string | null;
  taskId?: string | null;
}): "course_not_found" | "task_not_found" {
  return data.courseId ? "course_not_found" : "task_not_found";
}

export type UpdateNoteResult =
  | { success: true; data: Note }
  | { success: false; error: "not_found" | "course_not_found" | "task_not_found" };

export async function updateNote(
  userId: string,
  noteId: string,
  data: NoteUpdate
): Promise<UpdateNoteResult> {
  const rejection = await rejectForeignLinks(userId, data);
  if (rejection) {
    return { success: false, error: rejection };
  }

  let count: number;
  try {
    ({ count } = await prisma.note.updateMany({
      where: { id: noteId, userId },
      data,
    }));
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { success: false, error: linkedRowGone(data) };
    }
    throw error;
  }

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
  if (!note) {
    return { success: false, error: "not_found" };
  }

  return { success: true, data: note };
}

export type DeleteNoteResult =
  | { success: true }
  | { success: false; error: "not_found" };

export async function deleteNote(
  userId: string,
  noteId: string
): Promise<DeleteNoteResult> {
  const { count } = await prisma.note.deleteMany({
    where: { id: noteId, userId },
  });

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  return { success: true };
}
