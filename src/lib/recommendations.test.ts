import { describe, expect, test } from "vitest";
import { rankTasks, type RankableTask } from "@/lib/recommendations";

const now = new Date("2026-09-10T12:00:00Z");

function task(overrides: Partial<RankableTask> & { id: string }): RankableTask {
  return {
    title: overrides.id,
    status: "not_started",
    priority: "medium",
    dueDate: null,
    estimatedDuration: null,
    ...overrides,
  };
}

const rankedIds = (tasks: RankableTask[], availableMinutes?: number) =>
  rankTasks(tasks, { now, availableMinutes }).map((entry) => entry.task.id);

describe("rankTasks — urgency", () => {
  test("puts an overdue task ahead of one due later", () => {
    const overdue = task({ id: "overdue", dueDate: new Date("2026-09-08") });
    const upcoming = task({ id: "upcoming", dueDate: new Date("2026-09-20") });

    expect(rankedIds([upcoming, overdue])).toEqual(["overdue", "upcoming"]);
  });

  test("orders the most overdue task first", () => {
    const slightly = task({ id: "slightly", dueDate: new Date("2026-09-09") });
    const badly = task({ id: "badly", dueDate: new Date("2026-09-01") });

    expect(rankedIds([slightly, badly])).toEqual(["badly", "slightly"]);
  });

  test("puts a task due tomorrow ahead of a high-priority task due in three weeks", () => {
    const tomorrow = task({
      id: "tomorrow",
      dueDate: new Date("2026-09-11"),
      priority: "low",
    });
    const distant = task({
      id: "distant",
      dueDate: new Date("2026-10-01"),
      priority: "high",
    });

    expect(rankedIds([distant, tomorrow])).toEqual(["tomorrow", "distant"]);
  });

  test("puts a task with no due date last", () => {
    const someday = task({ id: "someday", priority: "high" });
    const dated = task({
      id: "dated",
      dueDate: new Date("2026-10-01"),
      priority: "low",
    });

    expect(rankedIds([someday, dated])).toEqual(["dated", "someday"]);
  });
});

describe("rankTasks — priority and deadline", () => {
  test("ranks higher priority first when urgency is comparable", () => {
    const low = task({ id: "low", dueDate: new Date("2026-09-11"), priority: "low" });
    const high = task({ id: "high", dueDate: new Date("2026-09-11"), priority: "high" });

    expect(rankedIds([low, high])).toEqual(["high", "low"]);
  });

  test("breaks a priority tie with the earlier deadline", () => {
    const later = task({ id: "later", dueDate: new Date("2026-09-12") });
    const sooner = task({ id: "sooner", dueDate: new Date("2026-09-11") });

    expect(rankedIds([later, sooner])).toEqual(["sooner", "later"]);
  });
});

describe("rankTasks — available time", () => {
  test("deprioritizes a task that will not fit the time available", () => {
    const tooLong = task({
      id: "tooLong",
      dueDate: new Date("2026-09-11"),
      priority: "high",
      estimatedDuration: 180,
    });
    const fits = task({
      id: "fits",
      dueDate: new Date("2026-09-11"),
      priority: "low",
      estimatedDuration: 20,
    });

    expect(rankedIds([tooLong, fits], 30)).toEqual(["fits", "tooLong"]);
  });

  test("keeps a task that does not fit rather than dropping it", () => {
    const tooLong = task({
      id: "tooLong",
      dueDate: new Date("2026-09-11"),
      estimatedDuration: 180,
    });

    expect(rankedIds([tooLong], 30)).toEqual(["tooLong"]);
  });

  test("ignores available time when the student has not said how long they have", () => {
    const tooLong = task({
      id: "tooLong",
      dueDate: new Date("2026-09-11"),
      priority: "high",
      estimatedDuration: 180,
    });
    const short = task({
      id: "short",
      dueDate: new Date("2026-09-11"),
      priority: "low",
      estimatedDuration: 20,
    });

    expect(rankedIds([short, tooLong])).toEqual(["tooLong", "short"]);
  });

  test("treats a task with no estimate as fitting", () => {
    const unknown = task({
      id: "unknown",
      dueDate: new Date("2026-09-11"),
      priority: "low",
    });
    const tooLong = task({
      id: "tooLong",
      dueDate: new Date("2026-09-11"),
      priority: "high",
      estimatedDuration: 180,
    });

    expect(rankedIds([unknown, tooLong], 30)).toEqual(["unknown", "tooLong"]);
  });
});

describe("rankTasks — what it excludes", () => {
  test("leaves out completed tasks", () => {
    const done = task({ id: "done", status: "completed", dueDate: new Date("2026-09-01") });
    const open = task({ id: "open", dueDate: new Date("2026-09-20") });

    expect(rankedIds([done, open])).toEqual(["open"]);
  });

  test("leaves out cancelled tasks", () => {
    const dropped = task({ id: "dropped", status: "cancelled", dueDate: new Date("2026-09-01") });
    const open = task({ id: "open", dueDate: new Date("2026-09-20") });

    expect(rankedIds([dropped, open])).toEqual(["open"]);
  });

  test("keeps paused and in-progress tasks", () => {
    const paused = task({ id: "paused", status: "paused", dueDate: new Date("2026-09-11") });
    const active = task({ id: "active", status: "in_progress", dueDate: new Date("2026-09-12") });

    expect(rankedIds([paused, active])).toEqual(["paused", "active"]);
  });
});

describe("rankTasks — explanation factors", () => {
  test("reports a task as overdue", () => {
    const overdue = task({ id: "overdue", dueDate: new Date("2026-09-08") });

    expect(rankTasks([overdue], { now })[0].factors.urgency).toBe("overdue");
  });

  test("reports how many days remain for an upcoming task", () => {
    const upcoming = task({ id: "upcoming", dueDate: new Date("2026-09-13T12:00:00Z") });

    expect(rankTasks([upcoming], { now })[0].factors.daysUntilDue).toBe(3);
  });

  test("flags a task that does not fit the time available", () => {
    const tooLong = task({ id: "tooLong", estimatedDuration: 180 });

    const [entry] = rankTasks([tooLong], { now, availableMinutes: 30 });
    expect(entry.factors.fitsAvailableTime).toBe(false);
  });

  test("does not judge fit when no available time was given", () => {
    const anything = task({ id: "anything", estimatedDuration: 180 });

    const [entry] = rankTasks([anything], { now });
    expect(entry.factors.fitsAvailableTime).toBeNull();
  });
});
