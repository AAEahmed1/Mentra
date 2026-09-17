import { prisma } from "@/lib/prisma";
import type { Course } from "@/generated/prisma/client";
import type { CourseInput } from "@/lib/course";
import { isForeignKeyViolation } from "@/lib/services/prisma-errors";

export type CreateCourseResult =
  | { success: true; data: Course }
  | { success: false; error: "not_found" };

export async function createCourse(
  userId: string,
  semesterId: string,
  data: CourseInput
): Promise<CreateCourseResult> {
  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId },
  });

  if (!semester) {
    return { success: false, error: "not_found" };
  }

  try {
    const course = await prisma.course.create({
      data: { ...data, semesterId },
    });
    return { success: true, data: course };
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { success: false, error: "not_found" };
    }
    throw error;
  }
}

export function listCoursesForSemester(
  userId: string,
  semesterId: string
): Promise<Course[]> {
  return prisma.course.findMany({
    where: { semesterId, semester: { userId } },
    orderBy: { name: "asc" },
  });
}

export function listCoursesForUser(userId: string): Promise<Course[]> {
  return prisma.course.findMany({
    where: { semester: { userId } },
    orderBy: { name: "asc" },
  });
}

/**
 * The fields an update may change. `undefined` leaves a field as it is; `null`
 * clears an optional one.
 */
export type CourseUpdate = {
  name?: string;
  code?: string | null;
  professor?: string | null;
  credits?: number | null;
};

export type UpdateCourseResult =
  | { success: true; data: Course }
  | { success: false; error: "not_found" };

export async function updateCourse(
  userId: string,
  courseId: string,
  data: CourseUpdate
): Promise<UpdateCourseResult> {
  const { count } = await prisma.course.updateMany({
    where: { id: courseId, semester: { userId } },
    data,
  });

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, semester: { userId } },
  });
  if (!course) {
    return { success: false, error: "not_found" };
  }

  return { success: true, data: course };
}

export type DeleteCourseResult =
  | { success: true }
  | { success: false; error: "not_found" };

export async function deleteCourse(
  userId: string,
  courseId: string
): Promise<DeleteCourseResult> {
  const { count } = await prisma.course.deleteMany({
    where: { id: courseId, semester: { userId } },
  });

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  return { success: true };
}
