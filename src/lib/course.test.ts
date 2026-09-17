import { describe, expect, test } from "vitest";
import { parseCourseInput, parseCourseUpdate } from "@/lib/course";

describe("parseCourseInput", () => {
  test("accepts a name with optional code, professor, and credits", () => {
    const result = parseCourseInput({
      name: "Network Security",
      code: "CYBR 301",
      professor: "Dr. Ada Lovelace",
      credits: "3",
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "Network Security",
        code: "CYBR 301",
        professor: "Dr. Ada Lovelace",
        credits: 3,
      },
    });
  });

  test("treats blank code, professor, and credits as skipped", () => {
    const result = parseCourseInput({
      name: "Network Security",
      code: "",
      professor: "",
      credits: "",
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "Network Security",
        code: undefined,
        professor: undefined,
        credits: undefined,
      },
    });
  });

  test("rejects an empty name", () => {
    const result = parseCourseInput({
      name: "",
      code: null,
      professor: null,
      credits: null,
    });

    expect(result.success).toBe(false);
  });

  test("trims surrounding whitespace from the name", () => {
    const result = parseCourseInput({
      name: "  Network Security  ",
      code: null,
      professor: null,
      credits: null,
    });

    expect(result.success && result.data.name).toBe("Network Security");
  });

  test("rejects a non-numeric credits value", () => {
    const result = parseCourseInput({
      name: "Network Security",
      code: null,
      professor: null,
      credits: "three",
    });

    expect(result.success).toBe(false);
  });
});

describe("course numbers and edits", () => {
  test("rejects negative and fractional credits", () => {
    const base = { name: "Anatomy", code: null, professor: null };

    expect(parseCourseInput({ ...base, credits: "-3" })).toEqual({
      success: false,
      errors: ["Credits cannot be negative"],
    });
    expect(parseCourseInput({ ...base, credits: "3.5" })).toEqual({
      success: false,
      errors: ["Credits must be a whole number"],
    });
  });

  test("clears code, professor and credits emptied on the edit form", () => {
    expect(
      parseCourseUpdate({
        name: "Anatomy",
        code: "",
        professor: "",
        credits: "",
      })
    ).toEqual({
      success: true,
      data: { name: "Anatomy", code: null, professor: null, credits: null },
    });
  });
});
