import { z } from "zod";

const blankToUndefined = (value: unknown) => {
  if (value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  body: z.string().trim().min(1, "Body is required"),
  courseId: z.preprocess(blankToUndefined, z.string().trim().optional()),
});

export type NoteInput = z.infer<typeof noteSchema>;

export type NoteResult =
  | { success: true; data: NoteInput }
  | { success: false; errors: string[] };

export function parseNoteInput(input: {
  title: FormDataEntryValue | null;
  body: FormDataEntryValue | null;
  courseId: FormDataEntryValue | null;
}): NoteResult {
  const result = noteSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }

  return { success: true, data: result.data };
}
