---
name: Mentra
description: A term printed as an almanac — one ruled table of what falls due when, with today's entry set in the largest type on the page.
colors:
  stock: "oklch(0.964 0.011 106)"
  stock-raised: "oklch(0.986 0.007 106)"
  index: "oklch(0.941 0.014 108)"
  band: "oklch(0.936 0.015 108)"
  ink: "oklch(0.235 0.019 152)"
  ink-quiet: "oklch(0.474 0.019 150)"
  wash: "oklch(0.929 0.013 110)"
  border: "oklch(0.884 0.012 115)"
  rule: "oklch(0.846 0.014 118)"
  rule-strong: "oklch(0.52 0.021 148)"
  input-stroke: "oklch(0.858 0.013 115)"
  now-green: "oklch(0.415 0.098 158)"
  plate-now: "oklch(0.415 0.098 158)"
  plate-now-ink: "oklch(0.975 0.012 100)"
  attention-oxblood: "oklch(0.442 0.138 27)"
  plate-over: "oklch(0.442 0.138 27)"
  plate-over-ink: "oklch(0.975 0.012 100)"
  destructive: "oklch(0.442 0.138 27)"
typography:
  display:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "2.375rem"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "2.125rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline-compact:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title-entry:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  subtitle:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  wordmark:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  panel-title:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  control-small:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  meta:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
    fontVariation: "tabular-nums"
  running-head:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.16em"
    textTransform: "uppercase"
  column-head:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
    textTransform: "uppercase"
rounded:
  none: "0px"
  mark: "2px"
  sm: "1.8px"
  md: "2.4px"
  lg: "3px"
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
  running-head:
    textColor: "{colors.ink-quiet}"
    typography: "{typography.running-head}"
    rule: "2px {colors.rule-strong} over 1px {colors.rule}, 3px apart"
  plate-band:
    backgroundColor: "{colors.plate-now}"
    textColor: "{colors.plate-now-ink}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  plate-band-over:
    backgroundColor: "{colors.plate-over}"
    textColor: "{colors.plate-over-ink}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  button-primary:
    backgroundColor: "{colors.plate-now}"
    textColor: "{colors.plate-now-ink}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, oklch(0.415 0.098 158) 80%, transparent)"
    textColor: "{colors.plate-now-ink}"
  button-outline:
    backgroundColor: "{colors.stock}"
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
    backgroundColor: "color-mix(in oklch, oklch(0.442 0.138 27) 10%, transparent)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.lg}"
    height: "32px"
  cta-link:
    backgroundColor: "{colors.plate-now}"
    textColor: "{colors.plate-now-ink}"
    rounded: "{rounded.mark}"
    padding: "8px 14px"
    typography: "{typography.body}"
  cta-link-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.mark}"
    padding: "8px 14px"
    border: "1px {colors.rule-strong}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
  almanac-table-head:
    textColor: "{colors.ink-quiet}"
    typography: "{typography.column-head}"
    borderBottom: "2px {colors.rule-strong}"
  almanac-table-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "11px 0"
    borderBottom: "1px {colors.rule}"
  almanac-table-row-banded:
    backgroundColor: "{colors.band}"
  filed-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "14px 8px"
  filed-row-banded:
    backgroundColor: "{colors.band}"
  term-entry:
    backgroundColor: "color-mix(in oklab, oklch(0.235 0.019 152) 24%, transparent)"
    textColor: "{colors.ink}"
    rounded: "{rounded.mark}"
    height: "22px"
    border: "1px {colors.rule-strong}"
  term-entry-overdue:
    backgroundColor: "{colors.plate-over}"
    rounded: "{rounded.mark}"
    height: "22px"
    border: "1px {colors.plate-over}"
  term-entry-today:
    backgroundColor: "{colors.plate-now}"
    rounded: "{rounded.mark}"
    height: "22px"
    border: "1px {colors.plate-now}"
  state-lamp-over:
    backgroundColor: "{colors.plate-over}"
    rounded: "{rounded.none}"
    height: "8px"
  state-lamp-today:
    backgroundColor: "{colors.plate-now}"
    rounded: "{rounded.none}"
    height: "8px"
  state-lamp-on-track:
    backgroundColor: "transparent"
    rounded: "{rounded.none}"
    height: "8px"
    border: "1px {colors.rule-strong}"
  index-item-active:
    backgroundColor: "{colors.plate-now}"
    textColor: "{colors.plate-now-ink}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
