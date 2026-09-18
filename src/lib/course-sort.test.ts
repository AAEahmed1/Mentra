import { describe, expect, test } from "vitest";

import { parseCourseSort, sortCourses } from "@/lib/course-sort";

const courses = [
  { name: "Research Methods", code: "NURS 285", credits: 10 },
  { name: "anatomy & Physiology", code: "BIOL 204", credits: 15 },
  { name: "Clinical Pharmacology", code: "NURS 302", credits: 20 },
  { name: "Elective Seminar", code: null, credits: null },
  { name: "Adult Nursing", code: "NURS 310", credits: 20 },
];

const names = (list: typeof courses) => list.map((course) => course.name);

describe("parseCourseSort", () => {
  test("accepts the three sorts", () => {
    expect(parseCourseSort("name")).toBe("name");
    expect(parseCourseSort("code")).toBe("code");
    expect(parseCourseSort("credits")).toBe("credits");
  });

  test("falls back to name for anything else", () => {
    expect(parseCourseSort(undefined)).toBe("name");
    expect(parseCourseSort("professor")).toBe("name");
    expect(parseCourseSort(["code", "credits"])).toBe("name");
  });
});

describe("sortCourses", () => {
  test("sorts by name A to Z, ignoring case", () => {
    expect(names(sortCourses(courses, "name"))).toEqual([
      "Adult Nursing",
      "anatomy & Physiology",
      "Clinical Pharmacology",
      "Elective Seminar",
      "Research Methods",
    ]);
  });

  test("sorts by code with numbers in order, uncoded courses last", () => {
    expect(names(sortCourses(courses, "code"))).toEqual([
      "anatomy & Physiology",
      "Research Methods",
      "Clinical Pharmacology",
      "Adult Nursing",
      "Elective Seminar",
    ]);
  });

  test("sorts by credits heaviest first, ties by name, blanks last", () => {
    expect(names(sortCourses(courses, "credits"))).toEqual([
      "Adult Nursing",
      "Clinical Pharmacology",
      "anatomy & Physiology",
      "Research Methods",
      "Elective Seminar",
    ]);
  });

  test("does not reorder the input", () => {
    const input = [...courses];
    sortCourses(input, "credits");
    expect(input).toEqual(courses);
  });
});
