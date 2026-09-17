# Security and privacy

How Mentra protects student data, what leaves the app, and the known gaps. Mentra holds coursework, private notes, conversations and things the assistant has inferred about a person, so privacy is treated as part of the product.

- [Authentication and sessions](#authentication-and-sessions)
- [Authorization](#authorization)
- [Database exposure](#database-exposure)
- [The assistant](#the-assistant)
- [Error reporting](#error-reporting)
- [Data that leaves the app](#data-that-leaves-the-app)
- [Student controls](#student-controls)
- [Secrets](#secrets)
- [Known gaps](#known-gaps)
- [Reporting a vulnerability](#reporting-a-vulnerability)

## Authentication and sessions

- Better Auth handles sign-up, sign-in, password hashing (scrypt) and sessions. Sessions are rows in the `session` table referenced by a cookie signed with `BETTER_AUTH_SECRET`.
- Better Auth only accepts requests from trusted origins: `BETTER_AUTH_URL` and, on Vercel, the production and deployment URLs.
- Changing a password revokes every other session.
- Details in [authentication.md](authentication.md).

## Authorization

There is one role: a student, who can only see and change their own data. It is enforced in three places:

1. **Every protected page, server action and the assistant route** calls `requireUserId()`, which reads the session and redirects to `/sign-in` without one.
2. **Every service query is scoped to that user.** Rows are loaded, updated and deleted with `{ id, userId }` (courses through their semester's owner), so another student's id behaves exactly like a missing one and reveals nothing.
3. **Linked ids are checked.** When a form or tool attaches a note or work to a course or task, the service verifies the target belongs to the same student before writing.

Integration tests cover refusals across two students for each service.

## Database exposure

Supabase publishes the `public` schema through its Data API using an anon key that is designed to be public. Mentra doesn't use that API, but it exists.

The migration `20260913040000_enable_row_level_security` enables row level security on every table with no policies, which denies the `anon` and `authenticated` roles all rows. Mentra connects through Prisma as the table owner, which is not subject to RLS. `rls.test.ts` fails if a table without RLS is added. See [database.md](database.md#row-level-security) for the details and limits.

## The assistant

- **Identity comes from the session, never from the model.** No tool accepts a `userId`. The route binds it and passes it to tool execution separately, and a `userId` placed in tool arguments is stripped during validation. A test fails if a tool schema ever includes it.
- **History comes from the database, not the browser.** The client sends only the new message and a conversation id, and the route only loads conversations the student owns.
- **Messages are capped at 4000 characters**, and each turn is limited to five rounds of tool calls.
- **Destructive reach is limited.** The assistant can delete work and notes, but not courses, terms, memories or the account.

Risks to be aware of:

- **Prompt injection from the student's own content.** Note bodies and task titles are returned to the model verbatim. Text pasted into a note could try to make the assistant delete or change things. Damage is limited to that student's data, but work and note deletions are permanent.
- **Memories carry weight.** Memories are written by the model and injected into the system message on later turns, so a misleading saved memory keeps influencing the assistant until the student forgets it on the "What Mentra knows" page.
- **No usage limits.** There is no per-student rate limit or token cap on `/api/assistant`. Set a spending limit in the OpenAI dashboard.

See [ASSISTANT.md](../ASSISTANT.md) for the full list of tools and limits.

## Error reporting

Sentry is optional. When enabled, every error event passes through `scrubEvent` (`src/lib/sentry-scrub.ts`) before it is sent:

- The request body, cookies and headers are removed.
- The query string is dropped, and every URL query parameter except `minutes` is stripped from the request URL and from breadcrumb URLs. This matters because `?q=` on the notes search contains the student's own words.
- `sendDefaultPii` is false, so IP addresses and user identity are not attached.
- Browser events are sent through the app's own `/monitoring` route.

What is **not** scrubbed:

- Exception messages and stack traces.
- Performance transactions and spans, which don't go through `beforeSend`. URLs in transactions can include query strings.
- Breadcrumbs that store URLs outside `data.url`, such as navigation breadcrumbs' `from` and `to`.

## Data that leaves the app

| Recipient | What is sent | When |
| --- | --- | --- |
| Supabase | Everything Mentra stores | Always (the database) |
| OpenAI | The student's memories, the current conversation's recent messages, and whatever the tools read: courses, work, full note bodies | Each assistant turn, when `OPENAI_API_KEY` is set |
| Google | The OAuth exchange; Google returns name, email and avatar | Google sign-in only |
| Sentry | Scrubbed error events and performance traces | When `NEXT_PUBLIC_SENTRY_DSN` is set |
| Vercel | Request logs, including `console.error` output from failed assistant turns | Always (hosting) |

## Student controls

- **See what the assistant has learned** and forget any of it on "What Mentra knows" (`/privacy`).
- **Delete conversations** from the Chats pages.
- **Delete the account.** Typing `DELETE` removes the account and everything in it in one transaction: terms, courses, work, notes, memories, conversations, messages, sessions and sign-in accounts.

Data export is not implemented.

## Secrets

- `.env*` files are gitignored except `.env.example`, which contains only placeholders.
- Production secrets live in Vercel's environment variables.
- `NEXT_PUBLIC_SENTRY_DSN` is public by design. Nothing else should use the `NEXT_PUBLIC_` prefix, because those values are bundled into browser code.
- Use a different `BETTER_AUTH_SECRET` in each environment. Rotating it signs everyone out.

## Known gaps

- No email verification and no password reset.
- No application-level rate limiting on sign-in or the assistant beyond Better Auth's in-memory defaults.
- No security headers or Content Security Policy are configured in `next.config.ts`.
- `public/review/` serves old design screenshots containing demo data.
- More detail and smaller issues are in [known-issues.md](known-issues.md).

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the maintainer rather than opening a public issue.
