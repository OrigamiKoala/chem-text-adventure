# Turtle Rock Science Club — Brand & Style Guide

The visual and verbal rules for **trscienceclub.org**. This is a description of
what the site *already does*, written down so it stays consistent. Everything
here was read off the live source (`src/`, `newsletter/`); where a rule has a
known exception or a known gap, it says so rather than pretending.

**Who we're talking to.** Elementary school students and their guardians, plus
the middle/high-school coaches who run sessions. Two audiences at once: the
site has to look inviting to a nine-year-old and credible to their parent. That
tension explains almost every choice below — rounded shapes and a cartoon
turtle, but real science, honest numbers, and no baby talk.

**The one-line brand.** *Curiosity is welcome here.* Friendly, warm, hands-on,
and quietly serious about the science.

---

## 1. The mark

`public/Logo.png` — a cartoon sea turtle whose shell is a domed beaker of
bubbling green liquid, set inside the ellipses of an atom, with **TURTLE ROCK**
arced above in chunky teal caps and *science club* curved below. Yellow-green
electrons sit on the orbit paths. Sticker-style: thick dark outlines, a white
keyline, flat fills.

It is the only logo. There is no wordmark-only lockup, no monochrome variant,
no alternate mascot.

**Rendering it.** Always through `TurtleRockLogo.tsx`, never a raw `<img>`.

| Prop | Use |
|---|---|
| `hideText` | Circular crop that zooms past the ring of text to the turtle + beaker. For small sizes where the arced type would be unreadable. |
| default | The full badge with its lettering. |

Sizes in use: **44px** (header, cropped), **36px** (footer, cropped), **150px**
(hero, full). Keep to that pattern — cropped below ~64px, full above.

**Rules.**

- The asset lives in `public/` and *must* be addressed as
  `` `${import.meta.env.BASE_URL}Logo.png` ``. A hardcoded `/Logo.png` resolves
  against the domain root and breaks under any non-root `base`.
- Don't recolor, add drop shadows, place it on a busy photo, or set it on a
  mid-green background — the logo's own greens stop separating. Cream, white,
  and deep teal are the safe backdrops.
- Don't stretch: width and height are always equal.
- It's decorative in the header (paired with the visible wordmark) and carries
  the alt text `Turtle Rock Science Club Logo` / `… Icon` elsewhere.

**Written name.** "Turtle Rock Science Club" on first use, **TRSC** acceptable
after. Never "TRSC Club", never "the Turtle Rock club", never lowercase
"turtle rock".

---

## 2. Color

The palette is deliberately small: a deep teal ink, a leafy green, a warm cream
page, and gold for reward moments. Everything else is a tint of those.

### 2.1 Core palette

| Hex | Name | Role | Dark-mode value |
|---|---|---|---|
| `#1F3A42` | **Deep Teal** (ink) | Primary text, borders (at low alpha), modal scrims, dark solid buttons/chips, avatar tile | `#E7EDE9` as *text*; stays `#1F3A42` as a *background* |
| `#4B6169` | **Slate** | Secondary/body text, metadata rows, icon strokes in meta | `#93A6A0` |
| `#9AA6A6` | **Faint** | Timestamps, placeholders, empty-state icons, fine print | `#67807A` |
| `#6CC24A` | **Club Green** | Primary button fill, progress fill, avatar circle, focus ring, success accents | unchanged |
| `#4C9A3A` | **Leaf** | The 3–4px hard "shelf" shadow under green buttons; small eyebrow labels; inline link cues | unchanged (no override — see §2.5) |
| `#2E7D46` | **Forest** | Green *text* — success copy, active nav label, "Read Entry →" | `#8FE07A` |
| `#14351F` | **Deep Leaf** | Label color *on* green fills. Never on a light background. | unchanged, intentionally |
| `#E4F5DA` | **Mint** | Active nav pill, badge icon tiles, success chips, progress track | `rgba(108,194,74,0.18)` |
| `#FBF7EC` | **Cream** | Page background, modal body, toast | `#12181A` |
| `#F3F0E4` | **Deep Cream** | Footer background | `#0D1213` |
| `#ffffff` | **White** | Cards, inputs, modal headers | `#1B2426` |
| `#F2C94C` | **Gold** | XP / trophy / ticket / lock icons, level-up chrome, "UNLOCKED" chip | unchanged |
| `#4A3900` | **Gold ink** | Label on gold fills | unchanged |
| `#B8860B` | **Dark gold** | Level-up headline only | unchanged |
| `#E4574B` | **Alert Red** | "Sold Out" chip only | unchanged |
| `#CFF2E0` | **Seafoam** | One decorative hero blob | unchanged |
| `#14282e` | **Teal pressed** | Hover/shelf for the dark solid button | unchanged |

