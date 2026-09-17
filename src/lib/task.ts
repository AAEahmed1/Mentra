import { z } from "zod";

import {
  blankToClear,
  blankToUndefined,
  limitMessage,
  parseWith,
  type ParseResult,
} from "@/lib/form-values";

export const TASK_STATUSES = [
  "not_started",
  "in_progress",
  "paused",
  "completed",
  "cancelled",
] as const;

/** A week of minutes. No single piece of work is planned for longer. */
export const MAX_TASK_MINUTES = 10_080;

const title = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(200, limitMessage("Title", 200));

const description = z
  .string()
  .trim()
  .max(2000, limitMessage("Description", 2000));

const dueDate = z.coerce.date({ error: "Due date must be a valid date" });

function minutes(label: string) {
  return z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number of minutes`)
    .nonnegative(`${label} cannot be negative`)
    .max(MAX_TASK_MINUTES, `${label} can be at most a week`);
}

const topicsToReview = z
  .string()
  .trim()
  .max(1000, limitMessage("Topics to review", 1000));

const id = z.string().trim();

const priority = z.preprocess(
  blankToUndefined,
  z.enum(["low", "medium", "high"], { error: "Pick a priority" }).default("medium")
);

const type = z.preprocess(
  blankToUndefined,
  z.enum(["task", "assignment", "exam"], { error: "Pick a type" }).default("task")
);

const taskSchema = z.object({
  title,
  description: z.preprocess(blankToUndefined, description.optional()),
  dueDate: z.preprocess(blankToUndefined, dueDate.optional()),
  priority,
  estimatedDuration: z.preprocess(
    blankToUndefined,
    minutes("Estimated duration").optional()
  ),
  type,
  topicsToReview: z.preprocess(blankToUndefined, topicsToReview.optional()),
  courseId: z.preprocess(blankToUndefined, id.optional()),
});

/**
 * The edit form. Optional fields the student empties become null so the
 * stored value is cleared; see `blankToClear`.
 */
const taskUpdateSchema = z.object({
  title,
  description: z.preprocess(blankToClear, description.nullable().optional()),
  dueDate: z.preprocess(blankToClear, dueDate.nullable().optional()),
  priority,
  estimatedDuration: z.preprocess(
    blankToClear,
    minutes("Estimated duration").nullable().optional()
  ),
  actualDuration: z.preprocess(
    blankToClear,
    minutes("Actual time").nullable().optional()
  ),
  type,
  status: z.preprocess(
    blankToUndefined,
    z.enum(TASK_STATUSES, { error: "Pick a valid status" }).optional()
  ),
  topicsToReview: z.preprocess(
    blankToClear,
    topicsToReview.nullable().optional()
  ),
  courseId: z.preprocess(blankToClear, id.nullable().optional()),
});

const completionSchema = z.object({
  actualDuration: z.preprocess(
    blankToUndefined,
    minutes("Actual time").optional()
  ),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskResult = ParseResult<TaskInput>;

type TaskFormFields = {
  title: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  dueDate: FormDataEntryValue | null;
  priority: FormDataEntryValue | null;
  estimatedDuration: FormDataEntryValue | null;
  type: FormDataEntryValue | null;
  topicsToReview: FormDataEntryValue | null;
  courseId: FormDataEntryValue | null;
};

export function parseTaskInput(input: TaskFormFields): TaskResult {
  return parseWith(taskSchema, input);
}

export function parseTaskUpdate(
  input: TaskFormFields & {
    status: FormDataEntryValue | null;
    actualDuration: FormDataEntryValue | null;
  }
): ParseResult<TaskUpdateInput> {
  return parseWith(taskUpdateSchema, input);
}

export function parseTaskCompletion(input: {
  actualDuration: FormDataEntryValue | null;
}): ParseResult<z.infer<typeof completionSchema>> {
  return parseWith(completionSchema, input);
}
