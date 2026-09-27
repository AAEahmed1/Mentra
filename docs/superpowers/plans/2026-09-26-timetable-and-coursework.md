# Timetable and Coursework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a student give each course its weekly class times, see them as a week timetable, expand any course on the Courses page to add coursework (quizzes, assignments, exams) against it, and see today's classes and the next two weeks of coursework on Today.

**Architecture:** A new `CourseMeeting` model holds one weekly slot per row (course, weekday, start minute, duration, kind, location), always read as wall-clock time on the student's own calendar, the same way due dates already are. Coursework is not a new model: it is the existing `Task` filed under a course, with a new `quiz` type. Pure functions in `src/lib/meeting.ts`, `src/lib/timetable.ts` and `src/lib/coming-up.ts` hold every rule and are unit-tested; services, server actions and components follow the existing course/task pattern exactly. The assistant gains one read tool, `get_timetable`, and can file quizzes.

**Tech Stack:** Next.js 16.3 (App Router, server components + server actions), React 19, Prisma 7 on Postgres (`prisma dev` locally), zod 4, Tailwind 4, Vitest 4.

**Spec:** No separate spec document. The requirements are the user's request plus the decisions they made when asked, recorded in "Decisions" below. Executors read that section as the spec.

## Decisions (the spec)

1. **Class times are weekly slots.** A course has any number of meetings. Each has a kind (lecture, lab, tutorial, seminar, other), a weekday, a start time, a duration in minutes and an optional location. The add form lets the student tick several days at once and creates one row per day. A slot repeats every week of the course's term. No one-off sessions.
2. **The timetable is a new page, `/timetable`,** with its own sidebar entry, showing a Monday–Sunday week grid for one term (the running term by default, switchable with `?term=<id>`). Class times can be added there (with a course picker) and from each course on the Courses page.
3. **Coursework reuses Work items (`Task`).** Add a `quiz` value to `TaskType`. Coursework added from a course is a `Task` with that `courseId`, so it also appears on Work, is ranked on Today, and is visible to the assistant. No due time is added: due dates stay calendar dates.
4. **Each course on the Courses page expands** to show its class times (add, edit, remove) and its open coursework (list plus a quick add form).
5. **Today gains two sections:** "Classes today" (today's meetings from the term that is running, in time order) and "Coming up" (open work due from today through 14 days ahead, grouped by day).
6. **The assistant can read the timetable** through a new `get_timetable` tool, and `create_task` accepts `type: "quiz"`. It cannot create, edit or delete class times.

## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js code (AGENTS.md: "This is NOT the Next.js you know"). Page props use the generated global `PageProps<"/route">` type, as `src/app/courses/page.tsx` does.
- Every new table needs `ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;` in its migration. `src/lib/services/rls.test.ts` fails otherwise.
- Every service takes `userId` first and proves ownership through `course.semester.userId`. Never trust an id from a form.
- Times of day are stored as whole minutes since midnight (`0`–`1439`) on the student's wall clock. Never convert them with a time zone. Compare them with the student clock `now` from `getStudentTime()`, reading `getUTCHours()`/`getUTCMinutes()`/`getUTCDay()` (see `src/lib/timezone.ts`).
- Weekdays are ISO numbers: `1` = Monday … `7` = Sunday.
- Any change under `src/lib/ai/` updates `ASSISTANT.md` in the same commit (AGENTS.md).
- Any change that makes `docs/` untrue updates the relevant page in the same commit (AGENTS.md).
- Any change to a page's appearance retakes that page's screenshot in `docs/screenshots/` in the same change.
- Code comments, commit messages and docs are plain English prose, matching the existing voice (explain *why*, not *what*).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Before a task is reported done: `npm test` passes, `npx tsc --noEmit` passes, `npm run lint` passes, and any UI change has been driven in the running app (preview config `mentra-dev` in `.claude/launch.json`). Local Postgres runs through `prisma dev` (instances `mentra` and `mentra-test`), never Docker: `npx prisma dev start mentra mentra-test`, URLs from `npx prisma dev ls`. See `docs/development.md`.

## File Structure

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` (modify) | `MeetingKind` enum, `CourseMeeting` model, `quiz` in `TaskType` |
| `prisma/migrations/<ts>_timetable/migration.sql` (create) | Generated SQL plus RLS line |
| `src/lib/task.ts` (modify) | `TASK_TYPES`, `TASK_TYPE_LABELS`; `quiz` accepted |
| `src/lib/meeting.ts` (create) | Weekday/kind constants, clock-time parse/format, meeting form validation, `describeMeeting` |
| `src/lib/timetable.ts` (create) | Pure timetable rules: ISO weekday, term running, term choice, today's classes, week layout |
| `src/lib/coming-up.ts` (create) | Pure rules: coming-up grouping, a course's open coursework |
| `src/lib/services/meeting.ts` (create) | Prisma reads/writes for meetings, ownership-checked |
| `src/lib/actions/meeting.ts` (create) | Server actions for create/update/delete meeting |
| `src/components/filed-row.tsx` (modify) | Optional `detail` slot under a row |
| `src/components/timetable/add-meeting-form.tsx` (create) | Add class time(s) form |
| `src/components/timetable/meeting-row.tsx` (create) | One class time, inline edit and remove |
| `src/components/timetable/week-grid.tsx` (create) | Desktop week grid |
| `src/components/timetable/day-list.tsx` (create) | Phone-width list of the same week |
| `src/components/timetable/classes-today.tsx` (create) | Today's "Classes today" section |
| `src/components/courses/course-panel.tsx` (create) | Expandable class times + coursework under a course |
| `src/components/courses/add-coursework-form.tsx` (create) | Quick add of a Task filed under a course |
| `src/components/courses/course-row.tsx` (modify) | Accepts and renders a `panel` |
| `src/components/coming-up.tsx` (create) | Today's "Coming up" section |
| `src/app/timetable/page.tsx` (create) | Timetable page |
| `src/app/courses/page.tsx` (modify) | Loads meetings and tasks, renders panels |
| `src/app/dashboard/page.tsx` (modify) | Loads meetings and terms, renders the two new sections |
| `src/components/app-sidebar.tsx` (modify) | Timetable entry and icon |
| `src/components/tasks/create-task-form.tsx`, `src/components/tasks/task-row.tsx` (modify) | Quiz option from `TASK_TYPES` |
| `src/lib/ai/tools.ts`, `execute.ts`, `system-prompt.ts` (modify) | `quiz`, `get_timetable` |
| `prisma/seed-demo.ts` (modify) | Demo class times and a quiz |
| `ASSISTANT.md`, `docs/*.md`, `docs/screenshots/*` (modify) | Kept true |

---

### Task 1: Schema — `CourseMeeting`, `MeetingKind`, and the `quiz` type

**Files:**
- Modify: `prisma/schema.prisma` (the `TaskType` enum and the `Course` model; add a new enum and model after `Course`)
- Create: `prisma/migrations/<timestamp>_timetable/migration.sql` (generated, then edited)
- Modify: `docs/database.md`
- Test: `src/lib/services/rls.test.ts` (existing, must still pass)

**Interfaces:**
- Consumes: nothing.
- Produces: Prisma model `CourseMeeting { id, courseId, kind: MeetingKind, weekday: Int, startMinute: Int, durationMinutes: Int, location: String?, createdAt, updatedAt }`, `prisma.courseMeeting`, `Course.meetings`, enum `MeetingKind = lecture | lab | tutorial | seminar | other`, `TaskType` gains `quiz`. Generated types in `@/generated/prisma/client` and `@/generated/prisma/enums`.

- [ ] **Step 1: Make sure the local databases are up**

Run: `npx prisma dev start mentra mentra-test && npx prisma dev ls`
Expected: both servers listed as running with a `DATABASE_URL`. `.env` has `DATABASE_URL` pointing at `mentra` and `TEST_DATABASE_URL` at `mentra-test` (see `docs/development.md`). If `.env` is missing either, copy the URLs from `prisma dev ls` into it.

- [ ] **Step 2: Edit the schema**

In `prisma/schema.prisma`, change `TaskType`:

```prisma
enum TaskType {
  task
  assignment
  quiz
  exam
}
```

Add `meetings` to `Course` (after `notes Note[]`):

```prisma
  tasks    Task[]
  notes    Note[]
  meetings CourseMeeting[]
```

Add after the `Course` model:

```prisma
enum MeetingKind {
  lecture
  lab
  tutorial
  seminar
  other
}

/// One weekly class: a course meets on this weekday, at this time, every week
/// of its term.
///
/// Times are minutes since midnight on the student's own wall clock, not
/// instants. A 09:30 lecture is 09:30 wherever the student's browser says they
/// are, which is how due dates already work (see src/lib/timezone.ts), so the
/// timetable and Today never disagree about what day or hour it is.
model CourseMeeting {
  id              String      @id @default(cuid())
  courseId        String
  // A class time means nothing without its course, unlike work or notes,
  // which are the student's own and survive being unfiled.
  course          Course      @relation(fields: [courseId], references: [id], onDelete: Cascade)
  kind            MeetingKind @default(lecture)
  /// ISO weekday: 1 is Monday, 7 is Sunday.
  weekday         Int
  /// Minutes since midnight, 0 to 1439.
  startMinute     Int
  durationMinutes Int
  location        String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([courseId])
  @@map("course_meeting")
}
```

- [ ] **Step 3: Generate the migration without applying it**

Run: `npx prisma migrate dev --name timetable --create-only`
Expected: a new folder `prisma/migrations/<timestamp>_timetable/` whose `migration.sql` contains `ALTER TYPE "TaskType" ADD VALUE 'quiz';`, `CREATE TYPE "MeetingKind"`, `CREATE TABLE "course_meeting"`, an index and a foreign key with `ON DELETE CASCADE`.

- [ ] **Step 4: Close the new table to Supabase's REST API**

Append to that `migration.sql`:

```sql

-- Every public table is closed to Supabase's REST API; see
-- 20260913040000_enable_row_level_security.
ALTER TABLE "course_meeting" ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 5: Apply to both databases and regenerate the client**

Run: `npx prisma migrate dev && DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy`
(Load `.env` first if your shell does not: `set -a; source .env; set +a`.)
Expected: "Your database is now in sync with your schema" and the client regenerated into `src/generated/prisma`.

- [ ] **Step 6: Run the RLS test and the full suite**

Run: `npx vitest run src/lib/services/rls.test.ts && npm test`
Expected: PASS. If the RLS test lists `course_meeting`, Step 4 was missed.

- [ ] **Step 7: Document the model**

In `docs/database.md`, add a `CourseMeeting` section next to `Course` with: what one row means (one weekly slot), each field (weekday ISO 1–7, `startMinute` minutes since midnight on the student's wall clock, `durationMinutes`, `kind`, optional `location`), `onDelete: Cascade` from `Course` and why (a class time is meaningless without its course, unlike work and notes), and that RLS is enabled. Add `quiz` wherever `TaskType` values are listed.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations docs/database.md
git commit -m "feat: store weekly class times and a quiz type

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`src/generated` is checked in only if it already is: run `git status` and add it if it shows as modified.)

---

### Task 2: Quiz as a type of work everywhere work is typed

**Files:**
- Modify: `src/lib/task.ts:55-58`
- Modify: `src/lib/task.test.ts`
- Modify: `src/components/tasks/create-task-form.tsx:55-60`
- Modify: `src/components/tasks/task-row.tsx:235-241`
- Modify: `src/lib/ai/tools.ts:15`, and the `get_tasks`/`create_task` descriptions
- Modify: `src/lib/ai/tools.test.ts`
- Modify: `src/lib/ai/system-prompt.ts:27`
- Modify: `src/app/tasks/page.tsx:45`
- Modify: `ASSISTANT.md`, `docs/domain-logic.md`, `docs/user-guide.md`

**Interfaces:**
- Consumes: `TaskType` with `quiz` (Task 1).
- Produces: in `@/lib/task`: `export const TASK_TYPES = ["task", "assignment", "quiz", "exam"] as const;`, `export type TaskTypeValue = (typeof TASK_TYPES)[number];`, `export const TASK_TYPE_LABELS: Record<TaskTypeValue, string>`.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/task.test.ts` (it already imports `parseTaskInput`; add `TASK_TYPE_LABELS` and `TASK_TYPES` to that import):

```ts
describe("quizzes", () => {
  test("accepts quiz as a type of work", () => {
    const result = parseTaskInput({
      title: "Week 3 quiz",
      description: null,
      dueDate: "2026-10-02",
      priority: null,
      estimatedDuration: null,
      type: "quiz",
      topicsToReview: null,
      courseId: null,
    });

    expect(result.success && result.data.type).toBe("quiz");
  });

  test("labels every type", () => {
    expect(TASK_TYPES.map((type) => TASK_TYPE_LABELS[type])).toEqual([
      "Task",
      "Assignment",
      "Quiz",
      "Exam",
    ]);
  });
});
```

Append to `src/lib/ai/tools.test.ts` inside `describe("validateToolCall — accepting good calls", ...)`:

```ts
  test("accepts a quiz from create_task", () => {
    const result = validateToolCall("create_task", {
      title: "Week 3 quiz",
      type: "quiz",
    });

    expect(result.ok).toBe(true);
  });
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/lib/task.test.ts src/lib/ai/tools.test.ts`
Expected: FAIL — `TASK_TYPES` is not exported; `quiz` rejected with "Pick a type" / an invalid-arguments error.

- [ ] **Step 3: Implement**

In `src/lib/task.ts`, after `TASK_STATUSES`:

```ts
export const TASK_TYPES = ["task", "assignment", "quiz", "exam"] as const;

export type TaskTypeValue = (typeof TASK_TYPES)[number];

/** How a type reads wherever work is listed. */
export const TASK_TYPE_LABELS: Record<TaskTypeValue, string> = {
  task: "Task",
  assignment: "Assignment",
  quiz: "Quiz",
  exam: "Exam",
};
```

and change `type`:

```ts
const type = z.preprocess(
  blankToUndefined,
  z.enum(TASK_TYPES, { error: "Pick a type" }).default("task")
);
```

In `src/components/tasks/create-task-form.tsx`, import `{ TASK_TYPES, TASK_TYPE_LABELS } from "@/lib/task"` and replace the three hard-coded `<option>`s in the Type select with:

```tsx
{TASK_TYPES.map((type) => (
  <option key={type} value={type}>
    {TASK_TYPE_LABELS[type]}
  </option>
))}
```

Do the same in the edit form's Type select in `src/components/tasks/task-row.tsx` (around line 235). In both files change the topics hint from `(exams, optional)` to `(quizzes and exams, optional)`.

In `src/lib/ai/tools.ts` line 15:

```ts
import { TASK_TYPES } from "@/lib/task";
// ...
const taskType = z.enum(TASK_TYPES);
```

Change the `get_tasks` description's "tasks, assignments and exams" to "tasks, assignments, quizzes and exams", and `create_task`'s "Create a task, assignment or exam" to "Create a task, assignment, quiz or exam". In `src/lib/ai/system-prompt.ts:27` change "tasks, assignments, exams and notes" to "tasks, assignments, quizzes, exams and notes". In `src/app/tasks/page.tsx:45` change the lede to "Everything due — tasks, assignments, quizzes and exams, on a course line or on their own."

Check `toolDefinitions` for `create_task`: if its `type` property is built with `enumOf(taskType.options, ...)` it picks up `quiz` automatically; if it lists values literally, add `"quiz"`.

- [ ] **Step 4: Run tests, types and lint**

Run: `npx vitest run src/lib/task.test.ts src/lib/ai && npx tsc --noEmit && npm run lint`
Expected: PASS. If `src/lib/ai/system-prompt.test.ts` pins the old sentence, update the expected string to the new wording.

- [ ] **Step 5: Keep the docs true**

- `ASSISTANT.md`: in `create_task`, change "type (`task`, `assignment` or `exam`; default `task`)" to "type (`task`, `assignment`, `quiz` or `exam`; default `task`)".
- `docs/domain-logic.md` and `docs/user-guide.md`: wherever the types of work are listed, add quiz. Quizzes rank like any other work (type does not affect `rankTasks`); say so if the page discusses ranking inputs.

- [ ] **Step 6: Verify in the app**

Start `mentra-dev` with preview_start, sign in as the local test account (from `prisma/seed-demo.ts` or one created for this session), open `/tasks`, add a piece of work with type Quiz, confirm it appears and that editing it shows Quiz selected.

- [ ] **Step 7: Commit**

```bash
git add src/lib/task.ts src/lib/task.test.ts src/components/tasks src/lib/ai src/app/tasks/page.tsx ASSISTANT.md docs
git commit -m "feat: let work be a quiz

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Meeting rules — `src/lib/meeting.ts`

**Files:**
- Create: `src/lib/meeting.ts`
- Test: `src/lib/meeting.test.ts`

**Interfaces:**
- Consumes: `blankToClear`, `blankToUndefined`, `limitMessage`, `parseWith`, `ParseResult` from `@/lib/form-values`.
- Produces:
  - `WEEKDAYS: readonly { value: 1..7; short: string; long: string }[]`
  - `weekdayLabel(weekday: number, style: "short" | "long"): string`
  - `MEETING_KINDS = ["lecture","lab","tutorial","seminar","other"] as const`, `type MeetingKindValue`, `MEETING_KIND_LABELS: Record<MeetingKindValue, string>`
  - `MINUTES_PER_DAY = 1440`
  - `parseClockTime(value: string): number | null`
  - `formatClockTime(minute: number): string` → `"09:30"` (also the value an `<input type="time">` takes)
  - `describeMeeting(m: { kind; weekday; startMinute; durationMinutes; location: string | null }): string`
  - `type MeetingInput = { kind: MeetingKindValue; weekdays: number[]; startMinute: number; durationMinutes: number; location?: string }`
  - `type MeetingUpdateInput = { kind: MeetingKindValue; weekday: number; startMinute: number; durationMinutes: number; location?: string | null }`
  - `parseMeetingInput(fields: MeetingFormFields): ParseResult<MeetingInput>` where `MeetingFormFields = { kind: FormDataEntryValue | null; weekdays: FormDataEntryValue[]; startTime: FormDataEntryValue | null; durationMinutes: FormDataEntryValue | null; location: FormDataEntryValue | null }`
  - `parseMeetingUpdate(fields: Omit<MeetingFormFields, "weekdays"> & { weekday: FormDataEntryValue | null }): ParseResult<MeetingUpdateInput>`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/meeting.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/meeting.test.ts`
Expected: FAIL — cannot resolve `@/lib/meeting`.

- [ ] **Step 3: Implement**

Create `src/lib/meeting.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/meeting.test.ts && npx tsc --noEmit`
Expected: PASS. If a test expecting exactly one error message gets two (zod reporting both a type and a custom issue), add `abort: true` to the first check's options, as `src/lib/ai/tools.ts` does for `calendarDate`, rather than loosening the test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/meeting.ts src/lib/meeting.test.ts
git commit -m "feat: validate and describe weekly class times

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Meeting service — `src/lib/services/meeting.ts`

**Files:**
- Create: `src/lib/services/meeting.ts`
- Test: `src/lib/services/meeting.test.ts`

**Interfaces:**
- Consumes: `prisma`, `CourseMeeting` from `@/generated/prisma/client`, `MeetingInput`, `MeetingUpdateInput` (Task 3), `isForeignKeyViolation` from `@/lib/services/prisma-errors`.
- Produces:
  - `type MeetingWithCourse = CourseMeeting & { course: { id: string; name: string; code: string | null; semesterId: string } }`
  - `createMeetings(userId, courseId, input: MeetingInput): Promise<{ success: true; data: CourseMeeting[] } | { success: false; error: "not_found" }>`
  - `listMeetingsForUser(userId): Promise<MeetingWithCourse[]>` ordered by weekday then start
  - `updateMeeting(userId, meetingId, data: MeetingUpdateInput): Promise<{ success: true } | { success: false; error: "not_found" }>`
  - `deleteMeeting(userId, meetingId): Promise<{ success: true } | { success: false; error: "not_found" }>`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/services/meeting.test.ts`:

```ts
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import { createSemester } from "@/lib/services/semester";
import { createCourse } from "@/lib/services/course";
import {
  createMeetings,
  deleteMeeting,
  listMeetingsForUser,
  updateMeeting,
} from "@/lib/services/meeting";

const slot = {
  kind: "lecture" as const,
  weekdays: [1, 3],
  startMinute: 570,
  durationMinutes: 80,
  location: "Room 204",
};

const userIds: string[] = [];

async function studentWithCourse() {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-meeting-${randomUUID()}@example.com`,
      emailVerified: true,
    },
  });
  userIds.push(user.id);
  const semester = await createSemester(user.id, {
    name: "Fall 2026",
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-12-15"),
  });
  const course = await createCourse(user.id, semester.id, {
    name: "Network Security",
    code: "CYBR 301",
    professor: undefined,
    credits: 3,
  });
  if (!course.success) throw new Error("fixture failed");
  return { userId: user.id, courseId: course.data.id };
}

