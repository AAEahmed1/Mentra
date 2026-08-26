# 06: Dashboard — sort function + recommended-for-tonight

**What to build:** The dashboard's core value: a ranked "Recommended for tonight" list built from the student's real tasks, driven by a standalone, testable sort function (not the AI) so it's fast and deterministic.

**Blocked by:** 03 (needs real Task data)

**Status:** implemented

**Design:** No direction round — the pulled-card composition already exists from ticket 08 and DESIGN.md documents it as the system's signature component. This ticket swaps hardcoded example content for real ranked data inside that established surface, which inherits rather than re-decides the visual world.

- [x] Server-side sort function — `rankTasks(tasks, { now, availableMinutes? })` in `src/lib/recommendations.ts`. Ranks by urgency bucket first (overdue / due within 3 days / later / no deadline), then fits-available-time, then priority, then earlier deadline. Excludes completed and cancelled tasks. No dependency graph, no historical-duration weighting
- [x] Vitest unit tests covering overdue-first ordering, priority ties broken by deadline, and too-long-for-available-time deprioritized — plus most-overdue-first, no-deadline-last, resolved-task exclusion, and the reported factors. Fixed dates throughout, no real clock
- [x] Dashboard renders the top result as the pulled card and the next four as filed rows, against real Task data
- [x] Quick actions: add task, add note, and a visibly disabled "Ask Mentra — soon" stub (wired in ticket 07)
- [x] Snapshot line: program, course count, open task count, and how many are due this week

**Why urgency buckets before priority:** the ticket asks for both "deadline proximity" and "priority ties broken by deadline". Sorting on priority first would put a high-priority task due in three weeks above a low-priority one due tomorrow — the wrong answer for a student. Bucketing by urgency first fixes that while still letting priority order things inside a bucket, with the earlier deadline breaking equal-priority ties. There's a test for exactly this case.

**Explainability shipped here, not deferred to the AI:** plan.md puts explainability in v0, and the card carries a "Recommended because…" line. `explainRecommendation` (`src/lib/recommendation-reason.ts`, 11 tests) builds that sentence from the same factors the sort used, so it is deterministic, free, and always consistent with the actual ordering. Ticket 07's assistant reads these same factors when asked "why?" rather than inventing its own reasoning.

**Also added:** `indexTabCode` (`src/lib/course-code.ts`, 6 tests) derives the card's index-tab stamp from the course code (`CYBR 301` → `CYBR`), falling back to name initials. The tab is omitted for a task with no course rather than faked.

**Verified live:** empty state, three tasks ranked overdue → due-today → distant with correct chips and reason text, and completing the top task correctly dropping it from the ranking and promoting the next (which also brought its `CYBR` index tab in). Light + dark, desktop + mobile. Build, lint, 127 tests, detector clean.
