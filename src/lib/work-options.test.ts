import { describe, expect, test } from "vitest";
import { toWorkOptions } from "@/lib/work-options";
import type { RankableTask } from "@/lib/recommendations";

const now = new Date("2026-09-10T12:00:00Z");
const courses = new Map([["c1", "Clinical Pharmacology"]]);

type PickableTask = RankableTask & { courseId: string | null };

function task(overrides: Partial<PickableTask> & { id: string }): PickableTask {
  return {
    title: overrides.id,
    status: "not_started",
    priority: "medium",
    dueDate: null,
    estimatedDuration: null,
    courseId: null,
    ...overrides,
  };
}

describe("toWorkOptions", () => {
  test("leaves out completed work, which is rarely what a note is about", () => {
    const options = toWorkOptions(
      [task({ id: "done", status: "completed" }), task({ id: "open" })],
      courses,
      now
    );

    expect(options.map((option) => option.id)).toEqual(["open"]);
  });

  test("leaves out cancelled work", () => {
    const options = toWorkOptions(
      [task({ id: "dropped", status: "cancelled" }), task({ id: "open" })],
      courses,
      now
    );

    expect(options.map((option) => option.id)).toEqual(["open"]);
  });

  test("puts the soonest deadline first so the likely target is near the top", () => {
    const options = toWorkOptions(
      [
        task({ id: "later", dueDate: new Date("2026-09-20") }),
        task({ id: "sooner", dueDate: new Date("2026-09-11") }),
      ],
      courses,
      now
    );

    expect(options.map((option) => option.id)).toEqual(["sooner", "later"]);
  });

  test("puts undated work last rather than treating it as urgent", () => {
    const options = toWorkOptions(
      [task({ id: "undated" }), task({ id: "dated", dueDate: new Date("2026-09-20") })],
      courses,
      now
    );

    expect(options.map((option) => option.id)).toEqual(["dated", "undated"]);
  });

  test("names the course and the due state so a title alone need not identify it", () => {
    const [option] = toWorkOptions(
      [task({ id: "t", courseId: "c1", dueDate: new Date("2026-09-11T12:00:00Z") })],
      courses,
      now
    );

    expect(option.detail).toBe("Clinical Pharmacology · due tomorrow");
  });

  test("counts overdue work in days over", () => {
    const [option] = toWorkOptions(
      [task({ id: "t", dueDate: new Date("2026-09-07T12:00:00Z") })],
      courses,
      now
    );

    expect(option.detail).toBe("3 days over");
  });

  test("says so when work has no deadline", () => {
    const [option] = toWorkOptions([task({ id: "t" })], courses, now);

    expect(option.detail).toBe("no deadline");
  });

  test("measures the due state in calendar days, not elapsed hours", () => {
    // Due later today: hours-based arithmetic would call this overdue.
    const [option] = toWorkOptions(
      [task({ id: "t", dueDate: new Date("2026-09-10T09:00:00Z") })],
      courses,
      now
    );

    expect(option.detail).toBe("due today");
  });
});
