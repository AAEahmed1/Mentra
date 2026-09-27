"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/session";
import { ROW_ACTION_OK, type RowActionResult } from "@/lib/action-state";
import { parseMeetingInput, parseMeetingUpdate } from "@/lib/meeting";
import {
  createMeetings,
  deleteMeeting,
  updateMeeting,
} from "@/lib/services/meeting";

export type MeetingActionState = {
  errors: string[];
};

function readSlotFields(formData: FormData) {
  return {
    kind: formData.get("kind"),
    startTime: formData.get("startTime"),
    durationMinutes: formData.get("durationMinutes"),
    location: formData.get("location"),
  };
}

/** Class times print on the timetable, under each course and on Today. */
function revalidateTimetable() {
  revalidatePath("/timetable");
  revalidatePath("/courses");
  revalidatePath("/dashboard");
}

export async function createMeetingAction(
  _prevState: MeetingActionState,
  formData: FormData
): Promise<MeetingActionState> {
  const userId = await requireUserId();
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) {
    return { errors: ["Pick a course"] };
  }

  const result = parseMeetingInput({
    ...readSlotFields(formData),
    weekdays: formData.getAll("weekday"),
  });
  if (!result.success) {
    return { errors: result.errors };
  }

  const created = await createMeetings(userId, courseId, result.data);
  if (!created.success) {
    return { errors: ["That course no longer exists."] };
  }

  revalidateTimetable();
  return { errors: [] };
}

export async function updateMeetingAction(
  _prevState: MeetingActionState,
  formData: FormData
): Promise<MeetingActionState> {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId") ?? "");

  const result = parseMeetingUpdate({
    ...readSlotFields(formData),
    weekday: formData.get("weekday"),
  });
  if (!result.success) {
    return { errors: result.errors };
  }

  const updated = await updateMeeting(userId, meetingId, result.data);
  if (!updated.success) {
    return { errors: ["That class time no longer exists."] };
  }

  revalidateTimetable();
  return { errors: [] };
}

export async function deleteMeetingAction(
  formData: FormData
): Promise<RowActionResult> {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId") ?? "");

  const deleted = await deleteMeeting(userId, meetingId);
  if (!deleted.success) {
    return { error: "That class time was already removed." };
  }

  revalidateTimetable();
  return ROW_ACTION_OK;
}
