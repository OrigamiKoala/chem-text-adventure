# Chem CYOA — chem-text-adventure

A choose-your-own-adventure chemistry text game with a built-in "virtual
lab" flask/beaker simulator, deployed at chem.trscienceclub.org (see
`CNAME`). React + TypeScript + Vite, no backend — all game content is a
static `data.json` narrative graph served from the repo.

## Commands

- `npm run dev` — Vite dev server.
- `npm run build` — `tsc && vite build`. This is the only correctness gate:
  no separate lint script, no test suite in this repo.
- `npm run preview` — preview the production build.

## Architecture

- `src/App.tsx` — top-level layout: `Header`, `ChatContainer` (left/story
  panel), `LabContainer` (right panel, shown when `isLabVisible`),
  `InventoryModal`, `PeriodicTableModal`. All state comes from
  `useGameEngine`.
- `src/hooks/useGameEngine.ts` — owns narrative state (`currentNode`,
  `chatLog`, player HP/stats/inventory) and wires up `useLabEngine`.
- `src/hooks/useLabEngine.ts` — owns the lab flask's `visualStack`
  simulation: adding reagents (via `window.prompt` for amount — guarded by
  `typeof window !== 'undefined'` so the pure engine functions stay testable
  outside a browser), chained reaction detection/resolution
  (`runReactionChain`, debounced via `scheduleReactionCheck`), returning
  flask contents to inventory, and passive cooling toward ambient
  temperature while the lab is open.
- `src/engine/reactionEngine.ts` — attribute/color resolution for lab
  beakers and items (`getAttributes`, `getColors`, `resolveId`), and
  chemical-equation generation for reaction names.
- `src/engine/labEngine.ts` — `determineNextReaction` / `applyReaction`:
  the actual reaction-matching and stack-mutation logic driving the flask.
- `src/engine/diceEngine.ts`, `src/engine/textParser.ts` — dice-roll
  mechanics and narrative text processing (TeX/HTML cleanup, MathJax
  typesetting via `safeTypeset`).
- `src/components/LabContainer.tsx` — renders the flask/beaker bench. The
  *reaction-driven* visuals (liquid layer stacking from `visualStack`, gas
  cloud/bubble generation, solid-block clip-path, all chemistry-data-driven
  fill colors) are computed here from `visualStack`/`itemsData`/`labData` —
  treat that logic as the "reaction rendering" and don't touch it casually;
  it's a faithful port of the original `game.js` `renderVisualStack()` /
  `updateMeasurementBars()`.
- `data.json` — the narrative graph (nodes, choices, items, lab reagent
  definitions). `public/images/` — reference diagrams (NMR spectra,
  molecule structures, periodic table) linked from node text as
  `images/<file>`.
- `game.js` — the original pre-React implementation, kept in the repo root
  for reference; the `src/` tree is a from-scratch React port of its logic,
  not a wrapper around it.

## Styling

Plain CSS in `style.css` (no Tailwind, no component library) implementing
the Turtle Rock Science Club brand — see `STYLE.md` for the full design
system (palette, type scale, spacing, component recipes, voice/tone).
Highlights:

- Brand colors/semantics are CSS custom properties in `:root`, redefined in
  `:root.dark` — write `var(--tr-*)` / semantic aliases, never a bare hex,
  or the rule silently breaks dark mode (STYLE.md §2.2).
- The lab bench (`.lab-table` in `style.css`, "SECTION 11: Lab Workspace")
  is a themed wood workbench (honey-oak in light mode, dim walnut-toned in
  dark mode) built from its own `--lab-wood-*`/`--lab-metal*`/`--lab-ink`/
  `--lab-shadow` variables, plus decorative ring-stand/Bunsen-burner
  graphics around the flask (`LabContainer.tsx`'s `.flask-rig`) — all
  chrome, none of it touches the reaction-rendering logic above. Full
  details in `STYLE.md` §10.
- Theme state lives in `localStorage['tr_sc_theme']`, toggled via
  `useTheme.ts` and a `.dark` class on `<html>`; `index.html` has an inline
  pre-render script to avoid a light-mode flash on load — keep both in sync
  if you touch theme init.

## Conventions

- No icon library — every icon is a plain emoji, inline in JSX (STYLE.md
  §7). Don't introduce `lucide-react` or similar without a deliberate,
  repo-wide decision.
- Reaction names render as real chemical equations via MathJax/`mhchem`
  (`\(\ce{...}\)`) — see `reactionEngine.ts`'s equation generation and
  `textParser.ts`'s `safeTypeset`.
