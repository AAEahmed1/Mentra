"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/session";
import { parseSemesterInput } from "@/lib/semester";
import {
  createSemester,
  deleteSemester,
} from "@/lib/services/semester";

export type SemesterActionState = {
  errors: string[];
};

export async function createSemesterAction(
  _prevState: SemesterActionState,
  formData: FormData
): Promise<SemesterActionState> {
  const userId = await requireUserId();

  const result = parseSemesterInput({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!result.success) {
    return { errors: result.errors };
  }

  await createSemester(userId, result.data);
  revalidatePath("/courses");

  return { errors: [] };
}

export type DeleteSemesterActionState = {
  error: string | null;
};

export async function deleteSemesterAction(
  _prevState: DeleteSemesterActionState,
  formData: FormData
): Promise<DeleteSemesterActionState> {
  const userId = await requireUserId();
  const semesterId = String(formData.get("semesterId") ?? "");

  const result = await deleteSemester(userId, semesterId);

  if (!result.success) {
    return {
      error:
        result.error === "has_courses"
          ? "Remove its courses before deleting this semester."
          : "Semester not found.",
    };
  }

  revalidatePath("/courses");
  return { error: null };
}
