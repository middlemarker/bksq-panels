# Design detail (AI reference)

## Public surfaces

### `window.SSPPanelHelpers`

`esc`, `attrs`, `button`, `sendButton`, `holdButton`, `dual`, `gauge`, `placeholder` — HTML builders for `config/buttons.js`.

### `window.SSPPanel(spec)`

Input: `{ buttons, layout[], extraPolls?, polls?, gridClass?, cols?, id?, skipFitGrid?, profiles? }`.

Output: `{ renderMode: 'innerHtml', innerHtml, polls, gridClass, cols?, ... }`.

Unknown layout tokens resolve to `buttons.empty` silently.

### `window.SSP_PANEL_FACTORY(buttons, defaults)`

Returns aircraft-specific factory (e.g. `StarshipPanel`, `TBMPanel`) with bound `buttons` dict.

### `window.SSP_PANELS`

Map of `pageId → panel object` assigned in `config/panels/*.js`.

### `window.SSPRuntime`

| Method | Role |
|--------|------|
| `boot(panelId)` | Render grid, set cols, start polls |
| `setPollInterval(ms)` | Restart UI poll timer |
| `testHold(ssp, ms, btnId)` | Test buttons with latch |
| `applyProfile(panel)` | URL `?profile=` grid/body classes |
| `lampMaps` | Named functions: raw L-var → lamp index |

Internal: `_applyPoll`, `_runPollTick`, `_bindPollElements` (handle cache).

### `window.SSP_PANEL_OVERRIDES`

```javascript
{ onPoll: function(panelId, ctx) {}, polls: { id: function(poll) {} } }
```

### `window.SSP_UI_SETTINGS`

From `panel-settings.js`: load/save/apply, `SSP_GET_POLL_MS`, hub UI.

### `window.SSP_LAYOUT_STORE` (`panel-builder.js` + `panel-edit.js`)

`mergePanel(pageId, panel)` (builder, runs at boot; no-op for non-`innerHtml` or `layoutEditDisabled` panels), `getOverride(pageId)`, `save(pageId, {layout, cols})`, `reset(pageId)` (edit module).

### `window.SSP_PANEL_EDIT` (`panel-edit.js`, lazy)

Public: `init(pageId, panel)`, `exit()`, `active`, `mode` (`'move'` | `'delete'`).

- `init` refuses pages with `layoutEditDisabled`, non-`innerHtml` render mode, or grid child count ≠ layout length, showing a notice.
- State: `_layout` (token array), `_cols`, `_undo` (≤ 40 snapshots). All mutations go through `_change(fn)` → push undo → `_save()` (store + re-render + toolbar sync).
- Pointer handling: document-level capture listeners for touch and mouse. Taps on a cell open the picker (Move) or clear it (Delete); drags beyond 6 px move a ghost clone and hit-test with `elementFromPoint`.
- Picker: tiles built once from the buttons dictionary with inert markup (ids and `onclick` stripped). Filters: chip (`suggest`, `recent`, `all`, `g:<prefix>`), search text over token + label, "Hide placed". Positioned inside `[8px, viewport − nav − 8px]`.
- JSON sheet: tabs `page` / `all` / `config`; `_applyImport(text)` validates and applies (see formats in `docs/DEVELOPER-GUIDE.md`).

### `SSPRuntime` edit API

`enterEditMode(done?)`, `exitEditMode()`, `isEditing()`.

### `window.SSP_NAV_TOOLS` (`panel-nav.js`)

- `mount(pageId, panel)` — panel pages: inserts `button.nav-tool` ⌂ and EDIT before the gear, writes `<storageKey>:last-page`, runs the auto-home idle timer (1 s check; activity = touchstart, mousedown, mousemove, keydown, wheel, scroll).
- `mountHub()` — hub: same buttons on every `.nav-bar`; ⌂ scrolls to `#selAutoHomePage`, EDIT opens the last page (or first page without `noEdit`) with `?edit=1`; adds `.nav-last` to the last page's tab.
- Settings keys: `autoHomePage` (page id or `''`), `autoHomeIdleSec` (5–300, default 20; aircraft may override via `defaults.autoHomeIdleSec`).

### `aircraft.js` page entry

`{ id, label, navLabel, href, hiddenByDefault?, noEdit?, aliases? }` — `noEdit` marks CSS-positioned pages for the hub EDIT button. `aliases` lists retired ids; `panel-settings.js` maps them to `id` when loading `navPages` and `autoHomePage`.

