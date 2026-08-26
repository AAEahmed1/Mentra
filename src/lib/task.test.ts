import { describe, expect, test } from "vitest";
import { parseTaskInput } from "@/lib/task";

const baseInput = {
  title: "Network Security Lab",
  description: null,
  dueDate: null,
  priority: null,
  estimatedDuration: null,
  type: null,
  topicsToReview: null,
  courseId: null,
};

describe("parseTaskInput", () => {
  test("accepts a title with everything else blank, defaulting priority and type", () => {
    const result = parseTaskInput(baseInput);

    expect(result).toEqual({
      success: true,
      data: {
        title: "Network Security Lab",
        description: undefined,
        dueDate: undefined,
        priority: "medium",
        estimatedDuration: undefined,
        type: "task",
        topicsToReview: undefined,
        courseId: undefined,
      },
    });
  });

  test("rejects an empty title", () => {
    const result = parseTaskInput({ ...baseInput, title: "" });

    expect(result.success).toBe(false);
  });

  test("trims surrounding whitespace from the title", () => {
    const result = parseTaskInput({ ...baseInput, title: "  Lab  " });

    expect(result.success && result.data.title).toBe("Lab");
  });

  test("parses a due date string into a Date", () => {
    const result = parseTaskInput({ ...baseInput, dueDate: "2026-09-03" });

    expect(result.success && result.data.dueDate).toEqual(
      new Date("2026-09-03")
    );
  });

  test("accepts an explicit priority", () => {
    const result = parseTaskInput({ ...baseInput, priority: "high" });

    expect(result.success && result.data.priority).toBe("high");
  });

  test("rejects an invalid priority", () => {
    const result = parseTaskInput({ ...baseInput, priority: "urgent" });

    expect(result.success).toBe(false);
  });

  test("accepts an explicit type", () => {
    const result = parseTaskInput({ ...baseInput, type: "exam" });

    expect(result.success && result.data.type).toBe("exam");
  });

  test("rejects a negative estimated duration", () => {
    const result = parseTaskInput({ ...baseInput, estimatedDuration: "-5" });

    expect(result.success).toBe(false);
  });

  test("coerces a numeric estimated duration string", () => {
    const result = parseTaskInput({ ...baseInput, estimatedDuration: "55" });

    expect(result.success && result.data.estimatedDuration).toBe(55);
  });

  test("treats a blank courseId as unlinked (undefined)", () => {
    const result = parseTaskInput({ ...baseInput, courseId: "" });

    expect(result.success && result.data.courseId).toBeUndefined();
  });

  test("keeps a provided courseId", () => {
    const result = parseTaskInput({ ...baseInput, courseId: "course_123" });

    expect(result.success && result.data.courseId).toBe("course_123");
  });
});