Supporting one-offs: `#2D525D`, `#142B32`, `#A8E090`, `#064e3b`, `#043629`,
`#F3F0E4`, `#FEF3C7`, `#92400E` — decorative gradients and a couple of
game-adjacent accents. Don't grow this list without a reason.

### 2.2 Semantic assignments

- **Primary action** — Club Green fill, Deep Leaf label, Leaf shelf shadow.
- **Secondary action** — white fill, ink label, `border-[#1F3A42]/15`.
- **Tertiary / dismiss** — no fill, Slate label, underline or hover-ink.
- **High-emphasis dark action** — Deep Teal fill, white label, `#14282e` shelf.
  Used sparingly (the "Got it" confirm, the official-document link).
- **Success** — Forest text on Mint, or a Club Green check icon.
- **Warning / scarcity** — Gold fill with Gold-ink label (`< 5 spots left`).
- **Error** — Alert Red for the Sold Out chip; Tailwind `red-500/600` with
  `red-50` / `red-200` for form errors. (Two reds coexist; form errors are the
  Tailwind one.)
- **Reward** — Gold, always. XP, levels, badges, trophies, tickets.

### 2.3 Backgrounds and depth

Page is Cream with a **dot pattern** (`.bg-dot-pattern`, 20px grid of
`rgba(76,154,58,0.10)` dots). A `.bg-grid-pattern` also exists
(30px, `rgba(31,58,66,0.05)` lines) for panels. Cards sit on top as **white**.
The footer drops to Deep Cream. Modals reverse it: **white header, Cream body**.

Depth ladder, lightest to heaviest: cream page → white card → ink-tinted border
→ soft ambient shadow → hard green shelf (interactive only) → `shadow-2xl`
(modals and toasts only).

### 2.4 Borders

Borders are structural here, not hairlines. **`border-2` is the default** —
`border` (1px) appears essentially only inside the always-dark games.

Alpha ladder on Deep Teal, in order of how often it's used:

| Token | Use |
|---|---|
| `/8` | Card borders, section dividers, modal header rule |
| `/10` | Header/footer rules, panel borders, dashed dividers |
| `/12` | **Form inputs**, dashed empty-state borders |
| `/15` | Secondary button borders, card hover state |
| `/20` | Profile chip hover |
| `/5` | Image-to-body seams inside cards |

Hover convention: bump the border one rung (`/8` → `/15`) and/or wash the
surface with `hover:bg-[#1F3A42]/5`.

### 2.5 Dark mode — read this before adding a color

Dark mode is implemented in `src/index.css` as `:root.dark` overrides
(`!important`) on the site's hardcoded `bg-[#hex]` / `text-[#hex]` classes. The
rules are **enumerated one hex at a time**.

> **A new `text-[#hex]` that isn't in that list renders identically in both
> themes** — which usually means dark text on a dark background.

So: reuse `text-[#1F3A42]` / `text-[#4B6169]` / `text-[#9AA6A6]` /
`text-[#2E7D46]` and `bg-[#FBF7EC]` / `bg-white` / `bg-[#E4F5DA]` /
`bg-[#F3F0E4]`, or add the override alongside the new color. `text-[#14351F]`
is deliberately *not* flipped — it's the dark label on green buttons.

Two known live consequences:

- **`text-[#4C9A3A]` has no override.** It's the header's "Science Club"
  subtitle, the "Virtual Lab" eyebrow, the dashboard's scientist title, and the
  Read Entry cue. On the dark card (`#1B2426`) it measures **4.51:1** — passes
  AA for normal text, but it's the weakest brand color in dark mode. Prefer
  `text-[#2E7D46]` (→ `#8FE07A`, 9.88:1) for anything that must be legible.