let userId: string;
let courseId: string;

beforeEach(async () => {
  ({ userId, courseId } = await studentWithCourse());
});

afterEach(async () => {
  // Courses restrict their term's deletion, so they go first; meetings
  // cascade with them.
  await prisma.course.deleteMany({
    where: { semester: { userId: { in: userIds } } },
  });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  userIds.length = 0;
});

describe("createMeetings", () => {
  test("creates one row per day ticked", async () => {
    const result = await createMeetings(userId, courseId, slot);

    expect(result.success).toBe(true);
    expect(result.success && result.data.map((m) => m.weekday)).toEqual([1, 3]);
    expect(result.success && result.data[0]).toMatchObject({
      courseId,
      kind: "lecture",
      startMinute: 570,
      durationMinutes: 80,
      location: "Room 204",
    });
  });

  test("refuses a course that belongs to someone else", async () => {
    const other = await studentWithCourse();

    expect(await createMeetings(userId, other.courseId, slot)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await prisma.courseMeeting.count({ where: { courseId: other.courseId } })).toBe(0);
  });
});

describe("listMeetingsForUser", () => {
  test("lists only this student's classes, in week order, with the course", async () => {
    await createMeetings(userId, courseId, { ...slot, weekdays: [3] });
    await createMeetings(userId, courseId, {
      ...slot,
      weekdays: [1],
      startMinute: 840,
    });
    await createMeetings(userId, courseId, { ...slot, weekdays: [1] });
    const other = await studentWithCourse();
    await createMeetings(other.userId, other.courseId, slot);

    const meetings = await listMeetingsForUser(userId);

    expect(meetings.map((m) => [m.weekday, m.startMinute])).toEqual([
      [1, 570],
      [1, 840],
      [3, 570],
    ]);
    expect(meetings[0].course).toEqual({
      id: courseId,
      name: "Network Security",
      code: "CYBR 301",
      semesterId: expect.any(String),
    });
  });
});