---

# Design System: Mentra

## Overview

**Creative North Star: "The Almanac"**

An almanac is a year's worth of facts set as one ruled table: what falls when,
printed once, read down a column. Mentra prints the student's edition and
re-prints it every morning. A term is exactly this object — a fixed span of
days, a fixed set of lines running through it, and one thing that matters most
today — and the interface is the printed page it belongs on rather than a
dashboard of tiles.

The stock is a pale rag with a green cast, the colour academic calendars and
ledgers were actually printed on, and never the cream every generated
interface reaches for. Two plates go over it: **thicket green** for what is
live now, **oxblood** for what has slipped. Display is set in a slab with the
weight of a printed timetable; the running text, every label and every figure
in a grotesque. Regions open with a **thick-thin rule pair** — 2px over 1px —
which is the single most recognisable mark in the system, and every list is a
table with fixed columns, banded stock behind alternating rows, and heavy
rules closing its head and its foot.

Colour is spent as ink, not as accent. Where this system uses a plate, the
plate owns a whole region: today's entry sits under a solid band across the
measure with its state reversed out of it, the open section in the index is a
solid band running the index's full width, the chosen span in the time
selector is a filled cell. A hairline of colour scattered over a neutral page
is what made the previous edition read as a wireframe; a solid is what makes
this one read as printed.

Motion is a page being printed. The rules are struck, the entries are
impressed onto them slightly out of register and settle sharp, and the mark
for today lands last because it is the only mark that belongs to every line at
once. The whole sequence resolves in under a second. Both editions carry the
same structure; the night edition is the same two plates on bookcloth.

**Key Characteristics:**
- Thick-thin rule pairs open every region; tables, not cards, carry every list.
- Banded stock behind alternating rows, on both real tables and filed rows.
- Two plates, laid as solids that own regions — never as scattered accents.
- Two families: a slab (Bitter) for display, a grotesque (Archivo) for
  everything read at small size, including all figures.
- Marks and solids are separate token families: `--now` / `--attention` are the
  inks used for text and rules; `--plate-*` are the same inks as fills, dark
  with light type in both editions.
- Overprint: two entries colliding on one line multiply where they overlap.
- Duration drawn as extent against a ruled trough, not written as a numeral alone.
- A lamp column one glyph wide at the head of every ranked table.
- Tabular figures everywhere a number can be compared down a column.
- A collapsible index (240px / 64px) that names every table and never leaves the page.

## Colors

Almanac stock carrying two plates. There is no third plate: destruction
borrows the oxblood and is told apart by its words and its all-round border.

### Primary
- **Now Green** (light `oklch(0.415 0.098 158)`, dark `oklch(0.735 0.135 158)`):
  the ink for what is live. As a *mark* it draws today's rule crossing every
  line in the term table, today's date on the dateline, the "Now" running
  head's rule pair, the focus ring, the caret, and the due-today figure in a
  table. It lifts in the night edition so a hairline still reads on cloth.
- **Plate Now** (light `oklch(0.415 0.098 158)`, dark `oklch(0.442 0.105 158)`)
  with **Plate Now Ink** (`oklch(0.975 0.012 100)`, dark `oklch(0.955 0.018 150)`):
  the same ink as a *solid*. Today's entry band, the primary button and CTA,
  the open section in the index, the chosen span in the time selector, a
  due-today entry on the term table, a due-today lamp. It stays dark with
  light type in both editions.

### Secondary
- **Attention Oxblood** (light `oklch(0.442 0.138 27)`, dark `oklch(0.712 0.148 32)`):
  marks what has slipped and nothing else — the overdue figure in a table, the
  overdue due-label. Lifts in the night edition for the same reason green does.
- **Plate Over** (light `oklch(0.442 0.138 27)`, dark `oklch(0.432 0.145 28)`)
  with **Plate Over Ink** (`oklch(0.975 0.012 100)`, dark `oklch(0.962 0.016 60)`):
  the oxblood as a solid. Today's entry band when the entry has slipped, an
  overdue entry on the term table, an overdue lamp.

