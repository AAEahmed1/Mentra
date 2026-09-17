# Frontend

Routes, layout, components and the design system. The visual language itself, with its rules and reasoning, is specified in [DESIGN.md](../DESIGN.md); this page describes how it is implemented.

- [Routes](#routes)
- [Layout and shell](#layout-and-shell)
- [Components](#components)
- [Design system implementation](#design-system-implementation)
- [Accessibility](#accessibility)
- [Responsive behaviour](#responsive-behaviour)
- [Conventions](#conventions)

## Routes

All routes use the App Router under `src/app/`. Pages are server components unless noted.

| Route | Sign-in | Behaviour |
| --- | --- | --- |
| `/` | No | Landing page. Signed-in visitors are redirected to `/dashboard`. |
| `/sign-in` | No | Email and password form, plus Google when configured. Signed-in visitors go to `/dashboard`. |
| `/sign-up` | No | Name, email and password, plus Google. A new account, email or Google, continues to `/onboarding`. |
| `/onboarding` | Yes | Optional program and institution. Redirects to `/dashboard` once a program is set. Continue and Skip both go to `/courses`. |
| `/dashboard` | Yes | "Today": greeting, term timeline, time selector, today's entry and the ranked list. Reads `?minutes=`. |
| `/courses` | Yes | Terms with their courses; add, edit and remove courses; add and delete terms. |
| `/tasks` | Yes | "Work": every task with complete, edit, remove and attached notes; add work. |
| `/notes` | Yes | Notes with search (`?q=`), edit and remove; add a note. |
| `/chats` | Yes | List of assistant conversations; New chat. |
| `/chats/[id]` | Yes | One conversation in full; continue or delete it. Returns not found for another student's id. |
| `/privacy` | Yes | "What Mentra knows": memories, add a memory, delete account. |
| `/profile` | Yes | Name, program and institution; email; change password for password accounts. |
| `/api/auth/[...all]` | n/a | Better Auth handler (`GET`, `POST`). |
| `/api/assistant` | Yes | Assistant endpoint (`POST`). See [ASSISTANT.md](../ASSISTANT.md). |
| `/monitoring` | n/a | Sentry tunnel added by `withSentryConfig`; not a file in the repo. |

Special files:

- `error.tsx`: "That page didn't load." with **Try again** and **Back to today**. Reports the error to Sentry and shows its digest as a reference.
- `global-error.tsx`: "Mentra couldn't start." with **Reload Mentra**, for errors in the root layout. It renders its own `<html>` and `<body>`.
- `not-found.tsx`: "There's nothing here." with links to Today and Chats.

There are no `loading.tsx` files.

## Layout and shell

### Root layout (`src/app/layout.tsx`)

- Loads two fonts with `next/font/google`: **Archivo** for text and figures (`--font-sans`) and **Bitter** at 500, 600 and 700 for display (`--font-display`).
- Wraps everything in `ThemeProvider` (`next-themes`, `attribute="class"`, default `system`).
- Mounts `TimeZoneSync`, which reports the browser's time zone to the server in a cookie (see [domain-logic.md](domain-logic.md#dates-and-time-zones)).
- For a signed-in student, loads the most recent conversation and its last 40 messages and mounts `ThreadSeed` and `AssistantPanel`, so the assistant is available on every page. See [ASSISTANT.md](../ASSISTANT.md).

### `AppShell` (`src/components/app-shell.tsx`)

The frame of every signed-in page: a **Skip to content** link (visible when focused), the sidebar, then a centred `max-w-4xl` `<main id="main-content">` with a masthead (an `h1` in Bitter, an optional lede and actions, and the thick-thin rule) followed by the page content. The column clips horizontal overflow so the term table can't make the page scroll sideways.

```tsx
<AppShell title="Work" lede="Everything due..." actions={<Button>...</Button>}>
  ...
</AppShell>
```

### `AppSidebar` (`src/components/app-sidebar.tsx`)

- Links: Today, Courses, Work, Notes, Chats, What Mentra knows, Profile, each with a hand-drawn SVG icon and an explicit accessible name. The current section is filled with the green plate and marked `aria-current="page"`; nested pages such as `/chats/[id]` keep their section highlighted.
- On screens 768px and wider the sidebar is sticky and can collapse from 240px to 64px. The choice is stored in `localStorage` under `mentra:margin-collapsed` and read through `useSyncExternalStore`, so the server always renders it expanded and other tabs stay in sync.
- On phones it becomes a drawer opened from a sticky top bar, over a scrim. While open it behaves as a dialog: focus moves into it, Tab wraps inside it, Escape closes it and focus returns to the open button, which carries `aria-expanded`. While closed it is hidden from the tab order.
- The theme toggle and **Sign out** sit at the bottom (or in the phone top bar).

### Entry pages

`AuthShell` (`src/components/auth/auth-shell.tsx`) is the narrow centred frame for sign-in and sign-up. Onboarding has its own similar frame. Both include the theme toggle.

## Components

`src/components/` is grouped by feature. "Client" marks components with `"use client"`.

| Folder | Components | Notes |
| --- | --- | --- |
| (top level) | `AppShell`, `AppSidebar` (client), `ThemeProvider` (client), `ThemeToggle` (client), `TimeZoneSync` (client), `ConfirmAction` (client), `RunningHead`, `StateLamp`, `DurationBar`, `TimeAvailable`, `TermScore`, `filed-row.tsx` helpers | Shared building blocks |
| `auth/` | `AuthShell`, `SignInForm`, `SignUpForm`, `GoogleSignInButton`, `SignOutButton` | Forms are client components calling the Better Auth client |
| `onboarding/` | `OnboardingForm` | |
| `courses/` | `CourseRow`, `CreateCourseForm`, `CreateSemesterForm`, `DeleteCourseButton`, `DeleteSemesterButton` | |
| `tasks/` | `TaskRow`, `CreateTaskForm`, `QuickNoteForm` | |
| `notes/` | `NoteRow`, `CreateNoteForm` | |
| `privacy/` | `MemoryRow`, `CreateMemoryForm`, `DeleteAccountForm` | |
| `profile/` | `ProfileForm`, `ChangePasswordForm` | |
| `assistant/` | `AssistantPanel`, `AssistantThread`, `ThreadSeed`, `DeleteChatButton` | See [ASSISTANT.md](../ASSISTANT.md) |
| `landing/` | `LandingPage`, `SampleEdition` | The signed-out landing page and its live example term |
| `ui/` | `Button`, `Input`, `Label`, `Select`, `Textarea` | shadcn primitives |

Shared pieces worth knowing:

- **`RunningHead`** opens a region: an uppercase, letter-spaced label followed by a thick-thin rule. Props: `tone` (`quiet`, `now` or `danger`), `as` (`h2` or `h3`), `id`, `trailing`.
- **`StateLamp`** is the small square status mark (`over`, `today`, `on-track`). It always includes screen-reader text, so state is never shown by colour alone.
- **`DurationBar`** draws an estimate as a bar on a 240-minute scale, with the minutes written beside it.
- **`TimeAvailable`** renders the Any, 15m, 30m, 1h and 90m links that set `?minutes=`.
- **`TermScore`** is the dashboard timeline: seven days back to 21 days ahead, one row per course with dated work in that window, items sized at 90 minutes per day of width, a green line for today, and a hover or focus card per item. It is hidden below 768px.
- **`FiledRow`** and friends (`filed-row.tsx`) lay out list rows. On screens 768px and wider with a mouse, actions appear on hover or keyboard focus; on touch devices they stay visible. A row can print an `error` from a row action. `FormErrors` and `EditActions` are the edit form's error box and buttons.
- **`ConfirmAction`** asks before removing something: the first press turns the button into "Remove for good?" with **Remove** and **Keep**, focus follows the question, and Escape backs out. Its accessible name includes the item, such as "Remove Lab report".

### Forms

Forms are client components that call server actions through `useActionState` and render `{ errors }` in a `role="alert"` box. Inline edit and row buttons use the hooks in `src/lib/use-row-actions.ts`; see [domain-logic.md](domain-logic.md#client-helpers).

## Design system implementation

The design is called **The Almanac**: a term printed like an almanac, one ruled table of what is due when, with today's item in the largest type. [DESIGN.md](../DESIGN.md) is the specification. The implementation lives in [`src/app/globals.css`](../src/app/globals.css).

### Tokens

Colours are OKLCH custom properties exposed to Tailwind through `@theme inline`. Beyond the standard shadcn set there are:

| Token | Role |
| --- | --- |
| `now`, `plate-now`, `plate-now-ink` | The green plate: today, the current section, primary actions |
| `attention`, `plate-over`, `plate-over-ink` | The oxblood plate: work that has slipped, destructive actions |
| `rule`, `rule-strong` | 1px and 2px rules |
| `band` | Alternate row banding |

Text-and-line colours ("marks") and fill colours ("plates") are separate tokens, because the dark theme keeps plates dark and makes marks lighter.

- **Light theme ("day edition"):** pale green-grey paper, green-black ink, green and oxblood plates.
- **Dark theme ("night edition"):** deep green-black paper; plates stay dark with light text; marks become lighter.
- **Radius:** a 3px base (`--radius: 0.1875rem`). Corners are nearly square.
- **Type:** Bitter for headings (`h1` to `h3` and the display class), Archivo for everything else, with tabular figures for dates and numbers.

### Materials and motion

- A fixed radial "lamp" gradient on `html` and a faint grain texture over the viewport (`body::after`).
- Overlapping timeline items multiply (`.overprint`) in light mode.
- Motion is one "impression" sequence on the term table (the dashboard's, and the landing page's example of it): lane rules draw in, timeline blocks land (`animate-block-land`), the today line follows (`animate-now-rule`), and today's entry is struck (`animate-struck`, `animate-band`). Mastheads and running heads do not animate. All use `cubic-bezier(0.16, 1, 0.3, 1)`.
- `prefers-reduced-motion: reduce` switches the animations off.

### Structural classes

- `.running-head` and `.rule-pair` for the thick-thin rule (a 2px rule above a 1px rule).
- `.almanac-table` for banded tables with uppercase column heads.

## Accessibility

What is in place:

- Every field has a label; errors use `role="alert"` and confirmations use `role="status"`.
- Navigation landmarks are labelled, the current page uses `aria-current`, and decorative icons are `aria-hidden`.
- Status is always written in words as well as shown by colour.
- Timeline items are keyboard focusable, and their detail card opens on focus.
- Visible focus rings throughout.
- Inputs use 16px text on phones to stop iOS zooming.
- Reduced motion is respected.
- A skip link, a dialog-like phone drawer, row buttons named after their row, and a confirmation step before anything is removed.
- The assistant panel closes on Escape and moves focus in and out, but is not a modal; see [known-issues.md](known-issues.md#should-the-assistant-panel-be-a-dialog).

## Responsive behaviour

| Width | Changes |
| --- | --- |
| Under 640px | Secondary table columns fold under the title; the landing page hides its top Sign in link |
| Under 768px | Sidebar becomes a drawer under a sticky top bar; the term timeline is hidden; row actions are always visible; extra bottom padding leaves room for the assistant button |
| 768px and up | Sticky, collapsible sidebar; row actions appear on hover or focus when a mouse is present, and stay visible on touch screens |

## Conventions

- Prefer server components; add `"use client"` only for interactivity.
- Read data in pages through services; mutate through server actions. Don't call Prisma from components.
- Use the design tokens (`bg-plate-now`, `text-attention`, `border-rule-strong` and so on) instead of raw colours, and follow the rules in [DESIGN.md](../DESIGN.md): two plates, 1px or 2px rules, no shadows on content, square corners.
- Get the time from `getStudentTime()` in the page and pass `now` into date logic and client components, instead of calling `new Date()` in helpers, so the server render, the browser and the student's calendar agree on "today".
