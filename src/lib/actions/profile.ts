"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import { requireUserId } from "@/lib/session";
import { parsePasswordChangeInput, parseProfileInput } from "@/lib/profile";
import { updateProfile } from "@/lib/services/profile";

export type ProfileActionState = {
  errors: string[];
  saved: boolean;
};

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const userId = await requireUserId();

  const result = parseProfileInput({
    name: formData.get("name"),
    program: formData.get("program"),
    institution: formData.get("institution"),
  });

  if (!result.success) {
    return { errors: result.errors, saved: false };
  }

  await updateProfile(userId, result.data);

  // The name appears in the dashboard greeting, so refresh every page.
  revalidatePath("/", "layout");
  return { errors: [], saved: true };
}

export type PasswordActionState = {
  errors: string[];
  saved: boolean;
};

export async function changePasswordAction(
  _prevState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  await requireUserId();

  const result = parsePasswordChangeInput({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return { errors: result.errors, saved: false };
  }

  try {
    // better-auth checks the current password and hashes the new one. Other
    // devices are signed out, since a password change is often a response to
    // someone else knowing the old one.
    await auth.api.changePassword({
      headers: await headers(),
      body: { ...result.data, revokeOtherSessions: true },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return {
        errors: [
          error.body?.code === "INVALID_PASSWORD"
            ? "Current password is incorrect."
            : (error.body?.message ?? "Couldn't change your password."),
        ],
        saved: false,
      };
    }
    throw error;
  }

  return { errors: [], saved: true };
}