### Neutral
- **Stock** (`oklch(0.964 0.011 106)`, dark `oklch(0.183 0.013 155)`): the page.
  Pale rag with a green cast by day; a deep green-black bookcloth by night, at
  chroma low enough that the green plate still reads as ink on it.
- **Raised Stock** (`oklch(0.986 0.007 106)`, dark `oklch(0.228 0.014 155)`):
  overlay surfaces only — the assistant panel and the term table's hover card.
- **Index** (`oklch(0.941 0.014 108)`, dark `oklch(0.158 0.012 155)`): the
  sidebar's field, a half-step off the page so the index reads as furniture.
- **Band** (`oklch(0.936 0.015 108)`, dark `oklch(0.214 0.014 153)`): the
  alternating row tint behind every table and every filed row. The single
  cheapest legibility win in the system and the mark that says "ledger".
- **Ink** (`oklch(0.235 0.019 152)`, dark `oklch(0.925 0.012 100)`): all
  primary text. A green-black, never pure black.
- **Quiet Ink** (`oklch(0.474 0.019 150)`, dark `oklch(0.702 0.018 140)`):
  metadata, running heads, column heads, course names, the annotation line.
- **Rule** (`oklch(0.846 0.014 118)`, dark `oklch(0.345 0.018 150)`): the
  hairline — row separators, line rules, the thin half of every pair.
- **Strong Rule** (`oklch(0.52 0.021 148)`, dark `oklch(0.55 0.022 148)`): the
  2px half of every pair, a table's head and foot rule, the masthead rule, an
  outline control's edge, and the scrollbar thumb.
- **Wash** (`oklch(0.929 0.013 110)`, dark `oklch(0.264 0.014 152)`): hover
  fills, the duration trough, the user's own message bubble.

### Reserved
- **Destructive** = the oxblood plate (`oklch(0.442 0.138 27)`, dark
  `oklch(0.7 0.15 32)`). Only on controls that destroy something and on inline
  validation errors, always as a 10% tint with matching text and a 45% border.

### Named Rules
**The Two-Plate Rule.** An almanac was printed with the inks it could afford.
This one has two: green for now, oxblood for slipped. There is no third. A new
status does not get a new hue — it gets a word, a lamp, or a position.

**The Ink-Owns-A-Region Rule.** Where a plate is used, it is used as a solid
that owns something whole — a band across the measure, a filled cell, a filled
entry on a line. Colour spent as a 1px edge on an otherwise neutral page reads
as a wireframe, which is what this world replaced. Audit test: on any screen
carrying a plate, you must be able to point at a *region* that is that colour.

**The Mark-Versus-Solid Rule.** `--now` / `--attention` are for text, rules and
hairlines and lift in the night edition so they stay legible. `--plate-*` are
for fills and stay dark with light type in both editions. Using one value for
both jobs is what turns a night-mode fill pastel; the split is not optional.

**The Colour-As-Signal Rule.** The field is achromatic. Work that is on track
carries no plate at all. Strip every hue from a screen and it must still be
readable and correctly ordered.

**The State-Not-By-Hue-Alone Rule.** Every state a plate marks is also stated
in words or figures — "2 days over", "Today", "high priority" — and, in a
ranked table, in the lamp column as a filled or hollow square. Colour is
always the second or third reading, never the only carrier.

## Typography

**Display:** Bitter (Google, variable, `--font-display`) at 500/600/700 — a
slab with the weight of a printed timetable, low contrast, sturdy at 11px caps
and authoritative at 38px. It sets every `h1`/`h2`/`h3` by default and the one
figure that is allowed to be large.

**Text:** Archivo (Google, variable, `--font-sans`) at 400/500/600 — the
running text, every control, every label, and **every figure**. Tabular
numerals are on wherever a number can be compared down a column.

`--font-serif` and `--font-heading` alias the slab; `--font-mono` aliases the
grotesque. There is no third family and no mono: monospace as a costume for
"technical" is not part of this world, and Archivo's tabular figures do the
alignment work a mono would otherwise be hired for.

