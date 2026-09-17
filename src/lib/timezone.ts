/**
 * Mentra counts days on the student's calendar, not the server's.
 *
 * Due dates are calendar dates, stored as UTC midnight, and every day
 * calculation (overdue, "due today", the term timeline) compares UTC calendar
 * fields. So instead of teaching each of those functions about time zones, the
 * current instant is converted once into the student's wall-clock time and
 * expressed as a UTC Date: at 21:00 on Wednesday in Toronto, the "clock" is
 * Wednesday 21:00Z. Day arithmetic and UTC formatting then read the student's
 * own date and hour.
 *
 * A clock Date is for comparing and displaying calendar days and hours only.
 * It is not a real instant, so never store it or compare it with timestamps
 * read from the database; convert those with `studentClock` first.
 */

/** Set by the browser; see `TimeZoneSync`. */
export const TIME_ZONE_COOKIE = "mentra-tz";

export const DEFAULT_TIME_ZONE = "UTC";

/** An IANA time zone the runtime understands, or UTC. */
export function resolveTimeZone(value: string | null | undefined): string {
  if (!value) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

/** The wall-clock time in `timeZone` at `instant`, expressed as a UTC Date. */
export function studentClock(instant: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveTimeZone(timeZone),
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(instant);

  const field = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return new Date(
    Date.UTC(
      field("year"),
      field("month") - 1,
      field("day"),
      field("hour"),
      field("minute"),
      field("second"),
      instant.getUTCMilliseconds()
    )
  );
}
