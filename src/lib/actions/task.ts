"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/session";
import { parseTaskInput } from "@/lib/task";
import type { TaskStatus } from "@/generated/prisma/enums";
import {
  completeTask,
  createTask,
  deleteTask,
  updateTask,
} from "@/lib/services/task";

export type TaskActionState = {
  errors: string[];
};

function readTaskFormFields(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority"),
    estimatedDuration: formData.get("estimatedDuration"),
    type: formData.get("type"),
    topicsToReview: formData.get("topicsToReview"),
    courseId: formData.get("courseId"),
  };
}

export async function createTaskAction(
  _prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const userId = await requireUserId();

  const result = parseTaskInput(readTaskFormFields(formData));
  if (!result.success) {
    return { errors: result.errors };
  }

  const created = await createTask(userId, result.data);
  if (!created.success) {
    return { errors: ["Course not found."] };
  }

  revalidatePath("/tasks");
  return { errors: [] };
}

export async function updateTaskAction(
  _prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const userId = await requireUserId();
  const taskId = String(formData.get("taskId") ?? "");

  const result = parseTaskInput(readTaskFormFields(formData));
  if (!result.success) {
    return { errors: result.errors };
  }

  const status = formData.get("status");
  const updated = await updateTask(userId, taskId, {
    ...result.data,
    ...(typeof status === "string" && status
      ? { status: status as TaskStatus }
      : {}),
  });
  if (!updated.success) {
    return { errors: ["Task not found."] };
  }

  revalidatePath("/tasks");
  return { errors: [] };
}

export async function completeTaskAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const taskId = String(formData.get("taskId") ?? "");
  const actualDurationRaw = formData.get("actualDuration");
  const actualDuration =
    typeof actualDurationRaw === "string" && actualDurationRaw.trim() !== ""
      ? Number(actualDurationRaw)
      : undefined;

  await completeTask(userId, taskId, actualDuration);
  revalidatePath("/tasks");
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const taskId = String(formData.get("taskId") ?? "");

  await deleteTask(userId, taskId);
  revalidatePath("/tasks");
}
