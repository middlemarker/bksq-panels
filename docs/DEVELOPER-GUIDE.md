# Developer guide — BKSQ AAO panels

## Architecture (summary)

```
index.html              Hub: aircraft choice + settings overlay + bottom nav
aircraft/*/pages/*.html Thin shell per panel page: nav, #grid, script load order
aircraft/*/aircraft.js  BKSQ_AIRCRAFT meta: id, eventGroup, storageKey, defaults, pages[]
aircraft/*/config/buttons.js       Token → { html, polls? }
aircraft/*/config/panels/*.js      layout[] → SSPPanel / StarshipPanel / TBMPanel
aircraft/*/panels/overrides.js     onPoll + custom poll handlers
aircraft/*/bksq-*-scripts.xml      AAO RPN per SSP_* label
common/AaoWebApi.js     AAO HTTP poll loop and var cache
common/common.js        send*/get* helpers, fitGrid, touch flash
common/panel-settings.js  Settings schema, localStorage, CSS vars, hub settings form
common/panel-builder.js   Layout → HTML, SSPPanel, SSP_PANEL_FACTORY, saved-layout merge
common/panel-runtime.js   SSPRuntime: render, polls, edit-mode entry points
common/panel-nav.js       Bottom-nav tools: ⌂ auto-home + EDIT (panel pages and hub)
common/panel-edit.js      Layout editor (lazy-loaded): drag and drop, picker, JSON sheet
common/nav-inapp.js       Keeps nav links inside the iOS standalone web app
```

**Boot order (panel page):** `AaoWebApi.js` → `aircraft.js` → `panel-settings.js` → `nav-inapp.js` → `common.js` → (aircraft `common.js`) → `panel-builder.js` → `buttons.js` → `config/panels/<page>.js` → `panel-runtime.js` → `panel-nav.js` → `panels/overrides.js` → `SSPRuntime.boot('pageId')`.

`boot` merges any saved layout, renders the grid, starts polling, mounts the nav tools and records the page as the last visited. `panel-edit.js` is loaded only when EDIT is tapped (or `?edit=1`).

**Hub:** `index.html` loads `aircraft.js` + `panel-settings.js`, writes the page tabs, then loads `nav-inapp.js` and `panel-nav.js` and calls `SSP_NAV_TOOLS.mountHub()` so the bottom bar matches panel pages.

**Event path:** button → `sendP('SSP_…')` / `sendTbmP` → `webApi.SendEvent(1, '(>K:<eventGroup>-SSP_…)')` → AAO script from XML.

## Authoring a button

In `config/buttons.js`:

```javascript
my_token: {
  html: sspButton('g-instr', 'LABEL', 'SSP_TBM_OH_GYRO_TOGGLE', 'btnId', 'indId'),
  polls: [{ kind: 'toggleA', btnId: 'btnId', indId: 'indId', expr: 'CIRCUIT SWITCH ON:57, Bool' }]
}
```

- Style classes: `g-instr`, `g-lts`, `g-xpdr`, etc. (see existing entries).
- Every `SSP_*` label must exist in the aircraft `bksq-*-scripts.xml`.
- Name tokens `<system>_<name>` (e.g. `avncs_xpdrFunc`). The prefix groups the token in the edit-mode picker and palette and drives the picker's **For this spot** suggestions.
- The visible label text is what users search for in the picker, so keep it meaningful.

## Placing on a page

In `config/panels/<page>.js`:

```javascript
window.SSP_PANELS.overhead = TBMPanel({
  id: 'overhead',
  cols: 8,
  layout: [
    'token_a', 'token_b', 'empty', ...
  ]
});
```

- Layout fills **left to right**, `cols` cells per row (default 8, applied inline so no CSS breakpoint can change it). Use `'empty'` for spacers.
- Use one string token per cell. Nested arrays or inline objects render, but edit mode refuses pages where the rendered cell count differs from the token count.
- `layoutEditDisabled: true` for pages positioned by CSS rather than array order (Starship `antiice`, `mfd`). Also set `noEdit: true` on that page's entry in `aircraft.js` so the hub's EDIT button skips it.