### Hierarchy
- **Display** (Bitter 600, 2rem/32px rising to 2.375rem/38px at `sm`, line-height
  1.12, tracking −0.02em): today's entry title. The largest type on any screen.
- **Headline** (Bitter 600, 1.875rem/30px rising to 2.125rem/34px at `md`,
  line-height 1.15): the page title in the masthead.
- **Title** (Bitter 600, 1.75rem/28px): the heading on the entry surfaces
  (sign-in, sign-up, onboarding) and on the error and not-found pages.
- **Subtitle** (Bitter 600, 1.25rem/20px, 1.125rem/18px, 1rem/16px): a term
  heading on the courses page; the wordmark in the index; the assistant panel
  title.
- **Body** (Archivo 400, 0.875rem/14px): every row, paragraph, control and
  field. Prose is capped at 65ch; empty-state prose at 55ch.
- **Control small** (Archivo 500, 0.8rem): the `sm` button label only.
- **Meta** (Archivo 400, 0.75rem/12px, quiet ink, tabular): dates, counts,
  durations, priorities, row metadata, the term table's course names.
- **Running head** (Archivo 600, 0.6875rem/11px, tracking 0.16em, uppercase):
  the label that opens a region, and the speaker names in the assistant. Always
  paired with its rule.
- **Column head** (Archivo 600, 0.6875rem/11px, tracking 0.12em, uppercase):
  a table's column labels and the dateline's week ticks.

### Named Rules
**The Two Family Rule.** Bitter sets display; Archivo sets everything read at
small size, figures included. If a distinction is needed inside one of those
jobs, change weight, size, or colour — never family.

**The Slab-Is-For-Headings Rule.** The slab appears in exactly four places: a
heading, the wordmark, today's countdown figure on its band, and the title
inside the term table's hover card. It is never used for body copy, a control,
a label, or a table cell.

**The Tabular Figures Rule.** Any number a reader might compare down a column
carries tabular figures — applied via `<time>`, `[data-figures]`, or
`.tabular-nums-mono`. Dates, day counts and durations are always tabular.

**The Running Head Rule.** A region label is 11px, 600, uppercase, 0.16em
tracked, quiet ink, and is always followed by the thick-thin rule pair running
to the end of the measure. It labels a *region*; it is never a kicker above a
heading. The pair is inked in a plate only where the region itself is that
state — the "Now" region takes green, the "Delete account" region takes
oxblood.

## Layout

The signed-in frame is the index plus one printed plane: a sticky left index
(240px expanded, 64px collapsed, full-height, own field, 1px right edge) and a
single centred column capped at `max-w-4xl` (56rem) with 24px side padding and
40px/56px vertical padding. There is no content grid and no card grid —
regions stack in one column separated by 40px, each opened by a running head.

The masthead is the page title, its dateline beneath, and the thick-thin rule
pair closing it. Vertical rhythm runs on a 4px base: 8px between adjacent
controls, 12px between a running head and what follows, 16–20px inside a
region, 40px between regions. Table rows are 11px top and bottom against a 1px
rule; filed rows are 14px. Tables and filed rows both bleed 8px past the
measure on each side and pad their edge cells by the same 8px, so the banding
runs continuous while the first and last columns still line up with the
running head above them.

Responsive behaviour has one real breakpoint, `md` (768px). Below it the index
becomes an off-canvas drawer behind a 20%-ink scrim with a persistent top bar,
hover-revealed row actions become permanently visible, secondary table columns
drop out, and the term table is hidden outright — lines need width to mean
anything, so the phone reads the ranked table instead. A running head wraps
anything trailing it onto its own row rather than crushing its rule to a stub.

The term table itself is an 11rem column of course names then the dateline
field, spanning 28 days — 7 behind today, 21 ahead — with week ticks at −7, 0,
+7, +14, +21. Entries are positioned by due date as a percentage of that span
and drawn wide by estimated duration at 90 minutes per day-width, floored at
0.35 days so a ten-minute errand stays visible.

### Named Rules
**The One Plane Rule.** Every signed-in page is the index plus one column.
Regions are separated by space and rule pairs, never by nested containers or a
tile grid.

