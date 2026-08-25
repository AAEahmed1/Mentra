---
name: Mentra
description: Your academic life, understood.
colors:
  cardstock-cream: "oklch(0.985 0.012 80)"
  drawer-taupe: "oklch(0.93 0.018 70)"
  rail-taupe: "oklch(0.89 0.017 70)"
  ink: "oklch(0.24 0.02 55)"
  rust-tab: "oklch(0.53 0.15 35)"
  rust-tab-ink: "oklch(0.99 0.008 80)"
  teal-tab: "oklch(0.45 0.06 175)"
  teal-tab-ink: "oklch(0.97 0.01 170)"
  filed-border: "oklch(0.8 0.02 68)"
  muted-label: "oklch(0.48 0.02 60)"
  destructive: "oklch(0.53 0.22 25)"
typography:
  display:
    fontFamily: "IBM Plex Serif, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  headline:
    fontFamily: "IBM Plex Serif, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  metadata-mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "0.18rem"
  md: "0.24rem"
  lg: "0.3rem"
  xl: "0.42rem"
  pill: "999px"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  card-gap: "1.25rem"
components:
  card-filed:
    backgroundColor: "{colors.cardstock-cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  chip-tab-due:
    backgroundColor: "{colors.rust-tab}"
    textColor: "{colors.rust-tab-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  chip-tab-ontrack:
    backgroundColor: "{colors.teal-tab}"
    textColor: "{colors.teal-tab-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  button-primary:
    backgroundColor: "{colors.rust-tab}"
    textColor: "{colors.rust-tab-ink}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
  button-primary-hover:
    backgroundColor: "{colors.rust-tab}"
    textColor: "{colors.rust-tab-ink}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
  button-destructive:
    backgroundColor: "oklch(0.53 0.22 25 / 0.1)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
---

# Design System: Mentra

## Overview

**Creative North Star: "The Card Catalog"**

Mentra reads as a drawer of filed index cards, not a dashboard of panels. The governing object is the card: cream card-stock, a punched index tab, a short life on top of a fanned stack. The thesis is literal in the built dashboard — tonight's recommendation is not a list row, it is a single card physically pulled forward out of the rail, with the rest of the filed stack peeking from behind and below it in strict order. Nothing on screen claims urgency by decoration; urgency is expressed by position (pulled to the front) and by a two-color tab system (rust for due soon, muted teal for on track), never by an invented badge shape.

