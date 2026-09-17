import { describe, expect, test } from "vitest";
import { parseSemesterInput } from "@/lib/semester";

describe("parseSemesterInput", () => {
  test("accepts a name with a valid start/end date range", () => {
    const result = parseSemesterInput({
      name: "Fall 2026",
      startDate: "2026-09-01",
      endDate: "2026-12-15",
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "Fall 2026",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-12-15"),
      },
    });
  });

  test("rejects an empty name", () => {
    const result = parseSemesterInput({
      name: "",
      startDate: "2026-09-01",
      endDate: "2026-12-15",
    });

    expect(result.success).toBe(false);
  });

  test("trims surrounding whitespace from the name", () => {
    const result = parseSemesterInput({
      name: "  Fall 2026  ",
      startDate: "2026-09-01",
      endDate: "2026-12-15",
    });

    expect(result.success && result.data.name).toBe("Fall 2026");
  });

  test("rejects a missing start date", () => {
    const result = parseSemesterInput({
      name: "Fall 2026",
      startDate: "",
      endDate: "2026-12-15",
    });

    expect(result.success).toBe(false);
  });

  test("rejects an invalid date string", () => {
    const result = parseSemesterInput({
      name: "Fall 2026",
      startDate: "not-a-date",
      endDate: "2026-12-15",
    });

    expect(result.success).toBe(false);
  });

  test("rejects an end date that is before the start date", () => {
    const result = parseSemesterInput({
      name: "Fall 2026",
      startDate: "2026-12-15",
      endDate: "2026-09-01",
    });

    expect(result).toEqual({
      success: false,
      errors: ["End date must be after the start date"],
    });
  });
});

describe("missing semester dates", () => {
  test("a date field absent from the form is required, not 1 January 1970", () => {
    const result = parseSemesterInput({
      name: "Fall 2026",
      startDate: null,
      endDate: "2026-12-15",
    });

    expect(result).toEqual({
      success: false,
      errors: ["Start date is required"],
    });
  });
});
