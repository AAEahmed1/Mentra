import { z } from "zod";

import {
  blankToClear,
  blankToUndefined,
  limitMessage,
  parseWith,
  type ParseResult,
} from "@/lib/form-values";

const name = z
  .string({ error: "Name is required" })
  .trim()
  .min(1, "Name is required")
  .max(120, limitMessage("Name", 120));

const code = z.string().trim().max(30, limitMessage("Code", 30));

const professor = z
  .string()
  .trim()
  .max(120, limitMessage("Professor", 120));

const credits = z.coerce
  .number({ error: "Credits must be a number" })
  .int("Credits must be a whole number")
  .nonnegative("Credits cannot be negative")
  .max(999, "Credits must be 999 or fewer");

const courseSchema = z.object({
  name,
  code: z.preprocess(blankToUndefined, code.optional()),
  professor: z.preprocess(blankToUndefined, professor.optional()),
  credits: z.preprocess(blankToUndefined, credits.optional()),
});

/** The edit form: emptying a field clears it. */
const courseUpdateSchema = z.object({
  name,
  code: z.preprocess(blankToClear, code.nullable().optional()),
  professor: z.preprocess(blankToClear, professor.nullable().optional()),
  credits: z.preprocess(blankToClear, credits.nullable().optional()),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type CourseResult = ParseResult<CourseInput>;

type CourseFormFields = {
  name: FormDataEntryValue | null;
  code: FormDataEntryValue | null;
  professor: FormDataEntryValue | null;
  credits: FormDataEntryValue | null;
};

export function parseCourseInput(input: CourseFormFields): CourseResult {
  return parseWith(courseSchema, input);
}

export function parseCourseUpdate(
  input: CourseFormFields
): ParseResult<CourseUpdateInput> {
  return parseWith(courseUpdateSchema, input);
}
