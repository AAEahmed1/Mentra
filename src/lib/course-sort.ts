/**
 * How the courses inside a term are ordered on the Courses page.
 *
 * The choice travels in the URL (`?sort=code`), like the dashboard's time
 * filter: the page sorts on the server, survives a reload, and a student who
 * thinks in course codes can bookmark it that way.
 */
export const COURSE_SORTS = ["name", "code", "credits"] as const;

export type CourseSort = (typeof COURSE_SORTS)[number];

export const DEFAULT_COURSE_SORT: CourseSort = "name";

export const COURSE_SORT_LABEL: Record<CourseSort, string> = {
  name: "Name",
  code: "Code",
  credits: "Credits",
};

/** A single recognised sort, or the default for anything else. */
export function parseCourseSort(
  value: string | string[] | undefined
): CourseSort {
  return typeof value === "string" &&
    (COURSE_SORTS as readonly string[]).includes(value)
    ? (value as CourseSort)
    : DEFAULT_COURSE_SORT;
}

type SortableCourse = {
  name: string;
  code: string | null;
  credits: number | null;
};

// Numeric-aware and case-insensitive, so "NURS 285" comes before "NURS 302"
// and "anatomy" sits beside "Anatomy".
const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

/**
 * Sorts a copy of `courses`. Name is A to Z; code is A to Z; credits is the
 * heaviest course first, since that is the question credits answer. Courses
 * missing the value being sorted on go last, and ties fall back to the name
 * so the order never depends on the database.
 */
export function sortCourses<T extends SortableCourse>(
  courses: readonly T[],
  sort: CourseSort
): T[] {
  const byName = (a: T, b: T) => collator.compare(a.name, b.name);

  return [...courses].sort((a, b) => {
    if (sort === "code") {
      if (a.code === null || b.code === null) {
        if (a.code !== b.code) return a.code === null ? 1 : -1;
        return byName(a, b);
      }
      return collator.compare(a.code, b.code) || byName(a, b);
    }

    if (sort === "credits") {
      if (a.credits === null || b.credits === null) {
        if (a.credits !== b.credits) return a.credits === null ? 1 : -1;
        return byName(a, b);
      }
      return b.credits - a.credits || byName(a, b);
    }

    return byName(a, b);
  });
}