**The Fixed Column Rule.** A list of records is a table. Its columns never
move; a row changes state inside its own cells — a lamp, a plate, a word — and
never by breaking or reordering the grid.

**The Measure Rule.** Everything that opens a region and everything inside it
starts at the same left edge. A band, a table's first column, and a filed row's
title all line up; the banding is what bleeds past, not the content.

## Material

The page is stock, not a fill. Two layers say so, and both sit at the edge of
perception — you should not be able to point at the texture, only notice that
the surface stopped looking like a painted rectangle.

**Tooth.** Fractal noise (an inline `feTurbulence` data URI, 160px tile,
desaturated) laid over the whole viewport at 4% in the day edition and 6.2% in
the night one. It is laid *over* rather than under, because the index and every
shell paint their own opaque field and would hide it. Cloth takes more grain
than stock — a near-black field bands where paper does not, and the noise is
what breaks it up.

**A lamp at the upper left.** A fixed radial gradient on the root element, so a
long page does not drag its own lighting down the screen as it scrolls. The two
editions state the same lamp in opposite directions: stock is lit from outside
and darkens as it falls away from the light (transparent at the lamp, 6% ink in
the far corner); cloth is read by the light it returns and lifts where the light
lands (7% at the lamp, transparent by 58%).

**Overprint.** Two entries colliding on one line of the term table multiply
where they overlap (`.overprint`, `mix-blend-mode: multiply`), which is what
two plates actually do on a press — and which makes a collision between two
deadlines legible for free. The night edition prints without it: a screen blend
is the arithmetic inverse of a multiply but not the physical one, and it drains
the plate out of a block that should still read as oxblood. Ink on a dark board
sits on it; a collision there is read from the outline.

Both lamp tints are mixed `in oklab`. Interpolating a hue against `transparent`
leaves the hue undefined, and the tint has to stay the same green-black as the
ink it is made from.

### Named Rules
**The One Sheet Rule.** The grain covers the whole viewport, index included —
one sheet, folded, not two stocks side by side. Distinguish a surface with a
field change or a rule, never by giving it its own texture.

**The Imperceptible-Material Rule.** Texture is material, never pattern. If a
viewer can describe the texture as a thing they can see, it is too strong. No
visible grain, no paper photograph, no repeating motif.

## Motion

One authored sequence, and no other entrance choreography anywhere.

### The Impression (signature)

1. **The rules are struck.** Region rule pairs (`.animate-rule-draw`, 420ms)
   and the masthead rule draw left to right. Each line's hairline is a scaled
   pseudo-element on `.lane-rule`, drawing across on the same curve, staggered
   55ms per line from its own `--i`.
2. **The entries are impressed.** Entries scale from their own left edge while
   coming down 2px and out of a 2px blur, over 320ms
   (`.animate-block-land` → `block-impress`), each waiting for the line beneath
   it: `240ms + --i × 55ms + --j × 40ms`. An entry does not fade in — it presses
   down and settles sharp, which is what a struck character does, and it grows
   along the axis its width already means.
3. **Today's mark lands.** The green rule sweeps down through every line
   (`.animate-now-rule`, 480ms, delayed 460ms) once there are lines for it to
   cross. It is deliberately last: it is the only mark belonging to all of them.
4. **Today's entry is banded.** The band is inked left to right
   (`.animate-band`, 460ms, delayed 300ms) while the entry rises 6px into place
   (`.animate-struck`).

Everything is transform, opacity and blur. No step animates a layout property.

### Supporting motion
Only two, and both report state rather than decorate it:
- **A turn arriving** in the assistant (`.animate-turn`, 220ms).
- **The working indicator** (`.animate-working`): a 1.4s opacity pulse under
  "Looking it up…", saying the assistant is thinking rather than stalled.

Everything else transitions only in response to a pointer or a focus ring, at
150ms or less.

### Timing and easing
`cubic-bezier(0.16, 1, 0.3, 1)` throughout. Feedback is 100–220ms, the authored
steps 300–520ms, and the full sequence resolves by roughly 940ms. Bounce and
elastic curves are not part of the system.

