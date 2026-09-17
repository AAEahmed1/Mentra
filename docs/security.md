# Security and privacy

How Mentra protects student data, what leaves the app, and the known gaps. Mentra holds coursework, private notes, conversations and things the assistant has inferred about a person, so privacy is treated as part of the product.

- [Authentication and sessions](#authentication-and-sessions)
- [Authorization](#authorization)
- [HTTP headers](#http-headers)
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
- Sign-in, sign-up and password-change requests are rate limited per IP address, with counts stored in the database so the limits hold across server instances. See [authentication.md](authentication.md#rate-limiting).
- Details in [authentication.md](authentication.md).

## Authorization

There is one role: a student, who can only see and change their own data. It is enforced in three places:

1. **Every protected page and server action** calls `requireUserId()`, which reads the session and redirects to `/sign-in` without one. The assistant route reads the session with `getSession()` and answers `401` without one.
2. **Every service query is scoped to that user.** Rows are loaded, updated and deleted with `{ id, userId }` (courses through their semester's owner), so another student's id behaves exactly like a missing one and reveals nothing.
3. **Linked ids are checked.** When a form or tool attaches a note or work to a course or task, the service verifies the target belongs to the same student before writing.

Integration tests cover refusals across two students for each service.

## HTTP headers

`next.config.ts` sends these on every route:

| Header | Value | Why |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | Browsers use the declared content type instead of guessing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Other sites never see Mentra paths or search text |
| `X-Frame-Options` | `DENY` | Mentra can't be embedded in another site's frame |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Mentra needs none of these |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Browsers only ever connect over HTTPS |

There is no Content-Security-Policy yet; see [known-issues.md](known-issues.md#content-security-policy).

## Database exposure

Supabase publishes the `public` schema through its Data API using an anon key that is designed to be public. Mentra doesn't use that API, but it exists.

The migration `20260913040000_enable_row_level_security` enables row level security on every table with no policies, which denies the `anon` and `authenticated` roles all rows. Mentra connects through Prisma as the table owner, which is not subject to RLS. `rls.test.ts` fails if a table without RLS is added. See [database.md](database.md#row-level-security) for the details and limits.

## The assistant

- **Identity comes from the session, never from the model.** No tool accepts a `userId`. The route binds it and passes it to tool execution separately, and a `userId` placed in tool arguments is stripped during validation. A test fails if a tool schema ever includes it.
- **History comes from the database, not the browser.** The client sends only the new message and a conversation id, and the route only loads conversations the student owns.
- **Usage is bounded.** Messages are capped at 4000 characters, each student can start 30 turns an hour, each turn is limited to five rounds of tool calls, and each model reply to 1200 output tokens.
- **Destructive reach is limited.** The assistant can delete work and notes, but not courses, terms, memories or the account.

Risks to be aware of:

- **Prompt injection from the student's own content.** Note bodies and task titles are returned to the model. The prompt tells the assistant that stored content is data, never instructions, and that deletions must come from the student's own message in the conversation. That reduces the risk but cannot rule it out; damage would be limited to that student's data, and work and note deletions are permanent.
- **Memories carry weight.** Memories are written by the model and injected into the system message on later turns, so a misleading saved memory keeps influencing the assistant until the student forgets it on the "What Mentra knows" page.
- **Spending.** The app's limits bound what one student can spend, but set a spending limit in the OpenAI dashboard as a backstop.

See [ASSISTANT.md](../ASSISTANT.md) for the full list of tools and limits.

## Error reporting

Sentry is optional. When enabled, every error event passes through `scrubEvent` and every performance transaction through `scrubTransaction` (both in `src/lib/sentry-scrub.ts`) before it is sent:

- The request body, cookies and headers are removed.
- The query string is dropped, and every URL query parameter except `minutes` is stripped from request URLs, transaction names, span descriptions and data (`http.url`, `url.full`, `http.query` and similar), and breadcrumb URLs including navigation `from` and `to`. Fragments and credentials in URLs are removed too. This matters because `?q=` on the notes search contains the student's own words.
- `sendDefaultPii` is false, so IP addresses and user identity are not attached.
- Browser events are sent through the app's own `/monitoring` route.

What is **not** scrubbed: exception messages and stack traces. Avoid putting student content in error messages.

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
- No Content Security Policy.
- Rate limits are per IP address, so a shared network can reach them sooner, and the Profile page's password form is not rate limited.
- More detail is in [known-issues.md](known-issues.md).

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the maintainer rather than opening a public issue.