The material world is warm and archival: card-stock cream over a taupe "drawer" ground in light mode, warm charcoal with lamp-glow cards at night. Three IBM Plex faces do the type work with no additional families: Serif for headers (the card's typed title), Mono for metadata (the card's stamped facts — duration, percent complete, due-in-days), Sans for body copy (the card's handwritten reasoning). This is confirmed in the shipped font wiring (`layout.tsx`) and used consistently across dashboard, onboarding, auth, and the courses surface.

The courses page confirms the catalog thesis extends to CRUD: filed records (semesters) are Cards with the punched three-dot device, an inner bordered/divided list of nested records (courses), and a `CardAction`-positioned destructive control. Adding a new record is deliberately *not* another Card — it is a dashed-border, unfilled action slot, so the eye never confuses "add" with "filed."

**Key Characteristics:**
- One card, pulled forward, is the unit of the whole system — not a grid, not a table.
- Two-tab color vocabulary only: rust for due-soon, teal for on-track. No third tab color exists.
- IBM Plex Serif / Mono / Sans, one job each, never swapped.
- Filed cards behind the pulled card are represented by rotation and opacity, not by content — they are the fan, not a preview.
- A single authored motion moment (the pulled-card settle) marks the one thing the direction cares about; nothing else animates.
- Filed records are Cards; the action that creates a new one is a visually distinct, unfilled dashed slot — never a Card impersonating a record.

## Colors

The palette is a narrow, warm neutral field (cream-on-taupe by day, charcoal-with-lamp-glow by night) interrupted only by the two tab colors, the rust-toned primary, and a single destructive red reserved for irreversible or guarded actions. All values are OKLCH, defined once in `globals.css` `:root` / `.dark` and consumed as Tailwind-mapped custom properties — this is the single source of truth; no hex duplicates exist elsewhere.

### Primary
- **Rust Tab** (`oklch(0.53 0.15 35)` light / `oklch(0.68 0.16 35)` dark): the "due soon" tab color and the app's primary action color (`--primary` and `--tab-due` share the same hue). Used for the due-soon chip, primary buttons, links, focus ring, and text selection. It is the one saturated, chromatic color the eye is meant to land on.

### Secondary
- **Muted Teal Tab** (`oklch(0.45 0.06 175)` light / `oklch(0.62 0.09 175)` dark): the "on track" tab color (`--tab-ontrack` / `--accent`). Lower chroma than the rust so it reads as calm, not urgent — the two tabs are deliberately unequal in intensity, matching their unequal urgency.

### Neutral
- **Drawer Taupe** (`oklch(0.93 0.018 70)` light / `oklch(0.19 0.016 50)` dark): the page background — the "drawer" the cards sit in.
- **Cardstock Cream** (`oklch(0.985 0.012 80)` light / `oklch(0.25 0.02 50)` dark, "lamp-glow" at night): the card surface itself (`--card`, `--popover`).
- **Rail Taupe** (`oklch(0.89 0.017 70)` light / `oklch(0.23 0.018 50)` dark): a step between background and card, used for the index-tab device and the sidebar/rail plane — visually between the drawer and the filed card.
- **Ink** (`oklch(0.24 0.02 55)` light / `oklch(0.93 0.014 75)` dark): primary text (`--foreground`, `--card-foreground`).
- **Muted Label** (`oklch(0.48 0.02 60)` light / `oklch(0.68 0.02 60)` dark): secondary text — metadata, captions, optional-field hints in forms.
- **Filed Border** (`oklch(0.8 0.02 68)` light / `oklch(0.35 0.02 55)` dark): the hairline that edges every card, divider, list row, and input (`--input` shares this value).

### Destructive
- **Destructive Red** (`oklch(0.53 0.22 25)` light / `oklch(0.65 0.2 25)` dark, `--destructive`): reserved for irreversible or consequential removal — the guarded "Delete semester" action and inline form-validation errors. It never appears as decoration; it only appears attached to a destructive control or an error state.

### Named Rules
**The Two-Tab Rule.** Status color is expressed only through the rust/teal tab pair (`--tab-due` / `--tab-ontrack`). No third status color, and no status is ever conveyed by a bare colored dot, icon, or badge shape outside these two chips.

**The One Saturated Color Rule.** Rust is the only high-chroma color on any screen — it carries primary actions, the due-soon tab, and the focus ring simultaneously so a student never has to learn a second "important" color. Destructive red is the sole confirmed exception, and only ever on a delete control or an error message, never a status or emphasis device.

## Typography

**Display/Headline Font:** IBM Plex Serif (with Georgia, serif fallback)
**Body Font:** IBM Plex Sans (with system-ui fallback)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace fallback)

**Character:** A typed index card, not a screen — Serif gives titles the weight of a heading stamped on a card tab, Mono gives facts (durations, percentages, due-in-days, course code/professor/credits) the look of a machine-stamped ledger entry, and Sans carries the reasoning text and form copy in a plain, legible, non-decorative voice.

### Hierarchy
- **Headline** (font-semibold/600, 1.125–1.5rem, `leading-snug`): card titles and page greetings (`h1`/`h3` — "Network Security Lab", "Courses", "Fall 2026"). Always Serif.
- **Body** (400, 0.875rem, `leading-normal`): reasoning text, descriptions, form copy, course-row primary text. Always Sans. Line length stays within a single card's width (~60–70ch at most).
- **Label** (500, 0.875rem): section labels ("Recommended for tonight", "Add a semester", form field labels), muted-foreground weight for optional-field hints.
- **Metadata/Mono** (400, 0.75rem, tabular-nums, `letter-spacing: 0.02em`): stamped facts — "55 min · 70% complete", semester date ranges, the "Code · Professor · Credits" course-row line, the "NSEC" index-tab code. Always Mono, always `tabular-nums-mono` when it carries numbers so digits don't jitter in place.