**Saved layouts:** at boot `SSP_LAYOUT_STORE.mergePanel` replaces the file layout with the user's saved one from `localStorage` (never for `layoutEditDisabled` pages). If a user reports a layout that doesn't match the file, it's a saved override: EDIT → Reset page.

## Poll kinds (`panel.polls`)

| kind | Purpose |
|------|---------|
| `toggle` | L-var on/off → indicator |
| `toggleA` | A: expression == 1 |
| `toggleOr` | Multiple L-vars combined |
| `lamps` | Multi-lamp via `SSPRuntime.lampMaps` |
| `lvarText` / `avarText` | Gauge readout text |
| `testLatched` | Hold + L-var |
| `custom` | `SSP_PANEL_OVERRIDES.polls[id]` |

Optional **`everyMs`** on a poll rule throttles DOM updates (slow gauges).

## Adding a page

1. Add `{ id, label, navLabel, href }` to `aircraft.js` `pages[]` (plus `noEdit: true` if CSS-positioned).
2. Create `pages/<name>.html` by copying an existing page: fix the nav (`class="active"` on the new tab) and the `SSPRuntime.boot('<id>')` call, and keep `panel-nav.js` after `panel-runtime.js`. The page `id`, the `boot('<id>')` argument, the `window.SSP_PANELS.<id>` key and every `data-panel-nav="<id>"` must be the same string — settings, auto-home, last page and saved layouts are all keyed by it.
3. Create `config/panels/<name>.js` with the layout.
4. Add the nav link in all sibling `pages/*.html` for that aircraft (the hub builds its tabs from `pages[]` automatically).
5. Run `node tools/audit-layouts.js` and update the docs (see [Keeping docs current](#keeping-docs-current)).

To rename a page id later, keep the old one in the entry's `aliases: ['old']` so stored settings (`navPages`, `autoHomePage`) carry over. Saved layouts are keyed by the id too and are not migrated; the TBM entry `{ id: 'avionics', aliases: ['avnenv'] }` is an example.

## Adding an aircraft

Copy `aircraft/tbm850` or `aircraft/starship` as a template: new `id`, `eventGroup`, `storageKey`, `buttons.js`, scripts XML, and register it in the `index.html` aircraft selector. The buttons dictionary must be exposed as `window.SSP_BUTTONS` or `window.TBM_BUTTONS` for edit mode to find it (extend `getButtonsDict` in `panel-edit.js` / `panel-builder.js` for a new name).

## Overrides

`panels/overrides.js` — `onPoll(panelId)` runs after declarative polls each tick. Use for multi-step UI (ECS temps, pedestal gauges, XPDR). Prefer declarative polls when possible. Buttons that overrides update by id keep working after edit-mode moves, but not if the user removes them from the page (the override finds no element and skips).

## Browser storage (`localStorage`)

All keys are prefixed with the aircraft `storageKey`:

| Key | Contents | Written by |
|-----|----------|------------|
| `<storageKey>` | Settings object (poll ms, fonts, nav tabs `navPages: { pageId: bool }`, `autoHomePage`, `autoHomeIdleSec`, …). Page ids listed in a page's `aliases` are mapped to its `id` on load | `panel-settings.js` |
| `<storageKey>:layout:<pageId>` | `{ layout: [...], cols }` saved layout | `panel-edit.js` |
| `<storageKey>:edit-recent` | Recently placed tokens (picker **Recent**) | `panel-edit.js` |
| `<storageKey>:last-page` | Last panel page id (hub EDIT button, tab underline) | `panel-nav.js` |
| `bksq-panels-last-aircraft` | Last selected aircraft | `index.html` |

## Layout JSON formats

Exported and imported by the edit-mode **{ } JSON** sheet:

```json
{ "format": "bksq-layout", "version": 1, "aircraft": "tbm850", "page": "overhead", "cols": 8, "layout": ["...", "..."] }
```

```json
{ "format": "bksq-layouts", "version": 1, "aircraft": "tbm850", "pages": { "overhead": { "cols": 8, "layout": ["..."] } } }
```

Import also accepts a bare `{ "layout": [...], "cols": n }`. Non-string entries become `'empty'`; `cols` outside 1–12 falls back.

## Tools

| Script | Purpose |
|--------|---------|
| `tools/check-es5.js` | ES5 / iOS 12.5 syntax guard (comments are ignored) |
| `tools/audit-layouts.js` | Runs the real configs in a Node `vm` sandbox and writes `docs/LAYOUT-AUDIT.md`: unknown/duplicate tokens, duplicate DOM ids, dead poll targets, custom polls without a handler, row-comment mismatches, dead panel files, page ids that differ between `aircraft.js`, `boot()`, `SSP_PANELS` and nav links (redirect stubs are skipped), unplaced buttons |
| `aircraft/*/tools/check-manifest.js` | SSP labels in JS vs XML |

TBM binding verification (local `ref/AnalogTBM.xml`, gitignored):

```text
node aircraft/tbm850/tools/verify-analogtbm.js
```

## iOS 12.5 / ES5 rules

- No `let`/`const`, arrow functions, template literals, spread, `async`/`await`, optional chaining.
- Use `function`, `var`, string concatenation, `for` loops.
- `classList` add/remove/toggle OK; avoid `classList.replace`.
- `requestAnimationFrame` with `setTimeout` fallback (already in runtime).
- **No Pointer Events and no HTML5 drag-and-drop on touch** in iOS 12 Safari: use touch + mouse events (see `panel-edit.js`). Register `touchmove` with `{ passive: false }` when you need `preventDefault`; iOS commits to scrolling on the first `touchmove`.
- **No `gap` on flexbox** (Safari 14.1+): use margins. `grid-gap` on CSS grid is fine.
- Text inputs need `font-size: 16px` or iOS zooms the page on focus.
- `<a download>` is ignored on iOS 12; offer Copy instead of file downloads there.
- Test on Safari 12 / iPad mini 2 class hardware when changing poll, render or touch paths.

## Performance notes

- `getLVar` / `getAVar` read **cache** populated by `AaoWebApi` background loop — not one HTTP call per read.
- First read of each expression **registers** it for all future polls; avoid calling fallback `getAVar` every tick.
- Poll interval applies to both AAO fetch and UI tick; use higher ms on slow devices.
- Edit mode is lazy-loaded and costs nothing until EDIT is tapped; the picker builds its tiles once and filters by toggling `display`.

See [docs/ai/ARCHITECTURE.md](ai/ARCHITECTURE.md) for full data-flow detail.

## Keeping docs current

Every change updates the docs it affects, in the same change. Use this map:

| If you change… | Update |
|----------------|--------|
| Anything a pilot sees or does (pages, buttons, settings, nav, edit mode) | `docs/USER-GUIDE.md`, the aircraft `README.md` |
| Files, boot order, storage keys, formats, authoring steps | this guide |
| Public APIs, poll kinds, DOM/CSS contracts, module ownership | `docs/ai/ARCHITECTURE.md`, `docs/ai/DESIGN-DETAIL.md` |
| Concepts, goals, performance budget | `docs/ai/CONCEPTS-AND-GOALS.md` |
| Layouts or buttons | re-run `node tools/audit-layouts.js` (`docs/LAYOUT-AUDIT.md`) |
| Script labels / sim bindings | aircraft `CONFIG.md` |
| Agent rules | `AGENTS.md` |
| Anything user-visible | `CHANGELOG.txt` |

## Script reference

Script label maps, circuit indices and reserved labels live in `aircraft/starship/CONFIG.md` and `aircraft/tbm850/CONFIG.md`.
