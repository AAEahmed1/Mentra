# 02: Semester + Course management

**What to build:** A student can create a semester and add courses to it, and see their courses listed. This is the academic container everything else (tasks, notes, the assistant's tools) links against.

**Blocked by:** 01 (needs auth + a logged-in user)

**Status:** implemented

**Deletion policy:** deleting a semester is **blocked** while it still has courses (returns an inline error asking the student to remove them first), rather than cascading. Chosen to avoid silently wiping course data in v0 — courses are cheap to re-add but shouldn't disappear as a side effect of an unrelated cleanup action. Enforced at both the app layer (`deleteSemester` service) and the database layer (`Course.semester` FK is `ON DELETE RESTRICT`).

- [x] `Semester` model (id, user_id, name, start_date, end_date) with CRUD via Server Actions — create/read/update/delete implemented and integration-tested in `src/lib/services/semester.ts`; create/delete wired to Server Actions + UI, update proven at the service layer
- [x] `Course` model (id, semester_id, name, code, professor, credits) with CRUD via Server Actions — full create/read/update/delete tested and wired to UI (inline Edit toggle per course row, matching the delete-button design pattern)
- [x] "Add a course" step reachable from onboarding and from a dedicated courses page — onboarding's Continue/Skip now redirect to `/courses` instead of `/dashboard`; `/courses` is also linked from the dashboard header
- [x] Course list UI shows all courses for the current semester
- [x] Deleting a semester cascades or blocks deletion if it has courses (pick one, document the choice) — blocks, see above
- [x] Unit tests for the Server Actions (create/read/update/delete for both models) — integration tests in `src/lib/services/semester.test.ts` and `src/lib/services/course.test.ts`, run against the real dev Postgres DB with fixture cleanup
