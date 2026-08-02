# Chem CYOA — Style Guide

Visual and verbal rules for this repo (`chem-text-adventure`, deployed at
chem.trscienceclub.org). This file was ported from the main site's
`STYLE.md` to keep the **Turtle Rock Science Club brand constant** across
properties — but this app is a separate, much smaller codebase (plain CSS,
no Tailwind, no component library, no router), so the *implementation*
half of that guide didn't apply here. This version was rewritten by reading
this repo's actual source (`style.css`, `index.html`, `src/`); where a rule
carries over from the brand, it says so, and where this app deliberately
does its own thing, it says that instead.

**Who we're talking to.** Students working through a choose-your-own-adventure
chemistry course — same "curiosity is welcome here" audience as the main
site, but here it's the player directly, not a parent scanning a landing
page. Copy can be a little more playful and game-y as a result (see §7,
§9).

**The one-line brand.** *Curiosity is welcome here.* Friendly, warm,
hands-on, and quietly serious about the science. Unchanged from the parent
brand.

---

## 1. The mark & name

This app does **not** render the Turtle Rock turtle logo anywhere in the
UI, and the "Turtle Rock Science Club" name doesn't appear in any narrative
content or UI chrome either — confirmed by grep, it's zero hits outside the
CNAME/README hosting references. The org's assets are present but idle:
`Logo.png` and `favicon.ico` sit in `public/` (copied verbatim to the site
root by Vite's `publicDir`), and `favicon.ico` is the only one actually
live — picked up by the browser's default `/favicon.ico` request since
`index.html` has no explicit `<link rel="icon">`. `Logo.png` is unreferenced
by any component.

In place of the parent mark, the app has its own small lockup in
`Header.tsx` (`.header-brand`, `style.css` ~L223): a 🧪 emoji on a
`.header-badge` circle (`--bg-subtle` fill, `--tr-forest` glyph color — the
same theme-aware Mint/Forest pairing as `.item-count-badge`), next to the
wordmark **"Chem CYOA"** (`h1`, Baloo 2 bold) with the subtitle
**"Interactive Text Adventure"** (`p`, Baloo 2 bold, `--tr-leaf` /
`--tr-forest` in dark mode). Treat this as the sub-brand for this specific
product — keep it if you touch the header; don't try to retrofit the
turtle logo in without checking with whoever owns the parent site's brand
guide first, since `TurtleRockLogo.tsx` doesn't exist in this codebase at
all.

---

## 2. Color

The palette is **the same brand palette**, unchanged — this is the one
thing that must not drift between properties. It's implemented here as CSS
custom properties in `style.css` `:root` (not Tailwind arbitrary-value
classes), which is a meaningfully different — and simpler — mechanism than
the main site's, see §2.2.

### 2.1 Core palette (as CSS custom properties, `style.css` L14–29)

| Variable | Hex | Role here |
|---|---|---|
| `--tr-deep-teal` | `#1F3A42` | Primary text (`--text-main`), header/close-button hover text |
| `--tr-slate` | `#4B6169` | Secondary text (`--text-muted`), stat names, sidebar meta |
| `--tr-faint` | `#9AA6A6` | Placeholders, empty-state copy, fine print |
| `--tr-club-green` | `#6CC24A` | Primary button fill, player chat bubble, focus ring, HP bar (healthy) |
| `--tr-leaf` | `#4C9A3A` | Green button "shelf" shadow, header subtitle (light mode), dot-pattern tint |
| `--tr-forest` | `#2E7D46` | Link color, narrator/game chat bubble text, item-count badge text |
| `--tr-deep-leaf` | `#14351F` | Label color on green fills (buttons, chat bubble, choice badge) |
| `--tr-mint` | `#E4F5DA` | `--bg-subtle` value (header badge, outline drawer, item-count badge, HP track) |
| `--tr-cream` | `#FBF7EC` | Page background (`--bg-page`) |
| `--tr-white` | `#ffffff` | Cards (`--bg-card`), modal headers |
| `--tr-gold` | `#F2C94C` | Stat-value pill fill, item-qty badge, HP bar (low-mid) |
| `--tr-gold-ink` | `#4A3900` | Item-qty badge text |
| `--tr-dark-gold` | `#B8860B` | Stat-value text |
| `--tr-alert-red` | `#E4574B` | HP bar (critical), dice failure text |
| `--tr-teal-pressed` | `#14282e` | Dark "shelf" shadow (lab-item hover) |

Semantic aliases layered on top, redefined per theme (§2.2):
`--bg-page`, `--bg-card`, `--bg-subtle`, `--text-main`, `--text-muted`,
`--border-color`, `--border-input`, `--border-card`, plus the shadow tokens
`--shadow-card`, `--shadow-shelf-green`, `--shadow-shelf-sm`,
`--shadow-shelf-dark`, `--shadow-modal`.

**Rule:** reach for a `var(--tr-*)` or a semantic alias before writing a raw
hex. The lab bench (§10) is styled with its own small set of variables
(`--lab-wood-*`, `--lab-metal*`, `--lab-ink`, `--lab-shadow`, defined
alongside the brand palette in `:root` / `:root.dark`) rather than the brand
tokens above, since a wood workbench isn't a brand surface — but it's still
variables, still redefined per theme, never a bare hex.

### 2.2 Dark mode — simpler than the main site's, read this once

Dark mode here is a single block, `:root.dark { ... }` (`style.css`
L50–64), that **redefines the semantic CSS custom properties** —
`--bg-page`, `--text-main`, `--tr-forest`, etc. — to their dark-mode
values. Everywhere else in the CSS reads `var(--text-main)`,
`var(--bg-card)`, and so on, so **dark mode support is automatic**: a rule
written with the variables just works in both themes with no separate
override to remember.

This is the opposite failure mode from the main site's guide (which warns
"a new hardcoded hex needs its own `.dark` override or it silently breaks
dark mode") — here, the risk runs the other way: **hardcoding a literal hex
color in a new rule silently opts it out of theming.** Use the variable
that already exists for the role you need (`--text-main` / `--text-muted` /
`--tr-faint` for text; `--bg-page` / `--bg-card` / `--bg-subtle` for
surfaces; `--border-color` / `--border-input` / `--border-card` for
borders) before reaching for a hex.

Theme state lives in `localStorage` under `tr_sc_theme` — the same key
name the main site uses — toggled via `useTheme.ts` and a `.dark` class on
`<html>`. `index.html` has an inline pre-render script (before any CSS
loads) that reads that key and applies the class immediately, to avoid a
light-mode flash on load. If you touch theme init, keep that inline script
in sync with `useTheme.ts`'s own logic (matching `prefers-color-scheme` as
the fallback when nothing is saved yet).

