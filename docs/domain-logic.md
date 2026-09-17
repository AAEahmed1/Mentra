# Domain logic

The rules that decide what Mentra shows: how work is ranked, when it counts as overdue, how dates and labels are worked out, and what each form accepts. All of this lives in pure modules under `src/lib/` with unit tests beside them, so it can be reasoned about without a database.

- [The recommendation engine](#the-recommendation-engine)
- [The "why" sentence](#the-why-sentence)
- [Status and overdue](#status-and-overdue)
- [Dates and time zones](#dates-and-time-zones)
- [Validation rules](#validation-rules)
- [Server actions](#server-actions)
- [Client helpers](#client-helpers)

## The recommendation engine

[`src/lib/recommendations.ts`](../src/lib/recommendations.ts) decides what the student should work on. The dashboard, the landing page's example term and the assistant's `get_deadlines` tool all use it, so they always agree.

```ts
rankTasks(tasks: RankableTask[], options: { now: Date; availableMinutes?: number }): RankedTask[]
```

`RankableTask` needs only `id`, `title`, `status`, `priority`, `dueDate` and `estimatedDuration`, which keeps ranking independent of Prisma.

There is no numeric score. Ranking is an ordered comparison:

1. **Remove closed work.** Tasks that are `completed` or `cancelled` are dropped. Paused and in-progress work stays.
2. **Group by urgency.**

   | Urgency | Rule |
   | --- | --- |
   | `overdue` | Due date is before today on the student's calendar (closed work was already removed) |
   | `due_soon` | Due today or within the next 3 days (`DUE_SOON_DAYS = 3`) |
   | `upcoming` | Due in 4 or more days |
   | `someday` | No due date |

   Groups are ordered overdue, due soon, upcoming, someday.
3. **Within the overdue group**, the task that is most overdue comes first.
4. **Fit to available time.** When the student has said how much time they have (`?minutes=` on the dashboard, `availableMinutes` for the assistant), work whose estimate fits comes before work that does not. Work with no estimate counts as fitting. Work that doesn't fit moves down within its group but is never hidden.
5. **Priority:** high, then medium, then low.
6. **Earlier due date.** Undated work sorts last.
7. **Otherwise, input order.** The sort is stable, and the dashboard passes work newest first.

Some consequences:

- Urgency beats priority. A low-priority task due tomorrow ranks above a high-priority task due in three weeks.
- Within "due soon", priority beats the exact date. A high-priority task due in three days ranks above a low-priority task due today.
- When time is limited, fit beats priority. With 30 minutes, a 20-minute low-priority task ranks above a 3-hour high-priority task in the same group.

Each result carries the factors behind its position:

```ts
type RankFactors = {
  urgency: "overdue" | "due_soon" | "upcoming" | "someday";
  daysUntilDue: number | null;       // calendar days; negative when overdue
  priority: "low" | "medium" | "high";
  estimatedDuration: number | null;  // minutes
  fitsAvailableTime: boolean | null; // null when no time was given
};
```

### Available minutes

The dashboard's time selector writes `?minutes=15|30|60|90`. `parseAvailableMinutes()` in [`available-minutes.ts`](../src/lib/available-minutes.ts) accepts only a single whole number from 1 to 1440; anything else (a decimal, text, a repeated parameter, zero, more than a day) is ignored and the ranking behaves as if no time was given.

## The "why" sentence

[`explainRecommendation(factors)`](../src/lib/recommendation-reason.ts) turns the factors into one sentence. No model is involved. It combines:

1. **Timing** (always): "it has no deadline", "it's 3 days overdue", "it's due today", "it's due tomorrow" or "it's due in 5 days".
2. **Priority** (only when not medium): "you marked it high priority" or "you marked it low priority".
3. **Duration**: "the 180 min estimate is longer than the time you have" when it doesn't fit, otherwise "you estimated 45 min" when there is an estimate.

The parts are joined as "a, b and c":

> Recommended because it's 4 days overdue and you estimated 75 min.

> Recommended because it's due in 3 days, you marked it high priority and the 180 min estimate is longer than the time you have.

## Status and overdue

A task's stored status is one of `not_started`, `in_progress`, `paused`, `completed` or `cancelled`. **Overdue is never stored.** [`getEffectiveStatus(status, dueDate, now)`](../src/lib/task-status.ts) returns `"overdue"` for open work whose due date is before today on the student's calendar, and the stored status otherwise.

- Work due this morning is not overdue at noon.
- Work due at 23:59 yesterday is overdue at 00:30 today.
- Completed and cancelled work is never overdue.

## Dates and time zones

**Calendar days on the student's calendar.** Due dates are calendar dates, stored as UTC midnight (a form's `2026-09-30` is parsed that way). "Now" is converted once per request into the student's wall-clock time, expressed as a UTC `Date`, and every day calculation compares the UTC calendar fields of both with `calendarDaysUntil(date, now)` in [`task-status.ts`](../src/lib/task-status.ts). Comparing whole days rather than elapsed hours means a task due today stays "due today" all day instead of reading "1 day over" by lunchtime.

How the student's clock is found:

1. `TimeZoneSync` (`src/components/time-zone-sync.tsx`), mounted in the root layout, reads the browser's IANA time zone and stores it in the `mentra-tz` cookie. When the cookie is new or has changed, it refreshes the page once.
2. `getStudentTime()` (`src/lib/student-time.ts`) reads the cookie on the server and returns `{ now, timeZone }`, where `now` is `studentClock(new Date(), timeZone)` from [`timezone.ts`](../src/lib/timezone.ts). An unknown or missing zone falls back to UTC.
3. Pages and the assistant route pass that `now` to ranking, overdue checks, labels and the greeting (`greetingForHour(now.getUTCHours())`), and format it with `timeZone: "UTC"` to show the student's own date.
4. Real timestamps from the database, such as when a note or memory was written, are formatted with the student's `timeZone` instead.

A clock `Date` is only for comparing and displaying days and hours. Never store it or compare it with database timestamps without converting those through `studentClock` first.

| Function | File | Output |
| --- | --- | --- |
| `dueLabel(days)` | `due-label.ts` | "No deadline", "2 days over", "Today", "Tomorrow", "5 days" |
| `countdown(days)` | `due-label.ts` | `{ figure, word }` for the big number on today's entry: "4 / days over", "0 / due today", "5 / days left", "— / no date" |
| `greetingForHour(hour)` | `greeting.ts` | "Good night" before 05:00, "Good morning" before 12:00, "Good afternoon" before 18:00, otherwise "Good evening" |
| `toWorkOptions(tasks, courseNames, now)` | `work-options.ts` | The "About a piece of work" picker on the Notes page: open work only, soonest first, labelled like "Clinical Pharmacology · due tomorrow" |
| `buildSampleTerm(now)` | `landing-sample.ts` | The landing page's example term: five architecture courses and eight pieces of work dated relative to today, ranked with the real engine |

The greeting uses the hour on the student's clock.

## Validation rules

Every form is parsed by a zod schema in `src/lib/`. Each `parseXInput()` function returns either `{ success: true, data }` or `{ success: false, errors: string[] }`, and the form displays the errors.

Shared helpers live in [`form-values.ts`](../src/lib/form-values.ts). Text is trimmed and length-checked. How a blank field is read depends on the form:

- **Create forms** (`parseTaskInput`, `parseNoteInput`, `parseCourseInput`, ...): a missing or blank optional field becomes `undefined`, meaning "not given".
- **Edit forms** (`parseTaskUpdate`, `parseNoteUpdate`, `parseCourseUpdate`): a blank field becomes `null`, meaning "clear it", while a field missing from the form stays `undefined` and is left unchanged. This is how choosing "No course" or emptying a due date on an edit form actually clears it.
- **Profile**: a blank field becomes `null`.

### Work (`task.ts`)

| Field | Rule |
| --- | --- |
| `title` | Required, up to 200 characters |
| `description` | Optional, up to 2,000 characters |
| `dueDate` | Optional; must be a valid date |
| `priority` | `low`, `medium` or `high`; default `medium` |
| `estimatedDuration` | Optional whole number of minutes, 0 to 10,080 (a week) |
| `type` | `task`, `assignment` or `exam`; default `task` |
| `topicsToReview` | Optional, up to 1,000 characters |
| `courseId` | Optional; must be one of the student's courses (checked in the service on create and update) |

The edit form (`parseTaskUpdate`) also accepts `status`, which must be one of the five statuses, and `actualDuration`, with the same rule as the estimate. Completing work from its row (`parseTaskCompletion`) accepts an optional `actualDuration`.

### Semesters (`semester.ts`)

- `name` required, up to 120 characters.
- `startDate` and `endDate` required and valid (a blank or missing field is reported as required); `endDate` must be strictly after `startDate`.
- A semester with courses cannot be deleted ("Remove its courses before deleting this semester.").

### Courses (`course.ts`)

- `name` required, up to 120 characters.
- `code` optional, up to 30 characters; `professor` optional, up to 120.
- `credits` optional whole number from 0 to 999.

### Notes (`note.ts`)

- `title` required, up to 200 characters; `body` required, up to 20,000.
- `courseId` and `taskId` optional; both must belong to the student (checked in the service).

### Memories (`memory.ts`)

- `content` required, up to 1,000 characters.
- `type` required: `profile`, `commitment`, `learning_state` or `behavioral`.
- `source`: `explicit` or `inferred`; default `explicit` for memories added by hand.

### Onboarding (`onboarding.ts`)

`program` and `institution`, both optional, up to 120 characters each.

### Profile (`profile.ts`)

| Field | Rule |
| --- | --- |
| `name` | Required, 1 to 100 characters |
| `program`, `institution` | Optional, up to 120 characters; blank clears the value |

### Password change (`profile.ts`)

| Field | Rule |
| --- | --- |
| `currentPassword` | Required |
| `newPassword` | 8 to 128 characters (`MIN_PASSWORD_LENGTH`, `MAX_PASSWORD_LENGTH`); not trimmed |
| `confirmPassword` | Must match `newPassword` |
| | `newPassword` must differ from `currentPassword` |

Better Auth checks the length again and verifies the current password.

## Server actions

All mutations from the interface go through `"use server"` functions in [`src/lib/actions/`](../src/lib/actions). Each one starts with `requireUserId()`, so a signed-out request is redirected to `/sign-in`, and passes that id to a service that scopes the query.

| File | Actions | Revalidates or redirects |
| --- | --- | --- |
| `semester.ts` | `createSemesterAction`, `deleteSemesterAction` | `/courses`, `/dashboard` |
| `course.ts` | `createCourseAction`, `updateCourseAction`, `deleteCourseAction` | `/courses`, `/dashboard`, `/tasks`, `/notes` |
| `task.ts` | `createTaskAction`, `updateTaskAction`, `completeTaskAction`, `deleteTaskAction` | `/tasks`, `/dashboard`, `/notes` |
| `note.ts` | `createNoteAction`, `updateNoteAction`, `deleteNoteAction` | `/notes`, `/dashboard`, `/tasks` |
| `memory.ts` | `createMemoryAction`, `deleteMemoryAction` | `/privacy` |
| `account.ts` | `deleteAccountAction` | Redirects to `/sign-in` |
| `onboarding.ts` | `completeOnboardingAction` | Revalidates `/profile`, redirects to `/courses` |
| `profile.ts` | `updateProfileAction`, `changePasswordAction` | Profile updates revalidate every page, because the name appears in the greeting |
| `conversation.ts` | `startConversationAction`, `deleteConversationAction` | Redirect to `/chats/[id]` or `/chats` |

Returned state shapes:

- Most form actions return `{ errors: string[] }`.
- Profile and password actions return `{ errors: string[], saved: boolean }`, so the form can show "Saved."
- Semester and account deletion return `{ error: string | null }`.
- Row buttons (complete, remove, forget) return `RowActionResult`, `{ error: string | null }` from [`action-state.ts`](../src/lib/action-state.ts), and the row prints the error when something didn't happen (for example, it was already removed).

Notable behaviour:

- **Deleting an account** requires typing `DELETE` exactly. `deleteAccount()` removes notes, work, memories, courses, semesters and the user in one transaction; sessions, sign-in accounts, conversations and messages go with the user by cascade.
- **Changing a password** calls Better Auth's `changePassword` with `revokeOtherSessions: true`. Other devices are signed out and this device gets a fresh session. A wrong current password shows "Current password is incorrect."

## Client helpers

[`use-row-actions.ts`](../src/lib/use-row-actions.ts) provides the hooks the list rows use:

- **`useInlineEdit(action)`** opens and closes a row's edit form, keeping it open with errors when saving fails.
- **`useRowAction(action)`** runs a one-field action, such as Complete or Remove, in a transition, and keeps the action's `error` for the row to show.
- **`useQuickForm(action)`** clears a small form after a successful save by remounting it, and keeps the typed text when saving fails.

[`ConfirmAction`](../src/components/confirm-action.tsx) wraps removals: the first press asks "Remove for good?", the second carries it out, and Escape or **Keep** backs out.

[`assistant-thread.ts`](../src/lib/assistant-thread.ts) is the client store shared by the assistant panel and the chat pages; see [ASSISTANT.md](../ASSISTANT.md).
