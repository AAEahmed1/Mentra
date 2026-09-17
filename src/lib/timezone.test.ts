import { describe, expect, test } from "vitest";

import {
  DEFAULT_TIME_ZONE,
  resolveTimeZone,
  studentClock,
} from "@/lib/timezone";

describe("resolveTimeZone", () => {
  test("keeps a valid IANA zone", () => {
    expect(resolveTimeZone("America/Toronto")).toBe("America/Toronto");
  });

  test("falls back to UTC for missing or unknown zones", () => {
    expect(resolveTimeZone(undefined)).toBe(DEFAULT_TIME_ZONE);
    expect(resolveTimeZone("")).toBe(DEFAULT_TIME_ZONE);
    expect(resolveTimeZone("Mars/Olympus_Mons")).toBe(DEFAULT_TIME_ZONE);
  });
});

describe("studentClock", () => {
  test("reads the student's own date and hour west of UTC", () => {
    // 01:30 UTC on Thursday is 21:30 on Wednesday in Toronto (EDT, UTC-4).
    const clock = studentClock(
      new Date("2026-09-17T01:30:00Z"),
      "America/Toronto"
    );

    expect(clock.toISOString()).toBe("2026-09-16T21:30:00.000Z");
  });

  test("reads the next day east of UTC", () => {
    // 20:00 UTC is 05:00 the next day in Tokyo (UTC+9).
    const clock = studentClock(new Date("2026-09-16T20:00:00Z"), "Asia/Tokyo");

    expect(clock.toISOString()).toBe("2026-09-17T05:00:00.000Z");
  });

  test("is the identity in UTC", () => {
    const instant = new Date("2026-09-16T12:34:56.789Z");

    expect(studentClock(instant, "UTC").toISOString()).toBe(
      instant.toISOString()
    );
  });

  test("treats an unknown zone as UTC", () => {
    const instant = new Date("2026-09-16T12:00:00Z");

    expect(studentClock(instant, "Nowhere/Special").toISOString()).toBe(
      instant.toISOString()
    );
  });

  test("uses 00 rather than 24 for midnight", () => {
    const clock = studentClock(
      new Date("2026-09-17T04:00:00Z"),
      "America/Toronto"
    );

    expect(clock.toISOString()).toBe("2026-09-17T00:00:00.000Z");
  });
});
