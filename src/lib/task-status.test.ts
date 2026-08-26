import { describe, expect, test } from "vitest";
import { getEffectiveStatus } from "@/lib/task-status";

const now = new Date("2026-09-10T12:00:00Z");
const yesterday = new Date("2026-09-09T12:00:00Z");
const tomorrow = new Date("2026-09-11T12:00:00Z");

describe("getEffectiveStatus", () => {
  test("returns overdue when not_started and due date has passed", () => {
    expect(getEffectiveStatus("not_started", yesterday, now)).toBe("overdue");
  });

  test("returns overdue when in_progress and due date has passed", () => {
    expect(getEffectiveStatus("in_progress", yesterday, now)).toBe("overdue");
  });

  test("returns overdue when paused and due date has passed", () => {
    expect(getEffectiveStatus("paused", yesterday, now)).toBe("overdue");
  });

  test("returns the real status when due date is in the future", () => {
    expect(getEffectiveStatus("not_started", tomorrow, now)).toBe(
      "not_started"
    );
  });

  test("returns the real status when there is no due date", () => {
    expect(getEffectiveStatus("in_progress", null, now)).toBe("in_progress");
  });

  test("never reports completed tasks as overdue, even past their due date", () => {
    expect(getEffectiveStatus("completed", yesterday, now)).toBe("completed");
  });

  test("never reports cancelled tasks as overdue, even past their due date", () => {
    expect(getEffectiveStatus("cancelled", yesterday, now)).toBe("cancelled");
  });

  test("a due date exactly at the current moment is not yet overdue", () => {
    expect(getEffectiveStatus("not_started", now, now)).toBe("not_started");
  });
});
