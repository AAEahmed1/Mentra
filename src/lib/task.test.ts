import { describe, expect, test } from "vitest";
import {
  parseTaskCompletion,
  parseTaskInput,
  parseTaskUpdate,
} from "@/lib/task";

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

const editInput = {
  ...baseInput,
  status: null,
  actualDuration: null,
};

describe("parseTaskUpdate", () => {
  test("clears optional fields the student emptied", () => {
    const result = parseTaskUpdate({
      ...editInput,
      description: "",
      dueDate: "",
      estimatedDuration: " ",
      actualDuration: "",
      topicsToReview: "",
      courseId: "",
    });

    expect(result).toEqual({
      success: true,
      data: {
        title: "Network Security Lab",
        description: null,
        dueDate: null,
        priority: "medium",
        estimatedDuration: null,
        actualDuration: null,
        type: "task",
        status: undefined,
        topicsToReview: null,
        courseId: null,
      },
    });
  });

  test("leaves fields missing from the form untouched", () => {
    const result = parseTaskUpdate(editInput);

    expect(result.success && result.data.courseId).toBeUndefined();
    expect(result.success && result.data.dueDate).toBeUndefined();
  });

  test("accepts a known status and actual minutes", () => {
    const result = parseTaskUpdate({
      ...editInput,
      status: "in_progress",
      actualDuration: "95",
    });

    expect(result.success && result.data.status).toBe("in_progress");
    expect(result.success && result.data.actualDuration).toBe(95);
  });

  test("rejects an unknown status instead of passing it to the database", () => {
    const result = parseTaskUpdate({ ...editInput, status: "archived" });

    expect(result).toEqual({ success: false, errors: ["Pick a valid status"] });
  });
});

describe("task limits", () => {
  test("rejects an overlong title", () => {
    const result = parseTaskInput({ ...baseInput, title: "a".repeat(201) });

    expect(result).toEqual({
      success: false,
      errors: ["Title must be 200 characters or fewer"],
    });
  });

  test("rejects fractional and absurd estimates", () => {
    expect(
      parseTaskInput({ ...baseInput, estimatedDuration: "12.5" }).success
    ).toBe(false);
    expect(
      parseTaskInput({ ...baseInput, estimatedDuration: "20000" }).success
    ).toBe(false);
  });
});

describe("parseTaskCompletion", () => {
  test("allows completing without a time", () => {
    expect(parseTaskCompletion({ actualDuration: null })).toEqual({
      success: true,
      data: { actualDuration: undefined },
    });
  });

  test("rejects text instead of recording NaN", () => {
    expect(parseTaskCompletion({ actualDuration: "abc" })).toEqual({
      success: false,
      errors: ["Actual time must be a number"],
    });
  });
});
