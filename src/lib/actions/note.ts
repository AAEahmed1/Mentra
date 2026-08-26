"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/session";
import { parseNoteInput } from "@/lib/note";
import { createNote, deleteNote, updateNote } from "@/lib/services/note";

export type NoteActionState = {
  errors: string[];
};

/** Name which link failed, so the student knows what to change. */
function linkError(
  error: "not_found" | "course_not_found" | "task_not_found"
): string {
  if (error === "course_not_found") return "That course no longer exists.";
  if (error === "task_not_found") return "That piece of work no longer exists.";
  return "That note no longer exists.";
}

function readNoteFormFields(formData: FormData) {
  return {
    title: formData.get("title"),
    body: formData.get("body"),
    courseId: formData.get("courseId"),
    taskId: formData.get("taskId"),
  };
}

export async function createNoteAction(
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const userId = await requireUserId();

  const result = parseNoteInput(readNoteFormFields(formData));
  if (!result.success) {
    return { errors: result.errors };
  }

  const created = await createNote(userId, result.data);
  if (!created.success) {
    return { errors: [linkError(created.error)] };
  }

  revalidatePath("/notes");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { errors: [] };
}

export async function updateNoteAction(
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const userId = await requireUserId();
  const noteId = String(formData.get("noteId") ?? "");

  const result = parseNoteInput(readNoteFormFields(formData));
  if (!result.success) {
    return { errors: result.errors };
  }

  const updated = await updateNote(userId, noteId, result.data);
  if (!updated.success) {
    return { errors: [linkError(updated.error)] };
  }

  revalidatePath("/notes");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { errors: [] };
}

export async function deleteNoteAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const noteId = String(formData.get("noteId") ?? "");

  await deleteNote(userId, noteId);
  revalidatePath("/notes");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