### Named Rules
**The One Job Per Face Rule.** Serif is for titles only, Mono is for stamped facts only, Sans is for everything else. No face substitutes for another's job, even at small sizes.

## Layout

The app is single-column and card-centered, not grid-based. The dashboard's and courses page's `main` are capped at `max-w-3xl`, centered, with generous vertical rhythm (`gap-8` between sections, `py-12` outer padding). Auth and onboarding surfaces use a narrower `max-w-sm`/`max-w-md` single card centered in the viewport — the whole screen is one filed card, no rail.

The recommendation section is the system's signature composition: a `relative` stack where two `absolute` ghost cards (rotated 1.5° and 3°, decreasing opacity: 60% then 40%) sit behind and slightly offset from the pulled card, simulating a fanned stack glimpsed from the front. Below the fan, a bordered, divided list (`divide-y`) holds the remaining filed items in plain list form — the fan is reserved for the single pulled-forward recommendation; everything else below it is flat and filed, not fanned. The courses page reuses this same bordered/divided list pattern for course rows nested inside a semester Card, confirming it as the system's general "flat filed list" device, independent of the fan.

### Named Rules
**The Responsive Field-Row Rule.** A form row of three or more fields stacks to a single column on narrow viewports and expands to one row at `sm` and above (`grid-cols-1 sm:grid-cols-3`, confirmed in the course form's Code/Professor/Credits row) — a deliberate collision fix, not a one-off. A two-field row (e.g. the semester form's Starts/Ends dates) stays a fixed `grid-cols-2` with no responsive stacking, since two fields comfortably fit any supported viewport; the responsive rule applies specifically once a row reaches three or more fields.

## Elevation & Depth

