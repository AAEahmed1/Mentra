---
name: Mentra
description: A term read as a score — every course a line, all work against one timeline.
colors:
  paper: "oklch(0.972 0.004 90)"
  paper-raised: "oklch(0.995 0.002 90)"
  margin: "oklch(0.952 0.004 90)"
  ink: "oklch(0.21 0.014 265)"
  ink-quiet: "oklch(0.52 0.014 265)"
  wash: "oklch(0.945 0.005 265)"
  border: "oklch(0.89 0.006 265)"
  rule: "oklch(0.84 0.008 265)"
  input-stroke: "oklch(0.87 0.007 265)"
  now-indigo: "oklch(0.5 0.19 275)"
  now-indigo-wash: "oklch(0.94 0.02 275)"
  now-indigo-ink: "oklch(0.36 0.12 275)"
  attention-amber: "oklch(0.52 0.13 70)"
  on-signal: "oklch(0.99 0.002 90)"
  destructive: "oklch(0.55 0.2 20)"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
    fontFeature: "\"cv05\" 1"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  subtitle:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.1em"
  meta:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
    fontVariation: "tabular-nums"
rounded:
  sm: "3.6px"
  md: "4.8px"
  lg: "6px"
  full: "999px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  section: "40px"
  page-y: "56px"
components:
  button-primary:
    backgroundColor: "{colors.now-indigo}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, oklch(0.5 0.19 275) 80%, transparent)"
    textColor: "{colors.on-signal}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-outline-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-quiet}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-destructive:
    backgroundColor: "color-mix(in oklch, oklch(0.55 0.2 20) 10%, transparent)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.lg}"
    height: "32px"
  cta-link:
    backgroundColor: "{colors.now-indigo}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    typography: "{typography.body}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
  filed-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "14px 0"
  lane-block:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink-quiet}"
    rounded: "{rounded.sm}"
    height: "24px"
  lane-block-overdue:
    backgroundColor: "color-mix(in oklch, oklch(0.52 0.13 70) 30%, transparent)"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "24px"
  section-label:
    backgroundColor: "transparent"
    textColor: "{colors.ink-quiet}"
    typography: "{typography.label}"
  sidebar-item-active:
    backgroundColor: "{colors.now-indigo-wash}"
    textColor: "{colors.now-indigo-ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: Mentra

## Overview

**Creative North Star: "The Score"**

Mentra reads a term the way a musician reads a score: every course is a line, every piece of work sits on that line at the moment it comes due, and one rule crosses all the lines at today. The interface is paper and ink — a warm off-white field by day, deep slate by night — ruled with hairlines and set in a single grotesque at several weights. Nothing is a tile; nothing floats. The page is a plane with rules drawn on it, and the reader's eye moves along those rules rather than hopping between boxes.

The system is achromatic almost everywhere. Colour is not decoration here, it is notation: indigo marks now and next, amber marks what has slipped, and work that is simply on track carries no colour at all. That restraint is what makes a single indigo hairline down the left of tonight's item legible from across the room. Density is high but unhurried — 14px body copy, 12px figures in tabular columns, generous vertical air between sections and hairline separators instead of card walls.

Stillness is the default. The build authors exactly one motion moment: the NOW rule arriving on load, scaling down the lanes and settling in 620ms. Everything else transitions only in response to a pointer or a focus ring. Both modes carry the same structure; dark mode lifts the two signal hues rather than re-designing anything.

**Key Characteristics:**
- Hairline rules instead of cards; no boxed dashboard tiles on any signed-in surface.
- One typeface (Archivo) doing display, body, label and figure work — `--font-serif` and `--font-mono` are deliberately aliased to `--font-sans`.
- Colour used only as signal: indigo for now/next, amber for slipped, nothing for on-track.
- Duration drawn as extent, not only written as a numeral.
- Tabular figures everywhere a number can be compared down a column.
- A collapsible left margin (240px / 64px) that names every line and never leaves the page.

## Colors

Paper-and-ink neutrals carrying two signal hues, with a single reserved hue for destruction.

