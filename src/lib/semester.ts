import { z } from "zod";

const semesterSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    startDate: z.coerce.date({ error: "Start date is required" }),
    endDate: z.coerce.date({ error: "End date is required" }),
  })
  .refine((data) => data.endDate > data.startDate, {
    error: "End date must be after the start date",
    path: ["endDate"],
  });

export type SemesterInput = z.infer<typeof semesterSchema>;

export type SemesterResult =
  | { success: true; data: SemesterInput }
  | { success: false; errors: string[] };

export function parseSemesterInput(input: {
  name: FormDataEntryValue | null;
  startDate: FormDataEntryValue | null;
  endDate: FormDataEntryValue | null;
}): SemesterResult {
  const result = semesterSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }

  return { success: true, data: result.data };
}
