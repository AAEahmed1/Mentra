import { z } from "zod";

const blankToUndefined = (value: unknown) => {
  if (value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const courseSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  code: z.preprocess(blankToUndefined, z.string().trim().optional()),
  professor: z.preprocess(blankToUndefined, z.string().trim().optional()),
  credits: z.preprocess(
    blankToUndefined,
    z.coerce.number({ error: "Credits must be a number" }).int().optional()
  ),
});

export type CourseInput = z.infer<typeof courseSchema>;

export type CourseResult =
  | { success: true; data: CourseInput }
  | { success: false; errors: string[] };

export function parseCourseInput(input: {
  name: FormDataEntryValue | null;
  code: FormDataEntryValue | null;
  professor: FormDataEntryValue | null;
  credits: FormDataEntryValue | null;
}): CourseResult {
  const result = courseSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }

  return { success: true, data: result.data };
}
