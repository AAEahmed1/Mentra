# Domain logic

The rules that decide what Mentra shows: how work is ranked, when it counts as overdue, how dates and labels are worked out, and what each form accepts. All of this lives in pure modules under `src/lib/` with unit tests beside them, so it can be reasoned about without a database.

- [The recommendation engine](#the-recommendation-engine)
- [The "why" sentence](#the-why-sentence)
- [Status and overdue](#status-and-overdue)
- [Dates and labels](#dates-and-labels)
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
   | `overdue` | Due date is before today (UTC calendar day) and the task is open |
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

A task's stored status is one of `not_started`, `in_progress`, `paused`, `completed` or `cancelled`. **Overdue is never stored.** [`getEffectiveStatus(status, dueDate, now)`](../src/lib/task-status.ts) returns `"overdue"` for open work whose due date's UTC calendar day is before today's, and the stored status otherwise.

- Work due this morning is not overdue at noon.
- Work due at 23:59 yesterday is overdue at 00:30 today.
- Completed and cancelled work is never overdue.

## Dates and labels

**Calendar days, in UTC.** Every "days until due" calculation compares the UTC calendar date of the deadline with the UTC calendar date of now, rounding to whole days. Comparing elapsed hours would make a task due at midnight read "1 day over" by lunchtime on its due day. The downside is that the day boundary is UTC midnight, not the student's own; see [known-issues.md](known-issues.md).

Date-only inputs from forms (`2026-09-30`) are parsed as UTC midnight, which fits this model.

| Function | File | Output |
| --- | --- | --- |
| `dueLabel(days)` | `due-label.ts` | "No deadline", "2 days over", "Today", "Tomorrow", "5 days" |
| `countdown(days)` | `due-label.ts` | `{ figure, word }` for the big number on today's entry: "4 / days over", "0 / due today", "5 / days left", "— / no date" |
| `greetingForHour(hour)` | `greeting.ts` | "Good night" before 05:00, "Good morning" before 12:00, "Good afternoon" before 18:00, otherwise "Good evening" |
| `toWorkOptions(tasks, courseNames, now)` | `work-options.ts` | The "About a piece of work" picker on the Notes page: open work only, soonest first, labelled like "Clinical Pharmacology · due tomorrow" |
| `buildSampleTerm(now)` | `landing-sample.ts` | The landing page's example term: five architecture courses and eight pieces of work dated relative to today, ranked with the real engine |

The greeting uses the hour of the server's clock, which is UTC on Vercel.

## Validation rules

Every form is parsed by a zod schema in `src/lib/`. Each `parseXInput()` function returns either `{ success: true, data }` or `{ success: false, errors: string[] }`, and the form displays the errors.

Unless stated otherwise, text is trimmed and a blank optional field becomes `undefined`, meaning "not given". The profile form is the exception: there a blank field becomes `null`, meaning "clear it".

### Work (`task.ts`)

| Field | Rule |
| --- | --- |
| `title` | Required |
| `description` | Optional |
| `dueDate` | Optional; must be a valid date |
| `priority` | `low`, `medium` or `high`; default `medium` |
| `estimatedDuration` | Optional whole number of minutes, 0 or more |
| `type` | `task`, `assignment` or `exam`; default `task` |
| `topicsToReview` | Optional |
| `courseId` | Optional; must be one of the student's courses (checked in the service) |

Status is not part of this schema. It changes through the edit form's status field, the Complete button, or the assistant.

### Semesters (`semester.ts`)

- `name` required.
- `startDate` and `endDate` required and valid; `endDate` must be strictly after `startDate`.
- A semester with courses cannot be deleted ("Remove its courses before deleting this semester.").

### Courses (`course.ts`)

- `name` required.
- `code` and `professor` optional.
- `credits` optional whole number.

### Notes (`note.ts`)

- `title` and `body` required.
- `courseId` and `taskId` optional; both must belong to the student (checked in the service).

### Memories (`memory.ts`)

- `content` required.
- `type` required: `profile`, `commitment`, `learning_state` or `behavioral`.
- `source`: `explicit` or `inferred`; default `explicit` for memories added by hand.

### Onboarding (`onboarding.ts`)

`program` and `institution`, both optional.

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
| `semester.ts` | `createSemesterAction`, `deleteSemesterAction` | `/courses` |
| `course.ts` | `createCourseAction`, `updateCourseAction`, `deleteCourseAction` | `/courses` |
| `task.ts` | `createTaskAction`, `updateTaskAction`, `completeTaskAction`, `deleteTaskAction` | `/tasks` |
| `note.ts` | `createNoteAction`, `updateNoteAction`, `deleteNoteAction` | `/notes`, `/dashboard`, `/tasks` |
| `memory.ts` | `createMemoryAction`, `deleteMemoryAction`, `deleteAccountAction` | `/privacy`; account deletion redirects to `/sign-in` |
| `onboarding.ts` | `completeOnboardingAction` | Redirects to `/courses` |
| `profile.ts` | `updateProfileAction`, `changePasswordAction` | Profile updates revalidate every page, because the name appears in the greeting |
| `conversation.ts` | `startConversationAction`, `deleteConversationAction` | Redirect to `/chats/[id]` or `/chats` |

Returned state shapes:

- Most form actions return `{ errors: string[] }`.
- Profile and password actions return `{ errors: string[], saved: boolean }`, so the form can show "Saved."
- Semester and account deletion return `{ error: string | null }`.
- Row buttons (complete, delete, forget) return nothing.

Notable behaviour:

- **Deleting an account** requires typing `DELETE` exactly. `deleteAccount()` removes notes, work, memories, courses, semesters and the user in one transaction; sessions, sign-in accounts, conversations and messages go with the user by cascade.
- **Changing a password** calls Better Auth's `changePassword` with `revokeOtherSessions: true`. Other devices are signed out and this device gets a fresh session. A wrong current password shows "Current password is incorrect."

## Client helpers

[`use-row-actions.ts`](../src/lib/use-row-actions.ts) provides the hooks the list rows use:

- **`useInlineEdit(action)`** opens and closes a row's edit form, keeping it open with errors when saving fails.
- **`useRowAction(action)`** runs a one-field action, such as Complete or Remove, in a transition. It ignores errors.
- **`useQuickForm(action)`** clears a small form after a successful save by remounting it, and keeps the typed text when saving fails.

[`assistant-thread.ts`](../src/lib/assistant-thread.ts) is the client store shared by the assistant panel and the chat pages; see [ASSISTANT.md](../ASSISTANT.md).
