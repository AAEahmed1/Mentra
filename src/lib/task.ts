import { z } from "zod";

const blankToUndefined = (value: unknown) => {
  if (value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.preprocess(blankToUndefined, z.string().trim().optional()),
  dueDate: z.preprocess(
    blankToUndefined,
    z.coerce.date({ error: "Due date must be a valid date" }).optional()
  ),
  priority: z.preprocess(
    blankToUndefined,
    z.enum(["low", "medium", "high"]).default("medium")
  ),
  estimatedDuration: z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: "Estimated duration must be a number" })
      .int()
      .nonnegative("Estimated duration cannot be negative")
      .optional()
  ),
  type: z.preprocess(
    blankToUndefined,
    z.enum(["task", "assignment", "exam"]).default("task")
  ),
  topicsToReview: z.preprocess(
    blankToUndefined,
    z.string().trim().optional()
  ),
  courseId: z.preprocess(blankToUndefined, z.string().trim().optional()),
});

export type TaskInput = z.infer<typeof taskSchema>;

export type TaskResult =
  | { success: true; data: TaskInput }
  | { success: false; errors: string[] };

export function parseTaskInput(input: {
  title: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  dueDate: FormDataEntryValue | null;
  priority: FormDataEntryValue | null;
  estimatedDuration: FormDataEntryValue | null;
  type: FormDataEntryValue | null;
  topicsToReview: FormDataEntryValue | null;
  courseId: FormDataEntryValue | null;
}): TaskResult {
  const result = taskSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }

  return { success: true, data: result.data };
}
