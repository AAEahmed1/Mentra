# 04: Notes (CRUD + keyword search)

**What to build:** A student can write, edit, delete, and search their own notes, optionally linked to a course. Search is exact/keyword only in v0 — no embeddings.

**Blocked by:** 01 (parallel with 02/03)

**Status:** ready-for-agent

- [ ] `Note` model: id, user_id, course_id (nullable), title, body, created_at
- [ ] CRUD via Server Actions
- [ ] Notes list/detail UI, create/edit/delete
- [ ] Keyword search across title + body using Postgres `ILIKE` or full-text search
- [ ] Unit tests for the search query (matches, no false positives on unrelated notes)
