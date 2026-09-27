import { z } from "zod";

import {
  blankToClear,
  blankToUndefined,
  limitMessage,
  parseWith,
  type ParseResult,
} from "@/lib/form-values";

/**
 * A class time is a weekday and a time of day on the student's own wall
 * clock. It is never converted between time zones: see CourseMeeting in
 * schema.prisma and src/lib/timezone.ts.
 */

/** ISO weekdays, Monday first, as a timetable reads. */
export const WEEKDAYS = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 7, short: "Sun", long: "Sunday" },
] as const;

export function weekdayLabel(weekday: number, style: "short" | "long"): string {
  return WEEKDAYS.find((day) => day.value === weekday)?.[style] ?? "";
}

export const MEETING_KINDS = [
  "lecture",
  "lab",
  "tutorial",
  "seminar",
  "other",
] as const;

export type MeetingKindValue = (typeof MEETING_KINDS)[number];

export const MEETING_KIND_LABELS: Record<MeetingKindValue, string> = {
  lecture: "Lecture",
  lab: "Lab",
  tutorial: "Tutorial",
  seminar: "Seminar",
  other: "Class",
};

export const MINUTES_PER_DAY = 1440;

/** "09:30" as minutes since midnight, or null if it is not a time of day. */
export function parseClockTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minutes since midnight as "09:30", which is also what a time input takes. */
export function formatClockTime(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

type DescribableMeeting = {
  kind: MeetingKindValue;
  weekday: number;
  startMinute: number;
  durationMinutes: number;
  location: string | null;
};

/** "Tue 14:00–15:50 · Lab · Lab B" — one class time in a line. */
export function describeMeeting(meeting: DescribableMeeting): string {
  const range = `${formatClockTime(meeting.startMinute)}–${formatClockTime(
    meeting.startMinute + meeting.durationMinutes
  )}`;
  return [
    `${weekdayLabel(meeting.weekday, "short")} ${range}`,
    MEETING_KIND_LABELS[meeting.kind],
    meeting.location,
  ]
    .filter(Boolean)
    .join(" · ");
}

const kind = z.preprocess(
  blankToUndefined,
  z.enum(MEETING_KINDS, { error: "Pick a kind of class" }).default("lecture")
);

const weekday = z.coerce
  .number({ error: "Pick a day" })
  .int("Pick a day")
  .min(1, "Pick a day")
  .max(7, "Pick a day");

const startMinute = z.preprocess(
  blankToUndefined,
  z
    .string({ error: "Start time is required" })
    .transform((value, context) => {
      const minute = parseClockTime(value);
      if (minute === null) {
        context.addIssue({
          code: "custom",
          message: "Start time must be a time such as 09:30",
        });
        return z.NEVER;
      }
      return minute;
    })
);

// Blank or missing coerces to 0, which the minimum turns into a sentence that
// says what is wanted rather than "must be a number".
const durationMinutes = z.coerce
  .number({ error: "Duration must be a number" })
  .int("Duration must be a whole number of minutes")
  .min(5, "A class lasts at least 5 minutes")
  .max(720, "A class lasts at most 12 hours");

const location = z.string().trim().max(120, limitMessage("Location", 120));

function endsByMidnight(slot: { startMinute: number; durationMinutes: number }) {
  return slot.startMinute + slot.durationMinutes <= MINUTES_PER_DAY;
}

const midnight = {
  message: "A class must end by midnight",
  path: ["durationMinutes"],
};

const meetingSchema = z
  .object({
    kind,
    weekdays: z
      .array(weekday)
      .min(1, "Pick at least one day")
      // Ticking a day twice is one class, not two.
      .transform((days) => [...new Set(days)].sort((a, b) => a - b)),
    startMinute,
    durationMinutes,
    location: z.preprocess(blankToUndefined, location.optional()),
  })
  .refine(endsByMidnight, midnight);

/** The edit form changes one row, so one day. */
const meetingUpdateSchema = z
  .object({
    kind,
    weekday,
    startMinute,
    durationMinutes,
    location: z.preprocess(blankToClear, location.nullable().optional()),
  })
  .refine(endsByMidnight, midnight);

export type MeetingInput = z.infer<typeof meetingSchema>;
export type MeetingUpdateInput = z.infer<typeof meetingUpdateSchema>;

export type MeetingFormFields = {
  kind: FormDataEntryValue | null;
  weekdays: FormDataEntryValue[];
  startTime: FormDataEntryValue | null;
  durationMinutes: FormDataEntryValue | null;
  location: FormDataEntryValue | null;
};

export function parseMeetingInput(
  input: MeetingFormFields
): ParseResult<MeetingInput> {
  return parseWith(meetingSchema, {
    kind: input.kind,
    weekdays: input.weekdays,
    startMinute: input.startTime,
    durationMinutes: input.durationMinutes,
    location: input.location,
  });
}

export function parseMeetingUpdate(
  input: Omit<MeetingFormFields, "weekdays"> & {
    weekday: FormDataEntryValue | null;
  }
): ParseResult<MeetingUpdateInput> {
  return parseWith(meetingUpdateSchema, {
    kind: input.kind,
    weekday: input.weekday,
    startMinute: input.startTime,
    durationMinutes: input.durationMinutes,
    location: input.location,
  });
}
