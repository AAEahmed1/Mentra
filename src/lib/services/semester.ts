import { prisma } from "@/lib/prisma";
import type { Semester } from "@/generated/prisma/client";
import type { SemesterInput } from "@/lib/semester";
import { isForeignKeyViolation } from "@/lib/services/prisma-errors";

export function createSemester(
  userId: string,
  data: SemesterInput
): Promise<Semester> {
  return prisma.semester.create({
    data: { ...data, userId },
  });
}

export function listSemestersForUser(userId: string): Promise<Semester[]> {
  return prisma.semester.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
  });
}

export type UpdateSemesterResult =
  | { success: true; data: Semester }
  | { success: false; error: "not_found" };

export async function updateSemester(
  userId: string,
  semesterId: string,
  data: Partial<SemesterInput>
): Promise<UpdateSemesterResult> {
  const { count } = await prisma.semester.updateMany({
    where: { id: semesterId, userId },
    data,
  });

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId },
  });
  if (!semester) {
    return { success: false, error: "not_found" };
  }

  return { success: true, data: semester };
}

export type DeleteSemesterResult =
  | { success: true }
  | { success: false; error: "not_found" | "has_courses" };

export async function deleteSemester(
  userId: string,
  semesterId: string
): Promise<DeleteSemesterResult> {
  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId },
    include: { _count: { select: { courses: true } } },
  });

  if (!semester) {
    return { success: false, error: "not_found" };
  }

  if (semester._count.courses > 0) {
    return { success: false, error: "has_courses" };
  }

  try {
    await prisma.semester.deleteMany({ where: { id: semesterId, userId } });
  } catch (error) {
    // A course added in the moment since the count: the database's restrict
    // key refuses the delete, which is exactly the answer the count gives.
    if (isForeignKeyViolation(error)) {
      return { success: false, error: "has_courses" };
    }
    throw error;
  }
  return { success: true };
}
