# Known issues

Open defects, gaps and decisions still to be made. The full review in September 2026 found about sixty issues; the fixes that followed resolved most of them, and what remains is listed here. When you fix something on this page, remove it in the same commit.

- [Needs a product decision](#needs-a-product-decision)
- [Assistant](#assistant)
- [Security](#security)
- [Smaller issues](#smaller-issues)

## Needs a product decision

### Email verification and password reset

Mentra sends no email, so accounts are not verified, a forgotten password cannot be reset, and the email address cannot be changed. Better Auth supports all three once an email provider (for example Resend or Postmark) is chosen and configured.

### Content Security Policy

`next.config.ts` sets the other security headers but no Content-Security-Policy. A useful policy needs nonces for Next.js's inline scripts and must allow the Sentry tunnel, so it should be designed and tested rather than added blind.

### Rate limits for shared networks

Better Auth's limits (10 sign-ins per 5 minutes, 5 sign-ups per hour, 5 password changes per 10 minutes) are counted per IP address. A campus network or other shared connection could hit them for many students at once. The assistant's limit of 30 turns an hour is per student and is not affected.

### Should the assistant panel be a dialog?

The panel closes on Escape and moves focus in and out, but it is not marked as a dialog and does not trap focus, because the page behind it stays usable. Whether it should behave as a modal is a design decision.

## Assistant

- **Read caps apply after loading.** `search_notes` and `get_tasks` cap what is sent to the model, but still load every matching row from the database. Moving the limits into the note and task services would keep large accounts cheap.
- **Long notes are cut for the model.** Note bodies over 2000 characters are shortened in tool results, so the assistant cannot read or quote the rest of a very long note.
- **The turn limit can be overrun by simultaneous requests.** Requests sent at the same moment can all pass the check before any of them is stored, and failed turns are not stored, so they don't count.
- **Old empty conversations stay.** New chat now reuses an empty conversation instead of creating another, but empty rows created before that change are not cleaned up.
- **Stored content can still steer the model.** The prompt tells the assistant that note bodies and task titles are data, not instructions, and that deletions must come from the student's own message. That reduces prompt injection from pasted text but cannot rule it out.

## Security

- **Changing a password from the Profile page is not rate limited.** The form calls Better Auth's `changePassword` from a server action, which bypasses Better Auth's HTTP rate limiter; only the public `/api/auth/change-password` endpoint is limited. A wrong current password is still rejected every time.
- **Exception messages reach Sentry unchanged.** Request data, headers, cookies and query strings are scrubbed from errors and performance traces, but the text of an exception is sent as it is.

## Smaller issues

- **The demo seed uses UTC days.** `prisma/seed-demo.ts` dates work relative to the UTC day, so run late in the evening west of UTC it can land a day off from the student's own calendar.
- **Verification rows outlive a deleted account.** `verification` rows have no foreign key to the user, so deleting an account leaves any pending ones until they expire. None are created today, because email verification is not enabled.
- **`components.json` still names lucide as the icon library.** Nothing uses lucide and the package was removed; icons are inline SVG. Adding a shadcn component that imports lucide would need the package again.
- **Some checks and writes are not atomic.** Services now report a race with a delete as "not found" instead of throwing, but `appendMessages` still checks conversation ownership outside its transaction.
- **The original v0 tickets are out of date.** `.scratch/mentra-v0/issues/` describes the earlier "Card Catalog" design and a nine-tool assistant. They are kept as history.
