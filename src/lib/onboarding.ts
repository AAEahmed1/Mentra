import { z } from "zod";

const blankToUndefined = (value: unknown) => {
  if (value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const onboardingSchema = z.object({
  program: z.preprocess(blankToUndefined, z.string().trim().optional()),
  institution: z.preprocess(blankToUndefined, z.string().trim().optional()),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export type OnboardingResult =
  | { success: true; data: OnboardingInput }
  | { success: false; errors: string[] };

export function parseOnboardingInput(input: {
  program: FormDataEntryValue | null;
  institution: FormDataEntryValue | null;
}): OnboardingResult {
  const result = onboardingSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }

  return { success: true, data: result.data };
}
