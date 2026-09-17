import { z } from "zod";

import {
  blankToUndefined,
  limitMessage,
  parseWith,
  type ParseResult,
} from "@/lib/form-values";

const memorySchema = z.object({
  content: z
    .string({ error: "Content is required" })
    .trim()
    .min(1, "Content is required")
    .max(1000, limitMessage("A memory", 1000)),
  type: z.enum(["profile", "commitment", "learning_state", "behavioral"], {
    error: "Pick a memory type",
  }),
  source: z.preprocess(
    blankToUndefined,
    z.enum(["explicit", "inferred"]).default("explicit")
  ),
});

export type MemoryInput = z.infer<typeof memorySchema>;
export type MemoryResult = ParseResult<MemoryInput>;

export function parseMemoryInput(input: {
  content: FormDataEntryValue | null;
  type: FormDataEntryValue | null;
  source: FormDataEntryValue | null;
}): MemoryResult {
  return parseWith(memorySchema, input);
}
