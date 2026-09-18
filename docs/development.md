# Development

How to run Mentra locally, test it, and change it safely.

- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Scripts](#scripts)
- [Tests](#tests)
- [Demo data](#demo-data)
- [Working on the code](#working-on-the-code)

## Prerequisites

- **Node.js 20.9 or newer** (Next.js 16's minimum). Node 22 is used in development.
- **npm**, which is what `package-lock.json` is for.
- No Docker and no system PostgreSQL are needed. The local database is a [Prisma dev server](https://www.prisma.io/docs/postgres/database/local-development), started from the Prisma CLI that is already a project dependency.

## Local setup

Use two local databases: one for the app and one for the tests, because the tests create and delete rows.

**1. Install dependencies**

```bash
npm install
```

**2. Start the two databases**

```bash
npx prisma dev --name mentra -d
npx prisma dev --name mentra-test -d
npx prisma dev ls
```

`prisma dev ls` prints each server's `DATABASE_URL`, such as `postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&...`. Ports are assigned when a server is created, so copy them from this output. After a reboot, start them again with `npx prisma dev start mentra mentra-test`.

**3. Create `.env`**

```bash
cp .env.example .env
```

Then edit it:

- Set `DATABASE_URL` to the `mentra` server's URL.
- **Delete the `DIRECT_URL` line.** If it is present, even empty, the Prisma CLI will not use your local database.
- Set `TEST_DATABASE_URL` to the `mentra-test` server's URL.
- Set `BETTER_AUTH_URL="http://localhost:3000"`.
- Set `BETTER_AUTH_SECRET` to the output of `openssl rand -base64 32`.
- Optionally set `OPENAI_API_KEY` for the assistant, and `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google sign-in (register `http://localhost:3000/api/auth/callback/google` in Google Cloud Console).

Every variable is described in [configuration.md](configuration.md).

**4. Generate the Prisma client and migrate both databases**

```bash
npx prisma generate
npx prisma migrate deploy
DATABASE_URL="<mentra-test URL>" npx prisma migrate deploy
```

The client is generated into `src/generated/prisma`, which is gitignored, so this step is needed after every fresh clone and after schema changes. `npm run build` also runs it.

**5. Run the app**

```bash
npm run dev
```

Open http://localhost:3000, create an account, and optionally load the [demo data](#demo-data).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js development server with Turbopack |
| `npm run build` | `prisma generate`, then `scripts/migrate-for-build.mjs` (which runs `prisma migrate deploy` except on Vercel previews), then `next build`. **Locally it migrates whatever database `DIRECT_URL` or `DATABASE_URL` points at.** |
| `npm run start` | Serves a production build |
| `npm run lint` | ESLint over the project |
| `npm test` | Vitest, once; database tests use `TEST_DATABASE_URL` |
| `npm run seed:demo -- --email <address>` | Replaces that account's data with a demo term (local databases only) |
| `npx tsc --noEmit` | Type check without building |
| `npx prisma migrate dev --name <change>` | Create a migration from schema changes (local database only) |
| `npx prisma studio` | Browse the local database |

To run a production build locally against the local database:

```bash
npm run build
npm run start
```

## Tests

```bash
npm test                                   # everything
npx vitest run src/lib/recommendations.test.ts   # one file
npx vitest                                 # watch mode
```

- Tests live beside the code as `*.test.ts` under `src/`.
- **Database tests need `TEST_DATABASE_URL`.** `vitest.config.ts` points Prisma at it for the run, and refuses to start if it names the same database as `DATABASE_URL`. Without it, unit tests still run: the config warns and points Prisma at an unreachable address, so database tests fail quickly instead of touching your app database.
- Test files run one at a time (`fileParallelism: false`), because they share the database.

What is covered:

| Area | Kind | Examples |
| --- | --- | --- |
| Pure logic in `src/lib/*.test.ts` | Unit | Ranking order and factors, the "why" sentence, overdue rules, time zones, due labels, greeting, validation schemas (including edit forms that clear fields), available minutes, Sentry scrubbing, the client thread store, the landing sample |
| Services in `src/lib/services/*.test.ts` | Integration, real database | Ownership refusals across students, cascades and set-null behaviour, account deletion leaving no orphans, message ordering and the 40-message window, profile updates |
| Row level security (`rls.test.ts`) | Integration | Every table in `public` has RLS enabled |
| Assistant in `src/lib/ai/*.test.ts` | Unit and integration | Tool schemas never accept `userId`, argument validation, the round limit, tool failures, the system prompt's date and memory sections, tool execution against the database |

Not covered by automated tests: pages and components, server actions, the assistant HTTP route and the OpenAI client. Check those by running a production build of the app.

## Demo data

```bash
npm run seed:demo -- --email you@example.com
```

Fills an **existing** account with a nursing student's term: one semester, five courses, eleven pieces of work (overdue, due today, upcoming, undated, in progress, completed), three notes and four memories. Dates are relative to today, so the dashboard always has something in every state. Add `--clear` to remove the data instead.

> **Warning:** every run first deletes that account's terms, courses, work, notes and memories. The script refuses to run unless `DATABASE_URL` is a local database; `--allow-remote` overrides that, loudly. Use it only on a throwaway account.

## Working on the code

### Where things go

| Change | Location |
| --- | --- |
| A new page | `src/app/<route>/page.tsx`, calling `requireUserId()` and wrapping content in `AppShell`; add it to `SECTIONS` in `app-sidebar.tsx` if it belongs in navigation |
| A form or mutation | A zod schema and `parseXInput()` in `src/lib/<thing>.ts`, a server action in `src/lib/actions/`, and a client form component |
| Database access | A function in `src/lib/services/` that takes `userId` first and scopes its query |
| A model change | `prisma/schema.prisma` plus a migration (see below) |
| Ranking or date rules | `src/lib/recommendations.ts`, `task-status.ts`, `due-label.ts`, with unit tests |
| An assistant ability | `src/lib/ai/tools.ts` and `execute.ts`, **and `ASSISTANT.md` in the same commit** |
| A destructive row action | A server action returning `RowActionResult`, run through `useRowAction`, behind `ConfirmAction` |

### Rules that are enforced or expected

- **Scope every query to the student.** Services take `userId` from the session and filter by it. Never accept a user id from a form, URL or the model.
- **Enable row level security on new tables.** Prisma won't add it. Add `ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;` to the migration; `rls.test.ts` fails otherwise. See [database.md](database.md#adding-a-migration).
- **Keep `ASSISTANT.md` current.** Any change under `src/lib/ai/`, or giving the assistant access to a new service, updates [ASSISTANT.md](../ASSISTANT.md) in the same commit.
- **Read the bundled Next.js docs.** This project uses Next.js 16, whose APIs differ from older versions. The docs for the installed version are in `node_modules/next/dist/docs/`.
- **Follow the design system.** Use the tokens and rules in [DESIGN.md](../DESIGN.md).
- **Get the time from `getStudentTime()`** in pages and routes and pass `now` down, instead of calling `new Date()` in helpers or client components. See [domain-logic.md](domain-logic.md#dates-and-time-zones).

### Adding a migration

```bash
# 1. edit prisma/schema.prisma
npx prisma migrate dev --name add_something
# 2. add ENABLE ROW LEVEL SECURITY for any new table to the generated SQL
DATABASE_URL="<mentra-test URL>" npx prisma migrate deploy
npm test
```

Commit the schema and the migration folder together. The next deploy applies it.

### Before opening a pull request

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Then run the app and exercise the change in the browser.