Hybrid: flat "filed" list rows carry only a hairline border, while the pulled-forward card and every top-level container (auth shell, onboarding card, dashboard's pulled card, semester Card, course-row list) carry a two-layer shadow that reads as a card lifted off the drawer surface, not a UI panel floating in space. The one confirmed exception is the "add a semester" action slot, which is deliberately flat and shadowless — see Components.

### Shadow Vocabulary
- **Filed lift** (`box-shadow: 0 1px 2px oklch(0 0 0/0.06), 0 8px 24px -8px oklch(0 0 0/0.18)`): the resting elevation for any standalone card container (auth shell, onboarding card, generic `Card` component, semester record cards).
- **Pulled-card lift** (`box-shadow: 0 1px 2px oklch(0 0 0/0.06), 0 12px 28px -10px oklch(0 0 0/0.22)`): a deeper, wider shadow reserved for the single pulled-forward recommendation card — it sits visibly higher off the drawer than a resting filed card.

### Named Rules
**The Pull Reads as Lift Rule.** Depth is used narratively: the more "pulled forward" a card is, the deeper its shadow. Rows inside the filed list below it carry no shadow at all — they're still in the drawer.

**The Action Slot Stays Flat Rule.** A container whose job is to *create* a new filed record (not display one) carries no shadow and no fill — see The Add-New Slot in Components. Depth is reserved for records that already exist.

## Shapes

Corners are gently rounded, not sharp and not pill-heavy: `--radius: 0.3rem` (~4.8px) is the base, scaled up for larger surfaces (`--radius-xl`/`--radius-2xl` etc. via `calc(var(--radius) * n)`) and down for small chips. Only status/action chips and the theme toggle use full pill radius (`rounded-full`) — everything else (cards, list rows, buttons, inputs) uses the small `rounded-lg` card-corner value. Inputs confirm this: the `Input` primitive is `rounded-lg`, matching the card corner exactly rather than adopting its own radius. Borders are a consistent single hairline (`border border-border`/`border-input`) on every card, row, divider, and input — no double borders, no borderless floating panels except where shadow alone does the separating (the pulled card over its own fan). The one deliberate departure is the dashed border on the add-new action slot, which trades the hairline solid border for a dashed one specifically to signal "not a filed record" — see Components.

The signature silhouette is the **index tab**: a small rectangular tab (`h-[18px] w-11`, `rounded-t-md`, bordered on three sides only, no bottom border) that overlaps the top edge of the pulled card, stamped with a short Mono code (e.g. "NSEC"). It is the one place in the system where a shape breaks a card's own rectangle.

## Components

### Buttons
- **Shape:** `rounded-lg` (matches card radius), border-transparent by default.
- **Primary:** rust background / cream text (`bg-primary text-primary-foreground`), `hover:bg-primary/80`.
- **Ghost/ Outline/ Secondary:** ghost and outline variants used for the theme toggle, secondary/low-stakes actions (course "Remove"), and the "Add course" submit; hover shifts to muted background, never to a new hue.
- **Destructive:** low-emphasis tinted fill, not a solid red block — `bg-destructive/10 text-destructive`, `hover:bg-destructive/20`. Reserved for actions with real consequence (deleting a semester that may contain courses); it reads as a serious control without shouting.
- **Ghost icon button:** the theme toggle is the only icon-only button in the sampled surfaces — sun/moon rendered as inline stroke SVG at `size-4`, `variant="ghost" size="icon"`.

### Named Rules
**The Destructive Weight Matches Consequence Rule.** Button emphasis for a removal action scales with how consequential and reversible it is. Deleting a semester (`variant="destructive"`) is guarded — it can be blocked server-side with an inline error when the semester still holds courses — so it carries the tinted destructive treatment. Removing a single course (`variant="ghost"`) is low-stakes, frequent, and trivially reversible (re-add the course), so it stays visually quiet, matching every other ghost action. A destructive-red button is earned by an action that is actually guarded or hard to undo; it is not the default for every delete.

### Chips
- **Style:** pill radius (`rounded-full`), solid fill, small caps-free label text (`text-xs font-medium`), `px-2/2.5 py-0.5/1`.
- **State:** exactly two variants — `tab-due` (rust) and `tab-ontrack` (teal). No neutral/unselected chip variant exists in the sampled surfaces; a chip is always one of the two statuses.

### Cards / Containers
- **Corner Style:** `rounded-lg` (~4.8px, the base `--radius`).
- **Background:** `--card` (cardstock cream / lamp-glow charcoal), with the `.bg-cardstock` grain texture applied on interior content regions (dashboard pulled card, auth-shell body, onboarding body) — a faint fibrous SVG-noise multiply, opacity kept low enough to never affect text contrast.
- **Shadow Strategy:** see Elevation & Depth — filed lift at rest, pulled-card lift for the single forward-pulled surface.
- **Border:** single hairline, `border-border`, on every card.
- **Internal Padding:** `20px`/`24px` (`px-5 py-5` on the pulled card, `px-6 py-6` on auth/onboarding card bodies); the base `Card` UI primitive uses a `--card-spacing` token defaulting to `1rem` (`0.75rem` at `size=sm`).
- **Filed-index device:** every top-level card (auth shell header, onboarding header, dashboard pulled card, semester record card) carries the same three-dot "punched holes" mark (three `size-1` circles at 40% opacity) in its header — a consistent catalog-card affordance, not a one-off.
- **Nested filed list:** a semester Card's `CardContent` can hold its own bordered, divided list of child records (`divide-y divide-border overflow-hidden rounded-lg border border-border` wrapping `bg-card` rows) — the same flat "filed list" device used below the dashboard's fan, now nested one level deeper for course rows inside a semester.
- **CardAction placement:** a card's single consequential control (e.g. delete) is positioned via `CardAction` in the header, opposite the title — not inline in the body and not floating.

### Inputs / Fields
- **Style:** plain hairline border (`border-input`, the same `filed-border` hairline as everything else — no card-catalog-specific decoration), `bg-transparent` in light mode (`bg-input/30` in dark), `rounded-lg` matching the card-corner radius, fixed `h-8` (32px) height, `px-2.5 py-1` internal padding, base text at `text-base`/`md:text-sm`.
- **Focus:** `border-ring` plus a soft 3px `ring-ring/50` halo — no glow, no color shift beyond the standard rust focus ring already used system-wide.
- **Error/Disabled:** `aria-invalid` swaps the border and ring to destructive (`border-destructive`, `ring-destructive/20`); disabled state drops opacity to 50% with a faint `bg-input/50` fill. Field-level errors are not shown per-input; a form collects its errors into a single `role="alert"` block (`rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive`) below the fields — the same tinted-destructive treatment as the destructive button, not a louder red block.
- **Labels:** `Label` is plain `text-sm font-medium`, no color shift from body text, `gap-2` flex row (for cases pairing a label with an inline hint like "(optional)" in muted-foreground).

### Navigation
- No persistent nav/sidebar chrome in the sampled surfaces. Each page carries a minimal header: the "Mentra" wordmark (Serif, `text-primary`) at top-left, theme toggle + sign-out at top-right on the dashboard and courses page, theme toggle alone (top-right, absolute) on auth/onboarding.

### The Pulled Card (signature component)
The dashboard's central device: a `relative` stack of two `absolute`, rotated, decreasing-opacity ghost cards behind an `animate-pulled-card` foreground card bearing the index tab, title, mono metadata line, status chip, and reasoning text. On mount it runs the one authored motion moment in the system — `pulled-card-settle` (480ms, `cubic-bezier(0.16, 1, 0.3, 1)`, opacity 0→1 with a 10px rise and 0.98→1 scale), disabled under `prefers-reduced-motion: reduce`. This card is the only element in the sampled surfaces that animates on load.

### The Add-New Slot (signature component)
The system's second recurring custom pattern: a dashed-border, no-shadow, no-fill container (`rounded-lg border border-dashed border-border p-5`) that holds the form for creating a new filed record — confirmed as "Add a semester" below the semester list. Its heading is a plain `text-sm font-medium text-muted-foreground` label, never a `CardTitle`, and it carries no punched-hole device and no card background. This is a deliberate opposite of the filed-card language: a record that exists is a solid, shadowed, cream Card; a record that doesn't exist yet is an unfilled dashed slot. It is intended to generalize to future add-flows (tasks, notes) beyond courses/semesters.

## Do's and Don'ts

### Do:
- **Do** express status only through the rust/teal tab pair; never introduce a third status color.
- **Do** reserve the deeper "pulled-card" shadow for the single forward-pulled item on a screen; everything else uses the shallower "filed" shadow or no shadow.
- **Do** use IBM Plex Serif for titles/headlines, Mono for stamped metadata (with `tabular-nums`), and Sans for everything else — one face, one job.
- **Do** keep the three-dot "punched hole" mark as the recurring catalog-card affordance on top-level card headers.
- **Do** apply the `.bg-cardstock` grain texture only to card interiors, kept subtle enough not to affect text contrast.
- **Do** use the dashed, unfilled "add-new slot" (not a Card) for any container whose job is creating a new filed record.
- **Do** match destructive-button weight to actual consequence: tinted `destructive` for guarded/hard-to-undo removals, `ghost` for low-stakes, reversible ones.
- **Do** stack a form row to one column below `sm` once it holds three or more fields; a two-field row may stay fixed-width.

### Don't:
- **Don't** fan more than the single pulled-forward card — the ghost-card rotation/opacity technique represents "cards behind the front one," not a general list-decoration device; ordinary filed rows stay flat with a hairline border, no rotation.
- **Don't** add a neutral/unselected chip variant to the tab system — a chip is always due or on-track; if a third state is needed, it needs its own named rule, not a silent third color.
- **Don't** introduce a second saturated accent color; rust remains the system's only high-chroma color. Destructive red is not a second accent — it only ever attaches to a delete control or an error state.
- **Don't** use sharp, unrounded corners or heavy pill radius on cards, rows, or inputs — the base `rounded-lg` (~4.8px) card-corner value is the standard; pill radius is reserved for chips and icon-only controls.
- **Don't** give every delete action the destructive-red treatment by default; reserve it for actions that are actually guarded or consequential, or the color stops meaning anything.
