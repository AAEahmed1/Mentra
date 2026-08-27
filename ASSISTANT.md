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
| Stored conversations | `src/lib/services/conversation.ts` |
| Lines within a conversation | `src/lib/services/message.ts` |
| The chats pages | `src/app/chats/` |
| HTTP entry point and session binding | `src/app/api/assistant/route.ts` |
| The panel itself | `src/components/assistant/assistant-panel.tsx` |

Sixteen tools, six read and ten write.

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
- **`update_note`** — title, body, and the course or piece of work it is filed
  under. Only the fields named are changed.
- **`delete_note`** and **`delete_task`** — permanent. Notes written against a
  deleted piece of work survive it (`Note.taskId` is `onDelete: SetNull`).
- **`save_memory`** — content, type (profile, commitment, learning_state or
  behavioral) and source (explicit when the student said it, inferred
  otherwise).

The system prompt tells it to file things it hears in passing rather than
waiting to be commanded, and to say what it recorded. It asks first before
changing or removing anything that already exists, and is told that finishing
work is `complete_task`, not `delete_task`.

## What it cannot do

- **Delete a course, a term or a memory.** `deleteCourse`, `deleteSemester` and
  `deleteMemory` exist as services but have no tools: a course or a term takes
  real work with it, and forgetting is the student's call, so those stay in the
  UI where they click them. Tasks and notes it can delete, because it can also
  create them and needs to be able to undo itself.
- **Edit a course or a term.** `updateCourse` and `updateSemester` exist but
  have no tools.
- **Unfile a note.** `update_note` can move a note to a different course or
  piece of work, but not clear the link back to nothing.
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
- **Conversations are separate threads**, stored per student, so they survive a
  reload and follow them between devices. The Chats page lists them newest
  first, titled from their opening question; the floating panel carries on the
  most recent one. Starting a new chat is how you escape a thread that has gone
  wrong, and deleting one is permanent.
- **Only the current thread is given to the model.** It cannot read the
  student's other conversations, and nothing carries across them except memory.
- **Forty memories are injected per turn** (`MAX_INJECTED_MEMORIES`), newest
  first. Past that the prompt says how many were left out and points the model at
  `search_memory`, which still returns everything unfiltered.
- **`reasoning_effort` must stay `"none"`.** Not a tuning choice: the chat
  completions endpoint rejects any other value when function tools are attached
  ("Function tools with reasoning_effort are not supported for gpt-5.6-terra in
  /v1/chat/completions"). Reasoning together with tools would mean moving to
  /v1/responses, a different request and response shape. Ranking is decided by
  `rankTasks` anyway, so the model routes and phrases rather than deduces.
- **A poisoned transcript defeats the tools.** If the assistant ever claims an
  action it did not perform, that claim is stored like any other line, and later
  turns answer from it instead of calling tools — measured as zero tool calls on
  three consecutive turns. The same request on a clean thread calls
  `search_notes` then `delete_note` correctly. The cure is to start a new chat
  from the Chats page, which is why that exists.
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
