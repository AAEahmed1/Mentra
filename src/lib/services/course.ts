import { prisma } from "@/lib/prisma";
import type { Course } from "@/generated/prisma/client";
import type { CourseInput } from "@/lib/course";

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

  const course = await prisma.course.create({
    data: { ...data, semesterId },
  });

  return { success: true, data: course };
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

export type UpdateCourseResult =
  | { success: true; data: Course }
  | { success: false; error: "not_found" };

export async function updateCourse(
  userId: string,
  courseId: string,
  data: Partial<CourseInput>
): Promise<UpdateCourseResult> {
  const { count } = await prisma.course.updateMany({
    where: { id: courseId, semester: { userId } },
    data,
  });

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
  });

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
