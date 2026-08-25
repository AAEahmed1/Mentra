"use server";

import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseOnboardingInput } from "@/lib/onboarding";

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

  await prisma.user.update({
    where: { id: userId },
    data: result.data,
  });

  redirect("/courses");
}