### Primary
- **Now Indigo** (light `oklch(0.5 0.19 275)`, dark `oklch(0.7 0.16 275)`): the "look here" hue. It draws the NOW rule crossing every lane in the term score, the 1px left rule beside tonight's item, the today countdown figure, the focus ring, the text caret, the primary button and CTA link, and the active section in the margin. It is never used to decorate a surface.
- **Indigo Wash** (`oklch(0.94 0.02 275)`, dark `oklch(0.3 0.05 275)`) with **Indigo Ink** (`oklch(0.36 0.12 275)`, dark `oklch(0.86 0.07 275)`): the only tinted fill in the system, used for the current section in the margin.

### Secondary
- **Attention Amber** (light `oklch(0.52 0.13 70)`, dark `oklch(0.77 0.13 78)`): marks what has slipped and nothing else — the overdue countdown, the overdue due-label, and the outline plus 30% fill of an overdue block on its lane. Warm enough to notice, never alarming.

### Neutral
- **Paper** (`oklch(0.972 0.004 90)`, dark `oklch(0.172 0.014 265)`): the page field. Warm off-white by day, deep slate by night.
- **Raised Paper** (`oklch(0.995 0.002 90)`, dark `oklch(0.212 0.015 265)`): overlay surfaces only — the assistant panel and popovers.
- **Margin** (`oklch(0.952 0.004 90)`, dark `oklch(0.152 0.014 265)`): the sidebar field, a half-step off the page so the margin reads as furniture.
- **Ink** (`oklch(0.21 0.014 265)`, dark `oklch(0.93 0.006 90)`): all primary text. Slightly blue-black, never pure black.
- **Quiet Ink** (`oklch(0.52 0.014 265)`, dark `oklch(0.69 0.012 265)`): metadata, section labels, course names on lanes, the explanation line.
- **Rule** (`oklch(0.84 0.008 265)`, dark `oklch(0.36 0.016 265)`): the hairline itself — lane rules, row separators, header underlines, the filler line beside a section label, and the scrollbar thumb. This is the most-used non-text token in the build.
- **Border** (`oklch(0.89 0.006 265)`, dark `oklch(0.3 0.014 265)`): container edges — panel edges, outline buttons, prompt chips, the mobile bar.
- **Wash** (`oklch(0.945 0.005 265)`, dark `oklch(0.25 0.014 265)`): hover fills, the on-track lane block, the duration bar track, the user's own message bubble.

### Reserved
- **Destructive** (`oklch(0.55 0.2 20)`, dark `oklch(0.68 0.18 22)`): only on controls that destroy something and on inline validation errors, always as a 10% tint with a matching text colour and a 40% border.

### Named Rules
**The Colour-As-Edge Rule.** The field is achromatic. Colour appears only where it carries signal — indigo for now and next, amber for what has slipped. Work that is on track carries no colour at all. Audit test: strip every hue from a screen and it must still be readable and correctly ordered; add a hue and you must be able to say in one sentence what it tells the reader.

**The Two-Hue Rule.** Indigo and amber are the committed pair. Red is not part of the palette — it exists only on destructive controls and error alerts, and may never be used to signal urgency, priority, or lateness.

**The State-Not-By-Hue-Alone Rule.** Every state that colour marks is also stated in words or figures: "2 days over", "due today", "high priority". Colour is a second reading of something the text already says, never the only carrier.

**The Hairline Rule.** A coloured left rule is 1px and means "this is the one under the cursor" — tonight's struck item, the assistant header, the entry-page heading. It is never thickened into a side tab, and alerts use an all-round border instead of a left rule so the left rule keeps its single meaning.

## Typography

**Sole Font:** Archivo (Google, variable, `--font-sans`, with the `cv05` feature on for a single-storey-adjacent lowercase l disambiguation)
**Display / Body / Label / Mono:** all Archivo. `--font-serif`, `--font-mono` and `--font-heading` are all aliased to `--font-sans` on purpose; one family does every job.

**Character:** A neutral, slightly condensed grotesque that stays quiet at 12px and holds authority at 36px. Weight and size carry the whole hierarchy — there is no second family and no italic display. Italic appears once, on the plain-language explanation of why an item was ranked first, where it reads as a margin annotation.

