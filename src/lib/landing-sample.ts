import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import {
  rankTasks,
  type RankableTask,
  type RankedTask,
} from "@/lib/recommendations";

/**
 * The example term printed on the landing page.
 *
 * It is not a screenshot and not a mock-up: the same ranking that orders a
 * student's dashboard orders this, from example work dated relative to
 * whoever is reading. Today's mark is really today. What a visitor sees is
 * what the product does, with nothing to sign in for yet.
 *
 * The student is in architecture — a field with studio reviews, models and
 * problem sets — on purpose. The demo seed is a nursing student and the
 * builder studies cybersecurity; the landing page is the third field, so no
 * single program quietly becomes the one Mentra is "for".
 */

export type SampleTask = RankableTask & { courseId: string | null };

export type SampleCourse = { id: string; name: string };

const DAY = 86_400_000;

const COURSES: readonly SampleCourse[] = [
  { id: "studio", name: "Design Studio 3" },
  { id: "structures", name: "Structures I" },
  { id: "history", name: "Architectural History" },
  { id: "environment", name: "Environmental Systems" },
  { id: "fabrication", name: "Digital Fabrication" },
];

type SampleSeed = {
  id: string;
  title: string;
  courseId: string | null;
  /** Days from today; negative has slipped, null has no date. */
  due: number | null;
  minutes: number | null;
  priority: TaskPriority;
  status?: TaskStatus;
};

/**
 * Chosen so the edition shows every state the marks can take: one entry has
 * slipped (the oxblood plate, and the band prints in it), one is due today
 * (the green plate), the rest are on track, one has no course, and the
 * estimates range eight-fold so length visibly means duration.
 */
const SEEDS: readonly SampleSeed[] = [
  {
    id: "problem-set",
    title: "Structures problem set 4",
    courseId: "structures",
    due: -2,
    minutes: 90,
    priority: "medium",
  },
  {
    id: "pin-up",
    title: "Studio review pin-up",
    courseId: "studio",
    due: 0,
    minutes: 120,
    priority: "high",
    status: "in_progress",
  },
  {
    id: "precedent",
    title: "Precedent essay draft",
    courseId: "history",
    due: 3,
    minutes: 150,
    priority: "medium",
  },
  {
    id: "site-model",
    title: "Laser-cut site model",
    courseId: "fabrication",
    due: 6,
    minutes: 180,
    priority: "high",
  },
  {
    id: "daylight-quiz",
    title: "Daylighting quiz",
    courseId: "environment",
    due: 10,
    minutes: 60,
    priority: "medium",
  },
  {
    id: "reading",
    title: "Reading: Rossi, chapter 2",
    courseId: "history",
    due: 14,
    minutes: 45,
    priority: "low",
  },
  {
    id: "portfolio",
    title: "Portfolio photographs",
    courseId: null,
    due: 19,
    minutes: 40,
    priority: "low",
  },
  {
    id: "locker",
    title: "Renew studio locker",
    courseId: null,
    due: null,
    minutes: 10,
    priority: "low",
  },
];

/** Midnight UTC, `offsetDays` from now — the same day basis the app counts on. */
function dateFrom(now: Date, offsetDays: number): Date {
  const date = new Date(now.getTime() + offsetDays * DAY);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function buildSampleTerm(now: Date): {
  courses: readonly SampleCourse[];
  tasks: SampleTask[];
  ranked: RankedTask<SampleTask>[];
  courseNameById: Map<string, string>;
} {
  const tasks: SampleTask[] = SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    courseId: seed.courseId,
    status: seed.status ?? "not_started",
    priority: seed.priority,
    dueDate: seed.due === null ? null : dateFrom(now, seed.due),
    estimatedDuration: seed.minutes,
  }));

  return {
    courses: COURSES,
    tasks,
    ranked: rankTasks(tasks, { now }),
    courseNameById: new Map(COURSES.map((course) => [course.id, course.name])),
  };
}
