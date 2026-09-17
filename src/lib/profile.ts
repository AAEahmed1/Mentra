import { z } from "zod";

/**
 * Unlike onboarding, where a blank field means "skip", a blank field on the
 * profile page means "clear it" — so blanks become null, which Prisma writes.
 */
const blankToNull = (value: unknown) => {
  if (value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
};

const profileSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  program: z.preprocess(
    blankToNull,
    z
      .string()
      .trim()
      .max(120, "Program must be 120 characters or fewer")
      .nullable(),
  ),
  institution: z.preprocess(
    blankToNull,
    z
      .string()
      .trim()
      .max(120, "Institution must be 120 characters or fewer")
      .nullable(),
  ),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export type ProfileResult =
  { success: true; data: ProfileInput } | { success: false; errors: string[] };

export function parseProfileInput(input: {
  name: FormDataEntryValue | null;
  program: FormDataEntryValue | null;
  institution: FormDataEntryValue | null;
}): ProfileResult {
  const result = profileSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }

  return { success: true, data: result.data };
}

/** better-auth's default bounds; the server enforces them again. */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string({ error: "Enter your current password" })
      .min(1, "Enter your current password"),
    newPassword: z
      .string({ error: "Enter a new password" })
      .min(
        MIN_PASSWORD_LENGTH,
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      )
      .max(
        MAX_PASSWORD_LENGTH,
        `New password must be ${MAX_PASSWORD_LENGTH} characters or fewer`,
      ),
    confirmPassword: z.string({ error: "Confirm your new password" }),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((input) => input.newPassword !== input.currentPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

export type PasswordChangeResult =
  | {
      success: true;
      data: { currentPassword: string; newPassword: string };
    }
  | { success: false; errors: string[] };

export function parsePasswordChangeInput(input: {
  currentPassword: FormDataEntryValue | null;
  newPassword: FormDataEntryValue | null;
  confirmPassword: FormDataEntryValue | null;
}): PasswordChangeResult {
  const result = passwordChangeSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }

  return {
    success: true,
    data: {
      currentPassword: result.data.currentPassword,
      newPassword: result.data.newPassword,
    },
  };
}
