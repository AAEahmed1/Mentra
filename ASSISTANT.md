# The Mentra assistant

What "Ask Mentra" can and cannot do, how a turn works, and the limits it runs under.

> **Keep this current.** Any change under `src/lib/ai/` must be reflected here in the same commit. That includes adding, removing or reshaping a tool, editing the prompt in `system-prompt.ts`, changing the round limit, the history window, the default model, or what a tool returns. The same applies to giving the assistant access to a service it could not reach before. This file is the answer to "what can the assistant actually do?", and a stale answer is worse than none.

## Where it lives

| Concern | File |
| --- | --- |
| Tool schemas and argument validation | `src/lib/ai/tools.ts` |
| Tool execution against the services | `src/lib/ai/execute.ts` |
| System prompt (`BEHAVIOUR`, rebuilt each turn by `buildSystemPrompt`) | `src/lib/ai/system-prompt.ts` |
| The OpenAI client and request shape | `src/lib/ai/openai.ts` |
| The turn loop (tool rounds, recovery) | `src/lib/ai/chat.ts` |
| HTTP entry point and session binding | `src/app/api/assistant/route.ts` |
| Stored conversations and lines | `src/lib/services/conversation.ts`, `src/lib/services/message.ts` |
| Starting and deleting chats | `src/lib/actions/conversation.ts` |
| Shared client-side thread state and `sendMessage` | `src/lib/assistant-thread.ts` |
| The floating panel | `src/components/assistant/assistant-panel.tsx` |
| Transcript, composer and starter prompts | `src/components/assistant/assistant-thread.tsx` |
| Seeding the client state from server data | `src/components/assistant/thread-seed.tsx` |
| Mounting the panel on every signed-in page | `src/app/layout.tsx` |
| The Chats pages | `src/app/chats/` |
| Ranking and the "why" sentence the tools reuse | `src/lib/recommendations.ts`, `src/lib/recommendation-reason.ts` |

## How a turn works

1. **The student sends a message** from the floating panel or a chat page. Both share one client store, so they show the same thread. The browser posts `{ message, conversationId? }` to `POST /api/assistant`. It never sends history.
2. **The route authenticates.** `requireUserId()` binds the student from the session. If `OPENAI_API_KEY` is not set it stops with `503`. The body is validated: `message` must be 1 to 4000 characters, or the route returns `400`.
3. **The route picks the thread.**
   - If the request names a conversation the student owns, that one is used.
   - If it names a conversation that doesn't exist or belongs to someone else, a new conversation is created.
   - With no id, the student's most recently updated conversation is used, or a new one if they have none.
4. **The route builds the context.** It loads all of the student's memories and the last 40 stored messages of that thread. The model receives a system message from `buildSystemPrompt`, that history (text only), and the new message. A single `now` is taken here and used for both the prompt's date and the tool rankings.
5. **The tool loop runs** (`runAssistantTurn` in `chat.ts`). The model may request tools. Each call is validated, executed with the session's `userId`, and returned to the model as JSON, one at a time in order. This repeats for up to five rounds of tool execution. On the sixth model call, requested tools are ignored and the reply is whatever text the model produced. If there is no text, the reply is the fixed fallback: "I got stuck working that out. Could you ask me again, more specifically?"
6. **Only after the turn succeeds**, the student's message and the final reply are stored with `appendMessages`. Tool calls and tool results are never stored. A new thread is titled from the first 80 characters of its first message.
7. **The route responds** with `200 { reply, conversationId }`. Replies are not streamed; the whole reply arrives at once and is rendered as plain text.

### Errors

| Situation | Status | What the student sees |
| --- | --- | --- |
| `OPENAI_API_KEY` not set | 503 | "The assistant isn't configured yet — no API key is set." |
| Message missing, empty or over 4000 characters | 400 | "That message couldn't be read." |
| The model call or saving the transcript throws | 502 | "The assistant is unavailable right now." (logged server-side as `assistant turn failed`) |
| Network failure, or a response that is not JSON | none | "Couldn't reach the assistant. Check your connection." |

On any error the client removes the unanswered question from the transcript, because the turn was never stored. Tool side effects are **not** rolled back: if a write tool succeeded and a later step failed, the created or changed item remains, and retrying may repeat it.

When a tool fails, the model receives an `{ error }` object instead of throwing:

