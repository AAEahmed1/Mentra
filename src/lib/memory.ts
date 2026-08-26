import { z } from "zod";

const blankToUndefined = (value: unknown) => {
  if (value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const memorySchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
  type: z.enum(["profile", "commitment", "learning_state", "behavioral"], {
    error: "Pick a memory type",
  }),
  source: z.preprocess(
    blankToUndefined,
    z.enum(["explicit", "inferred"]).default("explicit")
  ),
});

export type MemoryInput = z.infer<typeof memorySchema>;

export type MemoryResult =
  | { success: true; data: MemoryInput }
  | { success: false; errors: string[] };

export function parseMemoryInput(input: {
  content: FormDataEntryValue | null;
  type: FormDataEntryValue | null;
  source: FormDataEntryValue | null;
}): MemoryResult {
  const result = memorySchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }

  return { success: true, data: result.data };
}