- **`dark:` utilities don't follow the toggle.** This is Tailwind v4 with no
  `@custom-variant dark` declared, so `dark:*` compiles to
  `@media (prefers-color-scheme: dark)` while the `.dark` class overrides
  follow the button. There are ~70 `dark:` utilities in the codebase
  (`LabLogAnnouncements`, `CuratedResources` category chips). A visitor on a
  light OS who toggles dark gets the `.dark` overrides but *not* those. New
  work should use the enumerated-override mechanism, not `dark:`.

### 2.6 Measured contrast

Computed on the actual pairs the site renders (WCAG 2.1):

| Pair | Ratio | |
|---|---|---|
| `#1F3A42` on `#ffffff` | 12.05 | ✅ |
| `#1F3A42` on `#FBF7EC` | 11.26 | ✅ |
| `#4B6169` on `#ffffff` | 6.54 | ✅ |
| `#4B6169` on `#FBF7EC` | 6.11 | ✅ |
| `#14351F` on `#6CC24A` (button label) | 6.06 | ✅ |
| `#2E7D46` on `#ffffff` | 5.07 | ✅ |
| `#4A3900` on `#F2C94C` | 7.05 | ✅ |
| `#2E7D46` on `#E4F5DA` (success chip) | 4.44 | ⚠️ AA normal text only at ≥14px bold / passes large |
| `#4C9A3A` on `#ffffff` | 3.51 | ⚠️ **large/bold text only** |
| `#ffffff` on `#E4574B` (Sold Out) | 3.64 | ⚠️ large/bold only — it *is* bold 10px, so treat as decorative-with-redundant-label |
| `#9AA6A6` on `#ffffff` | 2.51 | ❌ decorative / non-essential text only |
| Dark: `#E7EDE9` on `#1B2426` | 13.33 | ✅ |
| Dark: `#93A6A0` on `#1B2426` | 6.18 | ✅ |
| Dark: `#8FE07A` on `#1B2426` | 9.88 | ✅ |
| Dark: `#67807A` on `#1B2426` | 3.73 | ⚠️ fine print only |

Rule of thumb: **`#9AA6A6` never carries information a visitor needs.** It's
for timestamps and hints that are also expressed elsewhere.

---

## 3. Typography

Two Google fonts, loaded at the top of `src/index.css`.

```css
--font-sans:    "Nunito", ui-sans-serif, system-ui, sans-serif;   /* body */
--font-display: "Baloo 2", sans-serif;                            /* headings, buttons */
--font-mono:    "Nunito", ui-monospace, SFMono-Regular, monospace;
```

- **Baloo 2** (500/600/700/800) — `font-display`. Rounded, chunky, friendly.
  Every heading, every button label, every chip. Almost always `font-bold`.
- **Nunito** (400/600/700/800/900) — `font-sans`. Body copy, form labels, meta
  rows, nav items.

> **Quirk worth knowing:** `--font-mono` lists **Nunito first**, so the ~93
> `font-mono` utilities inside `src/components/games/` render in Nunito, not a
> monospaced face. Numbers in the games therefore don't tabular-align. That's
> the current, shipped behavior — don't "fix" it casually, since the game
> layouts were tuned against how they actually look.

### 3.1 Scale as used

The site leans small and dense, with a few big display moments.

| Token | Typical use |
|---|---|
| `text-4xl sm:text-5xl lg:text-6xl` | Hero headline and the About page H1 (`leading-[1.05]`, `tracking-tight`) |
| `text-3xl` / `text-2xl sm:text-3xl` | Page and section headings |
| `text-2xl` / `text-xl` | Sub-section headings, level-up headline |
| `text-lg` | Card group headings, modal titles, mission-card names |
| `text-base` | Lead paragraphs, footer/newsletter headings |
| `text-sm` | Standard body, primary button labels, form inputs |
| `text-xs` | The workhorse — card body, badge descriptions, FAQ answers, footer links |
| `text-[13px]` / `text-[12px]` | Nav items; event card description and meta rows |
| `text-[11px]` | Form labels, timestamps, fine print, small buttons |
| `text-[10px]` / `text-[9px]` | Chips, "UNLOCKED", field taglines |

