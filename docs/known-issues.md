# Known issues

Defects and gaps found during a full review of the codebase in September 2026. Nothing here has been fixed yet. Each entry says where the problem is and what a student or developer would experience. Items are grouped by impact, most important first.

- [Correctness](#correctness)
- [Security and privacy](#security-and-privacy)
- [Assistant](#assistant)
- [Operations and tooling](#operations-and-tooling)
- [Accessibility](#accessibility)
- [Design consistency](#design-consistency)
- [Dead code and clean-up](#dead-code-and-clean-up)

## Correctness

### Dates follow UTC, not the student's timezone

`src/lib/recommendations.ts`, `task-status.ts`, `work-options.ts`, `src/app/dashboard/page.tsx`, `src/lib/ai/system-prompt.ts`

"Today", "tomorrow", "overdue", the dashboard's date line and the assistant's idea of today are all computed from UTC calendar days, and the greeting uses the server's hour (UTC on Vercel). For a student in Toronto on a Wednesday evening, the dashboard heading still says Wednesday while the term timeline has already moved its "today" line to Thursday, work due Thursday is labelled "due today", and the greeting may be wrong for the time of day. Fixing this needs the student's timezone, from the browser or a profile setting.

### Clearing an optional field when editing does nothing

`src/lib/task.ts`, `note.ts`, `course.ts` with `src/lib/services/task.ts`, `note.ts`, `course.ts`

Edit forms turn a blank field into `undefined`, and Prisma ignores `undefined` in an update, so the old value is kept. Choosing "No course" for a piece of work, emptying its due date, description, estimate or topics, unfiling a note, or clearing a course's code, professor or credits all appear to save but change nothing. The profile form avoids this by turning blanks into `null`.

### Editing a note can silently detach it from its work

`src/components/notes/note-row.tsx:137`, `src/lib/work-options.ts`

The "About a piece of work" picker only lists open work. When a note is attached to work that has since been completed or cancelled, its current value is missing from the list, the browser selects "Not about anything in particular", and saving any change to the note removes the link.

### The Overdue marker on the Work page is unstyled

`src/components/tasks/task-row.tsx:115`

It uses `bg-tab-due` and `text-tab-due-foreground`, colour tokens from an earlier design that no longer exist. The marker renders as plain text in a pill shape instead of the oxblood plate.

### A task can be filed under another student's course

`src/lib/services/task.ts` (`updateTask`)

`createTask` checks that the course belongs to the student, but `updateTask` does not, and `updateTaskAction` passes the submitted `courseId` straight through. A hand-crafted form post can attach a student's own task to someone else's course id. No data is exposed, but the link crosses accounts. The assistant's `update_task` tool cannot change the course.

### Invalid values in some forms cause server errors instead of messages

- `updateTaskAction` passes the `status` field to the database without validating it; an invalid value throws.
- `completeTaskAction` converts `actualDuration` with `Number()` without checks, so text becomes `NaN`.
- The assistant's date arguments (`dueDate`, `startDate`, `endDate`) are not checked as dates; an invalid date throws and the model is told "That lookup failed".
- A semester date field that is missing from the form entirely (not blank) is read as 1 January 1970.

### Actual time spent can't be recorded from the interface

`src/components/tasks/task-row.tsx`, `src/lib/actions/task.ts`

`completeTaskAction` accepts `actualDuration`, but the Complete button doesn't send it and the edit form has no field for it. Only the assistant's `complete_task` tool can record it.

### Some pages don't refresh after related changes

Task and course actions revalidate only `/tasks` or `/courses`. Completing or editing work doesn't refresh the dashboard or the Notes page's work picker until they are reloaded or revalidated for another reason.

### Failed deletes are silent

Removing a course, work, note or memory, completing work, and deleting a conversation ignore a failed result, so nothing tells the student it didn't happen.

### Onboarding can be skipped entirely

Google sign-up goes straight to `/dashboard`, and nothing checks whether onboarding was completed. Program and institution can still be set on the Profile page.

### Smaller issues

- Validation schemas in `src/lib/`: only the profile form limits text length, and course credits accept negative numbers.
- `src/app/chats/page.tsx`: "Today" and "Yesterday" are based on 24-hour periods, not calendar days.
- `src/components/privacy/delete-account-form.tsx`: the warning lists terms, courses, work, notes and memories, but not conversations, which are also deleted.
- `src/components/app-sidebar.tsx`: exact path matching means Chats isn't highlighted on `/chats/[id]`.
- `src/components/term-score.tsx`: work due near the end of the three-week window, or its hover card, can extend past the page column; the landing page clips this but the dashboard does not.
- The dashboard's "due this week" count includes overdue work.

## Security and privacy

### Server-side module state in the assistant thread store

`src/components/assistant/thread-seed.tsx`, `src/lib/assistant-thread.ts`

`ThreadSeed` is a client component that writes to a module-level store during render. During server rendering this writes one student's conversation into a variable shared by the whole server process. Rendered output isn't affected, because the server snapshot always returns an empty thread, and no leak into responses was found. It is still a risky pattern that could leak data if the store were ever read on the server.

### Sentry scrubbing is incomplete

`src/lib/sentry-scrub.ts`, `src/instrumentation*.ts`

Performance transactions skip `beforeSend`, and navigation breadcrumbs keep URLs in `from` and `to` rather than `url`, so query strings such as `?q=` from the notes search can still reach Sentry. Exception messages are sent as they are.

### No limits on assistant usage

`src/app/api/assistant/route.ts`, `src/lib/ai/openai.ts`

No rate limit, per-student quota, token cap or timeout. Each turn can make up to six model calls with unlimited tool calls per round.

### Prompt injection through the student's own content

Note bodies and task titles are passed to the model verbatim, and the prompt tells the assistant to carry out explicit deletion requests without confirming. Pasted text could steer it into deleting the student's own work or notes.

### Missing account security features

No email verification, no password reset, no security headers or Content Security Policy, and only Better Auth's default in-memory rate limiting.

### Publicly served design screenshots

`public/review/*.png` are old design review screenshots with demo data, served at `/review/*.png` and not used by the app.

## Assistant

- **Deleting a chat leaves it in the panel.** After deleting the open conversation, the floating panel still shows its messages. The next message quietly starts a new, empty thread, so the student sees context the model doesn't have.
- **Retries can duplicate work.** Tool side effects aren't undone when a turn fails after a write, and the client removes the question, so asking again can create the same task or note twice.
- **An expired session shows the wrong error.** The route redirects to `/sign-in` instead of returning 401; the client fails to parse the HTML and says "Couldn't reach the assistant. Check your connection."
- **Malformed JSON returns 500, not 400**, because `request.json()` is outside the error handling.
- **Assistant failures don't reach Sentry.** They are caught and only logged with `console.error`.
- **Switching threads during a pending reply** can write the old reply into the new thread and unlock the composer early.
- **`seedThread` ignores newer server data** for a thread already in memory, so a chat updated in another tab shows a stale transcript until reload.
- **Empty conversations accumulate.** Each New chat creates a row that is hidden from the list but can become the "latest" thread the panel opens with.
- **Tool descriptions disagree with the prompt and the code.** `get_courses` says "current semester" but returns every term; `create_task` says to call it only when asked, while the prompt says to file things mentioned in passing.
- **Unbounded reads.** All memories, all notes (with full bodies) and the whole conversation on the chat page are loaded without limits, so cost grows with the student's data.
- **The final round still sends tools.** On the last model call tools are attached but ignored, which makes the fixed fallback reply more likely than a real answer.
- **Small UI gaps.** The panel has no Escape key or focus management, and messages are keyed by array index.

## Operations and tooling

- **Preview builds can migrate production.** `npm run build` runs `prisma migrate deploy`; if Preview shares production database variables, a pull request's migrations reach production before merge. See [deployment.md](deployment.md#preview-deployments).
- **`DIRECT_URL` wins over `DATABASE_URL` for the CLI**, including a leftover placeholder or an empty string, which can point migrations at the wrong database.
- **The test database guard compares strings only.** The same database written with different parameters passes.
- **Every test run needs a database**, even for pure unit tests, because the guard runs when the config loads.
- **Undeclared dependencies.** `dotenv` is imported by `prisma.config.ts` and the seed script but only installed transitively; `tsx` is fetched unpinned by `npx -y` on each seed run.
- **The seed script has no production guard** and deletes the target account's data on every run, not only with `--clear`.
- **`.env.example` said `npx prisma dev start mentra`** for creating the test database, which only starts an existing server; it now documents `npx prisma dev --name`.
- **Several multi-step service operations aren't atomic** (check then write, update then re-read), so rare races surface as thrown errors instead of `not_found` or `has_courses`.

## Accessibility

- No skip-to-content link before the sidebar.
- The phone drawer stays in the tab order when closed, doesn't trap focus or close on Escape when open, and its toggle lacks `aria-expanded`.
- Row buttons ("Edit", "Remove", "Complete", "Forget") don't say which item they act on, and the course remove button's accessible name ("Delete course") differs from its visible label ("Remove").
- Collapsed sidebar links get their name only from `title`.
- On tablets without a mouse, row actions are hidden until focused.
- Removing a course, work, note or memory has no confirmation or undo.

## Design consistency

Compared with [DESIGN.md](../DESIGN.md):

- Most form error boxes use `rounded-md` with a 40% border instead of the specified 2px radius and 45% border (only `FormErrors` matches).
- The outline button uses `border-border` rather than `rule-strong`, and the destructive button has a transparent border although the spec distinguishes it by its border.
- The Overdue marker is fully rounded, which the spec reserves for the scrollbar thumb.
- The motion sequence the spec reserves for the dashboard also runs on the landing page and every masthead.
- The phone top bar scrolls away instead of staying fixed.
- The landing page says "Behavioural", "You said so" and "Inferred" where the app says "Behavioral", "You told me" and "I inferred", and its ranking table simplifies how fit-to-time applies.

## Dead code and clean-up

- `src/components/ui/card.tsx` is unused (and has a shadow the design forbids).
- `src/lib/course-code.ts` (`indexTabCode`) is used only by its test.
- `lucide-react` is a dependency but nothing imports it; `components.json` still names it as the icon library.
- `authClient` and `useSession` from `src/lib/auth-client.ts` are unused.
- Unreachable branches: the no-estimate fallback in `recommendation-reason.ts`, and the final line of the loop in `src/lib/ai/chat.ts`.
- `create-next-app` default SVGs remain in `public/`.
- `src/components/ui/label.tsx` has an unnecessary `"use client"`.
- `blankToUndefined` is duplicated in five files, and the UTC day-difference calculation in three.
- Server action files mix concerns: `deleteAccountAction` lives in `actions/memory.ts`, and `completeOnboardingAction` calls Prisma directly instead of a service.
- `src/lib/services/account.ts`'s comment omits conversations from the cascade list, and most of its explicit deletes are already covered by cascades.
- `.scratch/mentra-v0/issues/` tickets describe the earlier "Card Catalog" design and a nine-tool assistant.
