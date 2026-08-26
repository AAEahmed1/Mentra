import { prisma } from "@/lib/prisma";
import type { Note } from "@/generated/prisma/client";
import type { NoteInput } from "@/lib/note";

export type CreateNoteResult =
  | { success: true; data: Note }
  | { success: false; error: "course_not_found" };

export async function createNote(
  userId: string,
  data: NoteInput
): Promise<CreateNoteResult> {
  if (data.courseId) {
    const course = await prisma.course.findFirst({
      where: { id: data.courseId, semester: { userId } },
    });
    if (!course) {
      return { success: false, error: "course_not_found" };
    }
  }

  const note = await prisma.note.create({
    data: { ...data, userId },
  });

  return { success: true, data: note };
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

export type UpdateNoteResult =
  | { success: true; data: Note }
  | { success: false; error: "not_found" };

export async function updateNote(
  userId: string,
  noteId: string,
  data: Partial<NoteInput>
): Promise<UpdateNoteResult> {
  const { count } = await prisma.note.updateMany({
    where: { id: noteId, userId },
    data,
  });

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  const note = await prisma.note.findUniqueOrThrow({
    where: { id: noteId },
  });

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
