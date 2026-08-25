# 05: Memory table + privacy page

**What to build:** The structural home for Mentra's "understanding of the student" — a flat memory table the student can inspect and clear — plus account deletion. No AI writes to it yet (that lands in ticket 07 via the `save_memory` tool); this ticket delivers the storage, the read/delete UI, and the privacy controls on top of it.

**Blocked by:** 01 (parallel with 02/03/04)

**Status:** ready-for-agent

- [ ] `Memory` model: id, user_id, content, type (`profile` / `commitment` / `learning-state` / `behavioral`), source (`explicit` / `inferred`), created_at
- [ ] Memory list page: view all memories for the current user, delete individual entries
- [ ] Delete-account action: cascades and removes the user's Semester/Course/Task/Note/Memory rows and the auth record
- [ ] Manual seed path (e.g. a dev script or admin form) to create test memory rows, since no writer exists until ticket 07
- [ ] Unit tests for the delete-account cascade (nothing orphaned)
