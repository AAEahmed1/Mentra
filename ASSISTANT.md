# The Mentra assistant

What "Ask Mentra" can and cannot do, and the limits it runs under.

> **Keep this current.** Any change to `src/lib/ai/` — a tool added, removed or
> reshaped, a system-prompt edit, a change to the round limit, history window or
> model — must be reflected here in the same commit. This file is the answer to
> "what can the assistant actually do?", and a stale answer is worse than none.

## Where it lives

| Concern | File |
| --- | --- |
| Tool schemas and validation | `src/lib/ai/tools.ts` |
| Tool execution against the services | `src/lib/ai/execute.ts` |
| System prompt, rebuilt each turn | `src/lib/ai/system-prompt.ts` |
| The OpenAI client | `src/lib/ai/openai.ts` |
| The turn loop (tool rounds, recovery) | `src/lib/ai/chat.ts` |
| Stored conversation | `src/lib/services/message.ts` |
| HTTP entry point and session binding | `src/app/api/assistant/route.ts` |
| The panel itself | `src/components/assistant/assistant-panel.tsx` |

Thirteen tools, six read and seven write.

## What it can read

- **`get_courses`** — the student's courses, with code, professor and credits.
- **`get_tasks`** — all work, optionally filtered by status or course. Each item
  carries title, course id, course name, due date, priority, status, type and
  estimate.
- **`get_deadlines`** — open work already ranked by `rankTasks`, each item
  carrying the factors behind its placement and a "why" sentence built by
  `explainRecommendation`. Takes an optional `availableMinutes` so the ranking
  accounts for the time the student actually has.
- **`search_notes`** — notes by keyword across title and body, or, given a
  `taskId`, exactly the notes attached to one piece of work. Every result
  carries its `taskId` and `courseName`.
- **`search_memory`** — everything Mentra has stored about this student. Rarely
  needed now that memories ride in the prompt; the model is told to reach for it
  only when that list says it was truncated.
- **`list_semesters`** — the student's terms, with ids and dates.

## What it can write

- **`create_task`** — title, description, due date, priority, estimated minutes,
  type (task, assignment or exam) and course.
- **`update_task`** — title, due date, priority, estimate, status.
- **`complete_task`** — optionally recording how long the work actually took.
- **`create_note`** — attachable to a course, to a piece of work, to both, or to
  neither.
- **`create_course`** — into an existing term, so `list_semesters` has to come
  first.
- **`create_semester`**.
- **`save_memory`** — content, type (profile, commitment, learning_state or
  behavioral) and source (explicit when the student said it, inferred
  otherwise).

The system prompt tells it to file things it hears in passing rather than
waiting to be commanded, and to say what it recorded. It asks first before
changing or removing anything that already exists.

## What it cannot do

- **Delete anything.** No delete tool exists for tasks, notes, courses, terms or
  memories. The services do (`deleteTask`, `deleteNote`, `deleteCourse`,
  `deleteSemester`, `deleteMemory`) — they are deliberately not exposed, so
  destructive actions stay in the UI where the student clicks them.
- **Edit a note, a course or a term.** `updateNote`, `updateCourse` and
  `updateSemester` exist but have no tools. Tasks are the only thing the
  assistant can change after the fact.
- **Detach or re-file a note.** A note's course and task are set when it is
  created and cannot be changed by chat.
- **Touch grades.** There is no grade field in the schema.
- **See anything outside those thirteen tools.** It cannot read the page the
  student is looking at, browse the web, or open files.
- **Reach another student's data.** No tool accepts a `userId`; ownership is
  bound from the session in the route handler and passed to `executeToolCall`
  separately from the model's arguments. A test over `TOOL_NAMES` fails if any
  new tool breaks this.

## Limits

- **Five tool rounds per turn** (`MAX_TOOL_ROUNDS` in `chat.ts`). Past that it
  answers with whatever it has rather than looping up cost.
- **Forty messages of history** (`MAX_STORED_HISTORY`), read from the database
  rather than sent by the browser. A single message is capped at 4000
  characters. Older lines stay in the table; this is the window the assistant is
  given, not a retention policy.
- **The conversation is stored per student**, so it survives a reload and
  follows them between devices. One running thread, not separate conversations —
  there is no way to start a fresh one or clear it from the UI yet.
- **Forty memories are injected per turn** (`MAX_INJECTED_MEMORIES`), newest
  first. Past that the prompt says how many were left out and points the model at
  `search_memory`, which still returns everything unfiltered.
- **`reasoning_effort: "none"`.** Ranking is decided by `rankTasks`, so the model
  routes and phrases rather than deduces. Revisit this before reaching for a
  larger model if multi-step requests start failing.
- **Model is `gpt-5.6-terra`** by default, overridable with `OPENAI_MODEL`. The
  cheaper `gpt-5.6-luna` could not chain tool calls: asked to attach a note to a
  piece of work it skipped the id lookup, wrote the context into the note body,
  and reported success anyway.

## What varies per turn

The system prompt is not a constant. `buildSystemPrompt` rebuilds it for every
request from two things the model must not be left to work out for itself:

- **Today's date**, as a weekday and a `YYYY-MM-DD` date, read in UTC — the same
  basis `getEffectiveStatus` and the ranking count calendar days on. The route
  takes one `now` and passes it to both the prompt and `executeToolCall`, so the
  date the assistant reasons from and the date the ranking scores against cannot
  land either side of midnight.
- **What Mentra remembers**, written straight into the prompt rather than left
  behind a tool call the model might not think to make. When there are no
  memories the prompt says so plainly, so the model doesn't read silence as
  having forgotten something.
