import type { z } from "zod";

/**
 * How a form field's raw value is read before validation.
 *
 * `FormData.get` returns null when a field is missing from the form and "" when
 * it was left empty. On a create form both mean "not given". On an edit form
 * they differ: an empty field means the student cleared it, while a missing one
 * means the form never offered it and the stored value should stay.
 */

/** Create forms: missing or blank means not given. */
export function blankToUndefined(value: unknown): unknown {
  if (value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

/** Edit forms: missing leaves the value alone, blank clears it. */
export function blankToClear(value: unknown): unknown {
  if (value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

/** Every validation message, in the order the fields were checked. */
export function issueMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

/** Runs a schema and returns the result shape every form action expects. */
export function parseWith<T>(
  schema: z.ZodType<T>,
  input: unknown
): ParseResult<T> {
  const result = schema.safeParse(input);

  if (!result.success) {
    return { success: false, errors: issueMessages(result.error) };
  }

  return { success: true, data: result.data };
}

/** A trimmed string with a readable length limit. */
export function limitMessage(label: string, max: number): string {
  return `${label} must be ${max.toLocaleString("en-US")} characters or fewer`;
}
