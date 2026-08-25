import { prisma } from "@/lib/prisma";
import type { Semester } from "@/generated/prisma/client";
import type { SemesterInput } from "@/lib/semester";

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

  const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: semesterId },
  });

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

  await prisma.semester.delete({ where: { id: semesterId } });
  return { success: true };
}
