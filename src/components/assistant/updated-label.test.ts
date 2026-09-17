import { describe, expect, test } from "vitest";

import { updatedLabel } from "@/components/assistant/updated-label";
import { studentClock } from "@/lib/timezone";

const TORONTO = "America/Toronto";

describe("updatedLabel", () => {
  test("calls a chat from late last night Yesterday, though under 24 hours ago", () => {
    // 23:00 Tuesday and 08:00 Wednesday in Toronto (EDT, UTC-4).
    const updatedAt = new Date("2026-09-16T03:00:00Z");
    const now = studentClock(new Date("2026-09-16T12:00:00Z"), TORONTO);

    expect(updatedLabel(updatedAt, now, TORONTO)).toBe("Yesterday");
  });

  test("calls a chat from earlier on the student's day Today, whatever the UTC date", () => {
    // 21:30 Wednesday in Toronto is already Thursday in UTC.
    const updatedAt = new Date("2026-09-16T13:00:00Z");
    const now = studentClock(new Date("2026-09-17T01:30:00Z"), TORONTO);

    expect(updatedLabel(updatedAt, now, TORONTO)).toBe("Today");
  });

  test("gives an older chat its date on the student's calendar", () => {
    // 22:00 on 10 September in Toronto is 11 September in UTC.
    const updatedAt = new Date("2026-09-11T02:00:00Z");
    const now = studentClock(new Date("2026-09-16T12:00:00Z"), TORONTO);

    expect(updatedLabel(updatedAt, now, TORONTO)).toBe("Sep 10");
  });
});