### Hierarchy
- **Display** (600, 2.25rem/36px, line-height 1.1, tracking tight): the struck item's title on the dashboard, and the countdown figure beside it (36px, tabular, leading-none). The only two things at this size on any screen.
- **Headline** (600, 1.875rem/30px, tracking tight, balanced): the page title in every app-shell header.
- **Title** (600, 1.5rem/24px, tracking tight, balanced): the single heading on the ruled entry surfaces (sign-in, sign-up, onboarding).
- **Subtitle** (600, 1.125rem/18px and 1rem/16px, tracking tight): a course group heading; the assistant panel title and the wordmark.
- **Body** (400, 0.875rem/14px): every list row, paragraph, control and field. Prose is capped at 65ch; empty-state prose at 55ch.
- **Label** (500, 0.75rem/12px, letter-spacing 0.1em, uppercase): section labels only — "THE TERM", "NOW", "AFTER THAT", and the speaker names in the assistant. Always paired with a hairline running to the end of the measure.
- **Meta** (400, 0.75rem/12px, quiet ink, tabular): dates, counts, durations, priorities, row metadata.

### Named Rules
**The One Family Rule.** Archivo does display, body, label and figures. Do not introduce a serif, a mono, or a second sans — if a distinction is needed, change weight (400/500/600), size, or colour.

**The Tabular Figures Rule.** Any number a reader might compare down a column carries tabular figures — apply it via `<time>`, `[data-figures]`, or `.tabular-nums-mono`. Dates, day counts, and durations are always tabular.

**The Section Label Rule.** A section label is 12px, 500, uppercase, 0.1em tracked, quiet ink, and is always followed by a 1px rule filling the remaining width. It labels a region of the page; it is never used as a kicker above a headline and never carries colour except where the region itself is the NOW region (whose rule is indigo).

## Layout

The signed-in frame is the margin plus one plane of content: a sticky left margin (240px expanded, 64px collapsed, full-height, own field and right border) and a single centred column capped at `max-w-4xl` (56rem) with 24px side padding and 40px/56px vertical padding. There is no multi-column content grid and no card grid — sections stack in a single column separated by 40px gaps, each opened by a section label and its rule.

Vertical rhythm runs on a 4px base: 8px between adjacent controls, 12px between a label and its rule, 16–20px inside a section, 24px between the struck item's parts, 40px between sections. List rows are 14px top and bottom against a 1px rule, with the last row's rule removed. The page header sits above a 1px rule with 20px of clearance.

Responsive behaviour has one real breakpoint, `md` (768px). Below it the margin becomes an off-canvas drawer behind a 20%-ink scrim with a persistent top bar, hover-revealed row actions become permanently visible (there is no hover on a phone), and the term score is hidden outright — lanes need width to mean anything, so the phone reads the ranked list instead. `sm` (640px) handles smaller reflows: row metadata drops beneath the title, duration bars widen from 40px to 64px.

The term score itself is a two-column grid (`12rem` margin of course names, then the lane field) spanning 28 days — 7 behind today, 21 ahead — with week ticks at −7, 0, +7, +14, +21. Blocks are positioned by due date as a percentage of that span and drawn wide by estimated duration at 90 minutes per day-width, floored at 0.35 days so a ten-minute errand stays visible.

### Named Rules
**The One Plane Rule.** Every signed-in page is the margin plus one column. Sections are separated by space and hairlines, not by nested containers or a tile grid.

**The Lane Rule.** Work on a timeline sits on a 1px horizontal rule drawn as a background gradient (`.lane-rule`), 12rem of names to its left and the NOW rule crossing it. A lane is 48px tall and its blocks are 24px.

## Elevation & Depth

The system is flat. Content surfaces have no shadow at all: depth is expressed by hairline rules, a half-step field change between page and margin, and the wash fill used for hover and inert blocks. A reader should never perceive a signed-in page as a stack of floating objects.

Shadow exists only where something genuinely floats above the page — the assistant's slide-out panel and the button that summons it. Both are transient overlays anchored to a viewport edge, not content.

