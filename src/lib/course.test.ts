import { describe, expect, test } from "vitest";
import { parseCourseInput } from "@/lib/course";

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
