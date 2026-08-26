import { describe, expect, test } from "vitest";
import { parseNoteInput } from "@/lib/note";

const baseInput = {
  title: "Subnetting cheatsheet",
  body: "A /24 gives 254 usable hosts.",
  courseId: null,
};

describe("parseNoteInput", () => {
  test("accepts a title and body with no course", () => {
    const result = parseNoteInput(baseInput);

    expect(result).toEqual({
      success: true,
      data: {
        title: "Subnetting cheatsheet",
        body: "A /24 gives 254 usable hosts.",
        courseId: undefined,
      },
    });
  });

  test("rejects an empty title", () => {
    const result = parseNoteInput({ ...baseInput, title: "" });

    expect(result.success).toBe(false);
  });

  test("rejects an empty body", () => {
    const result = parseNoteInput({ ...baseInput, body: "" });

    expect(result.success).toBe(false);
  });

  test("trims surrounding whitespace from the title", () => {
    const result = parseNoteInput({ ...baseInput, title: "  Cheatsheet  " });

    expect(result.success && result.data.title).toBe("Cheatsheet");
  });

  test("treats a blank courseId as unlinked (undefined)", () => {
    const result = parseNoteInput({ ...baseInput, courseId: "" });

    expect(result.success && result.data.courseId).toBeUndefined();
  });

  test("keeps a provided courseId", () => {
    const result = parseNoteInput({ ...baseInput, courseId: "course_123" });

    expect(result.success && result.data.courseId).toBe("course_123");
  });
});