### Named Rules
**The One Impression Rule.** The sequence belongs to the dashboard's term and
to nothing else. The landing page's example term is the same component showing
the same object, so it prints the same way; mastheads and running heads do not
animate. Do not reuse it as a page-load reveal, do not stagger
arbitrary regions, and do not add a second authored moment on another surface.

**The Movement-Means-Something Rule.** Outside the authored sequence, a thing
moves only when it has happened: a turn arrived, work is being done, a control
was pressed. Movement for liveness alone is animation debt.

**The Reduced-Motion Rule.** `prefers-reduced-motion` removes every step
outright — the edition is simply already printed, with nothing hidden, offset,
scaled or blurred. The one exception is the working indicator, which keeps a
gentler pulse, because it is feedback.

## Elevation & Depth

The system is flat. Content surfaces have no shadow at all: depth is expressed
by rule weight (1px against 2px), a field change between page, index and band,
and the wash fill used for hover. A reader should never perceive a signed-in
page as a stack of floating objects.

Shadow exists only where something genuinely floats — the assistant panel, the
button that summons it, and the term table's hover card. All three are
transient, and all three tint their shadow from the foreground ink rather than
from black, so the shadow belongs to the same green-black as everything else.

### Shadow Vocabulary
- **Floating control:** `0 10px 20px -8px color-mix(in oklab, var(--foreground) 55%, transparent)`
- **Overlay panel:** `0 0 60px -12px color-mix(in oklab, var(--foreground) 45%, transparent)`, with a 2px left rule
- **Hover card:** `0 12px 28px -12px color-mix(in oklab, var(--foreground) 45%, transparent)`, with a 2px all-round rule

### Named Rules
**The Flat-Plane Rule.** Shadows are for overlays only. A surface that is part
of the page gets a rule or a field change, never a shadow, and never a hard
offset shadow.

## Shapes

The world is squared off. The radius base is 3px (`--radius: 0.1875rem`) and
almost nothing exceeds it: controls and fields take 3px, ad-hoc CTAs, chips,
inline alerts and term entries take 2px, small buttons 2.4px. Anything that is
a **solid of ink** — a band, a lamp, an index item, a segmented cell — is
square, with no radius at all, because a printed solid has no rounded corner.
Fully rounded (999px) survives in exactly one place: the scrollbar thumb.

Rules come in two weights and only two: 1px for hairlines and separators, 2px
for a table's head and foot, a masthead, an overlay's edge, and the heavy half
of a rule pair. A coloured left border above 1px does not exist in this system.

Icons are drawn, not lettered and not glyph-fonts — inline SVG on an 18px grid,
1.4px stroke, round caps and joins, `currentColor`, always `aria-hidden` with a
text label beside or a `title` when the index is collapsed.

### Named Rules
**The Squared-Solid Rule.** If it is a solid of ink, it has no radius. Rounding
a band or a lamp turns a printed mark into a UI chip.

**The Two-Weight Rule.** Rules are 1px or 2px. A 3px or 4px rule, or a coloured
side-tab of any weight, is out of the system.

**The Drawn Icon Rule.** Every icon is inline SVG on the same grid at the same
stroke weight. No icon fonts, no emoji, no invented letter-abbreviations.

## Components

### Running Head (signature)
A 11px tracked-caps label, then the thick-thin rule pair — 2px `rule-strong`
over 1px `rule`, 3px apart, drawn as one element with two background stripes so
the pair moves and animates as a single rule. `tone="now"` inks the pair green
for the region that *is* now; `tone="danger"` inks it oxblood for the one
region that destroys something. The pair keeps a 2.5rem minimum so anything
trailing it wraps to its own row on a phone instead of crushing it.

### Today's Entry (signature)
The product's answer, printed as a notice rather than a card. A solid band
across the measure carries `TODAY'S ENTRY` in reversed tracked caps on the left
and the countdown — a slab figure with its word label — on the right, inked in
whichever plate the state belongs to: green while the entry is live, oxblood
once it has slipped. Beneath the band, on open stock, the title at 32–38px, the
course and duration bar, the ranking explanation as an italic annotation on a
1px rule, and the two calls to action. A 1px rule closes it. It is the only
object in the system where a plate covers a region this large, and it earns
that because it is the one thing the page exists to say.

