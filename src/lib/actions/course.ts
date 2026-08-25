"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/session";
import { parseCourseInput } from "@/lib/course";
import { createCourse, deleteCourse, updateCourse } from "@/lib/services/course";

export type CourseActionState = {
  errors: string[];
};

export async function createCourseAction(
  _prevState: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  const userId = await requireUserId();
  const semesterId = String(formData.get("semesterId") ?? "");

  const result = parseCourseInput({
    name: formData.get("name"),
    code: formData.get("code"),
    professor: formData.get("professor"),
    credits: formData.get("credits"),
  });

  if (!result.success) {
    return { errors: result.errors };
  }

  const created = await createCourse(userId, semesterId, result.data);
  if (!created.success) {
    return { errors: ["Semester not found."] };
  }

  revalidatePath("/courses");
  return { errors: [] };
}

export async function updateCourseAction(
  _prevState: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  const userId = await requireUserId();
  const courseId = String(formData.get("courseId") ?? "");

  const result = parseCourseInput({
    name: formData.get("name"),
    code: formData.get("code"),
    professor: formData.get("professor"),
    credits: formData.get("credits"),
  });

  if (!result.success) {
    return { errors: result.errors };
  }

  const updated = await updateCourse(userId, courseId, result.data);
  if (!updated.success) {
    return { errors: ["Course not found."] };
  }

  revalidatePath("/courses");
  return { errors: [] };
}

export async function deleteCourseAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const courseId = String(formData.get("courseId") ?? "");

  await deleteCourse(userId, courseId);
  revalidatePath("/courses");
}