`text-xs` and `text-[11px]` together account for most text on the site. That's
intentional density — but it's why the muted colors must stay high-contrast.

### 3.2 Weight, tracking, leading

- Headings: `font-display font-bold`, `tracking-tight`, `leading-tight` or
  `leading-snug`.
- Body: `leading-relaxed` (the default for any paragraph).
- Nav items and form labels: `font-sans font-extrabold` — small text earns its
  presence through weight, not size.
- Footer column headings: `font-display font-bold text-xs uppercase
  tracking-widest`. That's the only place uppercase-tracked type is used on the
  site.
- `font-semibold` appears 3 times total; prefer `font-bold` / `font-extrabold`.

### 3.3 Casing

- Headings and buttons: **Title Case** — "Upcoming Events", "Join the Club!",
  "Browse Upcoming Events", "Count Us In!".
- Body, taglines, helper text: **sentence case**.
- Chips/labels: Title Case, except the deliberate all-caps `UNLOCKED`.
- Never ALL CAPS for emphasis in prose.

---

## 4. Layout & spacing

### 4.1 The container

Every top-level section uses the same one:

```jsx
<section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ...">
```

`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` appears in the header, hero, footer,
events, gallery, lab, resources, dashboard, and announcements. Anything new
matches it exactly — no bespoke widths.

Vertical rhythm: `py-10` for a section; `space-y-8` between blocks inside one;
`space-y-14` / `space-y-16` between major stacked topics (Announcements, About);
`mb-8` under a section heading before its grid.

### 4.2 Grids

