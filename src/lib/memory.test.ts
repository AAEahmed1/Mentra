import { describe, expect, test } from "vitest";
import { parseMemoryInput } from "@/lib/memory";

const baseInput = {
  content: "Student struggles with subnetting.",
  type: "learning_state",
  source: "explicit",
};

describe("parseMemoryInput", () => {
  test("accepts content with an explicit type and source", () => {
    const result = parseMemoryInput(baseInput);

    expect(result).toEqual({
      success: true,
      data: {
        content: "Student struggles with subnetting.",
        type: "learning_state",
        source: "explicit",
      },
    });
  });

  test("rejects empty content", () => {
    const result = parseMemoryInput({ ...baseInput, content: "" });

    expect(result.success).toBe(false);
  });

  test("trims surrounding whitespace from content", () => {
    const result = parseMemoryInput({ ...baseInput, content: "  Note  " });

    expect(result.success && result.data.content).toBe("Note");
  });

  test("rejects an unknown type", () => {
    const result = parseMemoryInput({ ...baseInput, type: "vibes" });

    expect(result.success).toBe(false);
  });

  test("rejects an unknown source", () => {
    const result = parseMemoryInput({ ...baseInput, source: "guessed" });

    expect(result.success).toBe(false);
  });

  test("defaults source to explicit when omitted", () => {
    const result = parseMemoryInput({ ...baseInput, source: null });

    expect(result.success && result.data.source).toBe("explicit");
  });

  test("requires a type rather than defaulting one", () => {
    const result = parseMemoryInput({ ...baseInput, type: null });

    expect(result.success).toBe(false);
  });
});
