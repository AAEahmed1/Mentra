# 05: Memory table + privacy page

**What to build:** The structural home for Mentra's "understanding of the student" — a flat memory table the student can inspect and clear — plus account deletion. No AI writes to it yet (that lands in ticket 07 via the `save_memory` tool); this ticket delivers the storage, the read/delete UI, and the privacy controls on top of it.

**Blocked by:** 01 (parallel with 02/03/04)

**Status:** implemented

- [x] `Memory` model: id, user_id, content, type (`profile` / `commitment` / `learning_state` / `behavioral`), source (`explicit` / `inferred`), created_at. Enum member is `learning_state` rather than `learning-state` — Prisma enum values can't contain hyphens; the UI renders it as "Learning state"
- [x] Memory list page (`/privacy`): every memory for the current user, each with a ghost "Forget" control. Rows show provenance in the vision doc's own language — "You told me" vs "I inferred" (doc §27) — so an inferred guess never reads as something the student said
- [x] Delete-account action: removes Semester/Course/Task/Note/Memory plus the Better Auth session/account rows, then the user. Guarded by a typed `DELETE` confirmation and styled `destructive` per DESIGN.md's Destructive Weight Matches Consequence rule
- [x] Manual seed path: an "Add a memory" form on `/privacy` (content + type + source). Ticket 07's `save_memory` tool will write the same rows; until then this is how they get created
- [x] Unit tests for the delete-account cascade (nothing orphaned) — `src/lib/services/account.test.ts` seeds a user owning a row in *every* referencing table, then asserts all seven counts are zero afterwards, plus a second user's data survives untouched

**Cascade note (found by the test, not by reading the schema):** the naive `prisma.user.delete()` fails with `Foreign key constraint violated on the constraint: course_semesterId_fkey`. Ticket 02 deliberately made `Course.semester` `onDelete: Restrict` so a semester can't silently take its courses with it — which also means deleting a user does *not* cascade through Semester → Course. `deleteAccount` therefore deletes in explicit dependency order (notes, tasks, memories, courses, semesters, user) inside a `$transaction`, so a partial failure leaves the account intact rather than half-deleted.

**Also fixed here (regression this ticket's nav link exposed):** the page header had been duplicated across five pages, accumulating a link per ticket. At 375px it overflowed to 464px and scrolled the document horizontally — a design-floor violation. Extracted `src/components/app-header.tsx` as the single source, which wraps instead of overflowing and omits the link for the current page. Desktop layout unchanged.

**Verified live:** add memory, forget memory, empty state, delete-account guard rejecting a lowercase `delete` — light + dark, desktop + mobile (375px overflow confirmed gone: `scrollWidth === clientWidth`). Build, lint, 93 tests, and the design detector all clean.
