import { prisma } from "@/lib/prisma";
import type { CourseMeeting } from "@/generated/prisma/client";
import type { MeetingInput, MeetingUpdateInput } from "@/lib/meeting";
import { isForeignKeyViolation } from "@/lib/services/prisma-errors";

export type MeetingWithCourse = CourseMeeting & {
  course: { id: string; name: string; code: string | null; semesterId: string };
};

type NotFound = { success: false; error: "not_found" };
const NOT_FOUND: NotFound = { success: false, error: "not_found" };

/** A meeting is this student's when its course's term is. */
function ownedBy(userId: string) {
  return { course: { semester: { userId } } };
}

/**
 * One row per weekday ticked, written together: a Monday/Wednesday lecture
 * that saved only its Monday would be a timetable that quietly lies.
 */
export async function createMeetings(
  userId: string,
  courseId: string,
  input: MeetingInput
): Promise<{ success: true; data: CourseMeeting[] } | NotFound> {
  const owned = await prisma.course.count({
    where: { id: courseId, semester: { userId } },
  });
  if (owned === 0) return NOT_FOUND;

  const { weekdays, ...slot } = input;
  try {
    const data = await prisma.$transaction(
      weekdays.map((weekday) =>
        prisma.courseMeeting.create({ data: { ...slot, weekday, courseId } })
      )
    );
    return { success: true, data };
  } catch (error) {
    // The course was removed between the check and the write.
    if (isForeignKeyViolation(error)) return NOT_FOUND;
    throw error;
  }
}

export function listMeetingsForUser(userId: string): Promise<MeetingWithCourse[]> {
  return prisma.courseMeeting.findMany({
    where: ownedBy(userId),
    include: {
      course: { select: { id: true, name: true, code: true, semesterId: true } },
    },
    orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
  });
}

export async function updateMeeting(
  userId: string,
  meetingId: string,
  data: MeetingUpdateInput
): Promise<{ success: true } | NotFound> {
  const { count } = await prisma.courseMeeting.updateMany({
    where: { id: meetingId, ...ownedBy(userId) },
    data,
  });
  return count === 0 ? NOT_FOUND : { success: true };
}

export async function deleteMeeting(
  userId: string,
  meetingId: string
): Promise<{ success: true } | NotFound> {
  const { count } = await prisma.courseMeeting.deleteMany({
    where: { id: meetingId, ...ownedBy(userId) },
  });
  return count === 0 ? NOT_FOUND : { success: true };
}