- arguments that are not valid JSON: "Arguments were not valid JSON."
- arguments that fail validation: "Invalid arguments for `<tool>` — ..."
- an unknown tool: "Unknown tool: `<name>`"
- an exception during execution: "That lookup failed. Tell the student and move on." (used for write tools too)

## What it can read

Six read tools.

- **`get_courses`**: every course the student has, from **all** terms, with id, name, code, professor and credits. It does not say which term a course belongs to. The tool description sent to the model says "current semester", which is inaccurate.
- **`get_tasks`**: all work, optionally filtered by `status` or `courseId`. Each item has id, title, course id and name, due date (`YYYY-MM-DD`), priority, stored status, type and estimate. Completed and cancelled work is included unless filtered out. `status` is the stored value, so there is no "overdue" status here; overdue work is found through `get_deadlines`.
- **`get_deadlines`**: open work already ranked by `rankTasks`, each item with its rank, the factors behind its place and a "why" sentence from `explainRecommendation`. It takes an optional `availableMinutes` so the ranking considers how much time the student has. This is the same ranking the dashboard uses.
- **`search_notes`**: notes matched case-insensitively by `query` in the title or body, or, given a `taskId`, the notes attached to that piece of work. Each result includes the full body, `courseName` and `taskId`. With no arguments it returns every note.
- **`search_memory`**: everything Mentra has stored about the student. Memories are already in the prompt, so the model is told to call this only when the prompt says the list was truncated.
- **`list_semesters`**: the student's terms, with ids and start and end dates.

## What it can write

Ten write tools.

- **`create_task`**: title (required), description, due date, priority (default `medium`), estimated minutes, type (`task`, `assignment` or `exam`; default `task`) and course. It is refused if the course is not the student's. New work always starts as `not_started`.
- **`update_task`**: title, due date, priority, estimate and status. Only named fields change.
- **`complete_task`**: marks work completed, optionally recording how many minutes it actually took.
- **`create_note`**: title and body, filed under a course, a piece of work, both or neither. It is refused if either link is not the student's.
- **`update_note`**: title, body, and the course or piece of work it is filed under. Only named fields change.
- **`delete_note`** and **`delete_task`**: permanent. Notes attached to a deleted piece of work survive it, because `Note.taskId` is `onDelete: SetNull`.
- **`create_semester`**: name, start date and end date.
- **`create_course`**: into an existing term, so the model is told to call `list_semesters` first.
- **`save_memory`**: content, type (`profile`, `commitment`, `learning_state` or `behavioral`) and source (`explicit` when the student said it, otherwise `inferred`, which is the default).

Every write tool reports what happened (`created`, `updated`, `completed`, `deleted` or `saved`), with an `error` message when it did not.

## How it is told to behave

The prompt in `system-prompt.ts` sets these rules. They are instructions to a model, not guarantees.

- **Facts come from tools.** Everything it says about the student's work must come from a tool call. It must never invent a deadline, task, course or grade, and should say plainly when a tool returns nothing.
- **"What should I do?"** means calling `get_deadlines` and leading with the top item. "Why?" is answered with the actual factors, never a generic reason. If the student says how much time they have, it passes that as `availableMinutes`.
- **File things mentioned in passing.** When the student mentions work, a note or a fact about themselves, it records it and says what it recorded, rather than waiting for a command. It fills in only details the student gave. (The `create_task` description sent to the model still says to call it only when asked, which conflicts with this.)
- **Link correctly.** Notes about a specific piece of work are attached with a `taskId` looked up through `get_tasks`. Ids are never invented, and ids from earlier turns are not visible, so it looks them up again.
- **Ask before changing or removing, unless already told.** An explicit instruction such as "delete it" or "scratch that" is carried out in the same turn. If it filed something wrongly, it says so and fixes it. Finishing work is `complete_task`, not deletion.
- **Check results.** If a tool reports `created`, `updated` or `deleted` as false, it says the action did not happen and why.
- **No promises.** It must not say it is about to do something. It either reports what a tool already did, in the past tense, or asks a question.
- **Memory.** It uses what the prompt says it already knows rather than asking again, and saves durable facts with `save_memory`, marked `explicit` only when the student said them.
- **Tone and format.** Calm, brief and concrete, with no exclamation marks and no praise for ordinary things. Plain text only, no markdown.

## What varies per turn

The system prompt is rebuilt for every request from two things the model must not work out for itself:

