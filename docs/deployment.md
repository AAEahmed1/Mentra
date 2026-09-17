# Deployment

Mentra runs on **Vercel** with a **Supabase** PostgreSQL database. Google OAuth, OpenAI and Sentry are optional services.

- [First deployment](#first-deployment)
- [Environment variables on Vercel](#environment-variables-on-vercel)
- [Migrations during the build](#migrations-during-the-build)
- [Preview deployments](#preview-deployments)
- [Changing the domain](#changing-the-domain)
- [Error monitoring](#error-monitoring)
- [Resetting the production database](#resetting-the-production-database)
- [Operational checklist](#operational-checklist)

## First deployment

1. **Create a Supabase project.** In **Project Settings → Database → Connection string**, copy two pooler strings:
   - **Transaction pooler** (port 6543), for `DATABASE_URL`.
   - **Session pooler** (port 5432), for `DIRECT_URL`.
2. **Import the repository into Vercel.** The framework preset is Next.js. The build command stays `npm run build`.
3. **Set the environment variables** listed below for the Production environment.
4. **Deploy.** The build generates the Prisma client, applies all migrations to Supabase (including row level security), then builds the app.
5. **Set `BETTER_AUTH_URL`** to the final production origin if it wasn't known before the first deploy, then redeploy. Environment variable changes only take effect on a new deployment.
6. **Configure Google OAuth** if wanted: add the production origin and `https://<domain>/api/auth/callback/google` to the OAuth client (see [authentication.md](authentication.md#google-sign-in)).
7. **Check** that you can create an account, add a course and work, see Today, and, if configured, sign in with Google and use the assistant.

## Environment variables on Vercel

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase transaction pooler, port 6543 |
| `DIRECT_URL` | Supabase session pooler, port 5432 |
| `BETTER_AUTH_SECRET` | A fresh `openssl rand -base64 32`, different from development |
| `BETTER_AUTH_URL` | `https://<production domain>` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional |
| `OPENAI_API_KEY` | Optional; without it the assistant returns 503 |
| `OPENAI_MODEL` | Optional; defaults to `gpt-5.6-terra` |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional |
| `SENTRY_AUTH_TOKEN` | Optional; enables source map upload during the build |

Vercel provides `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_ENV` and `CI` itself. Full descriptions are in [configuration.md](configuration.md).

The app keeps one database connection per serverless instance in production (`max: 1` in `src/lib/prisma.ts`) and relies on Supabase's transaction pooler to share connections. Don't point `DATABASE_URL` at the session pooler in production; it runs out of connections under concurrency.

## Migrations during the build

`npm run build` is:

```bash
prisma generate && node scripts/migrate-for-build.mjs && next build
```

`scripts/migrate-for-build.mjs` runs `prisma migrate deploy` against the database named by `DIRECT_URL` (or `DATABASE_URL`), **before** the app is compiled, on production, local and CI builds. On Vercel preview builds it skips migrating and says why in the build log, unless `MIGRATE_ON_PREVIEW=1` is set.

What this means in practice:

- **Merging a migration deploys it** with the next production build. There is no separate migration step.
- **A failed migration fails the deployment**, and the previous deployment keeps serving.
- **A migration can succeed while the build fails.** The schema is then ahead of the code that is live. Keep migrations backward compatible with the currently deployed code (add columns before using them; remove them only after the code stops using them).
- **The build needs network access to the database**, which is why pooler URLs are used (Supabase's direct host is IPv6-only).

## Preview deployments

Preview builds do **not** migrate by default, because Vercel environments often share variables and a preview pointed at the production database would otherwise change production before a pull request is merged. Previews therefore run against whatever schema their database already has; a preview whose code needs a new migration may fail until that migration reaches the database.

To let previews migrate, give the Preview environment its own Supabase project or branch database, then set `MIGRATE_ON_PREVIEW=1` on Preview only.

Sign-in on previews: Better Auth trusts `BETTER_AUTH_URL`, the production domain and the deployment's own `VERCEL_URL`, but not branch alias URLs. Google sign-in on a preview only works if that preview URL is registered with the OAuth client.

## Changing the domain

When the production URL changes:

1. Update `BETTER_AUTH_URL` in Vercel and **redeploy**.
2. In Google Cloud Console, add the new origin under **Authorized JavaScript origins** and `https://<new domain>/api/auth/callback/google` under **Authorized redirect URIs**.
3. Check that no other environment still overrides `BETTER_AUTH_URL` with the old value.
4. Remove the old URLs from Google once the new ones work.

The symptom of a stale `BETTER_AUTH_URL` is Google sign-in returning to the old domain, for example with Vercel's `404 DEPLOYMENT_NOT_FOUND`. A missing redirect URI shows Google's `redirect_uri_mismatch`.

## Error monitoring

Sentry is set up through `@sentry/nextjs` when `NEXT_PUBLIC_SENTRY_DSN` is set:

- **Server** (`src/instrumentation.ts`): captures uncaught errors in server components, route handlers and actions through `onRequestError`.
- **Browser** (`src/instrumentation-client.ts`): captures client errors and navigation transactions.
- **Error pages**: `error.tsx` and `global-error.tsx` report the error and show its digest as a reference the student can quote.
- **Tunnel**: browser events are sent through `/monitoring` on the app's own origin, so ad blockers don't drop them.
- **Scrubbing**: every error passes through `scrubEvent` and every performance transaction through `scrubTransaction` before sending. See [security.md](security.md#error-reporting).
- **Source maps**: uploaded during the build when `SENTRY_AUTH_TOKEN` is set, then deleted from the build output.
- `tracesSampleRate` is 1, so every transaction is traced.
- **Assistant failures** are caught by the route, returned as `502`, logged with `console.error("assistant turn failed", ...)` and sent to Sentry with `captureException`, tagged `area: assistant`, without the student's message.

## Resetting the production database

To wipe all accounts and data while keeping the schema, open the Supabase **SQL Editor** and run:

```sql
truncate table
  "user", account, session, verification,
  conversation, message, memory,
  note, task, course, semester, rate_limit
restart identity cascade;
```

> **Warning:** this permanently deletes every account and all student data. Take a backup first (**Database → Backups**). Do not truncate `_prisma_migrations`, or the next deploy will try to re-apply every migration.

Better Auth, not Supabase Auth, manages accounts, so Supabase's **Authentication → Users** list is not used.

## Operational checklist

- [ ] `BETTER_AUTH_URL` matches the production origin exactly.
- [ ] `BETTER_AUTH_SECRET` is unique to production and stored only in Vercel.
- [ ] `DATABASE_URL` uses the transaction pooler (6543) and `DIRECT_URL` the session pooler (5432).
- [ ] Preview deployments do not use production database credentials, or `MIGRATE_ON_PREVIEW` is left unset.
- [ ] Google OAuth has the production origin and callback URL registered.
- [ ] `OPENAI_API_KEY` is set if the assistant should work, with a spending limit set in the OpenAI dashboard as a backstop to the app's 30-turns-an-hour limit per student.
- [ ] Sentry DSN and auth token are set if error reporting is wanted.
- [ ] Supabase backups are enabled for the plan in use.
