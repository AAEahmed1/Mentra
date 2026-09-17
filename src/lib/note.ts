import { z } from "zod";

import {
  blankToClear,
  blankToUndefined,
  limitMessage,
  parseWith,
  type ParseResult,
} from "@/lib/form-values";

const title = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(200, limitMessage("Title", 200));

const body = z
  .string({ error: "Body is required" })
  .trim()
  .min(1, "Body is required")
  .max(20_000, limitMessage("A note", 20_000));

const id = z.string().trim();

const noteSchema = z.object({
  title,
  body,
  courseId: z.preprocess(blankToUndefined, id.optional()),
  taskId: z.preprocess(blankToUndefined, id.optional()),
});

/** The edit form: choosing "No course" or "Not about anything" unfiles it. */
const noteUpdateSchema = z.object({
  title,
  body,
  courseId: z.preprocess(blankToClear, id.nullable().optional()),
  taskId: z.preprocess(blankToClear, id.nullable().optional()),
});

export type NoteInput = z.infer<typeof noteSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
export type NoteResult = ParseResult<NoteInput>;

type NoteFormFields = {
  title: FormDataEntryValue | null;
  body: FormDataEntryValue | null;
  courseId: FormDataEntryValue | null;
  taskId: FormDataEntryValue | null;
};

export function parseNoteInput(input: NoteFormFields): NoteResult {
  return parseWith(noteSchema, input);
}

export function parseNoteUpdate(
  input: NoteFormFields
): ParseResult<NoteUpdateInput> {
  return parseWith(noteUpdateSchema, input);
}
