# Configuration

Every environment variable Mentra reads, where it is used, and what happens without it. Start from [`.env.example`](../.env.example); locally, variables go in `.env`, which is gitignored.

## Environment variables

| Variable | Required | Used by | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | **Yes** | `src/lib/prisma.ts`; `prisma.config.ts` when `DIRECT_URL` is unset | Runtime PostgreSQL connection |
| `DIRECT_URL` | Production only | `prisma.config.ts` (Prisma CLI and Migrate) | Connection for migrations when it differs from the runtime one |
| `TEST_DATABASE_URL` | For `npm test` | `vitest.config.ts` | A separate database for the test suite |
| `BETTER_AUTH_SECRET` | **Yes** | Better Auth (read implicitly) | Signs session cookies and tokens |
| `BETTER_AUTH_URL` | **Yes** | `src/lib/auth.ts` | The app's public origin; base for OAuth callbacks and a trusted origin |
| `GOOGLE_CLIENT_ID` | No | `src/lib/auth.ts` | Google sign-in, together with the secret |
| `GOOGLE_CLIENT_SECRET` | No | `src/lib/auth.ts` | Google sign-in, together with the ID |
| `OPENAI_API_KEY` | For the assistant | `src/app/api/assistant/route.ts`, `src/lib/ai/openai.ts` | Calls to OpenAI |
| `OPENAI_MODEL` | No | `src/lib/ai/openai.ts` | Overrides the default model, `gpt-5.6-terra` |
| `NEXT_PUBLIC_SENTRY_DSN` | No | `src/instrumentation.ts`, `src/instrumentation-client.ts` | Enables Sentry error reporting |
| `SENTRY_AUTH_TOKEN` | No (build time) | Sentry's build plugin | Uploads source maps during `next build` |

Set automatically by the platform:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `VERCEL_URL` | `src/lib/auth.ts` | Trusts the per-deployment URL |
| `VERCEL_PROJECT_PRODUCTION_URL` | `src/lib/auth.ts` | Trusts the production domain |
| `VERCEL_ENV`, `NEXT_PUBLIC_VERCEL_ENV` | Sentry setup | The Sentry `environment` (falls back to `NODE_ENV`) |
| `NODE_ENV` | `src/lib/prisma.ts` | Connection pool size (1 in production, 10 otherwise) and client caching |
| `CI` | `next.config.ts` | Makes Sentry's build output verbose |

## Details

### Database URLs

| Environment | `DATABASE_URL` | `DIRECT_URL` |
| --- | --- | --- |
| Local | The local `prisma dev` connection string | Leave the line out |
| Vercel with Supabase | Transaction pooler, port **6543** | Session pooler, port **5432** |

- Supabase's direct connection is IPv6-only and unreachable from some networks, so use a pooler.
- On Vercel each serverless instance opens its own connection; the transaction pooler shares a small number of database connections across them.
- Prisma Migrate needs session-level advisory locks, which the transaction pooler doesn't provide, hence the separate `DIRECT_URL`.
- `prisma.config.ts` uses `DIRECT_URL ?? DATABASE_URL`. An **empty** `DIRECT_URL=""` does not fall back, so remove the line instead of blanking it. If `DIRECT_URL` is set, every Prisma CLI command uses it, including migrations you meant to run against another database.

### `TEST_DATABASE_URL`

The tests create and delete real rows. `vitest.config.ts` refuses to start when `TEST_DATABASE_URL` is unset or identical to `DATABASE_URL`, then points the Prisma client at it for the run. The check compares the strings exactly, so the same database written two different ways would pass; make sure it really is a different database. See [development.md](development.md#tests).

### `BETTER_AUTH_SECRET`

Generate one per environment:

```bash
openssl rand -base64 32
```

Changing it invalidates every existing session.

### `BETTER_AUTH_URL`

The exact origin students use, with the scheme and no trailing slash: `http://localhost:3000` locally, `https://your-domain.com` in production. If it is wrong, Google sign-in returns to the wrong place.

### Google

Both variables must be set for Google sign-in to be enabled; otherwise the buttons are hidden. The OAuth client needs `<BETTER_AUTH_URL>/api/auth/callback/google` as an authorized redirect URI. See [authentication.md](authentication.md#google-sign-in).

### OpenAI

Without `OPENAI_API_KEY` the app works normally, but every assistant message returns `503` with "The assistant isn't configured yet — no API key is set." `OPENAI_MODEL` changes the model; an empty value uses the default. The assistant relies on function tools with `reasoning_effort: "none"`, so a replacement model must support that combination on the Chat Completions API. See [ASSISTANT.md](../ASSISTANT.md#limits).

### Sentry

- Without `NEXT_PUBLIC_SENTRY_DSN`, Sentry is not initialised and nothing is sent. The DSN is public by design: it is bundled into the browser code and only allows sending events.
- Without `SENTRY_AUTH_TOKEN`, builds still succeed and errors still report, but stack traces are minified. The token needs the `project:releases` and `org:read` scopes.
- The Sentry organisation and project are set in `next.config.ts` (`aaeahmed98` / `javascript-nextjs`). Change them there if you use a different Sentry project.

## Files that configure the app

| File | What it controls |
| --- | --- |
| `next.config.ts` | Wraps the Next config with `withSentryConfig`: source map upload, the `/monitoring` tunnel route |
| `prisma.config.ts` | Schema and migrations paths; the CLI's database URL |
| `prisma/schema.prisma` | Data model; generates the client into `src/generated/prisma` |
| `vitest.config.ts` | Test database guard, `@/` alias, serial test files |
| `tsconfig.json` | Strict TypeScript; `@/*` maps to `src/*` |
| `eslint.config.mjs` | `eslint-config-next` core web vitals and TypeScript rules |
| `postcss.config.mjs` | Tailwind CSS v4 through `@tailwindcss/postcss` |
| `components.json` | shadcn CLI settings (`base-nova` style) |
| `.claude/launch.json` | Local preview launch configurations for Claude Code |
