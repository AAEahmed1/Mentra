import { z } from "zod";

import {
  blankToUndefined,
  limitMessage,
  parseWith,
  type ParseResult,
} from "@/lib/form-values";

// The same limits the profile page applies to these fields.
const onboardingSchema = z.object({
  program: z.preprocess(
    blankToUndefined,
    z.string().trim().max(120, limitMessage("Program", 120)).optional()
  ),
  institution: z.preprocess(
    blankToUndefined,
    z.string().trim().max(120, limitMessage("Institution", 120)).optional()
  ),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type OnboardingResult = ParseResult<OnboardingInput>;

export function parseOnboardingInput(input: {
  program: FormDataEntryValue | null;
  institution: FormDataEntryValue | null;
}): OnboardingResult {
  return parseWith(onboardingSchema, input);
}
