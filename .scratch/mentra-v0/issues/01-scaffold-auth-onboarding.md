# 01: Project scaffold, auth, onboarding shell

**What to build:** A student can visit the app, sign up (email/password or Google), complete a minimal onboarding (program, institution), and land on a personalized empty dashboard shell. This is the substrate every later ticket builds on.

**Blocked by:** None (can start immediately)

**Status:** implemented

**Design:** Invoke the `impeccable` skill for the onboarding flow and dashboard shell UI — calm, modern, low cognitive overload per the product's design principles (see [plan.md](../../../plan.md) section 2).

- [x] Next.js (App Router, TypeScript) app scaffolded with Tailwind CSS + shadcn/ui
- [x] Prisma connected to Postgres; schema pushed for `User`/`Session`/`Account`/`Verification` models
- [x] Better Auth configured with Prisma adapter: email/password + Google OAuth sign-up/sign-in (name is collected at sign-up, since Better Auth requires it on the account)
- [x] Onboarding form after sign-up: program (free text), institution — both optional/skippable
- [x] Authenticated dashboard route renders a personalized greeting ("Good evening, {name}") with an otherwise empty shell
- [x] Signing out and back in preserves the onboarding data
- [x] Env vars documented in `.env.example` (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`, placeholder `OPENAI_API_KEY`)
- [x] `DATABASE_URL` points at a real Supabase Postgres project (session pooler connection)
