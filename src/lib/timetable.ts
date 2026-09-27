import type { MeetingKindValue } from "@/lib/meeting";
import { calendarDaysUntil } from "@/lib/task-status";

/**
 * The rules behind the timetable and "Classes today".
 *
 * Every `now` here is a student clock (see `studentClock`): its UTC fields are
 * the student's own date and time, which is also how class times are stored.
 */

export type TimetableMeeting = {
  id: string;
  kind: MeetingKindValue;
  weekday: number;
  startMinute: number;
  durationMinutes: number;
  location: string | null;
  course: { id: string; name: string; code: string | null; semesterId: string };
};

export type TimetableTerm = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
};

/** 1 for Monday through 7 for Sunday. */
export function isoWeekday(now: Date): number {
  return ((now.getUTCDay() + 6) % 7) + 1;
}

export function minuteOfDay(now: Date): number {
  return now.getUTCHours() * 60 + now.getUTCMinutes();
}

/** A term runs every day from its start date through its end date. */
export function termRunsOn(term: TimetableTerm, now: Date): boolean {
  return (
    calendarDaysUntil(term.startDate, now) <= 0 &&
    calendarDaysUntil(term.endDate, now) >= 0
  );
}

/**
 * Which term's week to show: the one asked for, else the one running, else
 * the next to start (the break before a term is when a timetable gets
 * entered), else the one that ended last.
 */
export function pickTerm<T extends TimetableTerm>(
  terms: T[],
  now: Date,
  requestedId?: string
): T | null {
  const requested = requestedId && terms.find((term) => term.id === requestedId);
  if (requested) return requested;

  const running = terms.find((term) => termRunsOn(term, now));
  if (running) return running;

  const [next] = terms
    .filter((term) => calendarDaysUntil(term.startDate, now) > 0)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  if (next) return next;

  const [latest] = [...terms].sort(
    (a, b) => b.endDate.getTime() - a.endDate.getTime()
  );
  return latest ?? null;
}

/** Today's classes, earliest first, from terms that are running today. */
export function classesToday<M extends TimetableMeeting>(
  meetings: M[],
  terms: TimetableTerm[],
  now: Date
): M[] {
  const running = new Set(
    terms.filter((term) => termRunsOn(term, now)).map((term) => term.id)
  );
  const today = isoWeekday(now);

  return meetings
    .filter(
      (meeting) =>
        meeting.weekday === today && running.has(meeting.course.semesterId)
    )
    .sort((a, b) => a.startMinute - b.startMinute);
}

export type PlacedMeeting<M> = {
  meeting: M;
  /** Which column within the day, when classes overlap. */
  lane: number;
  /** How many columns the day is split into. */
  lanes: number;
  topPercent: number;
  heightPercent: number;
};

export type WeekLayout<M> = {
  startMinute: number;
  endMinute: number;
  /** The minute each hour line is drawn at. */
  hours: number[];
  days: { weekday: number; placed: PlacedMeeting<M>[] }[];
};

const DAY_STARTS = 8 * 60;
const DAY_ENDS = 18 * 60;
const WEEKDAYS_ALWAYS_SHOWN = [1, 2, 3, 4, 5];

/**
 * Where each class sits on the week grid.
 *
 * The day shown runs 08:00 to 18:00, stretched to whole hours around any
 * class outside it, so an ordinary week does not open on empty early hours.
 * Classes that overlap share their day's width in lanes, first come first
 * served, rather than printing over one another.
 */
export function layoutWeek<M extends TimetableMeeting>(meetings: M[]): WeekLayout<M> {
  const earliest = Math.min(DAY_STARTS, ...meetings.map((m) => m.startMinute));
  const latest = Math.max(
    DAY_ENDS,
    ...meetings.map((m) => m.startMinute + m.durationMinutes)
  );
  const startMinute = Math.floor(earliest / 60) * 60;
  const endMinute = Math.min(1440, Math.ceil(latest / 60) * 60);
  const span = endMinute - startMinute;

  const hours: number[] = [];
  for (let minute = startMinute; minute < endMinute; minute += 60) {
    hours.push(minute);
  }

  const hasWeekendClass = meetings.some((m) => m.weekday === 6 || m.weekday === 7);
  const weekdays = [
    ...WEEKDAYS_ALWAYS_SHOWN,
    ...(hasWeekendClass ? [6, 7] : []),
  ];

  const days = weekdays.map((weekday) => {
    const sorted = meetings
      .filter((m) => m.weekday === weekday)
      .sort(
        (a, b) =>
          a.startMinute - b.startMinute || b.durationMinutes - a.durationMinutes
      );

    const laneEnds: number[] = [];
    const withLanes = sorted.map((meeting) => {
      let lane = laneEnds.findIndex((end) => end <= meeting.startMinute);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = meeting.startMinute + meeting.durationMinutes;
      return { meeting, lane };
    });
    const lanes = Math.max(1, laneEnds.length);

    return {
      weekday,
      placed: withLanes.map(({ meeting, lane }) => ({
        meeting,
        lane,
        lanes,
        topPercent: ((meeting.startMinute - startMinute) / span) * 100,
        heightPercent: (meeting.durationMinutes / span) * 100,
      })),
    };
  });

  return { startMinute, endMinute, hours, days };
}
