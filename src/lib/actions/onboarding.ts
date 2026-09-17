"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/session";
import { parseOnboardingInput } from "@/lib/onboarding";
import { completeOnboarding } from "@/lib/services/profile";

export type OnboardingActionState = {
  errors: string[];
};

export async function completeOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const userId = await requireUserId();

  const result = parseOnboardingInput({
    program: formData.get("program"),
    institution: formData.get("institution"),
  });

  if (!result.success) {
    return { errors: result.errors };
  }

  await completeOnboarding(userId, result.data);

  // The profile page shows these fields; the dashboard does not.
  revalidatePath("/profile");
  redirect("/courses");
}
