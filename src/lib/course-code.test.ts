import { describe, expect, test } from "vitest";
import { indexTabCode } from "@/lib/course-code";

describe("indexTabCode", () => {
  test("uses the letters of a course code, dropping the number", () => {
    expect(indexTabCode({ code: "CYBR 301", name: "Network Security" })).toBe(
      "CYBR"
    );
  });

  test("handles a code with no space before its number", () => {
    expect(indexTabCode({ code: "CS101", name: "Intro" })).toBe("CS");
  });

  test("falls back to the course name when there is no code", () => {
    expect(indexTabCode({ code: null, name: "Thermodynamics" })).toBe("THER");
  });

  test("builds initials from a multi-word name", () => {
    expect(indexTabCode({ code: null, name: "Network Security Lab" })).toBe(
      "NSL"
    );
  });

  test("caps a long code at four characters", () => {
    expect(indexTabCode({ code: "BIOCHEM 200", name: "Biochemistry" })).toBe(
      "BIOC"
    );
  });

  test("returns null when there is no course at all", () => {
    expect(indexTabCode(null)).toBeNull();
  });
});
