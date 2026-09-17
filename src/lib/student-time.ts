import { cookies } from "next/headers";

import {
  resolveTimeZone,
  studentClock,
  TIME_ZONE_COOKIE,
} from "@/lib/timezone";

/**
 * The student's clock for this request: `now` is their wall-clock time as a
 * UTC Date (see `studentClock`), `timeZone` the zone their browser reported.
 * Until the browser has reported one, both fall back to UTC.
 */
export async function getStudentTime(): Promise<{
  now: Date;
  timeZone: string;
}> {
  const timeZone = resolveTimeZone(
    (await cookies()).get(TIME_ZONE_COOKIE)?.value
  );

  return { now: studentClock(new Date(), timeZone), timeZone };
}