### Term Table (signature)
Desktop-only by design (`hidden md:block`). A running head, then a dateline of
five week ticks, then a 2px head rule, then one 48px line per course: 11rem of
right-aligned course name, then a hairline line carrying its entries, with
alternating lines on banded stock. Each entry is 22px tall, 2px radius,
positioned by due date and drawn wide by estimated duration: a slipped entry is
a solid oxblood plate, an entry due today a solid green plate, and everything
on track a 24% ink fill with a `rule-strong` edge and no plate at all. Entries
overprint where they overlap. A 2px green rule crosses every line at today,
laid over the lines and starting *below* the head rule so it never strikes
today's own date. A 2px foot rule closes the table. Every entry carries a
`title`, a screen-reader name, and a hover/focus card; a 12px caption beneath
states how to read it.

### Almanac Table
Every list of records. A head row of 11px tracked-caps column labels over a 2px
rule; rows separated by 1px with alternating banded stock; a 2px rule closing
the last row. It bleeds 8px past the measure on both sides and pads its edge
cells by the same amount. Ranked tables lead with a **lamp column** one glyph
wide.

### State Lamp
An 8px square at the head of a ranked row: a solid oxblood plate for overdue, a
solid green plate for due today, a hollow `rule-strong` outline for on track —
no ink for work that needs none. Always carries its word in screen-reader text,
and always duplicates a state the due column already states.

### Duration Bar (signature)
An estimate printed as extent: an 8px-tall wash trough (40px wide, 64px at
`sm`) on a 1px `rule-strong` baseline, filled proportionally at 45% ink,
clamped at 240 minutes and floored at 6% so a short task still shows. Squared
off, not rounded — this is a measure printed against a scale, the same object
as an entry on the term table, not a progress pill. The exact figure sits
beside it in 12px tabular type.

**The Duration-Is-Length Rule.** An estimate is drawn as extent, not written as
a numeral alone. Two hours must look like twice one hour at a glance, and the
number stays alongside for anyone who needs the exact value.

### Filed Row
A record in its resting state: 14px vertical padding, 8px horizontal, 1px
separators, alternating banded stock, a 2px rule closing the last row, bleeding
8px past the measure so the banding runs continuous. Actions are ghost buttons
invisible at rest and revealed on hover or focus-within at `md` and above;
always visible below it. Editing replaces the row in place with its form, on
the same rules — reading and authoring are one object.

### Buttons
- **Shape:** 3px radius, 32px tall by default (28px small, 24px xs), 10px
  horizontal padding, 14px medium label, 1px transparent border reserved for focus.
- **Primary:** the green plate with its light ink; hover drops to 80% of the fill.
- **Outline:** page-coloured fill with a 1px `rule-strong` edge; hover fills with wash.
- **Ghost:** no fill or edge at rest; hover fills with wash. The default for row actions.
- **Destructive:** 10% oxblood tint with oxblood label — destruction is stated, not shouted.
- **Focus:** a 3px green ring at 50% plus a solid 1px border shift. Active nudges down 1px.
- **Link CTA:** the two dashboard calls to action are links styled as buttons —
  2px radius, 14px/8px padding, the green plate for the primary and a 1px
  `rule-strong` edge for the secondary.

### Inputs / Fields
Transparent fill, 1px input-toned stroke, 3px radius, 32px tall, 16px text on
phones dropping to 14px at `md` (deliberate — it stops iOS zooming on focus).
Focus shifts the border to green and adds a 3px green ring at 50%; the caret is
green everywhere. `aria-invalid` shifts the border to oxblood with a 20% ring,
and the message itself is an all-round-bordered inline alert (1px oxblood/45
edge, 10% tint, 2px radius) placed in the form, never a toast. Labels are 14px,
500, plain words.