describe("updateMeeting and deleteMeeting", () => {
  test("changes a class time", async () => {
    const created = await createMeetings(userId, courseId, { ...slot, weekdays: [1] });
    if (!created.success) throw new Error("fixture failed");
    const [meeting] = created.data;

    const result = await updateMeeting(userId, meeting.id, {
      kind: "lab",
      weekday: 4,
      startMinute: 840,
      durationMinutes: 120,
      location: null,
    });

    expect(result).toEqual({ success: true });
    expect(await prisma.courseMeeting.findUnique({ where: { id: meeting.id } })).toMatchObject({
      kind: "lab",
      weekday: 4,
      startMinute: 840,
      durationMinutes: 120,
      location: null,
    });
  });

  test("will not touch another student's class", async () => {
    const other = await studentWithCourse();
    const created = await createMeetings(other.userId, other.courseId, slot);
    if (!created.success) throw new Error("fixture failed");
    const [theirs] = created.data;

    expect(
      await updateMeeting(userId, theirs.id, {
        kind: "lab",
        weekday: 4,
        startMinute: 0,
        durationMinutes: 60,
        location: null,
      })
    ).toEqual({ success: false, error: "not_found" });
    expect(await deleteMeeting(userId, theirs.id)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await prisma.courseMeeting.findUnique({ where: { id: theirs.id } })).not.toBeNull();
  });

  test("removes a class time", async () => {
    const created = await createMeetings(userId, courseId, { ...slot, weekdays: [1] });
    if (!created.success) throw new Error("fixture failed");

    expect(await deleteMeeting(userId, created.data[0].id)).toEqual({ success: true });
    expect(await listMeetingsForUser(userId)).toEqual([]);
  });

  test("goes when its course goes", async () => {
    await createMeetings(userId, courseId, slot);

    await prisma.course.delete({ where: { id: courseId } });

    expect(await listMeetingsForUser(userId)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/services/meeting.test.ts`
Expected: FAIL — cannot resolve `@/lib/services/meeting`.

- [ ] **Step 3: Implement**

Create `src/lib/services/meeting.ts`:

```ts
import { prisma } from "@/lib/prisma";
import type { CourseMeeting } from "@/generated/prisma/client";
import type { MeetingInput, MeetingUpdateInput } from "@/lib/meeting";
import { isForeignKeyViolation } from "@/lib/services/prisma-errors";

export type MeetingWithCourse = CourseMeeting & {
  course: { id: string; name: string; code: string | null; semesterId: string };
};

type NotFound = { success: false; error: "not_found" };
const NOT_FOUND: NotFound = { success: false, error: "not_found" };

/** A meeting is this student's when its course's term is. */
function ownedBy(userId: string) {
  return { course: { semester: { userId } } };
}

/**
 * One row per weekday ticked, written together: a Monday/Wednesday lecture
 * that saved only its Monday would be a timetable that quietly lies.
 */
export async function createMeetings(
  userId: string,
  courseId: string,
  input: MeetingInput
): Promise<{ success: true; data: CourseMeeting[] } | NotFound> {
  const owned = await prisma.course.count({
    where: { id: courseId, semester: { userId } },
  });
  if (owned === 0) return NOT_FOUND;

  const { weekdays, ...slot } = input;
  try {
    const data = await prisma.$transaction(
      weekdays.map((weekday) =>
        prisma.courseMeeting.create({ data: { ...slot, weekday, courseId } })
      )
    );
    return { success: true, data };
  } catch (error) {
    // The course was removed between the check and the write.
    if (isForeignKeyViolation(error)) return NOT_FOUND;
    throw error;
  }
}

export function listMeetingsForUser(userId: string): Promise<MeetingWithCourse[]> {
  return prisma.courseMeeting.findMany({
    where: ownedBy(userId),
    include: {
      course: { select: { id: true, name: true, code: true, semesterId: true } },
    },
    orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
  });
}

export async function updateMeeting(
  userId: string,
  meetingId: string,
  data: MeetingUpdateInput
): Promise<{ success: true } | NotFound> {
  const { count } = await prisma.courseMeeting.updateMany({
    where: { id: meetingId, ...ownedBy(userId) },
    data,
  });
  return count === 0 ? NOT_FOUND : { success: true };
}

export async function deleteMeeting(
  userId: string,
  meetingId: string
): Promise<{ success: true } | NotFound> {
  const { count } = await prisma.courseMeeting.deleteMany({
    where: { id: meetingId, ...ownedBy(userId) },
  });
  return count === 0 ? NOT_FOUND : { success: true };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/services/meeting.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/meeting.ts src/lib/services/meeting.test.ts
git commit -m "feat: store and read a student's class times

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Timetable rules — `src/lib/timetable.ts`

**Files:**
- Create: `src/lib/timetable.ts`
- Test: `src/lib/timetable.test.ts`

**Interfaces:**
- Consumes: `calendarDaysUntil` from `@/lib/task-status`; `MeetingKindValue` from `@/lib/meeting`.
- Produces:
  - `type TimetableMeeting = { id: string; kind: MeetingKindValue; weekday: number; startMinute: number; durationMinutes: number; location: string | null; course: { id: string; name: string; code: string | null; semesterId: string } }` (`MeetingWithCourse` from Task 4 satisfies it)
  - `type TimetableTerm = { id: string; name: string; startDate: Date; endDate: Date }`
  - `isoWeekday(now: Date): number`
  - `minuteOfDay(now: Date): number`
  - `termRunsOn(term: TimetableTerm, now: Date): boolean`
  - `pickTerm<T extends TimetableTerm>(terms: T[], now: Date, requestedId?: string): T | null`
  - `classesToday<M extends TimetableMeeting>(meetings: M[], terms: TimetableTerm[], now: Date): M[]`
  - `type PlacedMeeting<M> = { meeting: M; lane: number; lanes: number; topPercent: number; heightPercent: number }`
  - `type WeekLayout<M> = { startMinute: number; endMinute: number; hours: number[]; days: { weekday: number; placed: PlacedMeeting<M>[] }[] }`
  - `layoutWeek<M extends TimetableMeeting>(meetings: M[]): WeekLayout<M>`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/timetable.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/timetable.test.ts`
Expected: FAIL — cannot resolve `@/lib/timetable`.

- [ ] **Step 3: Implement**

Create `src/lib/timetable.ts`:

```ts
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

  const weekdays = [
    ...WEEKDAYS_ALWAYS_SHOWN,
    ...[6, 7].filter((weekday) => meetings.some((m) => m.weekday === weekday)),
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
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/timetable.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Document the rules**

In `docs/domain-logic.md`, add a "Timetable" section: class times are wall-clock minutes on the student's calendar and never time-zone converted; which term the timetable shows (`pickTerm` order); "Classes today" only counts terms running today; the grid's 08:00–18:00 default window and whole-hour stretching; overlapping classes share lanes; the weekend appears only when it has classes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/timetable.ts src/lib/timetable.test.ts docs/domain-logic.md
git commit -m "feat: work out a term's week and today's classes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Coming-up rules — `src/lib/coming-up.ts`

**Files:**
- Create: `src/lib/coming-up.ts`
- Test: `src/lib/coming-up.test.ts`
- Modify: `docs/domain-logic.md`

**Interfaces:**
- Consumes: `calendarDaysUntil` from `@/lib/task-status`; `TaskStatus`, `TaskType` from `@/generated/prisma/enums`.
- Produces:
  - `COMING_UP_DAYS = 14`
  - `type UpcomingTask = { id: string; title: string; type: TaskType; status: TaskStatus; dueDate: Date | null; courseId: string | null }` (a Prisma `Task` satisfies it)
  - `type ComingUpDay<T> = { daysUntil: number; label: string; items: T[] }`
  - `dayHeading(daysUntil: number, date: Date): string`
  - `comingUp<T extends UpcomingTask>(tasks: T[], now: Date, days?: number): ComingUpDay<T>[]`
  - `courseworkFor<T extends UpcomingTask>(tasks: T[], courseId: string): T[]`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/coming-up.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
  comingUp,
  courseworkFor,
  dayHeading,
  type UpcomingTask,
} from "@/lib/coming-up";

// A Saturday morning on the student's clock.
const now = new Date("2026-09-26T10:00:00Z");

function task(
  overrides: Partial<UpcomingTask> & Pick<UpcomingTask, "id">
): UpcomingTask {
  return {
    title: overrides.id,
    type: "assignment",
    status: "not_started",
    dueDate: null,
    courseId: "c1",
    ...overrides,
  };
}

const due = (day: string) => new Date(`${day}T00:00:00Z`);

describe("dayHeading", () => {
  test("says Today and Tomorrow, then the date", () => {
    expect(dayHeading(0, due("2026-09-26"))).toBe("Today");
    expect(dayHeading(1, due("2026-09-27"))).toBe("Tomorrow");
    expect(dayHeading(3, due("2026-09-29"))).toBe("Tue, Sep 29");
  });
});

describe("comingUp", () => {
  test("groups open work due in the next two weeks by day", () => {
    const quiz = task({ id: "quiz", type: "quiz", dueDate: due("2026-09-29") });
    const essay = task({ id: "essay", dueDate: due("2026-09-26") });
    const exam = task({ id: "exam", type: "exam", dueDate: due("2026-09-29") });

    expect(comingUp([quiz, essay, exam], now)).toEqual([
      { daysUntil: 0, label: "Today", items: [essay] },
      { daysUntil: 3, label: "Tue, Sep 29", items: [exam, quiz] },
    ]);
  });

  test("leaves out finished, undated, overdue and far-off work", () => {
    const tasks = [
      task({ id: "done", status: "completed", dueDate: due("2026-09-27") }),
      task({ id: "dropped", status: "cancelled", dueDate: due("2026-09-27") }),
      task({ id: "someday" }),
      task({ id: "late", dueDate: due("2026-09-25") }),
      task({ id: "far", dueDate: due("2026-10-11") }),
      task({ id: "edge", dueDate: due("2026-10-10") }),
    ];

    expect(comingUp(tasks, now).flatMap((day) => day.items.map((t) => t.id))).toEqual([
      "edge",
    ]);
  });

  test("orders a day's work exams first, then quizzes, assignments and tasks", () => {
    const day = due("2026-09-28");
    const items = comingUp(
      [
        task({ id: "b-task", type: "task", dueDate: day }),
        task({ id: "assignment", type: "assignment", dueDate: day }),
        task({ id: "a-task", type: "task", dueDate: day }),
        task({ id: "quiz", type: "quiz", dueDate: day }),
        task({ id: "exam", type: "exam", dueDate: day }),
      ],
      now
    )[0].items.map((t) => t.id);

    expect(items).toEqual(["exam", "quiz", "assignment", "a-task", "b-task"]);
  });
});

describe("courseworkFor", () => {
  test("lists a course's open work, soonest first and undated last", () => {
    const later = task({ id: "later", dueDate: due("2026-10-20") });
    const sooner = task({ id: "sooner", dueDate: due("2026-09-28") });
    const undated = task({ id: "undated" });
    const other = task({ id: "other", courseId: "c2", dueDate: due("2026-09-27") });
    const done = task({ id: "done", status: "completed", dueDate: due("2026-09-27") });

    expect(courseworkFor([later, undated, other, done, sooner], "c1")).toEqual([
      sooner,
      later,
      undated,
    ]);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/coming-up.test.ts`
Expected: FAIL — cannot resolve `@/lib/coming-up`.

- [ ] **Step 3: Implement**

Create `src/lib/coming-up.ts`:

```ts
import type { TaskStatus, TaskType } from "@/generated/prisma/enums";
import { calendarDaysUntil } from "@/lib/task-status";

/** How far ahead Today's "Coming up" looks, in days. */
export const COMING_UP_DAYS = 14;

export type UpcomingTask = {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  dueDate: Date | null;
  courseId: string | null;
};

export type ComingUpDay<T> = { daysUntil: number; label: string; items: T[] };

const OPEN: readonly TaskStatus[] = ["not_started", "in_progress", "paused"];

/** On one day, the thing that is sat beats the thing that is handed in. */
const TYPE_ORDER: Record<TaskType, number> = {
  exam: 0,
  quiz: 1,
  assignment: 2,
  task: 3,
};

// Due dates are UTC midnight on the student's calendar, so read them in UTC.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function dayHeading(daysUntil: number, date: Date): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return dateFormatter.format(date);
}

function byTypeThenTitle(a: UpcomingTask, b: UpcomingTask): number {
  return TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.title.localeCompare(b.title);
}

/**
 * Open work due from today through `days` ahead, one group per day.
 *
 * Overdue work is left out on purpose: it already leads Today in the slipped
 * plate, and listing it again under a date that has passed says nothing new.
 */
export function comingUp<T extends UpcomingTask>(
  tasks: T[],
  now: Date,
  days: number = COMING_UP_DAYS
): ComingUpDay<T>[] {
  const byDay = new Map<number, { date: Date; items: T[] }>();

  for (const task of tasks) {
    if (!task.dueDate || !OPEN.includes(task.status)) continue;
    const daysUntil = calendarDaysUntil(task.dueDate, now);
    if (daysUntil < 0 || daysUntil > days) continue;

    const group = byDay.get(daysUntil) ?? { date: task.dueDate, items: [] };
    group.items.push(task);
    byDay.set(daysUntil, group);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([daysUntil, { date, items }]) => ({
      daysUntil,
      label: dayHeading(daysUntil, date),
      items: items.sort(byTypeThenTitle),
    }));
}

/** A course's open work, soonest first, undated at the end. */
export function courseworkFor<T extends UpcomingTask>(tasks: T[], courseId: string): T[] {
  return tasks
    .filter((task) => task.courseId === courseId && OPEN.includes(task.status))
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime() || a.title.localeCompare(b.title);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.title.localeCompare(b.title);
    });
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/coming-up.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Document**

In `docs/domain-logic.md`, add a "Coming up" section: window is today through 14 days ahead (`COMING_UP_DAYS`), only open statuses, overdue excluded and why, same-day order exam → quiz → assignment → task then title. Add a sentence on `courseworkFor` (a course's open work, soonest first, undated last).

- [ ] **Step 6: Commit**

```bash
git add src/lib/coming-up.ts src/lib/coming-up.test.ts docs/domain-logic.md
git commit -m "feat: gather the next two weeks of work by day

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Meeting actions and the class-time components

**Files:**
- Create: `src/lib/actions/meeting.ts`
- Create: `src/components/timetable/add-meeting-form.tsx`
- Create: `src/components/timetable/meeting-row.tsx`

**Interfaces:**
- Consumes: `parseMeetingInput`, `parseMeetingUpdate`, `WEEKDAYS`, `MEETING_KINDS`, `MEETING_KIND_LABELS`, `formatClockTime`, `describeMeeting` (Task 3); `createMeetings`, `updateMeeting`, `deleteMeeting` (Task 4); `useQuickForm`, `useInlineEdit`, `useRowAction` from `@/lib/use-row-actions`; `FiledRow`, `FiledRowEditing`, `FormErrors`, `EditActions` from `@/components/filed-row`; `ConfirmAction`.
- Produces:
  - `createMeetingAction(prev: MeetingActionState, formData: FormData): Promise<MeetingActionState>` — fields `courseId`, `kind`, `weekday` (repeated checkbox), `startTime`, `durationMinutes`, `location`
  - `updateMeetingAction(prev, formData)` — fields `meetingId`, `kind`, `weekday` (single), `startTime`, `durationMinutes`, `location`
  - `deleteMeetingAction(formData): Promise<RowActionResult>` — field `meetingId`
  - `<AddMeetingForm idPrefix: string; courseId?: string; courses?: { id: string; name: string }[] />` — exactly one of `courseId` / `courses` is passed
  - `<MeetingRow meeting={{ id, kind, weekday, startMinute, durationMinutes, location }} />`

There is no unit test layer for server actions or components in this repo; the logic they call is covered by Tasks 3–4. This task's test is driving it in the running app, in Task 8 Step 5 (the first place these components are mounted).

- [ ] **Step 1: Write the actions**

Create `src/lib/actions/meeting.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/session";
import { ROW_ACTION_OK, type RowActionResult } from "@/lib/action-state";
import { parseMeetingInput, parseMeetingUpdate } from "@/lib/meeting";
import {
  createMeetings,
  deleteMeeting,
  updateMeeting,
} from "@/lib/services/meeting";

export type MeetingActionState = {
  errors: string[];
};

function readSlotFields(formData: FormData) {
  return {
    kind: formData.get("kind"),
    startTime: formData.get("startTime"),
    durationMinutes: formData.get("durationMinutes"),
    location: formData.get("location"),
  };
}

/** Class times print on the timetable, under each course and on Today. */
function revalidateTimetable() {
  revalidatePath("/timetable");
  revalidatePath("/courses");
  revalidatePath("/dashboard");
}

export async function createMeetingAction(
  _prevState: MeetingActionState,
  formData: FormData
): Promise<MeetingActionState> {
  const userId = await requireUserId();
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) {
    return { errors: ["Pick a course"] };
  }

  const result = parseMeetingInput({
    ...readSlotFields(formData),
    weekdays: formData.getAll("weekday"),
  });
  if (!result.success) {
    return { errors: result.errors };
  }

  const created = await createMeetings(userId, courseId, result.data);
  if (!created.success) {
    return { errors: ["That course no longer exists."] };
  }

  revalidateTimetable();
  return { errors: [] };
}

export async function updateMeetingAction(
  _prevState: MeetingActionState,
  formData: FormData
): Promise<MeetingActionState> {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId") ?? "");

  const result = parseMeetingUpdate({
    ...readSlotFields(formData),
    weekday: formData.get("weekday"),
  });
  if (!result.success) {
    return { errors: result.errors };
  }

  const updated = await updateMeeting(userId, meetingId, result.data);
  if (!updated.success) {
    return { errors: ["That class time no longer exists."] };
  }

  revalidateTimetable();
  return { errors: [] };
}

export async function deleteMeetingAction(
  formData: FormData
): Promise<RowActionResult> {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId") ?? "");

  const deleted = await deleteMeeting(userId, meetingId);
  if (!deleted.success) {
    return { error: "That class time was already removed." };
  }

  revalidateTimetable();
  return ROW_ACTION_OK;
}
```

- [ ] **Step 2: Write the add form**

Create `src/components/timetable/add-meeting-form.tsx`:

```tsx
"use client";

import { createMeetingAction } from "@/lib/actions/meeting";
import { MEETING_KINDS, MEETING_KIND_LABELS, WEEKDAYS } from "@/lib/meeting";
import { useQuickForm } from "@/lib/use-row-actions";
import { FormErrors } from "@/components/filed-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type CourseOption = { id: string; name: string };

/**
 * Adds a class time on one or more days. It stays open and clears after
 * saving, because a course's lecture is usually followed by its lab.
 *
 * Under a course it is given `courseId`; on the timetable it is given the
 * term's `courses` and asks which one.
 */
export function AddMeetingForm({
  idPrefix,
  courseId,
  courses,
}: {
  idPrefix: string;
  courseId?: string;
  courses?: CourseOption[];
}) {
  const form = useQuickForm(createMeetingAction);

  return (
    <form key={form.formKey} action={form.submit} className="flex flex-col gap-3">
      {courseId ? (
        <input type="hidden" name="courseId" value={courseId} />
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-course`}>Course</Label>
          <Select id={`${idPrefix}-course`} name="courseId" defaultValue="" required>
            <option value="" disabled>
              Pick a course
            </option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Days</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {WEEKDAYS.map((day) => (
            <label key={day.value} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="weekday"
                value={day.value}
                className="size-4 accent-primary"
              />
              <span aria-hidden="true">{day.short}</span>
              <span className="sr-only">{day.long}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-kind`}>Kind</Label>
          <Select id={`${idPrefix}-kind`} name="kind" defaultValue="lecture">
            {MEETING_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {MEETING_KIND_LABELS[kind]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-start`}>Starts</Label>
          <Input id={`${idPrefix}-start`} name="startTime" type="time" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-duration`}>Minutes</Label>
          <Input
            id={`${idPrefix}-duration`}
            name="durationMinutes"
            type="number"
            min={5}
            max={720}
            step={5}
            defaultValue={50}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-location`}>
            Where <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id={`${idPrefix}-location`} name="location" />
        </div>
      </div>

      <FormErrors errors={form.errors} />

      <Button type="submit" disabled={form.isPending} variant="outline">
        {form.isPending ? "Adding…" : "Add class time"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Write the row**

Create `src/components/timetable/meeting-row.tsx`:

```tsx
"use client";

import { deleteMeetingAction, updateMeetingAction } from "@/lib/actions/meeting";
import {
  describeMeeting,
  formatClockTime,
  MEETING_KINDS,
  MEETING_KIND_LABELS,
  WEEKDAYS,
  type MeetingKindValue,
} from "@/lib/meeting";
import { useInlineEdit, useRowAction } from "@/lib/use-row-actions";
import { ConfirmAction } from "@/components/confirm-action";
import { EditActions, FiledRow, FiledRowEditing, FormErrors } from "@/components/filed-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Meeting = {
  id: string;
  kind: MeetingKindValue;
  weekday: number;
  startMinute: number;
  durationMinutes: number;
  location: string | null;
};

export function MeetingRow({ meeting }: { meeting: Meeting }) {
  const edit = useInlineEdit(updateMeetingAction);
  const remove = useRowAction(deleteMeetingAction);
  const description = describeMeeting(meeting);

  if (!edit.isEditing) {
    return (
      <FiledRow
        error={remove.error}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Edit ${description}`}
              onClick={edit.open}
            >
              Edit
            </Button>
            <ConfirmAction
              label="Remove"
              itemName={description}
              onConfirm={() => remove.run("meetingId", meeting.id)}
              isPending={remove.isPending}
            />
          </>
        }
      >
        <p data-figures className="text-sm">
          {description}
        </p>
      </FiledRow>
    );
  }

  const id = (field: string) => `meeting-${field}-${meeting.id}`;

  return (
    <FiledRowEditing>
      <form action={edit.submit} className="flex flex-col gap-3">
        <input type="hidden" name="meetingId" value={meeting.id} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor={id("day")}>Day</Label>
            <Select id={id("day")} name="weekday" defaultValue={String(meeting.weekday)}>
              {WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.long}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id("kind")}>Kind</Label>
            <Select id={id("kind")} name="kind" defaultValue={meeting.kind}>
              {MEETING_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {MEETING_KIND_LABELS[kind]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id("start")}>Starts</Label>
            <Input
              id={id("start")}
              name="startTime"
              type="time"
              defaultValue={formatClockTime(meeting.startMinute)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id("duration")}>Minutes</Label>
            <Input
              id={id("duration")}
              name="durationMinutes"
              type="number"
              min={5}
              max={720}
              step={5}
              defaultValue={meeting.durationMinutes}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id("location")}>Where</Label>
            <Input id={id("location")} name="location" defaultValue={meeting.location ?? ""} />
          </div>
        </div>
        <FormErrors errors={edit.errors} />
        <EditActions isPending={edit.isPending} onCancel={edit.cancel} />
      </form>
    </FiledRowEditing>
  );
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS. (A Prisma `MeetingKind` value is assignable to `MeetingKindValue`; if TypeScript disagrees, the enum values in Task 1 and `MEETING_KINDS` have drifted — fix the drift, do not cast.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/meeting.ts src/components/timetable
git commit -m "feat: forms for adding, editing and removing class times

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Expandable courses — class times and coursework on the Courses page

**Files:**
- Modify: `src/components/filed-row.tsx` (`FiledRow` gains `detail`)
- Modify: `src/components/courses/course-row.tsx` (accepts `panel`)
- Create: `src/components/courses/add-coursework-form.tsx`
- Create: `src/components/courses/course-panel.tsx`
- Modify: `src/app/courses/page.tsx`
- Modify: `docs/frontend.md`, `docs/user-guide.md`, `docs/screenshots/courses.jpg`

**Interfaces:**
- Consumes: `MeetingRow`, `AddMeetingForm` (Task 7); `courseworkFor` (Task 6); `listMeetingsForUser`, `MeetingWithCourse` (Task 4); `listTasksForUser`; `createTaskAction`; `TASK_TYPES`, `TASK_TYPE_LABELS` (Task 2); `dueLabel`; `calendarDaysUntil`; `RunningHead`.
- Produces: `FiledRow` prop `detail?: ReactNode`; `CourseRow` prop `panel?: ReactNode`; `<CoursePanel course meetings coursework now />`; `<AddCourseworkForm courseId />`.

- [ ] **Step 1: Give a filed row somewhere to put detail**

In `src/components/filed-row.tsx`, add to `FiledRow`'s props:

```tsx
  /** Opens beneath the row across its full width, such as a course's detail. */
  detail?: ReactNode;
```

destructure `detail`, and render it after the actions `<div>` and before the error:

```tsx
      {detail && <div className="w-full">{detail}</div>}
```

In `src/components/courses/course-row.tsx`, change the signature to `export function CourseRow({ course, panel }: { course: Course; panel?: ReactNode })` (import `type ReactNode` from `"react"`) and pass `detail={panel}` to `FiledRow`. The editing state does not show the panel.

- [ ] **Step 2: Write the coursework form**

Create `src/components/courses/add-coursework-form.tsx`:

```tsx
"use client";

import { createTaskAction } from "@/lib/actions/task";
import { TASK_TYPES, TASK_TYPE_LABELS } from "@/lib/task";
import { useQuickForm } from "@/lib/use-row-actions";
import { FormErrors } from "@/components/filed-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

/**
 * Adds a quiz, assignment or exam straight onto a course. It is ordinary work,
 * filed under this course, so it also appears on Work and is ranked on Today.
 * Fields the full Work form offers but this one does not (description, topics)
 * are simply left empty.
 */
export function AddCourseworkForm({ courseId }: { courseId: string }) {
  const form = useQuickForm(createTaskAction);
  const id = (field: string) => `coursework-${field}-${courseId}`;

  return (
    <form key={form.formKey} action={form.submit} className="flex flex-col gap-3">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("title")}>What is it</Label>
          <Input id={id("title")} name="title" placeholder="e.g. Week 4 quiz" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("type")}>Type</Label>
          <Select id={id("type")} name="type" defaultValue="quiz">
            {TASK_TYPES.map((type) => (
              <option key={type} value={type}>
                {TASK_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("due")}>Date</Label>
          <Input id={id("due")} name="dueDate" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("minutes")}>
            Est. minutes <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id={id("minutes")} name="estimatedDuration" type="number" min={0} />
        </div>
      </div>
      <FormErrors errors={form.errors} />
      <Button type="submit" disabled={form.isPending} variant="outline">
        {form.isPending ? "Adding…" : "Add coursework"}
      </Button>
    </form>
  );
}
```

(`required` on the date is a form nicety: coursework without a date cannot come up. Work without a date is still allowed on the Work page.)

- [ ] **Step 3: Write the panel**

Create `src/components/courses/course-panel.tsx`:

```tsx
import Link from "next/link";

import type { Task } from "@/generated/prisma/client";
import type { MeetingWithCourse } from "@/lib/services/meeting";
import { TASK_TYPE_LABELS } from "@/lib/task";
import { calendarDaysUntil } from "@/lib/task-status";
import { dueLabel } from "@/lib/due-label";
import { RunningHead } from "@/components/running-head";
import { MeetingRow } from "@/components/timetable/meeting-row";
import { AddMeetingForm } from "@/components/timetable/add-meeting-form";
import { AddCourseworkForm } from "@/components/courses/add-coursework-form";

/**
 * A course, opened: when it meets and what is coming up in it. Folded by
 * default so a term with eight courses still reads as a list of eight.
 */
export function CoursePanel({
  courseId,
  meetings,
  coursework,
  now,
}: {
  courseId: string;
  meetings: MeetingWithCourse[];
  coursework: Task[];
  now: Date;
}) {
  const summary = [
    meetings.length === 0
      ? "No class times"
      : `${meetings.length} class time${meetings.length === 1 ? "" : "s"}`,
    `${coursework.length} open`,
  ].join(" · ");

  return (
    <details className="group/course">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs text-muted-foreground select-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-3 shrink-0 transition-transform group-open/course:rotate-90"
        >
          <polyline points="4.5,2.5 8,6 4.5,9.5" />
        </svg>
        <span data-figures>{summary}</span>
      </summary>

      <div className="mt-4 flex flex-col gap-6 pl-5">
        <section className="flex flex-col gap-3">
          <RunningHead as="h3">Class times</RunningHead>
          {meetings.length > 0 && (
            <ul className="flex flex-col">
              {meetings.map((meeting) => (
                <MeetingRow key={meeting.id} meeting={meeting} />
              ))}
            </ul>
          )}
          <AddMeetingForm idPrefix={`meeting-${courseId}`} courseId={courseId} />
        </section>

        <section className="flex flex-col gap-3">
          <RunningHead as="h3">Coursework</RunningHead>
          {coursework.length > 0 && (
            <ul className="flex flex-col">
              {coursework.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule py-2"
                >
                  <span className="text-sm">
                    {task.title}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {TASK_TYPE_LABELS[task.type]}
                    </span>
                  </span>
                  <span data-figures className="text-xs text-muted-foreground">
                    {dueLabel(task.dueDate ? calendarDaysUntil(task.dueDate, now) : null)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <AddCourseworkForm courseId={courseId} />
          {coursework.length > 0 && (
            <Link
              href="/tasks"
              className="self-start text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Edit or complete these on Work
            </Link>
          )}
        </section>
      </div>
    </details>
  );
}
```

- [ ] **Step 4: Load the data on the Courses page**

In `src/app/courses/page.tsx`, import `listMeetingsForUser`, `listTasksForUser` from their services, `courseworkFor` from `@/lib/coming-up`, and `CoursePanel`. Load them alongside the semesters:

```tsx
  const [semesters, meetings, tasks] = await Promise.all([
    listSemestersForUser(userId),
    listMeetingsForUser(userId),
    listTasksForUser(userId),
  ]);
```

(remove the old standalone `listSemestersForUser` call), and render each course with its panel:

```tsx
                  {courses.map((course) => (
                    <CourseRow
                      key={course.id}
                      course={course}
                      panel={
                        <CoursePanel
                          courseId={course.id}
                          meetings={meetings.filter(
                            (meeting) => meeting.courseId === course.id
                          )}
                          coursework={courseworkFor(tasks, course.id)}
                          now={now}
                        />
                      }
                    />
                  ))}
```

Also add `revalidatePath("/courses")` to `revalidateWork()` in `src/lib/actions/task.ts`, and update its comment: work now also lists under its course on Courses.

- [ ] **Step 5: Verify in the running app**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: PASS.

Then preview_start `mentra-dev`, sign in, open `/courses`, and on one course:
1. Expand it. Summary reads "No class times · 0 open".
2. Add a Lecture on Mon + Wed at 09:30 for 80 minutes in "Room 204". Two rows appear: "Mon 09:30–10:50 · Lecture · Room 204" and the Wednesday one; the form is cleared and still open.
3. Submit with no days ticked: "Pick at least one day" shows, typed values stay.
4. Edit the Wednesday row to a Lab on Thursday 14:00; it reads "Thu 14:00–15:20 · Lab · Room 204".
5. Remove it (two presses); it disappears.
6. Add coursework "Week 4 quiz", type Quiz, dated three days out. It appears under Coursework with "3 days", and on `/tasks` with the course name.
7. Check the browser console (read_console_messages) for errors: none.

- [ ] **Step 6: Docs and screenshot**

- `docs/frontend.md`: the Courses page section describes the expandable course panel (class times with add/edit/remove, coursework list and quick add), and `FiledRow`'s `detail` slot.
- `docs/user-guide.md`: how to add class times and coursework from a course.
- Retake `docs/screenshots/courses.jpg` with one course expanded showing class times and coursework. Match the existing file's pixel size (`sips -g pixelWidth -g pixelHeight docs/screenshots/courses.jpg`) and theme.

- [ ] **Step 7: Commit**

```bash
git add src/components src/app/courses/page.tsx src/lib/actions/task.ts docs
git commit -m "feat: open a course to set its class times and coursework

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: The Timetable page

**Files:**
- Create: `src/components/timetable/week-grid.tsx`
- Create: `src/components/timetable/day-list.tsx`
- Create: `src/app/timetable/page.tsx`
- Modify: `src/components/app-sidebar.tsx` (`SECTIONS` and `SectionIcon`)
- Modify: `docs/frontend.md`, `docs/architecture.md` (route list, if it lists routes), `docs/user-guide.md`, `README.md` (if it lists pages or screenshots)
- Create: `docs/screenshots/timetable.jpg`

**Interfaces:**
- Consumes: `layoutWeek`, `pickTerm`, `isoWeekday`, `termRunsOn`, `WeekLayout`, `TimetableMeeting` (Task 5); `formatClockTime`, `weekdayLabel`, `describeMeeting`, `MEETING_KIND_LABELS` (Task 3); `listMeetingsForUser` (Task 4); `AddMeetingForm` (Task 7); `listSemestersForUser`, `listCoursesForUser`.
- Produces: route `/timetable` (optional `?term=<semesterId>`); `<WeekGrid layout todayWeekday />`; `<DayList layout todayWeekday />`.

- [ ] **Step 1: Read the design rules and the Next.js page docs**

Read `DESIGN.md` (tokens such as `border-rule`, `bg-band`, `text-now`, `data-figures`, and what "the now plate" is reserved for) and the App Router page/`searchParams` guide under `node_modules/next/dist/docs/01-app/`. Use only existing tokens.

- [ ] **Step 2: Write the week grid**

Create `src/components/timetable/week-grid.tsx`:

```tsx
import { formatClockTime, MEETING_KIND_LABELS, weekdayLabel } from "@/lib/meeting";
import type { TimetableMeeting, WeekLayout } from "@/lib/timetable";
import { cn } from "@/lib/utils";

/** Height of one hour on the grid. */
const HOUR_REM = 3.5;

/**
 * The week, drawn to scale: each class is as tall as it is long. Hidden at
 * phone width, where `DayList` prints the same week as lines instead.
 */
export function WeekGrid({
  layout,
  todayWeekday,
}: {
  layout: WeekLayout<TimetableMeeting>;
  /** Today's column, or null when the term shown is not running today. */
  todayWeekday: number | null;
}) {
  const height = ((layout.endMinute - layout.startMinute) / 60) * HOUR_REM;

  return (
    <div
      className="hidden sm:grid"
      style={{ gridTemplateColumns: `3.5rem repeat(${layout.days.length}, minmax(0, 1fr))` }}
    >
      <div />
      {layout.days.map((day) => (
        <div
          key={day.weekday}
          className={cn(
            "border-b-2 border-rule-strong pb-2 text-center text-xs font-semibold tracking-[0.12em] uppercase",
            day.weekday === todayWeekday ? "text-now" : "text-muted-foreground"
          )}
        >
          {weekdayLabel(day.weekday, "short")}
          {day.weekday === todayWeekday && <span className="sr-only"> (today)</span>}
        </div>
      ))}

      <div className="relative" style={{ height: `${height}rem` }}>
        {layout.hours.map((minute) => (
          <span
            key={minute}
            data-figures
            className="absolute right-2 -translate-y-1/2 text-[0.6875rem] text-muted-foreground"
            style={{ top: `${((minute - layout.startMinute) / (layout.endMinute - layout.startMinute)) * 100}%` }}
          >
            {formatClockTime(minute)}
          </span>
        ))}
      </div>

      {layout.days.map((day) => (
        <div
          key={day.weekday}
          className={cn(
            "relative border-l border-rule",
            day.weekday === todayWeekday && "bg-band"
          )}
          style={{ height: `${height}rem` }}
        >
          {layout.hours.map((minute) => (
            <div
              key={minute}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-rule/60"
              style={{ top: `${((minute - layout.startMinute) / (layout.endMinute - layout.startMinute)) * 100}%` }}
            />
          ))}
          {day.placed.map(({ meeting, lane, lanes, topPercent, heightPercent }) => (
            <div
              key={meeting.id}
              className="absolute overflow-hidden rounded-xs border-l-2 border-primary bg-muted px-1.5 py-1 text-xs"
              style={{
                top: `${topPercent}%`,
                height: `${heightPercent}%`,
                left: `${(lane / lanes) * 100}%`,
                width: `${100 / lanes}%`,
              }}
            >
              <p className="truncate font-medium">{meeting.course.code ?? meeting.course.name}</p>
              <p data-figures className="truncate text-muted-foreground">
                {formatClockTime(meeting.startMinute)}–
                {formatClockTime(meeting.startMinute + meeting.durationMinutes)}
              </p>
              <p className="truncate text-muted-foreground">
                {[MEETING_KIND_LABELS[meeting.kind], meeting.location].filter(Boolean).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write the phone-width list**

Create `src/components/timetable/day-list.tsx`:

```tsx
import { formatClockTime, MEETING_KIND_LABELS, weekdayLabel } from "@/lib/meeting";
import type { TimetableMeeting, WeekLayout } from "@/lib/timetable";
import { cn } from "@/lib/utils";

/** The week as lines, for screens too narrow for five columns. */
export function DayList({
  layout,
  todayWeekday,
}: {
  layout: WeekLayout<TimetableMeeting>;
  todayWeekday: number | null;
}) {
  const days = layout.days.filter((day) => day.placed.length > 0);

  return (
    <ol className="flex flex-col gap-5 sm:hidden">
      {days.map((day) => (
        <li key={day.weekday}>
          <h3
            className={cn(
              "text-xs font-semibold tracking-[0.12em] uppercase",
              day.weekday === todayWeekday ? "text-now" : "text-muted-foreground"
            )}
          >
            {weekdayLabel(day.weekday, "long")}
            {day.weekday === todayWeekday && " · Today"}
          </h3>
          <ul className="mt-2 flex flex-col">
            {[...day.placed]
              .sort((a, b) => a.meeting.startMinute - b.meeting.startMinute)
              .map(({ meeting }) => (
                <li key={meeting.id} className="flex gap-4 border-b border-rule py-2">
                  <span data-figures className="w-24 shrink-0 text-sm">
                    {formatClockTime(meeting.startMinute)}–
                    {formatClockTime(meeting.startMinute + meeting.durationMinutes)}
                  </span>
                  <span className="text-sm">
                    {meeting.course.name}
                    <span className="block text-xs text-muted-foreground">
                      {[MEETING_KIND_LABELS[meeting.kind], meeting.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Write the page**

Create `src/app/timetable/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";

import { requireUserId } from "@/lib/session";
import { getStudentTime } from "@/lib/student-time";
import { listSemestersForUser } from "@/lib/services/semester";
import { listCoursesForUser } from "@/lib/services/course";
import { listMeetingsForUser } from "@/lib/services/meeting";
import { isoWeekday, layoutWeek, pickTerm, termRunsOn } from "@/lib/timetable";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { RunningHead } from "@/components/running-head";
import { WeekGrid } from "@/components/timetable/week-grid";
import { DayList } from "@/components/timetable/day-list";
import { AddMeetingForm } from "@/components/timetable/add-meeting-form";

export const metadata: Metadata = {
  title: "Timetable — Mentra",
};

export default async function TimetablePage({
  searchParams,
}: PageProps<"/timetable">) {
  const userId = await requireUserId();
  const { now } = await getStudentTime();
  const { term: requested } = await searchParams;

  const [semesters, courses, meetings] = await Promise.all([
    listSemestersForUser(userId),
    listCoursesForUser(userId),
    listMeetingsForUser(userId),
  ]);

  const term = pickTerm(
    semesters,
    now,
    typeof requested === "string" ? requested : undefined
  );
  const termCourses = term
    ? courses.filter((course) => course.semesterId === term.id)
    : [];
  const termMeetings = term
    ? meetings.filter((meeting) => meeting.course.semesterId === term.id)
    : [];
  const layout = layoutWeek(termMeetings);
  const todayWeekday = term && termRunsOn(term, now) ? isoWeekday(now) : null;

  const termSwitcher =
    semesters.length > 1 ? (
      <nav aria-label="Terms" className="flex flex-wrap gap-1">
        {semesters.map((semester) => (
          <Link
            key={semester.id}
            href={`/timetable?term=${semester.id}`}
            aria-current={semester.id === term?.id ? "page" : undefined}
            className={cn(
              "rounded-xs px-2.5 py-1 text-xs transition-colors hover:bg-muted",
              semester.id === term?.id && "bg-muted font-medium"
            )}
          >
            {semester.name}
          </Link>
        ))}
      </nav>
    ) : undefined;

  return (
    <AppShell
      title="Timetable"
      lede={term ? `${term.name} · the week, every week of the term.` : "The week, once you have a term."}
      actions={termSwitcher}
    >
      {!term && (
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          A timetable hangs off a term and its courses.{" "}
          <Link href="/courses" className="underline underline-offset-4">
            Add them on Courses
          </Link>{" "}
          first.
        </p>
      )}

      {term && termMeetings.length === 0 && (
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          No class times in {term.name} yet. Add them below, or open a course on
          Courses.
        </p>
      )}

      {termMeetings.length > 0 && (
        <section aria-label={`${term?.name} week`} className="flex flex-col gap-4">
          <WeekGrid layout={layout} todayWeekday={todayWeekday} />
          <DayList layout={layout} todayWeekday={todayWeekday} />
        </section>
      )}

      {termCourses.length > 0 && (
        <section className="flex flex-col gap-4">
          <RunningHead>Add a class time</RunningHead>
          <AddMeetingForm
            idPrefix="timetable-meeting"
            courses={termCourses.map(({ id, name }) => ({ id, name }))}
          />
        </section>
      )}
    </AppShell>
  );
}
```

Check `AppShell`'s `lede` and `actions` prop types in `src/components/app-shell.tsx`; both are used this way on the Courses and Today pages.

- [ ] **Step 5: Add it to the sidebar**

In `src/components/app-sidebar.tsx`, add after Courses in `SECTIONS`:

```ts
  { href: "/timetable", label: "Timetable", icon: "timetable" },
```

and to `paths` in `SectionIcon`:

```tsx
    timetable: (
      <>
        <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" />
        <line x1="2.5" y1="7" x2="15.5" y2="7" />
        <line x1="7" y1="7" x2="7" y2="15.5" />
        <line x1="11" y1="7" x2="11" y2="15.5" />
        <line x1="2.5" y1="11" x2="15.5" y2="11" />
      </>
    ),
```

If the sidebar's active-link logic matches on exact `href`, `/timetable` needs nothing more; if it uses `startsWith`, confirm no other section's `href` is a prefix of it.

- [ ] **Step 6: Verify in the running app**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: PASS. (`PageProps<"/timetable">` is generated by Next's type generation; if `tsc` does not know it yet, run `npx next typegen` once, as `next dev`/`next build` do.)

In the running app:
1. Sidebar shows Timetable under Courses; clicking it highlights it.
2. With the class times from Task 8 in place, the grid shows Monday 09:30–10:50 at the right height, today's column (if the term is running) in `text-now` with the band behind it.
3. Add a Tutorial from the page's own form with a course picked; it appears on the grid without reload. Submitting without a course picked is blocked by the browser (`required`).
4. Add two overlapping classes on one day; they sit side by side.
5. With two terms, the switcher changes `?term=` and the week shown.
6. resize_window to `mobile`: the grid is hidden, the day list shows the same classes. Reset to `desktop`.
7. With a fresh account (no terms), the page says to add them on Courses.
8. Console: no errors, no hydration warnings.

- [ ] **Step 7: Docs and screenshot**

- `docs/frontend.md`: the Timetable page (what it shows, term choice, grid vs. phone list, add form), and the new sidebar entry.
- `docs/architecture.md`: add `/timetable` wherever routes are listed.
- `docs/user-guide.md`: a "Timetable" section.
- Take `docs/screenshots/timetable.jpg` at the same size and theme as the others, and reference it from `README.md` / `docs/user-guide.md` wherever the other page screenshots are shown.

- [ ] **Step 8: Commit**

```bash
git add src/app/timetable src/components/timetable src/components/app-sidebar.tsx docs README.md
git commit -m "feat: a week timetable for the running term

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Today — "Classes today" and "Coming up"

**Files:**
- Create: `src/components/timetable/classes-today.tsx`
- Create: `src/components/coming-up.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `docs/frontend.md`, `docs/user-guide.md`, `docs/screenshots/dashboard.jpg`, `dashboard-dark.jpg`, `dashboard-mobile.jpg`

**Interfaces:**
- Consumes: `classesToday`, `minuteOfDay`, `TimetableMeeting` (Task 5); `comingUp`, `ComingUpDay` (Task 6); `formatClockTime`, `MEETING_KIND_LABELS` (Task 3); `TASK_TYPE_LABELS` (Task 2); `listMeetingsForUser` (Task 4); `listSemestersForUser`.
- Produces: `<ClassesToday meetings nowMinute />`, `<ComingUp days courseNameById />`.

- [ ] **Step 1: Write "Classes today"**

Create `src/components/timetable/classes-today.tsx`:

```tsx
import Link from "next/link";

import { formatClockTime, MEETING_KIND_LABELS } from "@/lib/meeting";
import type { TimetableMeeting } from "@/lib/timetable";
import { cn } from "@/lib/utils";
import { RunningHead } from "@/components/running-head";

/** Today's classes in time order. One that has finished is set in grey. */
export function ClassesToday({
  meetings,
  nowMinute,
}: {
  meetings: TimetableMeeting[];
  nowMinute: number;
}) {
  return (
    <section aria-labelledby="classes-today-heading" className="flex flex-col gap-4">
      <RunningHead
        id="classes-today-heading"
        trailing={
          <Link
            href="/timetable"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Timetable
          </Link>
        }
      >
        Classes today
      </RunningHead>
      <ul className="flex flex-col">
        {meetings.map((meeting) => {
          const ends = meeting.startMinute + meeting.durationMinutes;
          const over = ends <= nowMinute;

          return (
            <li
              key={meeting.id}
              className={cn(
                "flex gap-4 border-b border-rule py-2",
                over && "text-muted-foreground"
              )}
            >
              <span data-figures className="w-28 shrink-0 text-sm">
                {formatClockTime(meeting.startMinute)}–{formatClockTime(ends)}
              </span>
              <span className="text-sm">
                {meeting.course.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {[MEETING_KIND_LABELS[meeting.kind], meeting.location]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {over && <span className="sr-only"> (finished)</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Write "Coming up"**

Create `src/components/coming-up.tsx`:

```tsx
import type { ComingUpDay, UpcomingTask } from "@/lib/coming-up";
import { TASK_TYPE_LABELS } from "@/lib/task";
import { RunningHead } from "@/components/running-head";

/** The next two weeks of work, a day at a time. */
export function ComingUp({
  days,
  courseNameById,
}: {
  days: ComingUpDay<UpcomingTask>[];
  courseNameById: Map<string, string>;
}) {
  return (
    <section aria-labelledby="coming-up-heading" className="flex flex-col gap-4">
      <RunningHead id="coming-up-heading">Coming up</RunningHead>
      <ol className="flex flex-col gap-5">
        {days.map((day) => (
          <li key={day.daysUntil}>
            <h3
              data-figures
              className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
            >
              {day.label}
            </h3>
            <ul className="mt-2 flex flex-col">
              {day.items.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule py-2"
                >
                  <span className="text-sm">
                    {task.title}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {TASK_TYPE_LABELS[task.type]}
                    </span>
                  </span>
                  {task.courseId && (
                    <span className="text-xs text-muted-foreground">
                      {courseNameById.get(task.courseId)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 3: Put them on Today**

In `src/app/dashboard/page.tsx`:
- Import `listMeetingsForUser`, `listSemestersForUser`, `classesToday`, `minuteOfDay`, `comingUp`, `ClassesToday`, `ComingUp`.
- Extend the `Promise.all` with `listMeetingsForUser(userId)` and `listSemestersForUser(userId)` (destructure as `meetings`, `semesters`).
- After it:

```tsx
  const courseNameById = new Map(courses.map((course) => [course.id, course.name]));
  const todaysClasses = classesToday(meetings, semesters, now);
  const upcoming = comingUp(tasks, now);
```

and use `courseNameById` for `TermScore`'s existing `courseNameById` prop instead of building the same map inline.
- Directly after the `{struck && struckFigures ? (…) : (…)}` block, still inside `AppShell`:

```tsx
      {todaysClasses.length > 0 && (
        <ClassesToday meetings={todaysClasses} nowMinute={minuteOfDay(now)} />
      )}

      {upcoming.length > 0 && (
        <ComingUp days={upcoming} courseNameById={courseNameById} />
      )}
```

Both sections are outside the ternary on purpose: a student with classes but no open work still sees today's classes.

- [ ] **Step 4: Verify in the running app**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: PASS.

In the running app, with the data from Tasks 8–9 plus a class on today's weekday (add one if needed) and work due today, in 3 days and in 20 days:
1. `/dashboard` shows "Classes today" with today's class and its time range; a class whose end time has passed is grey.
2. "Coming up" shows Today and the 3-days-out group with the quiz labelled Quiz and its course name; the 20-days-out work is absent; completed work is absent.
3. Complete the quiz from `/tasks`; it leaves Coming up.
4. The Timetable link in the running head goes to `/timetable`.
5. Dark theme and `mobile` width both read correctly. Console clean.

- [ ] **Step 5: Docs and screenshots**

- `docs/frontend.md`: the two new Today sections, where they sit and when they appear.
- `docs/user-guide.md`: what Today shows now.
- Retake `docs/screenshots/dashboard.jpg`, `dashboard-dark.jpg` and `dashboard-mobile.jpg` at their existing sizes.

- [ ] **Step 6: Commit**

```bash
git add src/components src/app/dashboard/page.tsx docs
git commit -m "feat: show today's classes and the next two weeks on Today

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: The assistant reads the timetable

**Files:**
- Modify: `src/lib/ai/tools.ts` (schema, definition)
- Modify: `src/lib/ai/execute.ts` (case)
- Modify: `src/lib/ai/system-prompt.ts` (one routing line)
- Modify: `src/lib/ai/tools.test.ts` (tool list)
- Modify: `src/lib/ai/execute.test.ts` (new describe)
- Modify: `ASSISTANT.md`

**Interfaces:**
- Consumes: `listMeetingsForUser` (Task 4); `weekdayLabel`, `formatClockTime` (Task 3); `listSemestersForUser`.
- Produces: tool `get_timetable` (no arguments) returning `{ id, courseId, courseName, semesterName, kind, day, start, end, location }[]`, where `day` is `"Monday"`…`"Sunday"` and `start`/`end` are `"HH:MM"`.

- [ ] **Step 1: Write the failing tests**

In `src/lib/ai/tools.test.ts`, add `"get_timetable",` to the expected list in "exposes exactly the tools the ticket lists".

In `src/lib/ai/execute.test.ts`, import `createMeetings` from `@/lib/services/meeting`, and add:

```ts
describe("get_timetable — when the student's classes are", () => {
  test("gives each class its course, term, day and times in words", async () => {
    await createMeetings(userId, courseId, {
      kind: "lab",
      weekdays: [2],
      startMinute: 840,
      durationMinutes: 110,
      location: "Lab B",
    });

    const [meeting] = (await run(userId, "get_timetable", {})) as Record<string, unknown>[];

    expect(meeting).toMatchObject({
      courseId,
      courseName: "Network Defence",
      semesterName: "Autumn 2026",
      kind: "lab",
      day: "Tuesday",
      start: "14:00",
      end: "15:50",
      location: "Lab B",
    });
  });
});
```

(`afterEach` already deletes the course, and its meetings cascade with it.)

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/lib/ai`
Expected: FAIL — tool list mismatch; `Unknown tool: get_timetable`.

- [ ] **Step 3: Implement**

In `src/lib/ai/tools.ts`, add to `toolSchemas` after `get_courses`:

```ts
  get_timetable: empty,
```

and to `toolDefinitions` after `get_courses`:

```ts
  {
    name: "get_timetable",
    description:
      "List the student's weekly class times across all of their terms: course, term, kind of class, weekday, start and end time (24-hour, their own clock) and location. Use it for questions about when or where their classes are, or what they have on a given day.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
```

In `src/lib/ai/execute.ts`, import `listMeetingsForUser` from `@/lib/services/meeting` and `formatClockTime, weekdayLabel` from `@/lib/meeting`, and add after the `get_courses` case:

```ts
    case "get_timetable": {
      const [meetings, semesters] = await Promise.all([
        listMeetingsForUser(userId),
        listSemestersForUser(userId),
      ]);
      // Days and times in words, so the model never does clock arithmetic.
      const terms = new Map(semesters.map((term) => [term.id, term.name]));
      return meetings.map((meeting) => ({
        id: meeting.id,
        courseId: meeting.course.id,
        courseName: meeting.course.name,
        semesterName: terms.get(meeting.course.semesterId) ?? null,
        kind: meeting.kind,
        day: weekdayLabel(meeting.weekday, "long"),
        start: formatClockTime(meeting.startMinute),
        end: formatClockTime(meeting.startMinute + meeting.durationMinutes),
        location: meeting.location,
      }));
    }
```

In `src/lib/ai/system-prompt.ts`, in the bullet list of guidance, add:

```
- Class times come from get_timetable. Today's weekday is in the date above;
  use it to answer "what do I have today" rather than guessing.
```

(Match the surrounding indentation and wrap width. If `system-prompt.test.ts` snapshots the prompt, update the snapshot deliberately and read the diff.)

- [ ] **Step 4: Run tests, types and lint**

Run: `npx vitest run src/lib/ai && npx tsc --noEmit && npm run lint`
Expected: PASS, including the existing test that no tool takes a `userId`.

- [ ] **Step 5: Update `ASSISTANT.md`**

- "Six read tools." → "Seven read tools." Add a `get_timetable` bullet: every class time from all terms, with course id and name, term name, kind, weekday name, start and end as `HH:MM` on the student's own clock, location; not capped.
- Add `get_timetable` to the uncapped list in the limits section ("`get_courses`, `get_timetable`, `get_deadlines` and `list_semesters` are not capped").
- "its sixteen tools" → "its seventeen tools".
- Under "What it cannot do", add: **Create, change or remove class times.** `createMeetings`, `updateMeeting` and `deleteMeeting` exist as services but have no tools; the timetable is edited on the Courses and Timetable pages.
- In the privacy section (what is sent to OpenAI), add class times to what the tools can fetch.

- [ ] **Step 6: Verify end to end**

With `OPENAI_API_KEY` set in `.env`, in the running app open a chat and ask "When is my lab this week?" and "What do I have on Monday?". Expected: the answer names the classes and times created in Tasks 8–9, and matches the timetable. Then ask "Add a quiz for Network Security next Friday" and confirm on `/courses` that it appears under that course, typed Quiz. If no API key is available locally, say so in the task report instead of claiming this step passed.

- [ ] **Step 7: Commit**

```bash
git add src/lib/ai ASSISTANT.md
git commit -m "feat: let the assistant read the timetable

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Demo data, final docs pass and full verification

**Files:**
- Modify: `prisma/seed-demo.ts`
- Modify: `docs/known-issues.md` (only if something below is left undone), `docs/README.md` (if it indexes features)

**Interfaces:**
- Consumes: `createMeetings` (Task 4); the seed's existing `COURSES`, `courseIds`, `user.id`, `TASKS`.
- Produces: a demo account with a full week of classes and a quiz.

- [ ] **Step 1: Seed class times and a quiz**

In `prisma/seed-demo.ts`, import `createMeetings` from `../src/lib/services/meeting`. Change the "Anatomy quiz 1" entry's `type` from `"exam"` to `"quiz"`, and add an open quiz:

```ts
  { title: "Pharmacology quiz 2", courseIndex: 0, due: 4, minutes: 30, priority: "medium", type: "quiz" },
```

After the loop that fills `courseIds`, add (adjust `courseIndex` values to the five `COURSES` actually defined):

```ts
/** A plausible week: every course meets, one has a lab, nothing overlaps. */
const MEETINGS: {
  courseIndex: number;
  kind: "lecture" | "lab" | "tutorial" | "seminar" | "other";
  weekdays: number[];
  start: string;
  minutes: number;
  location?: string;
}[] = [
  { courseIndex: 0, kind: "lecture", weekdays: [1, 3], start: "09:00", minutes: 80, location: "Hall A" },
  { courseIndex: 1, kind: "lab", weekdays: [2], start: "13:00", minutes: 170, location: "Sim Suite" },
  { courseIndex: 2, kind: "lecture", weekdays: [2, 4], start: "10:30", minutes: 80, location: "Hall B" },
  { courseIndex: 3, kind: "seminar", weekdays: [4], start: "14:00", minutes: 110, location: "Room 3.12" },
  { courseIndex: 4, kind: "tutorial", weekdays: [5], start: "11:00", minutes: 50 },
];
```

```ts
  for (const meeting of MEETINGS) {
    const [hours, minutes] = meeting.start.split(":").map(Number);
    const created = await createMeetings(user.id, courseIds[meeting.courseIndex], {
      kind: meeting.kind,
      weekdays: meeting.weekdays,
      startMinute: hours * 60 + minutes,
      durationMinutes: meeting.minutes,
      location: meeting.location,
    });
    if (!created.success) throw new Error("Could not seed class times.");
  }
```

Put the `MEETINGS` constant next to the other top-level constants (`COURSES`, `TASKS`) rather than inside the function. Course deletion in the seed's reset already removes meetings (cascade). Update the seed's header comment to say it also replaces class times.

- [ ] **Step 2: Run the seed against the local app database**

Run: `npm run seed:demo` (read the script's header for the account it targets and any confirmation it asks for).
Expected: completes; `/timetable` for the demo account shows the week above.

- [ ] **Step 3: Full verification**

Run each and read the output:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all pass. `npm run build` runs `prisma generate` and applies migrations to the local database first.

Then preview_start `mentra-local-prod` (the production build) and walk the whole feature as the demo account: Courses → expand a course → add a class time and a quiz → Timetable shows it → Today shows today's classes and the quiz under Coming up → complete the quiz on Work → it leaves Coming up → the assistant answers "what classes do I have tomorrow?". Check console and server logs (preview_logs) for errors. Stop the server afterwards.

- [ ] **Step 4: Docs pass**

Read every page under `docs/` plus `README.md`, `ASSISTANT.md` and `PRODUCT.md` for statements the feature made untrue (for example a feature list without the timetable, a "Work types are task, assignment, exam" line, or a known issue about missing class times). Fix each. If anything in this plan was deliberately left out (for example one-off class sessions or due times on coursework), add it to `docs/known-issues.md` or the roadmap only if those pages already track such gaps.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-demo.ts docs README.md PRODUCT.md
git commit -m "chore: seed a demo week of classes and bring the docs in line

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Out of scope

- One-off or cancelled sessions, alternating-week classes (decision 1).
- A due time on work; coursework stays date-only (decision 3).
- Assistant writes to the timetable (decision 6).
- Calendar export (iCal) and notifications.
