# Mentra

Your academic life, understood. See [plan.md](plan.md) for the product plan and staged roadmap (v0 → v1 → v2 → v3), and [PRODUCT.md](PRODUCT.md) for product truth used by the design workflow.

## Stack

Next.js (App Router, TypeScript), Tailwind CSS v4, shadcn/ui, Prisma + Postgres (Supabase), Better Auth, Vitest.

## Getting started

```bash
npm install
npx prisma migrate dev
npm run dev
```

Copy `.env.example` to `.env` and fill in `DATABASE_URL` (Supabase session pooler connection string — see the comment in `.env.example` for where to find it), `BETTER_AUTH_SECRET`, and (optionally, for Google sign-in) `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`. `OPENAI_API_KEY` isn't needed until ticket 07.

## Tests

```bash
npm run test
```

## Tickets

Work is tracked as local tickets under [.scratch/mentra-v0/issues/](.scratch/mentra-v0/issues/), numbered in dependency order.