### Index (navigation)
A full-height sticky column on its own field with a 1px right edge; a 56px head
carrying the wordmark over a 2px rule, then the sections separated by
hairlines, then a footer over another 2px rule holding the theme toggle and
sign-out. Items are 14px with 8px vertical padding and no radius; the open one
is a **solid green band running the index's full width** with reversed type and
`aria-current="page"`. Collapsed (64px) it shows drawn icons only, labels moved
to `title`, the wordmark to screen-reader-only, over a 200ms width transition;
the preference persists in `localStorage` and is read through a store
subscription so the server render and first client render agree. On a phone it
slides in from the left over a 20%-ink scrim, behind a top bar carrying the
wordmark, theme toggle and sign-out.

### Time Selector
A single bordered strip of cells divided by 1px rules, each a link that puts
the answer in the URL. The chosen span is a filled green plate with reversed
type — a solid, not a tint. It rides on the "Now" running head, because it
changes what Now is.

### Assistant Panel
A right-edge overlay, full height, capped at 28rem, raised stock with a 2px
left rule and the overlay shadow. Its header carries the same 2px rule the
masthead and the index carry, so an overlay still reads as part of the edition.
Speakers are named with 11px tracked caps; the user's turns sit right-aligned
in a wash bubble at 2px radius and Mentra's turns are unbubbled ink. Opening
prompts are 1px `rule-strong` chips that fill with wash on hover. Summoned by a
fixed green button in the bottom-right corner.

### Entry Surfaces (auth, onboarding, errors)
A single centred column (24rem for auth, 28rem for onboarding, 36rem for
errors): the wordmark with the rule pair running to the end of the measure,
then the heading at 28px in the slab, its lede, and the form. Same stock,
plates and rules as the app, before there is a term to print.

## Do's and Don'ts

### Do:
- **Do** spend a plate as a solid that owns a region — a band, a filled cell, a
  filled entry. If you cannot point at a region of that colour, you used it as
  an accent.
- **Do** keep on-track work achromatic. A plate is only for now/next and slipped.
- **Do** state every plate-marked state in words too, and in the lamp column
  where the surface is a ranked table.
- **Do** open every region with an 11px tracked-caps running head and its
  thick-thin rule pair.
- **Do** set every list of records as a table with fixed columns, banded rows,
  and heavy head and foot rules.
- **Do** keep the marks (`--now`, `--attention`) and the solids (`--plate-*`)
  as separate tokens; never fill with a mark or letter with a plate.
- **Do** align the first column of a table, the left edge of a band, and a
  filed row's title on the same measure; let the banding bleed, not the content.
- **Do** use Bitter for headings, the wordmark, and the one large figure —
  Archivo for everything else, figures included, always tabular in a column.
- **Do** draw estimates as extent against a ruled trough, at a consistent
  minutes-to-length scale.
- **Do** give focus a 3px green ring at 50% plus a solid border shift, on every
  interactive element.
- **Do** hide the term table below `md` and fall back to the ranked table
  rather than compressing lines.
- **Do** respect `prefers-reduced-motion`: the impression is disabled outright,
  while the working indicator keeps a gentler pulse.

### Don't:
- **Don't** introduce a third hue. Oxblood does double duty as the destructive
  colour and is told apart by its words and its all-round border.
- **Don't** use a coloured side border, or any rule above 2px. The system has
  exactly two rule weights.
- **Don't** round a solid of ink. Bands, lamps, index items and segmented cells
  are square.
- **Don't** let a night-edition fill use the lifted mark colour — that is what
  turns an oxblood band into salmon. Fills take the plate.
- **Don't** put shadows on content. Only the assistant panel, its summoning
  button and the term table's hover card may float, and they tint their shadow
  from the ink.
- **Don't** paint an opaque page-sized field in a shell or route — it covers
  the sheet's lighting. The root element owns the background.
- **Don't** add a third typeface or a mono; `--font-serif` aliases the slab and
  `--font-mono` aliases the grotesque on purpose.
- **Don't** lay signed-in content out as a grid of cards or tiles — the thesis
  is one plane of tables.
- **Don't** animate anything beyond the impression, the two state signals, and
  pointer/focus transitions. No scroll reveals, no staggered regions elsewhere,
  no hover lifts.
- **Don't** use the running head as a kicker or eyebrow above a heading. It
  labels a region and always carries its rule.
- **Don't** put validation in a toast that vanishes — errors are placed in the
  form, in place.
