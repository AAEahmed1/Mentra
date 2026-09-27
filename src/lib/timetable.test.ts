import { describe, expect, test } from "vitest";

import {
  classesToday,
  isoWeekday,
  layoutWeek,
  minuteOfDay,
  pickTerm,
  termRunsOn,
  type TimetableMeeting,
} from "@/lib/timetable";

// 2026-09-26 is a Saturday; 2026-09-28 a Monday. `now` is a student clock:
// its UTC fields are the student's own day and hour.
const saturday = new Date("2026-09-26T10:15:00Z");
const monday = new Date("2026-09-28T13:05:00Z");

const autumn = {
  id: "autumn",
  name: "Autumn 2026",
  startDate: new Date("2026-09-01"),
  endDate: new Date("2026-12-18"),
};
const spring = {
  id: "spring",
  name: "Spring 2027",
  startDate: new Date("2027-01-10"),
  endDate: new Date("2027-05-01"),
};
const lastYear = {
  id: "last",
  name: "Spring 2026",
  startDate: new Date("2026-01-10"),
  endDate: new Date("2026-05-01"),
};

function meeting(
  overrides: Partial<TimetableMeeting> & Pick<TimetableMeeting, "weekday" | "startMinute">
): TimetableMeeting {
  return {
    id: `${overrides.weekday}-${overrides.startMinute}`,
    kind: "lecture",
    durationMinutes: 60,
    location: null,
    course: { id: "c1", name: "Anatomy", code: null, semesterId: "autumn" },
    ...overrides,
  };
}

describe("the student's day and hour", () => {
  test("reads the ISO weekday from the clock", () => {
    expect(isoWeekday(saturday)).toBe(6);
    expect(isoWeekday(monday)).toBe(1);
    expect(isoWeekday(new Date("2026-09-27T23:59:00Z"))).toBe(7);
  });

  test("reads minutes since midnight from the clock", () => {
    expect(minuteOfDay(monday)).toBe(13 * 60 + 5);
  });
});

describe("terms", () => {
  test("a term runs from its first day through its last", () => {
    expect(termRunsOn(autumn, saturday)).toBe(true);
    expect(termRunsOn(autumn, new Date("2026-12-18T22:00:00Z"))).toBe(true);
    expect(termRunsOn(autumn, new Date("2026-12-19T00:00:00Z"))).toBe(false);
  });

  test("shows the term that was asked for", () => {
    expect(pickTerm([autumn, spring], saturday, "spring")).toBe(spring);
  });

  test("otherwise the one running today", () => {
    expect(pickTerm([spring, lastYear, autumn], saturday)).toBe(autumn);
    expect(pickTerm([autumn, spring], saturday, "not-a-term")).toBe(autumn);
  });

  test("between terms, the next one to start", () => {
    const christmas = new Date("2026-12-25T09:00:00Z");
    expect(pickTerm([lastYear, autumn, spring], christmas)).toBe(spring);
  });

  test("after every term, the one that ended last", () => {
    const later = new Date("2027-06-01T09:00:00Z");
    expect(pickTerm([lastYear, spring, autumn], later)).toBe(spring);
  });

  test("no terms, no term", () => {
    expect(pickTerm([], saturday)).toBeNull();
  });
});

describe("classesToday", () => {
  test("lists today's classes from running terms, earliest first", () => {
    const afternoon = meeting({ weekday: 1, startMinute: 840 });
    const morning = meeting({ weekday: 1, startMinute: 540 });
    const tuesday = meeting({ weekday: 2, startMinute: 540 });
    const nextTerm = meeting({
      weekday: 1,
      startMinute: 600,
      course: { id: "c2", name: "Physiology", code: null, semesterId: "spring" },
    });

    expect(
      classesToday([afternoon, tuesday, nextTerm, morning], [autumn, spring], monday)
    ).toEqual([morning, afternoon]);
  });
});

describe("layoutWeek", () => {
  test("spans eight to six when every class fits inside it", () => {
    const layout = layoutWeek([meeting({ weekday: 1, startMinute: 540 })]);

    expect(layout.startMinute).toBe(480);
    expect(layout.endMinute).toBe(1080);
    expect(layout.hours[0]).toBe(480);
    expect(layout.hours).toHaveLength(10);
  });

  test("stretches to whole hours around an early or late class", () => {
    const layout = layoutWeek([
      meeting({ weekday: 1, startMinute: 7 * 60 + 30 }),
      meeting({ weekday: 2, startMinute: 19 * 60, durationMinutes: 90 }),
    ]);

    expect(layout.startMinute).toBe(420);
    expect(layout.endMinute).toBe(21 * 60);
  });

  test("places a class by its share of the day shown", () => {
    const layout = layoutWeek([meeting({ weekday: 1, startMinute: 540 })]);
    const [placed] = layout.days[0].placed;

    // 08:00–18:00 is 600 minutes; 09:00 is 60 in, and it lasts 60.
    expect(placed.topPercent).toBeCloseTo(10);
    expect(placed.heightPercent).toBeCloseTo(10);
    expect(placed.lanes).toBe(1);
  });

  test("shows Monday to Friday always, and the weekend only when it has classes", () => {
    expect(layoutWeek([]).days.map((day) => day.weekday)).toEqual([1, 2, 3, 4, 5]);
    expect(
      layoutWeek([meeting({ weekday: 7, startMinute: 600 })]).days.map((d) => d.weekday)
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test("sets overlapping classes side by side", () => {
    const lecture = meeting({ weekday: 3, startMinute: 540, durationMinutes: 120 });
    const lab = meeting({ weekday: 3, startMinute: 600 });
    const later = meeting({ weekday: 3, startMinute: 720 });

    const wednesday = layoutWeek([later, lab, lecture]).days[2].placed;

    expect(wednesday.map((p) => [p.meeting, p.lane])).toEqual([
      [lecture, 0],
      [lab, 1],
      [later, 0],
    ]);
    expect(wednesday.every((p) => p.lanes === 2)).toBe(true);
  });
});
