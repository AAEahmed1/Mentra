import { describe, expect, test } from "vitest";

import {
  comingUp,
  courseworkFor,
  dayHeading,
  type UpcomingTask,
} from "@/lib/coming-up";

// A Saturday morning on the student's clock.
const now = new Date("2026-09-26T10:00:00Z");

function task(
  overrides: Partial<UpcomingTask> & Pick<UpcomingTask, "id">
): UpcomingTask {
  return {
    title: overrides.id,
    type: "assignment",
    status: "not_started",
    dueDate: null,
    courseId: "c1",
    ...overrides,
  };
}

const due = (day: string) => new Date(`${day}T00:00:00Z`);

describe("dayHeading", () => {
  test("says Today and Tomorrow, then the date", () => {
    expect(dayHeading(0, due("2026-09-26"))).toBe("Today");
    expect(dayHeading(1, due("2026-09-27"))).toBe("Tomorrow");
    expect(dayHeading(3, due("2026-09-29"))).toBe("Tue, Sep 29");
  });
});

describe("comingUp", () => {
  test("groups open work due in the next two weeks by day", () => {
    const quiz = task({ id: "quiz", type: "quiz", dueDate: due("2026-09-29") });
    const essay = task({ id: "essay", dueDate: due("2026-09-26") });
    const exam = task({ id: "exam", type: "exam", dueDate: due("2026-09-29") });

    expect(comingUp([quiz, essay, exam], now)).toEqual([
      { daysUntil: 0, label: "Today", items: [essay] },
      { daysUntil: 3, label: "Tue, Sep 29", items: [exam, quiz] },
    ]);
  });

  test("leaves out finished, undated, overdue and far-off work", () => {
    const tasks = [
      task({ id: "done", status: "completed", dueDate: due("2026-09-27") }),
      task({ id: "dropped", status: "cancelled", dueDate: due("2026-09-27") }),
      task({ id: "someday" }),
      task({ id: "late", dueDate: due("2026-09-25") }),
      task({ id: "far", dueDate: due("2026-10-11") }),
      task({ id: "edge", dueDate: due("2026-10-10") }),
    ];

    expect(comingUp(tasks, now).flatMap((day) => day.items.map((t) => t.id))).toEqual([
      "edge",
    ]);
  });

  test("orders a day's work exams first, then quizzes, assignments and tasks", () => {
    const day = due("2026-09-28");
    const items = comingUp(
      [
        task({ id: "b-task", type: "task", dueDate: day }),
        task({ id: "assignment", type: "assignment", dueDate: day }),
        task({ id: "a-task", type: "task", dueDate: day }),
        task({ id: "quiz", type: "quiz", dueDate: day }),
        task({ id: "exam", type: "exam", dueDate: day }),
      ],
      now
    )[0].items.map((t) => t.id);

    expect(items).toEqual(["exam", "quiz", "assignment", "a-task", "b-task"]);
  });
});

describe("courseworkFor", () => {
  test("lists a course's open work, soonest first and undated last", () => {
    const later = task({ id: "later", dueDate: due("2026-10-20") });
    const sooner = task({ id: "sooner", dueDate: due("2026-09-28") });
    const undated = task({ id: "undated" });
    const other = task({ id: "other", courseId: "c2", dueDate: due("2026-09-27") });
    const done = task({ id: "done", status: "completed", dueDate: due("2026-09-27") });

    expect(courseworkFor([later, undated, other, done, sooner], "c1")).toEqual([
      sooner,
      later,
      undated,
    ]);
  });
});