### Shadow Vocabulary
- **Floating control** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): the fixed "Ask Mentra" button, bottom-right.
- **Overlay panel** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)`): the assistant panel sliding in from the right edge, paired with a 1px left border.

### Named Rules
**The Flat-Plane Rule.** Shadows are for overlays only. If a surface is part of the page, it gets a rule or a field change, never a shadow — and never a hard offset shadow.

## Shapes

Corners are barely rounded: the radius base is 6px (`--radius: 0.375rem`) and the scale derives from it — 3.6px small, 4.8px medium, 6px large. Buttons, inputs and selects take the 6px large step; ad-hoc buttons, rows and message bubbles take the 4.8px medium step; lane blocks take 3.6px. Fully rounded (`999px`) is reserved for two hairline objects that read as strokes rather than shapes: the duration bar and its fill, and the 2px active marker in the margin.

Borders are 1px everywhere with one exception: the margin's active-section marker is a 2px rounded stroke sitting inside the item, which is a nav indicator rather than a content rule. Icons are drawn, not lettered and not glyph-fonts — inline SVG on an 18px grid, 1.4px stroke, round caps and joins, `currentColor`, always `aria-hidden` with a text label beside or a `title` when collapsed.

### Named Rules
**The Drawn Icon Rule.** Every icon in the system is inline SVG on the same grid at the same stroke weight. No icon fonts, no emoji, no invented letter-abbreviations standing in for icons in the collapsed margin.

## Components

### Buttons
- **Shape:** softly squared (6px), 32px tall by default (28px small, 24px xs), 10px horizontal padding, 14px medium-weight label, 1px transparent border reserved for focus.
- **Primary:** indigo fill, near-white label; hover drops to 80% opacity of the fill.
- **Outline:** page-coloured fill with a border-toned 1px edge; hover fills with wash.
- **Ghost:** no fill or edge at rest; hover fills with wash and darkens the label. The default for row actions and panel dismissals.
- **Destructive:** 10% destructive tint, destructive-coloured label, no solid fill — destruction is stated, not shouted.
- **Focus:** a 3px ring at 50% of the indigo ring colour plus a solid 1px border in the same hue. Active state nudges the control down 1px.
- **Link CTA:** the two dashboard calls to action are links styled as buttons — 4.8px radius, 14px/8px padding, indigo fill for the primary and a 1px border for the secondary.

### Inputs / Fields
- **Style:** transparent fill, 1px input-toned stroke, 6px radius, 32px tall, 16px text on phones dropping to 14px at `md` (deliberate — it stops iOS zooming on focus). Selects and textareas match exactly.
- **Focus:** border shifts to indigo and a 3px indigo ring at 50% opacity appears; the caret is indigo everywhere in the app.
- **Error:** `aria-invalid` shifts the border to destructive with a destructive 20% ring; the message itself is an all-round-bordered inline alert (1px destructive/40 edge, 10% tint, 4.8px radius) placed in the form, never a toast.
- **Labels:** 14px, 500, no uppercase, plain words.

### Navigation (the margin)
- **Style:** a full-height sticky column on its own field with a 1px right edge; 56px header carrying the wordmark and the collapse control; five sections; a footer holding the theme toggle and sign-out.
- **Items:** 14px, 8px vertical padding, 4.8px radius, quiet ink at rest, wash fill on hover.
- **Active:** indigo-wash fill, indigo-ink label, medium weight, plus a 2px rounded indigo marker at the left edge and `aria-current="page"`.
- **Collapsed (64px):** drawn icons only, labels moved to `title` and the wordmark to screen-reader-only; width transitions over 200ms. The preference persists in `localStorage` and is read through a store subscription so the server render and first client render agree.
- **Mobile:** a top bar with a menu control, wordmark, theme toggle and sign-out; the margin slides in from the left over a 20%-ink scrim.

### Lists (the filed row)
- **Style:** a flex row, 14px vertical padding, separated by a 1px rule with the last separator removed. Title at 14px; metadata beneath or beside at 12px quiet tabular.
- **Actions:** ghost buttons that are invisible at rest and appear on hover or focus-within at `md` and above; always visible below `md`.
- **Editing:** the row is replaced in place by its form, on the same rule, with Save (primary, small) and Cancel (ghost, small).

### Duration Bar (signature)
An estimate drawn as extent: a 4px-tall, fully-rounded wash track (40px wide, 64px at `sm`) filled proportionally at 50%-opacity quiet ink, clamped at 240 minutes and floored at 6% so a short task still shows. The exact figure sits beside it in 12px tabular type.

**The Duration-Is-Length Rule.** An estimate is drawn as extent, not written as a numeral alone. Two hours must look like twice one hour at a glance, and the number stays alongside for anyone who needs the exact value.

### Term Score (signature)
The system's thesis object, and desktop-only by design (`hidden md:block`). A "THE TERM" label and rule, then a date ruler on a 1px baseline with five week ticks, then one 48px lane per course: 12rem of right-aligned course name, then a hairline lane carrying blocks. Each block is 24px tall, 3.6px radius, positioned by due date and drawn wide by estimated duration; on-track blocks are wash with a rule-toned 1px border and carry no colour, overdue blocks are an amber 1px border over a 30% amber fill. A 1px indigo NOW rule crosses every lane at today's offset. Every block carries a `title` with the item and its plain-words state, and its name in screen-reader-only text. A 12px caption beneath states how to read it.

### Struck Item (signature)
Tonight's one thing, pulled forward off its lane: a 1px indigo left rule with 20–24px of indent, a 36px title, the course name and duration bar beneath, and the countdown figure at 36px on the right — amber if overdue, indigo if due today, plain ink otherwise, with a 12px word-label under it ("days over", "due today", "days left"). Beneath sits the ranking explanation in 14px italic quiet ink at 65ch.

### Assistant Panel
A right-edge overlay, full height, capped at 28rem, raised paper field with a 1px left border and the overlay shadow. Header carries a 1px indigo left rule; speakers are named with 12px uppercase labels; the user's turns sit right-aligned in a wash bubble (4.8px radius) and Mentra's turns are unbubbled ink. Opening prompts are 1px-bordered chips that fill with wash on hover. Summoned by a fixed indigo button in the bottom-right corner.

### Entry Surfaces (auth, onboarding)
A single centred column (24rem for auth, 28rem for onboarding) on the page field: wordmark with a hairline running to the end of the measure, then a 1px indigo left rule beside the heading and its lede, then the form. Same margin-and-line language as the app, before there is a term to draw.

## Do's and Don'ts

### Do:
- **Do** keep on-track work achromatic. Colour is spent only on now/next (indigo) and slipped (amber).
- **Do** state every colour-marked state in words too — "2 days over", "due today", "high priority".
- **Do** draw estimates as extent as well as figures, at a consistent minutes-to-length scale.
- **Do** separate content with 1px rules (`--rule`) and space rather than with boxes.
- **Do** use Archivo at 400/500/600 for every role, and tabular figures for anything comparable down a column.
- **Do** name controls in ordinary words — "Open my work", "Write a note", "Add a course", "What Mentra knows".
- **Do** open each region with a 12px uppercase section label followed by a hairline to the end of the measure.
- **Do** give focus a 3px indigo ring at 50% opacity plus a solid border shift, on every interactive element.
- **Do** draw icons as inline SVG on the 18px grid at 1.4px stroke in `currentColor`.
- **Do** hide the term score below `md` and fall back to the ranked list rather than compressing lanes.
- **Do** respect `prefers-reduced-motion`: the NOW rule's arrival is disabled outright, not merely shortened.

### Don't:
- **Don't** introduce red, green, or any third hue for status. Red is reserved for destructive controls and error alerts and carries no urgency meaning.
- **Don't** thicken a coloured left rule past 1px, or use one on an alert — alerts take an all-round border so the left rule keeps meaning "this is the one under the cursor".
- **Don't** put shadows on content. Only the assistant panel and its summoning button are allowed to float.
- **Don't** add a second typeface, a serif, or a mono; `--font-serif` and `--font-mono` are aliases of `--font-sans` on purpose.
- **Don't** lay signed-in content out as a grid of cards or tiles — the thesis is one plane with lanes on it.
- **Don't** animate anything beyond the one authored moment (the NOW rule landing) and pointer/focus state transitions.
- **Don't** use invented letter-abbreviations (TDY, CRS) or icon fonts in place of drawn icons.
- **Don't** use the uppercase 12px label as a kicker or eyebrow above a headline; it labels a region and always carries its rule.
- **Don't** put validation in a toast that vanishes — errors are placed in the form, in place.
