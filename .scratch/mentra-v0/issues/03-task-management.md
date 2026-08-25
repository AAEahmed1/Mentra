# 03: Task management

**What to build:** A student can create tasks (including assignments and exams, distinguished by a `type` field, not separate entities), link them to a course, edit them, mark them complete, and see status persist. This is the core unit the dashboard and AI assistant reason over.

**Blocked by:** 02 (tasks link to `Course`)

**Status:** ready-for-agent

- [ ] `Task` model: id, course_id (nullable), title, description, due_date, priority, estimated_duration, actual_duration, status (`not_started` / `in_progress` / `paused` / `completed` / `overdue` / `cancelled`), type (`task` / `assignment` / `exam`), topics_to_review (text, exam-only)
- [ ] CRUD via Server Actions
- [ ] Task list UI: create, edit, delete, change status; course link optional
- [ ] Completing a task records `actual_duration` if the student provides it
- [ ] `overdue` status derives from `due_date` vs now rather than being manually set
- [ ] Unit tests for status transitions and the overdue derivation