| Content | Grid |
|---|---|
| Event cards, lab log cards | `grid-cols-1 md:grid-cols-3` (events use `lg:grid-cols-3`), `gap-6` |
| Announcements, badges, reservations | `grid-cols-1 md:grid-cols-2`, `gap-4` |
| Game tabs | `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, `gap-3` |
| Footer | `grid-cols-1 md:grid-cols-4`, `gap-8` |
| Dashboard | `lg:grid-cols-12` split 4 / 8 |
| About mission cards | `md:grid-cols-3`, `gap-6` |

Mobile is always a single column. Breakpoints used: `sm`, `md`, `lg`, `xl`.

### 4.3 Radii

Very round. The ladder, by frequency:

| Radius | Use |
|---|---|
| `rounded-full` | **Every button**, every chip/pill, avatars, progress bars, scrollbar thumb |
| `rounded-xl` | Form inputs, small inner panels, comment rows |
| `rounded-2xl` | Badge cards, announcement cards, game tabs, icon tiles, game panels |
| `rounded-[28px]` | **The signature card radius** — event cards, dashboard panels, About cards, modals |
| `rounded-[24px]` | Newsletter panel, signup modal, confirm-email inner callout |
| `rounded-[32px]` | The confirm-email modal (largest, most emphatic) |
| `rounded-lg` / `rounded-md` | Small utility hit-areas (menu toggle, thumbnails) |

Pick `rounded-[28px]` for any new content card. Buttons are *never* anything
but `rounded-full`.

### 4.4 Shadows

Two families, plus modal lift.

- **Hard shelf (interactive):** `shadow-[0_3px_0_#4C9A3A]` for small/medium
  buttons, `shadow-[0_4px_0_#4C9A3A]` for large ones. The dark variant is
  `shadow-[0_4px_0_#14282e]`. This is the site's most recognizable detail —
  a flat, toy-like offset with no blur. Disabled buttons drop it
  (`disabled:shadow-none`).
- **Soft ambient (resting surfaces):**
  `shadow-[0_8px_24px_rgba(31,58,66,0.06)]` on event cards and dashboard
  panels, `0.05` on About cards. Plus `shadow-sm` / `shadow-md` on lighter
  elements.
- **Lift:** `shadow-2xl` on modals and the signup toast. Nothing else.

Never combine a shelf and an ambient shadow on the same element.

---

## 5. Component recipes

Copy these rather than improvising. Classes below are the ones actually shipped.

### Primary button

```jsx
className="px-6 py-3 rounded-full font-display font-bold text-sm
           transition-all duration-300 hover:scale-[1.02] active:scale-95
           cursor-pointer bg-[#6CC24A] text-[#14351F]
           shadow-[0_4px_0_#4C9A3A]"
```

Small variant: `px-4 py-2 text-xs` + `shadow-[0_3px_0_#4C9A3A]`.
Full-width in forms and cards: `w-full py-3` / `w-full py-2.5`.
Disabled: `disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none`
(or `disabled:opacity-60 disabled:cursor-wait` while submitting).

### Secondary button

```jsx
className="px-6 py-3 rounded-full font-display font-bold text-sm transition-all
           cursor-pointer bg-white hover:bg-[#1F3A42]/5 text-[#1F3A42]
           border-2 border-[#1F3A42]/15"
```

### Dark button (rare, high emphasis)

```jsx
className="px-10 py-4 rounded-full font-display font-bold
           bg-[#1F3A42] text-white shadow-[0_4px_0_#14282e]
           hover:scale-[1.02] active:scale-95 cursor-pointer"
```

### Nav pill

```jsx
// active
"px-3.5 py-2 rounded-full text-[13px] font-sans font-extrabold border-2
 bg-[#E4F5DA] text-[#2E7D46] border-transparent"
// idle
"... text-[#4B6169] border-transparent hover:bg-[#1F3A42]/5"
```

Note the `border-2 border-transparent` on both states — it reserves the space so
nothing shifts when the active style lands.

### Content card

```jsx
className="rounded-[28px] border-2 border-[#1F3A42]/8 bg-white
           hover:border-[#1F3A42]/15 transition-all duration-300
           shadow-[0_8px_24px_rgba(31,58,66,0.06)]"
```

With a cover image: `overflow-hidden`, image block `h-44` with
`border-b-2 border-[#1F3A42]/5`, image gets
`object-cover transition-transform duration-500 hover:scale-105`. Body is `p-6`
(or `p-5`) with `space-y-4`, and an internal meta block separated by
`pt-3.5 border-t-2 border-[#1F3A42]/8`.

### Status chip

```jsx
"px-2.5 py-1 rounded-full text-[10px] font-display font-bold"
```

Fill by meaning: `bg-[#6CC24A] text-[#14351F]` (good/plenty),
`bg-[#F2C94C] text-[#4A3900]` (scarce), `bg-[#E4574B] text-white` (gone),
`bg-[#E4F5DA] text-[#2E7D46]` (success/category), `bg-[#1F3A42] text-white`
(neutral category on an image).

### Form input

```jsx
className="w-full p-2.5 rounded-xl text-sm border-2 border-[#1F3A42]/12
           bg-white text-[#1F3A42] placeholder:text-[#9AA6A6] focus:outline-none"
```

Label above it: `text-[11px] font-extrabold text-[#4B6169]`, wrapper
`space-y-1` / `space-y-1.5`. `focus:outline-none` is safe here **only because**
`src/index.css` sets a global `outline: 2px solid #6CC24A; outline-offset: 1px`
on `input:focus, select:focus, textarea:focus`. Don't remove that rule, and
don't add `focus:outline-none` to non-input elements.

Placeholders are friendly and concrete: `e.g. Timothy`,
`e.g. Turtle Rock Elementary`, `parent@example.com`, `e.g. Alex Chen`.

### Modal

```jsx
// scrim
"fixed inset-0 z-50 overflow-y-auto bg-[#1F3A42]/45 backdrop-blur-sm
 flex items-center justify-center p-4"
// panel
"w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl bg-[#FBF7EC]
 flex flex-col justify-between max-h-[90vh] animate-fade-in"
```

Scrim alpha: `/45` for forms, `/50`–`/60` for celebratory or long-read modals
(`backdrop-blur-md` on the lab-log reader). Header strip is `p-5 bg-white
border-b-2 border-[#1F3A42]/8` with a title + one-line subtitle on the left and
a round `X` close button on the right (`p-1.5 rounded-full
hover:bg-[#1F3A42]/5 text-[#4B6169] hover:text-[#1F3A42]`).

Behavior conventions: Escape closes; click-outside closes (guard with
`e.target === e.currentTarget` or `stopPropagation` on the panel); set
`role="dialog"` and `aria-modal="true"` with a label; lock `body` overflow for
full-screen readers.

### Toast

Bottom-right, `fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border-2 px-4
py-3.5 shadow-2xl animate-fade-in bg-[#FBF7EC]`, border `#6CC24A]/50` on
success or `red-400/50` on failure, bold `text-xs` headline + `text-[11px]`
detail + a "Dismiss" button. Auto-clears after **5s**.

### Empty state

Centered in a card with a **dashed** border
(`border-2 border-dashed border-[#1F3A42]/12 rounded-[28px] bg-white`,
`py-12`): a `#9AA6A6` lucide icon, a bold short line, one encouraging sentence,
then a primary button. Copy pattern: state the fact, then point somewhere.
*"No sign-ups yet" → "Spots fill up fast! Explore upcoming events." → [Browse
Upcoming Events]*.

### Progress bar

`w-full bg-[#E4F5DA] h-3 rounded-full overflow-hidden` with an inner
`h-full rounded-full bg-[#6CC24A] transition-all duration-500`.

### Avatar

Header/mobile: `rounded-full bg-[#6CC24A] text-white font-display font-bold`,
first initial uppercased. Dashboard: `w-16 h-16 rounded-2xl bg-[#1F3A42]
text-white text-3xl` — the one place the avatar is a squircle, not a circle.

---

## 6. Motion

Restrained and quick. `motion` is a dependency but is barely used; nearly
everything is a CSS transition.

- **Durations:** `duration-200` (nav), `duration-300` (default for buttons and
  card hovers), `duration-500` (image zoom, progress fill, logo hover).
- **Press feedback:** `hover:scale-[1.02] active:scale-95` on primary buttons;
  `hover:scale-105` on smaller CTAs and card images; `hover:scale-[1.01]` on
  wide in-card buttons. Scale up a hair, scale down decisively.
- **Entrances:** `.animate-fade-in` — 0.25s, opacity 0→1 with a 4px rise. Used
  on every modal, the mobile drawer, the toast, and FAQ answers.
- **Ambient:** `.lava-bubble` (8s infinite rise) exists for decorative bubbles.
- **Spinners:** `<Loader2 className="animate-spin" />` from lucide, paired with
  a changed label ("Signing up…").

Don't add bounce, spring, parallax, or anything that moves on scroll.

---

## 7. Iconography

**lucide-react**, exclusively. No emoji in UI chrome (the one exception is the
`✔` inside "You're signed up ✔" and the `→` / `↗` arrows in text links).

Sizes: `w-3.5 h-3.5` inline with small text, `w-4 h-4` in buttons and meta,
`w-5 h-5` for section headings and modal closes, `w-6 h-6` in icon tiles,
`w-8`–`w-10` in empty states, `w-16`/`w-20` for confirmation moments. Default
stroke; `strokeWidth={1.5}` only for the oversized confirm-email icon.

Stable icon → meaning pairings (keep these consistent):

| Icon | Means |
|---|---|
| `Calendar` | Events / dates |
| `Clock` | Time / timestamps |
| `MapPin` | Location |
| `Ticket` | Sign-ups |
| `Trophy` | Level |
| `Award` | Achievements |
| `Star` | XP |
| `ShieldCheck` | Membership |
| `FlaskConical` | Games / chemistry |
| `BookOpen` | Announcements |
| `BookMarked` | Resources |
| `ImageIcon` | Gallery |
| `HelpCircle` | About / FAQ |
| `Lock` | Guest limitation |
| `CheckCircle` | Success |
| `ShieldAlert` / `AlertCircle` / `AlertTriangle` | Errors and warnings |
| `Moon` / `Sun` | Theme toggle |

Icon tiles: `p-3 rounded-2xl bg-[#E4F5DA] text-[#2E7D46]` (or `w-12 h-12
rounded-2xl` centered). Locked/inactive: `bg-[#1F3A42]/5 text-[#9AA6A6]`.

Each of the eleven minigames owns a badge icon — `Orbit`, `FlaskConical`,
`Bot`, `Eye`, `Zap`, `Activity`, `Dna`, `Leaf`, `Telescope`, `Factory`,
`ScrollText`. If a game is added, its icon must match between
`VirtualLab.tsx`'s `GAMES` and `Dashboard.tsx`'s `badgeCatalog`.

---

## 8. Imagery

Event and lab-log photos come from the Google Sheet, so the site can't control
their crop — which is why every image slot is fixed-height with `object-cover`
(`h-44` cards, `h-60` modal header) and every `<img>` carries
`referrerPolicy="no-referrer"`.

Over-image text sits on a gradient scrim: `bg-gradient-to-t from-black/60
via-black/10 to-transparent`. Chips over images use solid fills, never tints.

Photos should show **kids doing things** — hands, materials, mid-experiment —
not posed group shots or stock lab glassware.

---

## 9. Voice & tone

**Warm, plain, and specific.** We're a volunteer club talking to families, not
a brand talking to a market.

### Principles

1. **Say the real thing.** "Meetings take place at UCI's Paul Merage School of
   Business (Room SB2-117) every Saturday from 7:00 to 8:30 PM." Not "a
   convenient local venue."
2. **Respect the science.** Game copy names the actual field — "Punnett
   squares, test crosses, and epistasis"; "any topology you build, including a
   Wheatstone bridge." We tell children the true words for things.
3. **Encourage without hype.** "Levels get genuinely harder." "Curiosity is
   welcome here." Never "amazing", "revolutionary", "unleash", "supercharge".
4. **Be honest about limits.** "We only record the student's name and school so
   mentors know who to expect." "You won't receive anything from us until you
   do." "Events you've signed up for from this device."
5. **One exclamation point at a time.** They're reserved for genuine good news —
   "You're signed up!", "Welcome aboard!", "Count Us In!". Never two in a row,
   never in an error message.
6. **Second person.** "You're on the list", "Grab a spot before they fill up."
7. **Short.** Card body copy is one or two sentences. Helper text is one.

### Established phrases — reuse, don't reinvent

| Situation | Say |
|---|---|
| Membership CTA | "Join" / "Join the Club" / "Count Us In!" |
| Event CTA | "Sign Up for This Event" |
| Sold out | "No Spots Remaining" / "Sold Out" |
| Signup confirmed | "You're signed up!" — "*Name* is booked in for *Event*." |
| Join confirmed | "Welcome aboard!" |
| Return login | "Welcome back, *Name*!" |
| Newsletter success | "You're on the list!" / "You're already on the list!" |
| Level up | "Scientist Level Up!" → "Keep exploring!" |
| Level-up dismiss | "Continue experimenting!" |
| Nothing to show | "Check back soon —" + what's coming |
| Generic failure | "Something went wrong. Please try again." |
| Scarcity nudge | "Grab a spot before they fill up!" / "Spots fill up fast!" |

### Terminology

- The UI says **Events**. The code calls them `Mission`s — that's an internal
  legacy name from the template. **Never let "mission" appear in visitor-facing
  copy.**
- **Sign up** (verb) / **sign-up** (noun). Not "register", not "RSVP", not
  "reserve" in UI copy.
- **Guardian** on form labels ("Guardian Name", "Guardian Email"); "parent" is
  fine in prose and in the `parent@example.com` placeholder.
- **Coaches** and **mentors** are the middle/high-school students who teach.
- **Minigames** or **games**, hosted in the **Virtual Lab**.
- **Announcements** and **Lab Log** are distinct: announcements are short
  notices; lab log entries are illustrated write-ups with authors and comments.
- **Discovery XP**, **Level**, **badges**. Scientist titles ladder by badge
  count: *Rookie Researcher* → *Field Scientist* → *Senior Researcher* →
  *Principal Investigator*.

### Punctuation

Em dashes for asides, **with spaces around them** — like this — which is the
house style throughout the site. Real ellipses `…` in
loading states ("Signing up…", "Loading the latest schedule…"). Curly
apostrophes in prose. Serial comma. En dash for ranges ("7–8:30 PM").

### Don't

- No fake urgency or countdowns beyond the true spots-left number.
- No guilt in the newsletter or join flows.
- No jargon aimed at parents ("holistic STEM enrichment pathway").
- No talking down: no "Wow!", no "super fun", no baby talk.
- No claims about outcomes we can't back ("gets your child into a top college").

---

## 10. Email

`newsletter/*.html` are hand-written table-based emails and follow a
**deliberately different technical style** — email clients can't run the site's
CSS.

- **Type:** Georgia/Times serif for the H1, Arial/Helvetica for everything
  else. Baloo 2 and Nunito are *not* used — no webfonts in email.
- **Layout:** `role="presentation"` tables, 540px fixed width,
  `border-radius:16px` card on a `#FBF7EC` body.
- **Color:** the brand palette carries over — `#1F3A42` header bar and
  headings, `#6CC24A` button with `#14351F` label at `border-radius:999px`,
  `#4B6169` body, `#4C9A3A` step eyebrows. Email-only additions: `#3D5259`
  body text, `#FFF4D9` / `#E8B84B` / `#9A7318` / `#5C4A1F` for the caution
  card, `#8FA0A6` / `#5C7078` / `#EAF0F1` in the footer. These have no
  dark-mode counterparts and don't need any — email has no theme toggle.
- **Structure:** preheader div → teal header bar → H1 → body → callout →
  button → practical details → address + unsubscribe.
- **Voice:** same as the site, slightly more direct about logistics. The
  confirm email puts the *spam-folder* step **above** the confirm button on
  purpose — that ordering is a deliverability decision, not a layout
  preference. Don't reorder it.
- Every campaign ends with the physical address and `{{unsubscribe_link}}`.

---

## 11. The minigames are a deliberate exception

`src/components/games/` does **not** follow the light brand. All eleven games
render as always-dark instrument panels, on purpose — they read as lab
equipment rather than page content.

- **Surfaces:** `bg-[#0d0d12]` panels (also `#0a0a10`, `#070911`) with
  `border border-white/10` — note **1px** borders here, not the site's 2px.
- **Radius:** `rounded-2xl` throughout, not `rounded-[28px]`.
- **Text:** `text-zinc-200/300/400/500` instead of the teal/slate ink.
- **Semantic accents:** `emerald` = correct/go, `amber` = highlight/selected,
  `sky` = information/secondary, `red` = error/hazard.
- **Type:** `font-mono` (which resolves to Nunito, see §3) for readouts and
  numbers; `font-display` for game headings.

The site chrome *around* the games — the section heading, tab grid, and the
`rounded-[28px]` white host panel in `VirtualLab.tsx` — **is** normal brand
style. Only the interior is dark.

**Known unfinished work:** `src/index.css` contains `.game-molecule`,
`.game-robot`, and `.game-adventure` scoped rules meant to flip those three
between dark and light chrome with the site theme. Nothing applies those
wrapper classes, so the rules never fire and those games stay dark like the
rest. That's a gap, not a regression — leave it alone unless you're finishing
the feature.

---

## 12. Accessibility

- Interactive elements are real `<button>`s and carry `cursor-pointer`
  explicitly (Tailwind v4 doesn't set it by default).
- Icon-only buttons need `aria-label` **and** `title` (see the theme toggle).
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` or
  `aria-label`, Escape to close, focus the first input on open.
- Inputs get a real `<label>` (or `aria-label` where the label is visual
  context, as in the newsletter box), plus `autoComplete` where it applies
  (`name`, `email`, `organization`).
- Never remove the global green focus outline.
- Don't encode meaning in color alone — the Sold Out chip says "Sold Out", the
  success chip says "Signed up", the unlocked badge says "UNLOCKED".
- Decorative images take `alt=""`; the logo and content images take real alt
  text.

---

## 13. Checklist for anything new

1. Wrapped in `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` with `py-10`.
2. Heading is `font-display font-bold tracking-tight`; body is
   `font-sans leading-relaxed`.
3. Every color is from §2.1, **and** every new `text-[#hex]` / `bg-[#hex]` is
   in the `:root.dark` list in `src/index.css` (or is one of the intentional
   exceptions).
4. Cards: `rounded-[28px] border-2 border-[#1F3A42]/8 bg-white`. Buttons:
   `rounded-full` with the green shelf shadow.
5. Icons are lucide, at a size from §7, reusing the established meanings.
6. Copy is sentence case, second person, one sentence where one will do, and
   uses the established phrases.
7. Guests can see it. Only XP, badges, and levels are member-gated.
8. Checked in **both** themes and at 375px wide.
9. `npm run lint` (`tsc --noEmit`) and `npm run build` both pass.
