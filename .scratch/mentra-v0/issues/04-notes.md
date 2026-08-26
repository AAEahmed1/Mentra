# 04: Notes (CRUD + keyword search)

**What to build:** A student can write, edit, delete, and search their own notes, optionally linked to a course. Search is exact/keyword only in v0 — no embeddings.

**Blocked by:** 01 (parallel with 02/03)

**Status:** implemented

- [x] `Note` model: id, user_id, course_id (nullable, `onDelete: SetNull` so deleting a course keeps the note but unfiles it), title, body, created_at, updated_at
- [x] CRUD via Server Actions — `src/lib/actions/note.ts` wraps the tested service layer (`src/lib/services/note.ts`), same thin-wrapper pattern as tickets 02/03
- [x] Notes list/detail UI (`/notes`) — create via the dashed add-new slot, inline Edit toggle (`useTransition`, not effect-derived state), ghost Remove; note body shown inline on the row so there's no separate detail page to navigate to. Reuses the Card Catalog system per DESIGN.md; added a `Textarea` primitive matching the existing `Input`/`Select` treatment
- [x] Keyword search across title + body — case-insensitive `contains` (Postgres `ILIKE`) over both fields, scoped to the owner; driven by a plain GET form so the query lives in the URL (`/notes?q=…`), shareable and back-button friendly. Blank query returns all notes
- [x] Unit tests for the search query (matches, no false positives on unrelated notes) — `src/lib/services/note.test.ts` covers: title match, body match, case-insensitive match, **no false positive on an unrelated note**, **no leakage of another user's matching note**, and blank-query-returns-all

**Verified live:** create, search (match / unrelated-excluded / case-insensitive body hit / no-match empty state), inline edit, remove — light + dark, desktop + mobile. Build, lint, 79 tests, and the design detector all clean.