`id` must equal the `SSPRuntime.boot()` argument, the `SSP_PANELS` key and the page's `data-panel-nav` value; nav tools, settings and layout storage all key on it. `tools/audit-layouts.js` reports a mismatch.

### `AaoWebApi` instance `webApi`

- `GetSimVar(expr)` — register + cache read
- `SendEvent(value, event)`, `SendScript(code)`, `SetVariable`, `SetString`
- `StartAPI(ms)`, `StopAPI()`, `setPollInterval(ms)` (if extended)
- `getDataRevision()` — monotonic counter after each GET parse
- `onData(callback)` — optional listener after cache update
- A response that fails to parse (or throws in the listener) counts as a slow poll (`_lastRtt = 2000`, widening the adaptive interval); the loop always schedules the next request, so polling never stops on bad data.

### `common.js` helpers

`sendP`, `sendTbmP`, `getLVar`, `getAVar`, `setToggleVisual`, `setLamps`, `setValDisplay`, `fitGrid`.

Poll helpers accept optional pre-resolved elements when `_bindPollElements` ran.

## Poll kind table

| kind | Fields | Behavior |
|------|--------|----------|
| `toggle` | `lvar`, `lvarType?`, `btnId`, `indId`, `on?` | L-var truth → indicator |
| `toggleOr` | `checks[]`, `combine?`, `btnId`, `indId` | OR/AND of L-vars |
| `toggleA` | `expr`, `btnId`, `indId` | A: expr == 1 |
| `testLatched` | `lvar`, `btnId`, `indId` | Hold OR lvar |
| `lamps` | `lvar`, `map`, `lampIds[]` | `lampMaps[map](raw)` |
| `lvarText` | `lvar`, `id` | Text in `#id` |
| `avarText` | `expr`, `id`, `decimals?` | A: formatted text |
| `custom` | `id` | `SSP_PANEL_OVERRIDES.polls[id]` |

Optional on any rule: **`everyMs`** — skip application until interval elapsed.

Optional: **`_el`** cache populated at boot — `{ btn, ind, lamps[], val }`.

## DOM id conventions

- Button: `btnId` on `<button id="...">`
- Indicator: `<span class="indicator" id="indId">`
- Lamps: `<span class="lamp" id="...">` in dual buttons
- Gauges: `g-val` spans with ids from `gauge()` spec

Duplicate ids on one page break poll updates.

## CSS custom properties (settings)

`--ssp-btn-font`, `--ssp-grid-row-min`, `--ssp-grid-gap-x/y`, `--ssp-row-pad-pct`, `--ssp-ui-brightness`, `--ssp-dot-scale`, `--ssp-gauge-val-mult`, `--vh`, `--vhFix`, `--ssp-edit-dock-h` (set by edit mode).

## Root classes on `<html>`

| Class | Meaning |
|-------|---------|
| `ssp-edit-mode` | Edit mode active |
| `ssp-edit-del` | Edit mode in Delete mode |
| `ssp-edit-drag-active` | A drag is in progress |
| `ssp-panel-scrollable` | Scrollable panel pages setting |
| `ssp-settings-open` | Hub settings overlay open |
| `ssp-reduce-motion`, `ssp-no-touch-flash`, `ssp-row-align-*` | Settings toggles |

## Nav bar contract

Every `.nav-bar` (panel pages and hub) is: page tabs `a[data-panel-nav]` → `button.nav-tool.nav-tool-home.nav-tool-first` (⌂) → `button.nav-tool.nav-tool-edit` → `a.nav-settings-gear`. `.nav-tool-first` has `margin-left:auto` to right-align the tools. The buttons are `<button>`s so `nav-inapp.js` ignores them.

## Aircraft event groups

| Aircraft | `eventGroup` |
|----------|----------------|
| Starship | `bksq-starship-panel` |
| TBM 850 | `bksq-tbm-panel` |

## TBM transponder IE events (verified)

Some avionics use input events in XML, e.g. `(>IE:NAVCOM_TRANSPONDER_FUNC)` rather than `Scripts-xpndr-func`.

## Starship script labels

See `aircraft/starship/README.md` and historical `CONFIG.md` tables (circuits, ECS, pedestal L-vars). Manifest check enforces XML parity.
