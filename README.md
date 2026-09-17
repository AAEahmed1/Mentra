# Mentra

**Your academic life, understood.**

Mentra is a web app that keeps a student's courses, deadlines and notes in one place, and uses them to answer one question: what should I work on right now, and why? It ranks open work from the student's own due dates, priorities and time estimates, explains every recommendation in plain language, and includes an assistant that answers from the student's records instead of guessing.

![Mentra's Today page: a term timeline and today's recommended work with the reason it was chosen](docs/screenshots/dashboard.jpg)

## Features

- **Today.** A dashboard showing the term as a timeline, the single most important piece of work with a countdown, and the reason it was chosen, such as "Recommended because it's 4 days overdue and you estimated 75 min." Pick how much time you have (15 minutes to 90) and work that fits moves up.
- **Explainable ranking.** Ordinary, tested code decides the order, not a model: overdue work first, then work due within three days, then later work, then undated work, ordered within each group by fit to your time, priority and date.
- **Courses and terms.** Organise courses by semester, with codes, professors and credits.
- **Work.** Tasks, assignments and exams with due dates, priorities, estimates, statuses and topics to review. Overdue is worked out for you.
- **Notes.** Searchable notes, filed under a course and attached to the work they're about.
- **Ask Mentra.** An assistant on every page that reads your courses, work and notes through sixteen checked tools, files things you mention in passing, and explains its recommendations. Conversations are saved as separate threads.
- **What Mentra knows.** Every fact the assistant has learned about you, in plain language, with one-click forgetting and full account deletion.
- **Profile.** Edit your details and change your password.
- **Light and dark themes**, a layout that works on phones, and a considered visual design, "The Almanac".

## Screenshots

| | |
| --- | --- |
| ![Today in the dark theme](docs/screenshots/dashboard-dark.jpg) | ![The assistant panel](docs/screenshots/assistant.jpg) |
| **Today**, dark theme | **Ask Mentra** |
| ![Work](docs/screenshots/work.jpg) | ![Notes](docs/screenshots/notes.jpg) |
| **Work** | **Notes** |
| ![Courses](docs/screenshots/courses.jpg) | ![What Mentra knows](docs/screenshots/memory.jpg) |
| **Courses** | **What Mentra knows** |
| ![Landing page](docs/screenshots/landing.jpg) | ![Profile](docs/screenshots/profile.jpg) |
| **Landing page** | **Profile** |

More in the [user guide](docs/user-guide.md).

## Tech stack

