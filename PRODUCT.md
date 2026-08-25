# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, TypeScript), Tailwind CSS v4, shadcn/ui (base-nova preset). Prisma + Postgres (Supabase), Better Auth for auth, OpenAI API for the AI assistant (added in a later ticket). Deployed to Vercel. Chosen deliberately (not delegated) — see [plan.md](plan.md).

## Users

The primary user is a student managing their academic life across a program, courses, tasks/assignments/exams, and deadlines. The first real user is the builder, a cybersecurity student — used to seed and test the product — but the data model and UI must not assume any specific program. It must work identically for CS, engineering, business, medical, law, or any other student.

## Product Purpose

Mentra is a personal academic operating system: it builds a persistent, evolving understanding of the student (courses, deadlines, strengths, weaknesses, habits) and uses that understanding to tell them what to do next, rather than just storing their data. Core loop: Understand → Organize → Plan → Execute → Learn → Remember → Improve.

## Positioning

"Your academic life, understood." Mentra is not a task manager, calendar, note-taking app, AI chatbot, or study planner in isolation — it's the layer that understands the student across all of those activities and turns that understanding into a specific, explainable recommendation of what to do right now. The differentiating mechanism: every AI recommendation is grounded in the student's actual stored data (deadlines, progress, past duration, weaknesses) via controlled tool calls, and is explainable on request ("why?").

## Operating Context

A student signs up, completes a short onboarding (name, program, institution), adds courses, and manages tasks/assignments/exams against deadlines. The dashboard surfaces a ranked "recommended for tonight" list. A persistent chat panel (added in ticket 07) lets them ask the assistant what to work on and why. Single-user per account, no collaboration/sharing in v0.

## Capabilities and Constraints

v0 scope (see [plan.md](plan.md) for full staging): auth (email/password + Google), minimal onboarding, flat Semester → Course structure (no Program/Year hierarchy yet), Task/Assignment/Exam as one typed entity, Notes with keyword search, a flat Memory table, a deterministic (non-AI) scheduling sort function, and a single general-purpose AI assistant with a fixed tool set. No document uploads, no semantic search/embeddings, no specialized AI modes, no calendar integration, no flashcards/quizzes, no proactive notifications in v0 — all deferred to v1/v2/v3 per plan.md's roadmap.

## Brand Commitments

No existing logo, wordmark, or locked color palette — greenfield. Product name "Mentra" is fixed. Tone must read as: intelligent, calm, modern, personal, organized, trustworthy, student-focused, helpful without being intrusive. Explicitly must NOT read as: a corporate enterprise dashboard, a generic project-management tool, a generic AI chatbot, a school administration portal, a complicated database, or a gamified children's app.

## Evidence on Hand

No real user content, testimonials, or case studies exist yet — this is the first build. Placeholder/representative content only (e.g. a cybersecurity-student seed scenario) until real usage data accumulates.

## Product Principles

- Understand, don't just store — every screen should reflect what the app knows about the student, not just what they entered.
- Recommend, don't just display — surfaces should answer "what matters right now," not dump raw lists.
- Explain, don't just decide — AI-driven recommendations must be able to show their reasoning on request.
- Minimize manual data entry and cognitive overload — a student should never feel like they're maintaining a database to use the app.
- Program-agnostic by construction — no UI or data-model decision may assume a specific field of study.

## Accessibility & Inclusion

Standard WCAG AA (contrast, keyboard navigation, visible focus states). No specific disability accommodation beyond that has been identified.
