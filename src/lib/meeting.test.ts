import { describe, expect, test } from "vitest";

import {
  describeMeeting,
  formatClockTime,
  parseClockTime,
  parseMeetingInput,
  parseMeetingUpdate,
  weekdayLabel,
} from "@/lib/meeting";

const valid = {
  kind: "lecture",
  weekdays: ["1", "3"],
  startTime: "09:30",
  durationMinutes: "80",
  location: "Room 204",
};

describe("clock times", () => {
  test("reads HH:MM as minutes since midnight", () => {
    expect(parseClockTime("00:00")).toBe(0);
    expect(parseClockTime("09:30")).toBe(570);
    expect(parseClockTime("23:59")).toBe(1439);
  });

  test("refuses anything that is not a real time of day", () => {
    expect(parseClockTime("24:00")).toBeNull();
    expect(parseClockTime("9:30")).toBeNull();
    expect(parseClockTime("09:60")).toBeNull();
    expect(parseClockTime("")).toBeNull();
  });

  test("writes minutes back as the HH:MM a time input takes", () => {
    expect(formatClockTime(570)).toBe("09:30");
    expect(formatClockTime(0)).toBe("00:00");
    expect(formatClockTime(1440)).toBe("24:00");
  });
});

describe("weekdays", () => {
  test("names ISO weekdays, Monday first", () => {
    expect(weekdayLabel(1, "short")).toBe("Mon");
    expect(weekdayLabel(7, "long")).toBe("Sunday");
  });
});

describe("parseMeetingInput", () => {
  test("accepts a slot on several days", () => {
    expect(parseMeetingInput(valid)).toEqual({
      success: true,
      data: {
        kind: "lecture",
        weekdays: [1, 3],
        startMinute: 570,
        durationMinutes: 80,
        location: "Room 204",
      },
    });
  });

  test("defaults the kind to lecture and skips a blank location", () => {
    const result = parseMeetingInput({ ...valid, kind: "", location: "" });

    expect(result.success && result.data.kind).toBe("lecture");
    expect(result.success && result.data.location).toBeUndefined();
  });

  test("drops a day ticked twice and orders the days", () => {
    const result = parseMeetingInput({ ...valid, weekdays: ["5", "2", "5"] });

    expect(result.success && result.data.weekdays).toEqual([2, 5]);
  });

  test("needs at least one day", () => {
    expect(parseMeetingInput({ ...valid, weekdays: [] })).toEqual({
      success: false,
      errors: ["Pick at least one day"],
    });
  });

  test("refuses a day that does not exist", () => {
    const result = parseMeetingInput({ ...valid, weekdays: ["8"] });

    expect(result.success).toBe(false);
  });

  test("needs a real start time", () => {
    expect(parseMeetingInput({ ...valid, startTime: "" })).toEqual({
      success: false,
      errors: ["Start time is required"],
    });
    expect(parseMeetingInput({ ...valid, startTime: "25:00" })).toEqual({
      success: false,
      errors: ["Start time must be a time such as 09:30"],
    });
  });

  test("keeps the duration between five minutes and twelve hours", () => {
    expect(parseMeetingInput({ ...valid, durationMinutes: "" })).toEqual({
      success: false,
      errors: ["A class lasts at least 5 minutes"],
    });
    expect(parseMeetingInput({ ...valid, durationMinutes: "721" })).toEqual({
      success: false,
      errors: ["A class lasts at most 12 hours"],
    });
  });

  test("refuses a class that runs past midnight", () => {
    expect(
      parseMeetingInput({ ...valid, startTime: "23:00", durationMinutes: "90" })
    ).toEqual({ success: false, errors: ["A class must end by midnight"] });
  });
});

describe("parseMeetingUpdate", () => {
  test("takes a single day and clears an emptied location", () => {
    expect(
      parseMeetingUpdate({
        kind: "lab",
        weekday: "4",
        startTime: "14:00",
        durationMinutes: "120",
        location: "",
      })
    ).toEqual({
      success: true,
      data: {
        kind: "lab",
        weekday: 4,
        startMinute: 840,
        durationMinutes: 120,
        location: null,
      },
    });
  });
});

describe("describeMeeting", () => {
  test("reads as day, time range, kind and place", () => {
    expect(
      describeMeeting({
        kind: "lab",
        weekday: 2,
        startMinute: 840,
        durationMinutes: 110,
        location: "Lab B",
      })
    ).toBe("Tue 14:00–15:50 · Lab · Lab B");
  });

  test("leaves out a place that was not given", () => {
    expect(
      describeMeeting({
        kind: "lecture",
        weekday: 1,
        startMinute: 540,
        durationMinutes: 50,
        location: null,
      })
    ).toBe("Mon 09:00–09:50 · Lecture");
  });
});