### 2.3 Borders

Only three alpha rungs are defined as variables, all on Deep Teal / white
depending on theme:

| Token | Alpha (light) | Use |
|---|---|---|
| `--border-card` | `/8` | Card, modal, and lab-panel borders |
| `--border-color` | `/10` | Header rule, dividers, generic borders |
| `--border-input` | `/12` | The chat `.input-wrapper` border |

A couple of one-off washes exist inline rather than as variables:
`rgba(31,58,66,0.05)` (theme-toggle hover), `rgba(31,58,66,0.2)`
(scrollbar thumb). Don't invent new one-off alphas without checking
whether one of the three tokens already fits.

`border-2` (2px) is the norm here too, matching the main site — see
`.lab-item`, `.chat-card`, `.modal-card`, `.hp-pill`, etc. The lab bench
(§10) is the one place borders drop to 1px, deliberately.

---

## 3. Typography

Same two brand display/body fonts as the main site, loaded via the same
Google Fonts `@import` at the top of `style.css` (also duplicated as a
`<link>` in `index.html`'s `<head>` for faster first paint):

```css
--font-sans:    "Nunito", ui-sans-serif, system-ui, sans-serif;   /* body */
--font-display: "Baloo 2", sans-serif;                            /* headings, buttons */
--font-mono:    "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
```

**Difference from the main site:** `--font-mono` here is a *real*
monospace face (JetBrains Mono is loaded and listed first). The main site's
guide calls out a known quirk where its `--font-mono` lists Nunito first,
so nothing there is actually monospaced — that quirk does **not** exist in
this repo. `font-family: var(--font-mono)` is used for the chat input
(`input#response`), reaction/pH/temp readouts, measurement values, and the
periodic-table modal's atomic-mass fine print (`.el-mass`) — places where a
true fixed-width face matters for tabular numbers.

- **Baloo 2** — headings, buttons, badges, HP/stat text, readout labels.
  Weights in use: 700/800.
- **Nunito** — body copy, chat bubble prose, item descriptions, form
  labels. Weights in use: 400/700.

### 3.1 Scale as used

No Tailwind scale here — sizes are literal `rem` values in `style.css`.
Roughly, largest to smallest:

| Size | Typical use |
|---|---|
| `1.4rem` | Modal close `×` |
| `1.2rem` / `1.15rem` | Modal titles, header wordmark |
| `1.05rem` / `1.02rem` | Story prose, dice result |
| `0.95rem` / `0.92rem` | Chat bubble text, choice buttons |
| `0.85rem` / `0.82rem` | Primary/secondary buttons |
| `0.8rem` / `0.78rem` | Sidebar/lab subtitles, dice detail, readouts |
| `0.75rem` / `0.72rem` | HP text, item counts, stat chips, measure labels |
| `0.65rem` | Element card fine print (atomic number, mass) |

Nothing here matches the main site's dense `text-[10px]`/`text-[9px]`
territory — this app doesn't have that much chrome packed into small
spaces.

### 3.2 Casing

Same convention as the main brand: **Title Case** for buttons and headings
("Toggle Virtual Chemistry Lab Simulator", "Periodic Table"), **sentence
case** for body copy and helper text. No ALL CAPS except where a value is
inherently one (element symbols).

---

## 4. Layout & spacing

Nothing here resembles the main site's marketing-page container system —
this is a fixed-viewport app shell, not a scrolling page.

- `.app-main-layout` is `height: 100vh`, `overflow: hidden` — the whole app
  fits the viewport with no page scroll; individual panels
  (`.chat-history`, `.inventory-items-list`) scroll internally instead.
- `.main-container-wrapper` caps content at `max-width: 1280px`, centered,
  with responsive padding (`16px 20px 24px` → `20px 32px 32px` at `640px`).
- `.main-content-row` is a single column by default; opening the lab adds
  `.split-screen`, which becomes a two-column `1fr 1fr` grid at `1024px+`
  (`src/App.tsx` toggles the class via `isLabVisible`). Below that
  breakpoint the lab and chat stack instead of splitting.

### 4.1 Radii

Same "very round" philosophy as the brand, same signature number:

| Radius | Use |
|---|---|
| `9999px` (pill) | Every button, chip, badge, HP/measure bar track |
| `28px` | **Signature card radius** — `.chat-card`, `.inventory-sidebar`, `.lab-host-card`, `.modal-card` |
| `20px` | Chat bubbles, `.btn-choice`, outline drawer |
| `16px` | `.lab-table` bench, `.toolbox`, `.inventory-card`, `#reaction-info-container` |
| `4px` | Chat bubble "tail" corner (bottom-right on player, top-left on narrator) |

### 4.2 Shadows

Two families, matching the main site's vocabulary:

- **Hard shelf (interactive):** `var(--shadow-shelf-sm)` /
  `var(--shadow-shelf-green)` (`0 3px 0` / `0 4px 0 #4C9A3A`) on primary
  buttons and `.lab-item`; `var(--shadow-shelf-dark)` (`#14282e`) on
  `.lab-item:hover`. Disabled/pressed states drop it (`.btn-brand-primary
  :active { box-shadow: none }`).
- **Soft ambient:** `var(--shadow-card)` (`0 8px 24px rgba(31,58,66,0.06)`,
  `0.3` alpha in dark mode) on cards. `var(--shadow-modal)` for the modal
  lift only.

---

## 5. Component recipes

Real classes from `style.css`, not JSX utility strings — copy the class,
not a Tailwind stack.

- **Primary button** — `.btn-brand-primary` / `.btn-send`: pill, Club
  Green fill, Deep Leaf text, `--shadow-shelf-sm`, `translateY(-1px)
  scale(1.02)` on hover, shadow drops on `:active`.
- **Secondary button** — `.btn-brand-secondary`: pill, `--bg-card` fill,
  `--text-main`, `border-2 var(--border-color)`; hover/`.active` swaps to
  Mint fill + Forest text.
- **Choice button** (MCQ options) — `.btn-choice`: left-aligned, `--bg-page`
  fill, hover moves to Mint with a Club Green border and a small lift.
  Numbered options get a `.choice-badge` — a small green pill with the
  option number in Deep Leaf.
- **Chat bubble** — `.chat-bubble` + one of `.player` / `.narrator`/`.game`
  / `.roll`. Player bubbles are right-aligned Club Green; narrator/game
  bubbles are left-aligned Mint (dark mode: `rgba(108,194,74,0.12)` fill,
  `#E7EDE9` text); roll results are centered, dashed-bordered, on the page
  background.
- **Card** — `.chat-card` / `.inventory-sidebar` / `.lab-host-card`: 28px
  radius, `--bg-card`, `--border-card`, `--shadow-card`.
- **Modal** — `.modal-backdrop` (Deep Teal 50% + blur) → `.modal-card`
  (28px radius, `--bg-page`, `--shadow-modal`) → `.modal-header` (`--bg-card`
  strip with title + `.btn-close`). Add `.wide` to `.modal-card` for the
  800px variant (periodic table).
- **Pill readout** — `#ph-display` / `#temp-display` /
  `#reaction-name-display`: `--bg-subtle` fill, `font-mono`, hidden via
  `:empty` when there's nothing to show yet — don't conditionally render
  these in JSX, let CSS hide the empty ones so layout doesn't jump.

---

## 6. Motion

Even more restrained than the main site — no `motion`/Framer dependency at
all here, everything is a CSS `transition` or `@keyframes`.

- **Durations:** `0.2s` (buttons, borders), `0.3s`–`0.4s` (HP fill, lab
  panel background/border).
- **Press feedback:** `translateY(-1px) scale(1.02)` on hover,
  `translateY(1px) scale(0.96)` + shadow-drop on `:active` — same "toy
  button" shelf feel as the main brand.
- **Entrances:** `fadeIn` keyframe (opacity 0→1, 4px rise, 0.2–0.25s) on
  chat bubbles and modals.
- **Ambient:** `rise-bubble` (reaction bubbles drifting up the flask),
  `cloud-drift` (gas visuals), `glass-glow` (pulsing drop-shadow on the
  active flask image while a reaction is running).

Don't add bounce/spring easing or scroll-linked animation — same rule as
the parent brand.

---

## 7. Iconography

**No icon library** — this repo has no `lucide-react` or any icon package
(check `package.json`; only `react`/`react-dom` are dependencies). Every
icon in the UI is a **plain emoji character**, inline in JSX. This is the
opposite of the main site's "no emoji in UI chrome" rule — here emoji *are*
the icon system, and that's intentional for a game-flavored product aimed
at players, not a rule this app is breaking.

Stable emoji → meaning pairings in use today (`Header.tsx`,
`ChatContainer.tsx`):

| Emoji | Means |
|---|---|
| 🧪 | Lab / chemistry (header badge, "Lab" toggle button, lab-open chat notice) |
| ❤️ | HP |
| 🎒 | Inventory |
| ⚛️ | Periodic table |
| 📜 | Story outline |
| 🔄 | Restart |
| ☀️ / 🌙 | Theme toggle (light / dark) |

Keep new UI affordances consistent with this table rather than introducing
a second icon language. If a future feature genuinely needs crisper icons
(e.g. small inline glyphs that must scale precisely), that's a real
decision to make deliberately — don't reach for `lucide-react` piecemeal
without adding it as a dependency and deciding whether it replaces emoji
site-wide or coexists.

---

## 8. Imagery

Very different role from the main site's event/lab-log photography. Images
here (`public/images/`, referenced from `data.json` narrative node text as
relative `images/...` paths) are **teaching diagrams and reference
figures** for the chemistry content — NMR spectra, molecule structures, a
periodic table, atom-shell diagrams — not photos of people. `courtyard.jpg`
is the closest thing to a "scene" image (used for narrative atmosphere).

No fixed-aspect cropping system exists for these — they're inline content
images sized by whatever the narrative markup/CSS around them specifies,
not cards with a forced `object-cover` slot like the main site's event
photos. If you add a new reference image, drop it in `public/images/` and
point to it as `images/<file>` from `data.json`, matching the existing
paths.

---

## 9. Voice & tone

Same principles as the parent brand — still **warm, plain, and specific**
— with examples drawn from this app's actual copy instead of the main
site's events/newsletter copy.

1. **Say the real thing.** `"Please enter a valid positive number."`,
   `"Beaker full"` (`useLabEngine.ts`) — plain failure messages, no
   euphemism.
2. **Respect the science.** Reaction names render as real chemical
   equations (`\(\ce{HCl + NaOH -> NaCl + H2O}\)` via MathJax/`mhchem`),
   not simplified paraphrases — see `reactionEngine.ts`'s equation
   generation.
3. **Encourage without hype.** Same "no amazing/revolutionary/unleash"
   rule as the parent brand.
4. **Second person / short.** Prompts speak directly to the player
   ("How much {itemName} do you want to add?").
5. **One exclamation point at a time** — reserved for genuine progress
   (`"🧪 Laboratory split screen opened."`), not for routine copy.

### Established phrases in this app — reuse, don't reinvent

| Situation | Say |
|---|---|
| Lab opened | `"🧪 Laboratory split screen opened. Type "lab" again to hide."` |
| Lab closed | `"🧪 Laboratory workspace closed."` |
| Beaker at capacity | `"Beaker full"` |
| Bad amount entered | `"Please enter a valid positive number."` |
| Amount prompt | `"How much {itemName} do you want to add? (in {unit})"` |
| Help fallback | `"Type options or numeric answers to progress through the story."` |

### Terminology

- **Lab** = the flask/reagent simulator (`LabContainer`), not a physical
  room reference like the main site's meeting-location copy.
- **Reagent**, **flask**, **beaker**, **reaction** — real chemistry terms,
  used precisely (see the reaction-engine documentation in this repo's
  `CLAUDE.md` if you're touching that system).
- The narrative content format calls a scene a **node**; that's an
  internal/code term (`NarrativeNode`) — same "don't leak the internal
  name into player-facing copy" instinct as the main site's `Mission`/
  `Events` distinction, though nothing here currently risks leaking it
  since nodes aren't named in-UI.

### Punctuation

Same house style as the parent brand: em dashes with spaces for asides,
real ellipses `…`, curly apostrophes, serial comma.

---

## 10. The lab bench is a themed physical surface, not a brand card

The flask/beaker bench inside `LabContainer` (`style.css`, "SECTION 11: Lab
Workspace") is styled to read as an actual piece of lab furniture — a
honey-oak butcher-block workbench with a brushed-metal edge guard, a ring
stand, and a Bunsen burner around the flask — rather than a brand-colored
card. It used to be hardcoded to `#0d0d12` in both themes; that's gone. A
flat, textureless black read as broken chrome rather than intentional
equipment, and it never actually changed with the theme toggle, so it's now
built from its own small variable set (`--lab-wood-1/2/3`, `--lab-wood-edge`,
`--lab-metal`, `--lab-metal-dark`, `--lab-ink`, `--lab-shadow`) defined
alongside the brand palette in `:root` and redefined in `:root.dark` — same
physical bench, dimmer workshop lighting in dark mode, never flat black.

- **Host card** (`.lab-host-card`) — normal brand light shell: 28px
  radius, `--bg-card`, `--border-card`, theme-aware. Unchanged.
- **Bench** (`.lab-table`) — a `repeating-linear-gradient` wood-grain
  texture between `--lab-wood-1/2/3`, a `--lab-wood-edge` border, a
  brushed-metal strip (`--lab-metal` → `--lab-metal-dark`) along the front
  lip, and inset shadows for depth. `16px` radius, matching the old shape.
  Fully theme-aware now — both the wood tones and the metal tones swap in
  `:root.dark`.
- **Glassware tint:** flask/beaker PNGs are dark-outline line art. In light
  mode they render as-is (`opacity: 0.8`, a soft contact-shadow
  `drop-shadow`) since dark outlines read fine on the honey-oak wood. In
  dark mode (`:root.dark .lab-item.beaker img, :root.dark .lab-item.flask
  img`) they're inverted with a warm sepia tint (`invert(1) brightness(1.9)
  sepia(0.35)`) so they still read as light glassware against the dim wood
  — cream, not the old pure white.
- **Ring stand & Bunsen burner** (`.flask-rig`, `.ring-stand`,
  `.bunsen-burner`, `.burner-flame`, `.burner-base` in `LabContainer.tsx` /
  `style.css`) are purely decorative additions around the flask — metal-toned
  SVG/CSS shapes using `--lab-metal*`, not part of the reaction-rendering
  logic. The burner flame ignites (`.flask-active .burner-flame`) off the
  same `flaskActive` prop that already drives the flask's glow, so it lights
  up exactly when a reaction is running.
- **Reagent shelf** (`.lab-shelf`, wrapping `.beakers-container`) sits above
  the flask rather than beside it — `.lab-table` is a column layout now: the
  shelf (a wood plank with two metal `.lab-shelf-bracket` supports) holds
  the row of reagent beakers up top, and the reaction flask sits on the
  counter below, same as a real bench shelves reagents above the working
  surface. `.beakers-container` itself keeps its inset dark mat so the
  beakers read as sitting on a tray, not floating.
- **Safety pegboard** (`.lab-pegboard`) is a small row of emoji (🥽 🧤 🧯)
  in the back corner of the bench, low-opacity — decorative flavor using the
  same emoji-icon system as the rest of the app (§7), not a new icon
  language.
- **Toolbox row** (`.toolbox`) and **readouts**
  (`#ph-display`/`#temp-display`/`#reaction-name-display`) sit *outside*
  the bench and theme normally — unchanged.
- **Accent color while a reaction runs:** the active-flask glow
  (`glass-glow` / `glass-glow-dark` keyframes) uses Club Green at low/high
  alpha — same accent family as the rest of the brand, just applied as a
  glow instead of a fill.

**What did not change:** the reaction-rendering logic — the liquid-layer
stacking, gas cloud/bubble generation, solid-block clip path, and all
chemistry-data-driven fill colors in `LabContainer.tsx` — is untouched. Only
the bench's own chrome (wood, metal, glass tint, decorative equipment) was
reworked; the flask/beaker/gas/liquid/solid graphics and their data-driven
colors are the same ones as before, just recolored and given real furniture
to sit on.

If you extend the lab UI, keep this split: the chemistry visuals inside the
flask stay driven by `visualStack`/item data, never by hand; anything
decorative you add to the bench itself should pull from the `--lab-*`
variables so it stays in sync between themes.

---

## 11. Accessibility

- Interactive elements are real `<button>`s (`Header.tsx`, modals) — keep
  it that way rather than clickable `<div>`s.
- Modals (`InventoryModal`, `PeriodicTableModal`) carry `role="dialog"`
  `aria-modal="true"` on the backdrop and `aria-label="Close"` on the close
  button — match this pattern for any new modal.
- The theme toggle sets both `aria-label` and `title` describing the
  *target* state ("Switch to dark mode" while light) — keep that phrasing
  convention for any new toggle.
- Never remove the global focus outline (`input:focus, select:focus,
  textarea:focus, button:focus-visible` in `style.css` L110) — it's the
  only visible focus indicator in the app.
- `window.alert`/`window.prompt` are used for the lab's add-reagent flow
  (`useLabEngine.ts`) — these are real, guarded behind `typeof window !==
  'undefined'` checks so the pure engine functions stay testable; don't
  swap them for a custom modal without preserving that guard, since the
  reaction engine is exercised standalone outside a browser (see
  `CLAUDE.md`).

---

## 12. Checklist for anything new

1. Reuse a `var(--tr-*)` / semantic alias (§2.1–2.2) before writing a raw
   hex — and remember hardcoding a hex is what breaks dark mode *here*,
   not the reverse.
2. Buttons: pill radius, `--shadow-shelf-*`. Cards: `28px` radius,
   `--border-card`, `--shadow-card` (§4).
3. New icons are emoji, matching the table in §7 — don't introduce
   `lucide-react` or another icon font without a deliberate decision.
4. Copy is sentence case (Title Case for buttons/headings), second person,
   short, and matches the plain, honest tone in §9.
5. No Tailwind classes — this repo doesn't have the dependency; write a
   real class in `style.css` instead.
6. Checked in both themes — the lab bench is now theme-aware too (same wood
   workbench, dimmer in dark mode via `--lab-*` vars, never flat black —
   §10).
7. `npm run build` (`tsc && vite build`) passes — there's no separate lint
   script and no test suite in this repo (see `CLAUDE.md`).
