import { prisma } from "@/lib/prisma";
import type { Task, TaskStatus } from "@/generated/prisma/client";
import type { TaskInput } from "@/lib/task";
import { isForeignKeyViolation } from "@/lib/services/prisma-errors";

export type CreateTaskResult =
  | { success: true; data: Task }
  | { success: false; error: "course_not_found" };

/** Whether a course id is one of this student's courses. */
function ownsCourse(userId: string, courseId: string): Promise<boolean> {
  return prisma.course
    .count({ where: { id: courseId, semester: { userId } } })
    .then((count) => count > 0);
}

export async function createTask(
  userId: string,
  data: TaskInput
): Promise<CreateTaskResult> {
  if (data.courseId && !(await ownsCourse(userId, data.courseId))) {
    return { success: false, error: "course_not_found" };
  }

  try {
    const task = await prisma.task.create({
      data: { ...data, userId },
    });
    return { success: true, data: task };
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { success: false, error: "course_not_found" };
    }
    throw error;
  }
}

export function listTasksForUser(userId: string): Promise<Task[]> {
  return prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * The fields an update may change. `undefined` leaves a field as it is; `null`
 * clears an optional one.
 */
export type TaskUpdate = {
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  priority?: Task["priority"];
  estimatedDuration?: number | null;
  actualDuration?: number | null;
  type?: Task["type"];
  status?: TaskStatus;
  topicsToReview?: string | null;
  courseId?: string | null;
};

export type UpdateTaskResult =
  | { success: true; data: Task }
  | { success: false; error: "not_found" | "course_not_found" };

export async function updateTask(
  userId: string,
  taskId: string,
  data: TaskUpdate
): Promise<UpdateTaskResult> {
  // The same ownership proof creating work needs: a course id from a form is
  // not trusted to be this student's just because the task is.
  if (data.courseId && !(await ownsCourse(userId, data.courseId))) {
    return { success: false, error: "course_not_found" };
  }

  let count: number;
  try {
    ({ count } = await prisma.task.updateMany({
      where: { id: taskId, userId },
      data,
    }));
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { success: false, error: "course_not_found" };
    }
    throw error;
  }

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  // Read back scoped to the student as well: if the task was deleted in the
  // moment since the update, that is "not found", not a thrown error.
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    return { success: false, error: "not_found" };
  }

  return { success: true, data: task };
}

export async function completeTask(
  userId: string,
  taskId: string,
  actualDuration?: number
): Promise<UpdateTaskResult> {
  return updateTask(userId, taskId, {
    status: "completed",
    ...(actualDuration !== undefined ? { actualDuration } : {}),
  });
}

export type DeleteTaskResult =
  | { success: true }
  | { success: false; error: "not_found" };

export async function deleteTask(
  userId: string,
  taskId: string
): Promise<DeleteTaskResult> {
  const { count } = await prisma.task.deleteMany({
    where: { id: taskId, userId },
  });

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  return { success: true };
}