- **Today's date**, as a weekday and a `YYYY-MM-DD` date, read in **UTC**. That is the same basis `getEffectiveStatus` and the ranking use to count calendar days. The date and the ranking share one `now`, so they cannot land either side of midnight. There is no time of day.
- **What Mentra remembers**, written into the **system** message as `- (type, source) content` for the 40 most recent memories. If there are more, the prompt says how many were left out and points the model at `search_memory`. If there are none, the prompt says so plainly, so the model does not read silence as having forgotten something.

## What it cannot do

- **Delete a course, a term or a memory.** `deleteCourse`, `deleteSemester` and `deleteMemory` exist as services but have no tools. A course or term takes real work with it, and forgetting is the student's decision, so those stay in the interface.
- **Edit a course, a term or a memory.** `updateCourse` and `updateSemester` exist but have no tools. There is no memory update at all.
- **Change a task's course or description, clear its due date, or set topics to review.** `update_task` accepts none of these.
- **Unfile a note.** `update_note` can move a note to a different course or piece of work, but not clear the link.
- **Read or change the student's profile or account.** There is no tool for names, program, institution, email, password or deleting the account.
- **Touch grades.** There is no grade field in the schema.
- **See tool results from earlier turns.** Only the text of past messages is kept.
- **See anything outside its sixteen tools.** It cannot read the page the student is looking at, browse the web, open files, or see other conversations.
- **Reach another student's data.** No tool accepts a `userId`. Ownership is bound from the session in the route handler and passed to `executeToolCall` separately from the model's arguments, and a `userId` smuggled into arguments is stripped during validation. A test over `TOOL_NAMES` fails if a new tool breaks this.

## Limits

- **Five rounds of tool execution per turn** (`MAX_TOOL_ROUNDS` in `chat.ts`), so at most six model calls. There is no cap on how many tools the model can request in one round. Text the model writes alongside tool calls in an intermediate round is not shown.
- **Forty messages of history** (`MAX_STORED_HISTORY` in `message.ts`), read from the database rather than sent by the browser. This is the window given to the model and shown in the panel on first load; the chat page shows the whole conversation. Older lines stay in the database.
- **A message is capped at 4000 characters.**
- **Forty memories are injected per turn** (`MAX_INJECTED_MEMORIES`), newest first.
- **Conversations are separate threads**, stored per student, so they survive a reload and follow the student between devices.
  - The Chats page lists threads that have at least one message, newest first, titled from their opening question.
  - **New chat** creates an empty thread straight away and opens it.
  - The floating panel continues whichever thread the page last loaded. On a fresh load that is the most recently updated thread.
  - Deleting a thread is permanent.
- **Only the current thread is given to the model.** Nothing carries across threads except memory.
- **No rate limit, quota, token cap or request timeout** is applied in the assistant path. Each turn can make up to six completions.
- **`reasoning_effort` must stay `"none"`.** This is not a tuning choice: the chat completions endpoint rejects any other value when function tools are attached ("Function tools with reasoning_effort are not supported for gpt-5.6-terra in /v1/chat/completions"). Reasoning together with tools would mean moving to `/v1/responses`, which has a different request and response shape. Ranking is decided by `rankTasks` anyway, so the model routes and phrases rather than deduces.
- **A poisoned transcript defeats the tools.** If the assistant ever claims an action it did not perform, that claim is stored like any other line, and later turns answer from it instead of calling tools. This was measured as zero tool calls on three consecutive turns; the same request on a clean thread called `search_notes` then `delete_note` correctly. The cure is to start a new chat from the Chats page, which is why threads exist.
- **The model is `gpt-5.6-terra`** by default, overridable with `OPENAI_MODEL`. The cheaper `gpt-5.6-luna` could not chain tool calls: asked to attach a note to a piece of work, it skipped the id lookup, wrote the context into the note body, and reported success anyway.

## Privacy and safety notes

- Every turn sends the student's memories, recent messages, and whatever the tools fetch (courses, work, full note bodies) to OpenAI.
- Memories are written by the model from conversation and then placed in the system message on every later turn, so a saved memory carries more weight than ordinary chat text. Students can review and delete memories on the "What Mentra knows" page.
- Note bodies and task titles are returned to the model verbatim. Text pasted into a note could therefore try to steer the assistant. The damage is limited to the student's own data, but deletions are permanent.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes, for the assistant | Checked on every request. Without it the rest of the app works and the assistant answers `503`. |
| `OPENAI_MODEL` | No | Overrides the default `gpt-5.6-terra`. An empty value also falls back to the default. |
