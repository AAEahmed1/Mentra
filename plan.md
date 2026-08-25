# Mentra — Plan

## Product summary

Mentra is a personal academic operating system: it builds a persistent, evolving understanding of a student (program, courses, deadlines, strengths, weaknesses, habits) and uses that understanding to tell them what to do next — not just store their data.

Core loop: **Understand → Organize → Plan → Execute → Learn → Remember → Improve**.

Guiding principles (carried into every later phase, not just v0):
- Understand, don't just store.
- Recommend, don't just display.
- Remember, don't just retain chat history.
- Explain, don't just decide.
- The database is the source of truth; the AI never invents facts, it reads and proposes changes through tools.
- Program-agnostic data model, even though the first real user (the builder) is a cybersecurity student and will be used to seed/test it.

## Staging strategy

The full vision (35 sections) is too much for a first build. Work proceeds in four stages:

- **v0** — smallest slice that tests the core hypothesis ("does an AI that understands my academic context help me get more done?"). Trimmed even below the doc's own MVP list.
- **v1 (MVP)** — the doc's full section 30 list: adds back the Program → Year → Semester hierarchy, stored goals/availability, a real scheduling engine, per-page AI embedding.
- **v2** — doc section 31: document uploads, semantic search, course materials, study sessions, learning-state tracking, assignment breakdown, intelligent rescheduling, calendar integration, flashcards, quizzes, academic analytics.
- **v3** — doc section 32: proactive recommendations, risk detection, behavioral learning, advanced scheduling, research assistant, advanced memory, personalized tutoring, external integrations, adaptive study planning.

This document specs **v0** in detail and lists v1–v3 at a high level as the roadmap.

## Tech stack (v0)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript) — single deployable app, no separate backend service |
| Data fetching / mutations | React Server Components for reads, Server Actions for writes. No client state library (Redux/Zustand/React Query) at this scale. |
| Database | Postgres via Supabase |
| ORM | Prisma |
| Auth | Better Auth, email/password + Google OAuth, Prisma adapter |
| AI provider | OpenAI API (GPT-4o or GPT-4.1), function/tool calling — **API key to be supplied later**, wire up via `OPENAI_API_KEY` env var |
| UI | Tailwind CSS + shadcn/ui |
| Hosting | Vercel (app) + Supabase (DB) |
| Testing | Vitest for unit/logic tests (sort function, tool-call validation) now; Playwright e2e deferred until UI stabilizes past v0 |

pgvector/embeddings are **not** used in v0 — semantic search and document embeddings are a v2 feature per the doc's own roadmap. v0 search is exact/keyword (Postgres `ILIKE` / full-text).

## Data model (v0)

Flat structure — no Program/Year layer yet (that's v1).

- **User** — id, name, program (free text), institution (optional), email, auth fields.
- **Semester** — id, user_id, name, start_date, end_date.
- **Course** — id, semester_id, name, code, professor, credits.
- **Task** — id, course_id (nullable), title, description, due_date, priority, estimated_duration, actual_duration, status (not_started / in_progress / paused / completed / overdue / cancelled), type (`task` / `assignment` / `exam`), topics_to_review (text, exam-only use).
  - No separate Assignment or Exam entity in v0 — `type` discriminates. No auto-milestone-breakdown yet (that needs the `create_plan` tool, deferred to v2).
- **Note** — id, user_id, course_id (nullable), title, body, created_at.
- **Memory** — id, user_id, content, type (`profile` / `commitment` / `learning-state` / `behavioral`), source (`explicit` / `inferred`), created_at.
  - No confidence score, no expiration, no embeddings in v0 — that tiering is v2+ (doc sections 15–16).

## Onboarding (v0)

Name is collected at sign-up (required by Better Auth's account model). After that, a minimal first-run step: program (free text), institution — both optional/skippable, plus add one course. Everything else (goals, weekly availability) is skipped — the student can skip optional questions per the doc's own principle (section 4), and v0's scheduling doesn't consume goals or a stored availability profile anyway.

## Scheduling (v0)

No standalone scheduling engine module. One server-side function sorts open tasks by deadline proximity, priority, and estimated duration. No dependency graph, no historical-duration-based estimation yet (that needs accumulated actual-vs-estimated data first).

Availability is handled ad-hoc: the student tells the assistant how much time they have right now (chat), and the assistant re-sorts/re-recommends against that number live. A persistent weekly-availability profile is a v1/v2 add.

## AI assistant (v0)

- **One general-purpose assistant**, no specialized modes yet (Tutor/Planner/Study Coach/etc. from doc section 14 are a v2/v3 split, once there's enough behavioral data to differentiate them).
- **UI placement**: single persistent chat panel (e.g. slide-out from the dashboard), not embedded per-page. It still has full tool access, so it can answer "why is X due tomorrow" by name. Per-page embedding (a "Why?" button next to each individual recommendation) is v1/v2 polish.
- **Tools available (v0)**: `get_courses`, `get_tasks`, `get_deadlines`, `create_task`, `update_task`, `complete_task`, `search_memory`, `search_notes`.
  - Deferred to v2 (need data that doesn't exist yet in v0): `analyze_progress`, `identify_weak_topics`, `create_study_session`, `schedule_task`, `create_plan`, `get_course_materials`.
- **Context engine**: no separate pre-assembly module in v0 — the OpenAI tool-calling loop itself is the context engine (the model calls tools as needed per turn). A dedicated context-assembly layer (doc section 18) becomes worth building once token cost/relevance actually becomes a problem.
- **Explainability**: included in v0. Recommendations state their factors (deadline, priority, estimated time) directly — cheap to build, core to the product's differentiation from day one (doc sections 20, 26, 35).
- **Source of truth**: the AI never stores or invents deadlines/progress/status — it reads them through tools and proposes changes through tools (`create_task`/`update_task`/`complete_task`), the app validates and executes.

## Dashboard (v0)

- Greeting.
- Snapshot: active courses, upcoming deadlines (sorted tasks).
- "Recommended for tonight" list (top N tasks from the sort function), each explainable via the assistant.
- Quick actions: add task, start chat, add note.

## Privacy (v0)

- Memory list page: view + delete individual memory rows (cheap, since Memory is a flat table).
- Delete-account action.
- Deferred to v1/v2: data export, per-integration access controls (no third-party integrations exist yet).

## Non-goals for v0 (explicitly deferred)

- Program → Academic Year → Semester hierarchy (v1: flat Semester → Course only)
- Stored goals, stored weekly availability (v1)
- Real scheduling engine with dependencies/risk scoring (v1/v2)
- Document uploads, embeddings, semantic search (v2)
- Course materials, study sessions, learning-state tracking (v2)
- Assignment auto-breakdown into milestones (v2)
- Intelligent rescheduling, calendar integration (v2)
- Flashcards, quizzes (v2)
- Academic analytics dashboards (v2)
- Proactive/risk-detection notifications, behavioral learning, research assistant, advanced memory (confidence/expiration/inference tiers), personalized tutoring, external integrations, adaptive planning (v3)
- Specialized AI modes (Tutor/Planner/Analyst/etc.) — v0 ships one general assistant (v2/v3)
- Per-page embedded AI ("Why?" buttons everywhere) — v0 ships one chat panel (v1/v2)

## Open items

- OpenAI API key — to be supplied by the user before the AI assistant can be wired up and tested end-to-end.
- Everything else above is settled; ready to move from plan to implementation tickets.
