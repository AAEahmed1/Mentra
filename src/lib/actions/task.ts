"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/session";
import { ROW_ACTION_OK, type RowActionResult } from "@/lib/action-state";
import {
  parseTaskCompletion,
  parseTaskInput,
  parseTaskUpdate,
} from "@/lib/task";
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

/**
 * Work appears on the Work page, drives the ranking on Today, and fills the
 * "about a piece of work" picker on Notes, so a change refreshes all three.
 */
function revalidateWork() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/notes");
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
    return { errors: ["That course no longer exists."] };
  }

  revalidateWork();
  return { errors: [] };
}

export async function updateTaskAction(
  _prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const userId = await requireUserId();
  const taskId = String(formData.get("taskId") ?? "");

  const result = parseTaskUpdate({
    ...readTaskFormFields(formData),
    status: formData.get("status"),
    actualDuration: formData.get("actualDuration"),
  });
  if (!result.success) {
    return { errors: result.errors };
  }

  const updated = await updateTask(userId, taskId, result.data);
  if (!updated.success) {
    return {
      errors: [
        updated.error === "course_not_found"
          ? "That course no longer exists."
          : "That piece of work no longer exists.",
      ],
    };
  }

  revalidateWork();
  return { errors: [] };
}

export async function completeTaskAction(
  formData: FormData
): Promise<RowActionResult> {
  const userId = await requireUserId();
  const taskId = String(formData.get("taskId") ?? "");

  const result = parseTaskCompletion({
    actualDuration: formData.get("actualDuration"),
  });
  if (!result.success) {
    return { error: result.errors[0] };
  }

  const completed = await completeTask(
    userId,
    taskId,
    result.data.actualDuration
  );
  if (!completed.success) {
    return { error: "That piece of work no longer exists." };
  }

  revalidateWork();
  return ROW_ACTION_OK;
}

export async function deleteTaskAction(
  formData: FormData
): Promise<RowActionResult> {
  const userId = await requireUserId();
  const taskId = String(formData.get("taskId") ?? "");

  const deleted = await deleteTask(userId, taskId);
  if (!deleted.success) {
    return { error: "That piece of work was already removed." };
  }

  revalidateWork();
  return ROW_ACTION_OK;
}