| | |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui on Base UI |
| Database | PostgreSQL ([Supabase](https://supabase.com) in production) with [Prisma 7](https://www.prisma.io) |
| Authentication | [Better Auth](https://www.better-auth.com): email and password, optional Google |
| Assistant | OpenAI Chat Completions with function tools |
| Monitoring | Sentry, with student data scrubbed from reports |
| Testing | Vitest, with integration tests against a real database |
| Hosting | Vercel |

## Quick start

Requires Node.js 20.9 or newer. No Docker is needed; the local database runs through the Prisma CLI.

```bash
git clone git@github.com:AAEahmed1/Mentra.git
cd Mentra
npm install
```

Start a local database for the app and one for the tests, then list their connection strings:

```bash
npx prisma dev --name mentra -d
npx prisma dev --name mentra-test -d
npx prisma dev ls
```

Create your environment file:

```bash
cp .env.example .env
```

In `.env`:

1. Set `DATABASE_URL` to the `mentra` URL and `TEST_DATABASE_URL` to the `mentra-test` URL.
2. **Delete the `DIRECT_URL` line.** It is only for production.
3. Set `BETTER_AUTH_URL="http://localhost:3000"`.
4. Set `BETTER_AUTH_SECRET` to the output of `openssl rand -base64 32`.
5. Optionally, add `OPENAI_API_KEY` for the assistant and Google OAuth credentials for Google sign-in.

Generate the Prisma client, apply migrations to both databases, and start the app:

```bash
npx prisma generate
npx prisma migrate deploy
DATABASE_URL="<your mentra-test URL>" npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account. To fill it with a realistic term:

```bash
npm run seed:demo -- --email you@example.com
```

The full walkthrough is in [docs/development.md](docs/development.md).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate the Prisma client, **apply migrations**, and build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite (needs `TEST_DATABASE_URL`) |
| `npm run seed:demo -- --email <address>` | Replace an account's data with a demo term (local use only) |

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection used by the app |
| `DIRECT_URL` | Production | Connection used for migrations (Supabase session pooler) |
| `TEST_DATABASE_URL` | For tests | A separate database the tests can write to |
| `BETTER_AUTH_SECRET` | Yes | Signs sessions |
| `BETTER_AUTH_URL` | Yes | The app's public origin |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | No | Enable Google sign-in |
| `OPENAI_API_KEY` | For the assistant | Without it the assistant replies that it isn't configured |
| `OPENAI_MODEL` | No | Defaults to `gpt-5.6-terra` |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | No | Error reporting and source maps |

Details for each are in [docs/configuration.md](docs/configuration.md).

## Deployment

Mentra is built for Vercel with a Supabase database:

1. Create a Supabase project and copy its transaction pooler (port 6543) and session pooler (port 5432) connection strings.
2. Import the repository into Vercel and set `DATABASE_URL` (transaction pooler), `DIRECT_URL` (session pooler), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and any optional variables.
3. Deploy. The build applies database migrations before compiling, including enabling row level security on every table.
4. For Google sign-in, register `https://<your-domain>/api/auth/callback/google` with your OAuth client.

Because migrations run during the build, make sure preview deployments don't use the production database. See [docs/deployment.md](docs/deployment.md).

## Project structure

```text
prisma/              Schema, migrations and the demo seed script
src/app/             Pages, API routes, layout and global styles
src/components/      React components grouped by feature, plus ui/ primitives
src/lib/actions/     Server actions for every form
src/lib/services/    Database access, scoped to the signed-in student
src/lib/ai/          The assistant: tools, prompt, loop and OpenAI client
src/lib/             Ranking, validation, date rules, auth and session helpers
docs/                Documentation and screenshots
```

## Documentation

| | |
| --- | --- |
| [User guide](docs/user-guide.md) | Every page, from a student's point of view |
| [Architecture](docs/architecture.md) | How the system fits together |
| [Database](docs/database.md) | Data model, migrations, row level security, services |
| [Domain logic](docs/domain-logic.md) | Ranking, dates, validation and server actions |
| [Authentication](docs/authentication.md) | Sessions, protection, passwords and Google |
| [Frontend](docs/frontend.md) | Routes, components and the design system |
| [The assistant](ASSISTANT.md) | What Ask Mentra can and cannot do |
| [Configuration](docs/configuration.md) | Environment variables and config files |
| [Development](docs/development.md) | Local setup, tests and contribution rules |
| [Deployment](docs/deployment.md) | Vercel, Supabase and monitoring |
| [Security and privacy](docs/security.md) | How student data is protected |
| [Known issues](docs/known-issues.md) | Open defects and gaps |
| [Design system](DESIGN.md) | "The Almanac" visual language |
| [Product](PRODUCT.md) and [plan](plan.md) | Principles and roadmap |

## Privacy

Each student sees only their own data. Every query is scoped to the signed-in account, the assistant cannot be given another student's id, and row level security closes Supabase's public API. Error reports have request bodies, cookies, headers and search text removed. The assistant sends the student's relevant records to OpenAI when it is used. Students can review and forget anything the assistant has learned, and delete their account and all its data. See [docs/security.md](docs/security.md).

## Not included yet

Calendar sync, file uploads, reminders and notifications, sharing and group work, grades, email verification and password reset.

## Contributing

Before opening a pull request, run:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Then check the change in the running app. Scope every database query to the signed-in student, enable row level security on any new table, and update [ASSISTANT.md](ASSISTANT.md) and the relevant page in `docs/` in the same commit as the change they describe. The full guidelines are in [docs/development.md](docs/development.md#working-on-the-code).

## License

No license has been chosen yet, so all rights are reserved by the author.
