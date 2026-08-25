# 02: Semester + Course management

**What to build:** A student can create a semester and add courses to it, and see their courses listed. This is the academic container everything else (tasks, notes, the assistant's tools) links against.

**Blocked by:** 01 (needs auth + a logged-in user)

**Status:** ready-for-agent

- [ ] `Semester` model (id, user_id, name, start_date, end_date) with CRUD via Server Actions
- [ ] `Course` model (id, semester_id, name, code, professor, credits) with CRUD via Server Actions
- [ ] "Add a course" step reachable from onboarding and from a dedicated courses page
- [ ] Course list UI shows all courses for the current semester
- [ ] Deleting a semester cascades or blocks deletion if it has courses (pick one, document the choice)
- [ ] Unit tests for the Server Actions (create/read/update/delete for both models)
