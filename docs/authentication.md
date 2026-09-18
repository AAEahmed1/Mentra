# Authentication

Mentra uses [Better Auth](https://www.better-auth.com/) for accounts and sessions. Students sign in with email and password, or with Google when it is configured. Sessions are database rows referenced by a signed cookie.

- [Configuration](#configuration)
- [Sign-up and sign-in flows](#sign-up-and-sign-in-flows)
- [Reading the session on the server](#reading-the-session-on-the-server)
- [Protecting pages and actions](#protecting-pages-and-actions)
- [Rate limiting](#rate-limiting)
- [Password changes](#password-changes)
- [Account deletion](#account-deletion)
- [Google sign-in](#google-sign-in)
- [What is not implemented](#what-is-not-implemented)

## Configuration

The server configuration is in [`src/lib/auth.ts`](../src/lib/auth.ts):

| Setting | Value |
| --- | --- |
| `database` | `prismaAdapter(prisma, { provider: "postgresql" })`, using the `user`, `session`, `account`, `verification` and `rate_limit` tables |
| `baseURL` | `BETTER_AUTH_URL` |
| `trustedOrigins` | `BETTER_AUTH_URL`, plus `https://$VERCEL_PROJECT_PRODUCTION_URL` and `https://$VERCEL_URL` when Vercel sets them |
| `emailAndPassword` | Enabled, no email verification |
| `socialProviders.google` | Registered only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set |
| `rateLimit` | Enabled and stored in the database (`rate_limit` table), with stricter rules for sign-in, sign-up and password changes |
| `plugins` | `[nextCookies()]`, which must stay last |

`BETTER_AUTH_SECRET` is read by Better Auth directly and signs session cookies. It must be set in every environment.

All Better Auth endpoints are served by one catch-all route, [`src/app/api/auth/[...all]/route.ts`](../src/app/api/auth/[...all]/route.ts), which exports `GET` and `POST` from `toNextJsHandler(auth)`.

The browser client is [`src/lib/auth-client.ts`](../src/lib/auth-client.ts). It calls `createAuthClient()` with no base URL, so it talks to the current origin, and exports `signIn`, `signUp` and `signOut`.

### Why `nextCookies()` is required

Server actions can only set cookies through Next's `cookies()` API. When a server action calls a Better Auth API that replaces the session, as changing a password does, the new session cookie is only written to the response if the `nextCookies()` plugin is installed. Without it the old session is deleted, the new cookie is dropped, and the student is signed out.

### Why `trustedOrigins` includes Vercel URLs

Vercel serves the same deployment from its deployment URL and from any custom domain. Better Auth rejects requests and OAuth callbacks from origins it doesn't trust, so both are listed. Branch alias URLs (`VERCEL_BRANCH_URL`) are not trusted, so signing in from a branch alias may fail.

## Sign-up and sign-in flows

| Flow | Component | After success |
| --- | --- | --- |
| Sign up with email | `src/components/auth/sign-up-form.tsx` calls `signUp.email({ name, email, password })` | `/onboarding` |
| Sign in with email | `src/components/auth/sign-in-form.tsx` calls `signIn.email({ email, password })`; a failure shows "Incorrect email or password." | `/dashboard` |
| Google (sign in or sign up) | `src/components/auth/google-sign-in-button.tsx` calls `signIn.social({ provider: "google", callbackURL: "/dashboard", newUserCallbackURL: "/onboarding" })` | `/onboarding` for a new account, otherwise `/dashboard` |
| Sign out | `src/components/auth/sign-out-button.tsx` calls `signOut()` | `/sign-in` |

The landing page, `/sign-in` and `/sign-up` redirect signed-in visitors to `/dashboard`.

Every new account, email or Google, lands on `/onboarding` once. It is not enforced after that: the step can be skipped, and program and institution can be set later on the Profile page.

## Reading the session on the server

[`src/lib/session.ts`](../src/lib/session.ts) is the only place server code should read the session:

```ts
getSession()      // the session with its user, or null
requireUserId()   // the user's id, or redirect("/sign-in")
```

`getSession()` does not pass `headers()` straight to Better Auth. It copies the request headers and replaces the `Cookie` header with `(await cookies()).toString()`. When a server action changes the session cookie, Next re-renders the page in the same request; `headers()` still holds the cookie the browser sent, which now names a deleted session, while `cookies()` reflects what the action set. Without this, a successful password change would re-render into a redirect to `/sign-in`.

The root layout, the landing page, `/sign-in` and `/sign-up` use `getSession()`. Every protected page and server action uses `requireUserId()`.

## Protecting pages and actions

There is no middleware. Protection is explicit:

- Every signed-in page calls `requireUserId()` near the top.
- Every exported server action in `src/lib/actions/` calls `requireUserId()` before doing anything.
- The assistant route calls `getSession()` and answers `401` JSON without a session, because a redirect would be meaningless to its `fetch` caller.
- Services take the resulting `userId` and scope every query to it (see [database.md](database.md#service-layer)).

When adding a page or action that touches student data, call `requireUserId()` and pass its result to services. Never accept a user id from a form, a URL or the assistant model.

## Rate limiting

Better Auth's rate limiter is enabled with `storage: "database"`, so limits hold across every serverless instance rather than per instance. Counts live in the `rate_limit` table. Limits are per IP address:

| Endpoint | Limit |
| --- | --- |
| `/sign-in/email` | 10 requests per 5 minutes |
| `/sign-up/email` | 5 requests per hour |
| `/change-password` | 5 requests per 10 minutes |
| Everything else under `/api/auth` | Better Auth's default (100 requests per 10 seconds) |

The limiter only sees requests that reach `/api/auth`.

## Password changes

The Profile page's **Change password** form is shown only when the student has a `credential` account (a password). It posts to `changePasswordAction` in [`src/lib/actions/profile.ts`](../src/lib/actions/profile.ts), which:

1. Validates the form with `parsePasswordChangeInput`: new password 8 to 128 characters, confirmation matches, different from the current password.
2. Calls `auth.api.changePassword` with `revokeOtherSessions: true`. Better Auth verifies the current password, stores the new hash, deletes every session for the user, creates a new session, and sets its cookie through `nextCookies()`.
3. Maps Better Auth's `INVALID_PASSWORD` error to "Current password is incorrect."

The effect is that other devices are signed out and the current device stays signed in.

Students who signed up only with Google have no password and don't see the form.

## Account deletion

"Delete account" on `/privacy` requires typing `DELETE`. `deleteAccount()` in `src/lib/services/account.ts` deletes the student's notes, work, memories, courses, semesters and user row in one transaction. Sessions, sign-in accounts, conversations and messages are removed by cascade. The student is then redirected to `/sign-in`.

## Google sign-in

1. In Google Cloud Console, create an OAuth client ID of type **Web application**.
2. Add the app's origin (for example `https://your-domain.com`, and `http://localhost:3000` for local use) under **Authorized JavaScript origins**.
3. Add `<BETTER_AUTH_URL>/api/auth/callback/google` under **Authorized redirect URIs**, for each environment.
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and restart or redeploy.

When either variable is missing, `hasGoogleAuth` is false: Google is not registered with Better Auth, and the Google buttons are hidden on the landing, sign-in and sign-up pages rather than shown broken.

If Google sign-in returns to the wrong domain, `BETTER_AUTH_URL` still names an old URL; if Google shows `redirect_uri_mismatch`, the callback URL is not registered.

## What is not implemented

- Email verification
- Password reset ("forgot password")
- Changing the email address
- Linking or unlinking a Google account from the Profile page
