# 06: Dashboard — sort function + recommended-for-tonight

**What to build:** The dashboard's core value: a ranked "Recommended for tonight" list built from the student's real tasks, driven by a standalone, testable sort function (not the AI) so it's fast and deterministic.

**Blocked by:** 03 (needs real Task data)

**Status:** ready-for-agent

**Design:** Invoke the `impeccable` skill for the dashboard's recommended-list UI — this is the product's primary "what matters right now" surface (see [plan.md](../../../plan.md) section on Dashboard).

- [ ] Server-side sort function: ranks open tasks by deadline proximity, priority, and estimated_duration relative to a stated available-time input; no dependency graph, no historical-duration weighting yet
- [ ] Vitest unit tests for the sort function covering: overdue-first ordering, priority ties broken by deadline, tasks longer than available time deprioritized
- [ ] Dashboard "Recommended for tonight" section renders the top N results against real Task data
- [ ] Quick actions on the dashboard: add task, add note, (chat entry point stubbed, wired in 07)
- [ ] Snapshot section: active courses, upcoming deadlines count
