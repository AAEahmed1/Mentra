import { z } from "zod";

import {
  blankToUndefined,
  limitMessage,
  parseWith,
  type ParseResult,
} from "@/lib/form-values";

const semesterSchema = z
  .object({
    name: z
      .string({ error: "Name is required" })
      .trim()
      .min(1, "Name is required")
      .max(120, limitMessage("Name", 120)),
    // Blank and missing both read as not given, so a missing field reports
    // "required" instead of coercing null to 1 January 1970.
    startDate: z.preprocess(
      blankToUndefined,
      z.coerce.date({ error: "Start date is required" })
    ),
    endDate: z.preprocess(
      blankToUndefined,
      z.coerce.date({ error: "End date is required" })
    ),
  })
  .refine((data) => data.endDate > data.startDate, {
    error: "End date must be after the start date",
    path: ["endDate"],
  });

export type SemesterInput = z.infer<typeof semesterSchema>;
export type SemesterResult = ParseResult<SemesterInput>;

export function parseSemesterInput(input: {
  name: FormDataEntryValue | null;
  startDate: FormDataEntryValue | null;
  endDate: FormDataEntryValue | null;
}): SemesterResult {
  return parseWith(semesterSchema, input);
}
