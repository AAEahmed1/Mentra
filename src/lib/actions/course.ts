"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/session";
import { ROW_ACTION_OK, type RowActionResult } from "@/lib/action-state";
import { parseCourseInput, parseCourseUpdate } from "@/lib/course";
import { createCourse, deleteCourse, updateCourse } from "@/lib/services/course";

export type CourseActionState = {
  errors: string[];
};

function readCourseFormFields(formData: FormData) {
  return {
    name: formData.get("name"),
    code: formData.get("code"),
    professor: formData.get("professor"),
    credits: formData.get("credits"),
  };
}

/**
 * Course names label work on Today, rows on Work and notes on Notes, and a
 * removed course unfiles all of them, so every one of those pages refreshes.
 */
function revalidateCourses() {
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/notes");
}

export async function createCourseAction(
  _prevState: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  const userId = await requireUserId();
  const semesterId = String(formData.get("semesterId") ?? "");

  const result = parseCourseInput(readCourseFormFields(formData));
  if (!result.success) {
    return { errors: result.errors };
  }

  const created = await createCourse(userId, semesterId, result.data);
  if (!created.success) {
    return { errors: ["That term no longer exists."] };
  }

  revalidateCourses();
  return { errors: [] };
}

export async function updateCourseAction(
  _prevState: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  const userId = await requireUserId();
  const courseId = String(formData.get("courseId") ?? "");

  const result = parseCourseUpdate(readCourseFormFields(formData));
  if (!result.success) {
    return { errors: result.errors };
  }

  const updated = await updateCourse(userId, courseId, result.data);
  if (!updated.success) {
    return { errors: ["That course no longer exists."] };
  }

  revalidateCourses();
  return { errors: [] };
}

export async function deleteCourseAction(
  formData: FormData
): Promise<RowActionResult> {
  const userId = await requireUserId();
  const courseId = String(formData.get("courseId") ?? "");

  const deleted = await deleteCourse(userId, courseId);
  if (!deleted.success) {
    return { error: "That course was already removed." };
  }

  revalidateCourses();
  return ROW_ACTION_OK;
}
