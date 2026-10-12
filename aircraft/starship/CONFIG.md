# Starship panel config (SSP_PANELS)

> **Docs:** [docs/USER-GUIDE.md](../../docs/USER-GUIDE.md), [docs/DEVELOPER-GUIDE.md](../../docs/DEVELOPER-GUIDE.md), [docs/LAYOUT-AUDIT.md](../../docs/LAYOUT-AUDIT.md), [AGENTS.md](../../AGENTS.md).

Static `.js` files under `config/panels/` assign to `window.SSP_PANELS.<panelId>`. Typical page load order: `common.js` → **`panel-builder.js`** → **`config/buttons.js`** → `config/panels/<name>.js` → `panel-runtime.js` → `panel-nav.js` → `panels/overrides.js` → `SSPRuntime.boot('panelId')` (full order in the [developer guide](../../docs/DEVELOPER-GUIDE.md)).

**Current default:** most panels use **`StarshipPanel({ layout: [...] })`**, which expands to **`renderMode: 'innerHtml'`** from **`config/buttons.js`**. Legacy **`renderMode: 'rows'`** / **`cells`** remains supported for special pages (e.g. MFD); see below.

**Hand-maintained:** `config/panels/*.js` and `panels/overrides.js` are edited directly. The old HTML-to-config generator scripts are gone; there is no regeneration step.

## Panel object

| Field | Description |
|--------|-------------|
| `id` | Same string as `SSPRuntime.boot(id)` (e.g. `tests`). |
| `title` | Optional; for documentation only. |
| `gridClass` | `className` for `#grid` (e.g. `grid`, `grid ice-grid`, `mfd-shell`). |
| `skipFitGrid` | If true, do not call `fitGrid()` after render (e.g. MFD shell). |
| `cols` | Grid column count (default 8; Tests uses 9). Applied inline at boot. |
| `layoutEditDisabled` | If true, edit mode refuses the page and saved layouts are ignored (Anti-Ice, MFD). |
| `renderMode` | `rows` (default), `cells` (flat list), or `innerHtml` (raw string). |
| `rows` | Array of rows; each row is an array of **cells**. |
| `cells` | Flat array when `renderMode === 'cells'`. |
| `innerHtml` | Full inner HTML of `#grid` when `renderMode === 'innerHtml'`. |
| `polls` | Array of **poll rules** (see below). |
| `profiles` | Optional map `name → { gridClass?, extraBodyClass? }`; select with `?profile=name` or `matchMedia`. |

## Cell object

| Field | Description |
|--------|-------------|
| `enabled` | If `false`, cell is skipped. |
| `type` | `button` \| `dual` \| `gauge` \| `placeholder` \| `html` |
| `id` | Element `id` (buttons / gauges). |
| `classes` | Space-separated classes on the root element. |
| `label` | Text for simple button (use `\n` for line breaks, rendered as `<br>`). |
| `html` | For `type: 'html'`, raw inner HTML of a wrapper `div`. |
| `action` | See below. |
| `indicatorId` | Optional; creates `<span class="indicator">` for toggles. |
| `hdr` | Dual header text. |
| `lampRows` | Dual rows: `[{ label, lampId }, ...]`. |
| `gauge` | `{ label, rows: [{ subLeft?, valId, subRight?, valId? }] }` for gauge markup. |

## Actions (`cell.action`)

- `{ ssp: 'SSP_...' }` — click calls `sendP(ssp)`.
- `{ hold: { ssp, ms } }` — click calls hold helper (tests).
- `{ nav: 'relative.html' }` — `location.assign`.
- `{ noop: true }` — no handler.

Dual buttons use one `action.ssp` for the whole control.

## Poll rules (`panel.polls`)

| `kind` | Fields | Behavior |
|--------|--------|----------|
| `toggle` | `btnId`, `indId`, `lvar`, `lvarType`, `on` (default `==1`) | `setToggleVisual` when `on` is number: truthy match. Use `on: 'gt0'` for `Number > 0`. |
| `toggleOr` | `btnId`, `indId`, `combine`: `and` \| `or` (default or), `checks: [{ lvar, lvarType, on? }]` | Each check uses `on`: `1`, `gt0`, etc. |
| `toggleA` | `btnId`, `indId`, `expr` | `getAVar(expr) == 1` for external / sim A: vars. |
| `lamps` | `lampIds[]`, `lvar`, `lvarType`, `map` | `map` is string key into `SSPRuntime.lampMaps` (e.g. `wiper4`, `iceWsL`). |
| `avarText` | `id`, `expr`, `decimals?` | `setValDisplay` from `getAVar(expr)`. |
| `custom` | `id` | Runs `SSP_PANEL_OVERRIDES.polls[id](ctx)` if defined. |

## Overrides (`panels/overrides.js`)

`window.SSP_PANEL_OVERRIDES = { onPoll: function(panelId, ctx){ ... } }` runs every tick after declarative polls. Use for ECS temps, pedestal gen load, XPDR, etc.

## Device profiles

`SSPRuntime.applyProfile(panel)` reads `?profile=` from URL or uses `panel.defaultProfile`. Merges `gridClass` / `document.body.classList`.

## AAO scripts

Every `ssp` label must exist in `bksq-starship-scripts.xml` under `bksq-starship-panel`. Optional check (requires Node): `node tools/check-manifest.js` — lists `SSP_*` strings in **`config/panels/*.js`** and **`config/buttons.js`** missing from that XML.
