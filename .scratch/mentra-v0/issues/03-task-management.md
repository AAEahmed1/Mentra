# 03: Task management

**What to build:** A student can create tasks (including assignments and exams, distinguished by a `type` field, not separate entities), link them to a course, edit them, mark them complete, and see status persist. This is the core unit the dashboard and AI assistant reason over.

**Blocked by:** 02 (tasks link to `Course`)

**Status:** implemented

**Note:** plan.md's schema sketch for Task omits a `user_id`, but since `course_id` is nullable (a task need not belong to a course), Task needs its own direct `userId` for ownership — otherwise a course-less task would have no owner to scope it to. Added.

- [x] `Task` model: id, user_id, course_id (nullable), title, description, due_date, priority (low/medium/high, default medium), estimated_duration, actual_duration, status (`not_started` / `in_progress` / `paused` / `completed` / `cancelled` — persisted; `overdue` is derived, see below), type (`task` / `assignment` / `exam`, default task), topics_to_review (exam-only use, not DB-enforced)
- [x] CRUD via Server Actions — full create/read/update/delete tested (`src/lib/services/task.test.ts`, integration tests against the real dev Postgres DB) and wired to UI (`/tasks`), matching ticket 02's create/edit/delete pattern (dashed add-new slot, inline Edit toggle, ghost Remove — task deletion is low-stakes/reversible like course removal, not destructive-styled like semester deletion)
- [x] Task list UI: create, edit, delete, change status; course link optional — course picker is a plain `<select>` populated from `listCoursesForUser` (added to the course service alongside the existing per-semester lister)
- [x] Completing a task records `actual_duration` if the student provides it — `completeTask(userId, taskId, actualDuration?)` only writes `actualDuration` when the caller supplies one; the quick "Complete" row action completes without it, the edit form lets the student set it directly
- [x] `overdue` status derives from `due_date` vs now rather than being manually set — `not_started`/`in_progress`/`paused` past their due date display as "Overdue" (reusing the dashboard's rust tab-due chip, no new status color introduced); `completed`/`cancelled` are never shown as overdue even past due. Pure function `getEffectiveStatus(status, dueDate, now)` in `src/lib/task-status.ts`, DB status stays untouched
- [x] Unit tests for status transitions and the overdue derivation — `src/lib/task-status.test.ts` (8 cases, fixed dates, no clock flakiness) plus status-change coverage in the service integration tests
