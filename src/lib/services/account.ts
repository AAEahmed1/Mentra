import { prisma } from "@/lib/prisma";

/**
 * Permanently deletes a student's account and everything hanging off it.
 *
 * The order matters and is not merely defensive: `Course.semester` is
 * `onDelete: Restrict` (ticket 02, so a semester can't silently take its
 * courses with it), which means deleting the user does NOT cascade through
 * Semester -> Course. Courses must go before semesters or Postgres rejects the
 * delete with a `course_semesterId_fkey` violation.
 *
 * Every other table cascades from the user: sessions, sign-in accounts,
 * conversations and their messages go with the user row. Notes, work and
 * memories cascade too, but are deleted explicitly first so the order reads
 * top-down, from what hangs off courses to the user itself.
 *
 * Wrapped in a transaction so a failure part-way leaves the account intact
 * rather than half-deleted.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.note.deleteMany({ where: { userId } }),
    prisma.task.deleteMany({ where: { userId } }),
    prisma.memory.deleteMany({ where: { userId } }),
    prisma.course.deleteMany({ where: { semester: { userId } } }),
    prisma.semester.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
