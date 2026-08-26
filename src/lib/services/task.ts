import { prisma } from "@/lib/prisma";
import type { Task, TaskStatus } from "@/generated/prisma/client";
import type { TaskInput } from "@/lib/task";

export type CreateTaskResult =
  | { success: true; data: Task }
  | { success: false; error: "course_not_found" };

export async function createTask(
  userId: string,
  data: TaskInput
): Promise<CreateTaskResult> {
  if (data.courseId) {
    const course = await prisma.course.findFirst({
      where: { id: data.courseId, semester: { userId } },
    });
    if (!course) {
      return { success: false, error: "course_not_found" };
    }
  }

  const task = await prisma.task.create({
    data: { ...data, userId },
  });

  return { success: true, data: task };
}

export function listTasksForUser(userId: string): Promise<Task[]> {
  return prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export type UpdateTaskResult =
  | { success: true; data: Task }
  | { success: false; error: "not_found" };

export async function updateTask(
  userId: string,
  taskId: string,
  data: Partial<TaskInput> & { status?: TaskStatus }
): Promise<UpdateTaskResult> {
  const { count } = await prisma.task.updateMany({
    where: { id: taskId, userId },
    data,
  });

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
  });

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
