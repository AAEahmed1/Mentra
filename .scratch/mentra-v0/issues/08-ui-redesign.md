# 08: UI redesign — establish a real visual direction

**What to build:** The current auth/onboarding/dashboard screens (ticket 01) are functionally correct but visually generic — default shadcn styling with no real design direction. This ticket gives Mentra an actual look: typography, color, spacing, and motion that feels "calm, modern, personal, trustworthy" per plan.md's product identity (section 2), not a bare admin-panel template. It also sets the visual system later tickets (02–07) should build new screens against, so this is worth doing now rather than after more UI accumulates in the current style.

**Blocked by:** 01 (needs the screens to exist)

**Status:** implemented

**Design:** Built via the `impeccable` skill's full direction-selection process (concept-seed rolls, a decision page with re-rolls in both bolder and safer registers, user-locked choice). Direction: **Card Catalog** (library card-catalog drawers / zettelkasten slip-boxes) — every course/task/note is a filed card, tonight's recommendation is the card pulled to the front of the rail. Full system recorded in [DESIGN.md](../../../DESIGN.md). Passed finish review (one fix round: dark-mode verification, an authored settle animation on the pulled card, browser-surface theming, an index-tab device) — disposition: ship.

- [x] Redesign sign-up, sign-in, onboarding, and dashboard-shell screens with a coherent visual direction (type scale, color palette, spacing rhythm — not just default shadcn tokens)
- [x] Establish reusable patterns (button/card/input treatment, page layout shell) that later tickets can follow without re-deciding style each time — recorded in DESIGN.md (Two-Tab Rule, One Saturated Color Rule, One Job Per Face Rule, Pull-Reads-as-Lift Rule)
- [x] Light/dark mode both look intentional, not just inverted defaults — light is daytime cream card-stock, dark is warm charcoal with lamp-glow cards, both verified via screenshot
- [x] No functional/behavioral changes — this is styling only, existing tests and flows keep working unchanged (build/tests/lint all green)
- [x] Verify in browser at both mobile and desktop widths — verified light+dark × desktop+mobile, one round of mobile-wrapping fixes applied
