# PanelKit — detailed design

Module-by-module specification. Read [HLD.md](HLD.md) first. Data formats are in [PACK-FORMAT.md](PACK-FORMAT.md), widget contracts in [WIDGETS.md](WIDGETS.md), adapters in [ADAPTERS.md](ADAPTERS.md).

All runtime code is **ES5** and MUST pass `node tools/check-es5.js`. Every module is an IIFE that attaches to `window.PK`:

```javascript
(function (PK) {
  'use strict';
  /* ... */
  PK.expr = { parseSource: parseSource, parseAction: parseAction };
})(window.PK);
```

`'use strict'` is allowed (iOS 12 supports it). Modules marked **DOM-free** MUST NOT touch `document`, `window.location`, `localStorage` or timers at load time or in their public functions, because Node tools load them in a `vm` sandbox.

## 1. Module list

| File | DOM-free | Owns | Spec |
|------|----------|------|------|
| `panelkit/core/pk-core.js` | yes | `PK` namespace, util, log, events, registries, query parsing (given a string) | §5 |
| `panelkit/core/pk-expr.js` | yes | Source and action grammar → canonical objects | §6 |
| `panelkit/core/pk-transform.js` | yes | State-spec normalisation and evaluation, maps, formats | §7.1–§7.3 |
| `panelkit/core/pk-resolve.js` | yes | Merge vendor/libraries/pack, templates, normalisation, problems | §8 |
| `panelkit/core/pk-store.js` | no | `localStorage` wrapper and key schema | §17 |
| `panelkit/runtime/pk-widgets.js` | yes at load | Widget registry and built-in widgets | [WIDGETS.md](WIDGETS.md) |
| `panelkit/runtime/pk-bind.js` | no | Binding engine: var slots, dirty checking, timers, local vars | §7.4–§7.9 |
| `panelkit/runtime/pk-actions.js` | no | Action dispatcher | §10 |
| `panelkit/runtime/pk-input.js` | no | Delegated touch/mouse input, confirm guard, flash | §9 |
| `panelkit/runtime/pk-layout.js` | no | Page render, mount, columns, placed pages, fit, theme CSS | §11 |
| `panelkit/runtime/pk-boot.js` | no | `PK.boot()` | §18 |
| `panelkit/chrome/pk-settings.js` | no | Settings schema, storage, CSS vars, hub form | §12 |
| `panelkit/chrome/pk-nav.js` | no | Nav bar, in-app navigation | §13 |
| `panelkit/chrome/pk-autohome.js` | no | Auto-home idle timer | §14 |
| `panelkit/chrome/pk-status.js` | no | Connection status dot | §15 |
| `panelkit/chrome/pk-edit.js` | no | Edit mode (lazy-loaded) | §16 |
| `panelkit/adapters/pk-adapter-aao.js` | no | AxisAndOhs adapter | [ADAPTERS.md](ADAPTERS.md) §2 |
| `panelkit/adapters/pk-adapter-mock.js` | yes | Mock adapter | [ADAPTERS.md](ADAPTERS.md) §3 |
| `panelkit/pk-loader.js` | no | Reads the URL, writes `<script>` tags | §4 |
| `panelkit/css/panelkit.css` | — | All engine CSS | §11 |
| `panel.html`, `hub.html` | — | Shells | §3 |

Tools (Node, ES5 style, no dependencies): `tools/lib/pk-node.js` (sandbox loader, §21), `tools/pk-test.js`, `tools/pk-validate.js`, `tools/pk-build-xml.js`, `tools/pk-new-pack.js`, `tools/pk-import-legacy.js`.

## 2. Directory layout

```
panel.html                 generic panel page
hub.html                   new hub (becomes index.html at switch-over, WP-28)
panelkit/
  pk-loader.js
  core/   pk-core.js pk-expr.js pk-transform.js pk-resolve.js pk-store.js
  runtime/ pk-widgets.js pk-bind.js pk-actions.js pk-input.js pk-layout.js pk-boot.js
  chrome/ pk-settings.js pk-nav.js pk-autohome.js pk-status.js pk-edit.js
  adapters/ pk-adapter-aao.js pk-adapter-mock.js
  css/    panelkit.css
  dev/    gallery.html
  tests/  *.test.js  helpers/dom-stub.js
packs/
  catalog.js
  examples/demo/pack.js
  blacksquare/vendor.js
  blacksquare/tbm850/   pack.js aao-scripts.xml README.md
  blacksquare/starship/ pack.js behaviors.js aao-scripts.xml README.md
tools/
  lib/pk-node.js  pk-test.js  pk-validate.js  pk-build-xml.js  pk-new-pack.js  pk-import-legacy.js
```

`common/AaoWebApi.js` stays where it is and is shared with the legacy engine until switch-over.

## 3. Shells

### 3.1 `panel.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="theme-color" content="#0b0f12" />
  <title>PanelKit</title>
  <link rel="stylesheet" href="panelkit/css/panelkit.css" />
  <script src="panelkit/core/pk-core.js"></script>
  <script src="packs/catalog.js"></script>
  <script src="panelkit/pk-loader.js"></script>
</head>
<body>
  <nav class="pk-nav" id="pk-nav"></nav>
  <main id="pk-main"><div class="pk-grid-wrap"><div class="pk-grid" id="pk-grid"></div></div></main>
  <script>PK.boot();</script>
</body>
</html>
```

Nothing aircraft-specific appears in the shell. The nav is generated (§13).

### 3.2 `hub.html`

Same head, but the loader runs in hub mode (`PK.loader.hub()` instead of the panel path). Body: a pack list grouped by vendor, the selected pack's page list, and the settings form generated from the settings schema (§12). See §19.

## 4. Loader (`pk-loader.js`)

### 4.1 Algorithm (panel mode)

Runs synchronously in `<head>` after `pk-core.js` and `catalog.js`.

1. `q = PK.parseQuery(location.search)` → `{ pack, page, edit, adapter, debug }`.
2. If `q.pack` is missing: read `localStorage['pk:last-pack']` directly (inside `try/catch`; `pk-store.js` is not loaded yet). If still missing, redirect to `hub.html` and stop.
3. Look up `entry = catalog.packs` by id. If not found, also match `legacyIds`. If still not found, write an error page ("Unknown aircraft: <escaped id>" + link to the hub) and stop. **Never** build a path from `q.pack`.
4. Build the ordered script list:
   1. Engine core: `pk-expr.js`, `pk-transform.js`, `pk-resolve.js`, `pk-store.js`.
   2. Runtime: `pk-widgets.js`, `pk-bind.js`, `pk-actions.js`, `pk-input.js`, `pk-layout.js`, `pk-boot.js`.
   3. Chrome: `pk-settings.js`, `pk-nav.js`, `pk-autohome.js`, `pk-status.js` (not `pk-edit.js`; lazy).
   4. Adapter: by id from `q.adapter` (only `mock` is accepted from the URL) or the pack's catalog entry, using the table in §4.2.
   5. Vendor file (`catalog.vendors[entry.vendor].file`), library files (`entry.uses`), then `entry.dir + f` for each `entry.files`.
5. `document.write('<script src="' + escAttr(src) + '"><\/script>')` for each, in order.
6. Store `PK.loader.entry = entry` and `PK.loader.query = q` for `PK.boot()`.

Every path written comes from the catalog or the fixed tables. The adapter id from the URL is checked against the table.

### 4.2 Fixed tables

| Adapter id | Files (in order) |
|------------|------------------|
| `aao` | `common/AaoWebApi.js`, `panelkit/adapters/pk-adapter-aao.js` |
| `mock` | `panelkit/adapters/pk-adapter-mock.js` |

### 4.3 Errors

The error page is plain HTML written with `document.write` and the nav-less body; it MUST escape the id. Script load failures (404) cannot be detected synchronously; `PK.boot()` detects a missing pack registration and shows the same error page.

## 5. Core (`pk-core.js`, DOM-free)

```javascript
PK.version = '1.0.0-dev';
PK.FORMAT_VERSION = 1;
```

### 5.1 `PK.util`

| Function | Contract |
|----------|----------|
| `hasOwn(o, k)` | `Object.prototype.hasOwnProperty.call` |
| `isArray(v)`, `isPlainObject(v)` | `isPlainObject`: non-null, `typeof 'object'`, not an array |
| `clone(v)` | Deep copy of JSON-compatible data |
| `merge1(a, b)` | Template merge rule (PACK-FORMAT §12 step 3): new object; for each key of `b`, if both values are plain objects → shallow merge, else `b`'s value |
| `mergeSettings(a, b)` | Union by key, `b` wins (no recursion) |
| `escHtml(s)` | Escapes `& < > " '`; `null`/`undefined` → `''` |
| `labelHtml(s)` | `escHtml(s)` then `\n` → `<br>` |
| `toBool(v)` | PACK-FORMAT §8.2 |
| `isMissing(v, unit)` | PACK-FORMAT §8.2 |
| `looseEq(a, b)` | Numeric equality when both convert to finite numbers, else `String(a) === String(b)` |
| `now()` | `Date.now()` (tests may replace `PK.util.now`) |

### 5.2 `PK.log`

Ring buffer of the last 200 entries `{ t, level, msg, data }`. `debug/info/warn/error(msg, data)`. Mirrors to `console` only when `PK.loader.query.debug` is set. `entries()` returns a copy.

### 5.3 `PK.events`

`on(name, fn)`, `off(name, fn)`, `emit(name, payload)`. Listener exceptions are caught and logged. Event names:

| Event | Payload | Emitted by |
|-------|---------|------------|
| `pk:resolved` | `{ pack, problems }` | boot |
| `pk:rendered` | `{ pageId, cells }` | boot, edit mode re-render |
| `pk:data` | `{ revision }` | bind (after a tick that read new data) |
| `pk:settings` | `{ settings }` | settings (after apply) |
| `pk:edit-enter`, `pk:edit-exit` | `{ pageId }` | edit mode |
| `pk:status` | `{ state }` | status (on change) |
| `pk:activity` | none | input (any touch) |

### 5.4 Registries

```javascript
PK.defineCatalog(obj);  PK.defineVendor(obj);  PK.defineLibrary(obj);  PK.definePack(obj);
PK.defineBehavior(id, impl);
PK.registry  // { catalog, vendors: {}, libraries: {}, packs: {}, behaviors: {} }
PK.widgets.define(type, impl);  PK.widgets.get(type);  PK.widgets.types();
PK.adapters.define(id, factory);  PK.adapters.create(id, options);
```

`define*` stores the object as given (no copying, no validation). A second definition with the same id is ignored and logged as V-004. Validation happens in the resolver and the validator.

### 5.5 `PK.parseQuery(search)`

Pure function: `'?pack=a.b&page=x&edit=1'` → `{ pack: 'a.b', page: 'x', edit: true, adapter: null, debug: false }`. Unknown keys ignored. Values `decodeURIComponent`-ed.

## 6. Expressions (`pk-expr.js`, DOM-free)

### 6.1 API

```javascript
PK.expr.parseSource(str)            // → Source | throws PK.Problem
PK.expr.parseAction(any, ctx)       // → Action | throws PK.Problem; ctx = { scriptGroup }
PK.expr.sourceKey(src)              // → canonical key string
PK.expr.actionKey(action)           // → canonical string for script/k actions ('script:LABEL'), else null
```

`PK.Problem(code, message, path)` is a constructor in `pk-core.js` (`{ code, level, message, path }`), level defaulting from the rule table.

### 6.2 Canonical source

```javascript
{ kind: 'L', name: 'var_MasterPanelLights', unit: 'Bool', key: 'L:var_MasterPanelLights,Bool' }
{ kind: 'A', name: 'CIRCUIT SWITCH ON', index: 57, unit: 'Bool', key: 'A:CIRCUIT SWITCH ON:57,Bool' }
{ kind: 'local', name: 'dhMode', key: 'local:dhMode' }
{ kind: 'const', value: 1, key: 'const:1' }
```

Algorithm (PACK-FORMAT §8.1): `i = str.indexOf(':')`; `kind = str.slice(0, i)`; body = rest. `L`: split at the first comma (name, unit default `Number`). `A`/`E`: split at the last comma; missing comma → V-021. `A` name matching `/^(.*):(\d+)$/` → name + integer index. Trim all parts; empty name → V-020. Unknown kind → V-020.

### 6.3 Canonical action

```javascript
{ op: 'script', label: 'SSP_X', group: 'bksq-tbm-panel' }
{ op: 'k', event: 'TOGGLE_NAV_LIGHTS', value: 1 }
{ op: 'rpn', code: '...' }
{ op: 'set', target: Source, value: 2 }
{ op: 'adjust', target: Source, by: 1, min: 0, max: 10, wrap: false }
{ op: 'cycle', target: Source, values: [0, 1, 2], mode: 'wrap', onUnknown: 'first' }
{ op: 'switch', on: Spec, cases: { '0': Action, '4': null }, def: Action }
{ op: 'behavior', id: 'blacksquare.starship.temp', method: 'run', args: null }
{ op: 'seq', items: [Action, ...], gapMs: 0 }
```

String forms: prefix up to the first `:` selects the op (`script`, `k`, `rpn`, `behavior`); anything else → V-030. `k:EVENT=n` splits at the last `=` when the right side is numeric. `behavior:id#method` splits at `#`. Arrays → `seq`. Objects: exactly one of the keys `script`, `k`, `rpn`, `set`, `adjust`, `cycle`, `switch`, `behavior`, `seq` (else V-030). `script` group: explicit `group`, else `ctx.scriptGroup`, else V-035. `switch` needs `PK.transform.normalizeSpec` for its `switch` field, so `parseAction` takes `ctx.normalizeSpec` (the resolver passes it).

## 7. Values and bindings

### 7.1 `pk-transform.js` API (DOM-free)

```javascript
PK.transform.normalizeSpec(specOrString, ctx)  // → Spec | throws Problem; ctx = { maps, everyMs }
PK.transform.evaluate(spec, reader)            // → value (number | string | boolean | undefined)
PK.transform.applyMap(map, x)
PK.transform.format(fmt, v)                    // → string; fmt may be null (String(v) or missing text)
PK.transform.sources(spec)                     // → [Source] eagerly registered sources only (§7.4)
```

### 7.2 Normalised spec

```javascript
{
  producer: 'src' | 'first' | 'pick' | 'when' | 'any' | 'all',
  src: Source | null,                                  // producer 'src'
  first: null | [Spec],                                // 'first'; {src, fallback} is rewritten to this
  pick: null | { index: Spec, from: [Spec] },
  when: null | { cases: [{ test: Spec, value: Value }], otherwise: Value | null },
  items: null | [Spec],                                // 'any' / 'all'
  missing: undefined | value, everyMs: 0,
  scale: null, offset: null, clamp: null, round: null,
  map: null | { values, ranges, default, missing },   // named maps resolved to objects
  test: null | { op: 'eq', value: 1 }, not: false
}
Value = { constant: x } | { spec: Spec }               // then/else after normalisation
```

Normalisation rules: a string becomes `{ producer: 'src', src }`; `{ src, fallback }` becomes `{ producer: 'first', first: [{ src }, fallback...] }` with the transforms kept on the outer spec; `then`/`else` numbers, booleans and `null` become `{ constant }`, strings and objects become `{ spec }`. Zero or several producers → V-026. `everyMs` falls back to `ctx.everyMs` (the control's `everyMs`). Unknown map name → V-023.

### 7.3 Evaluation

`evaluate(spec, reader)` implements PACK-FORMAT §8.2 exactly, recursing into nested specs. `reader` is `{ read: function (src) {}, lazy: function (spec) {} }`: `read` returns the current value of an eagerly registered source; `lazy(spec)` is called before evaluating any lazily registered nested spec (`first` entries after the first, `pick.from[i]`, `then`/`else` specs) and registers its sources on first use (§7.4). The function is pure apart from calling `reader`.

### 7.4 Lazy registration

Rule from `AGENTS.md`: never register a fallback var every tick, and only register it when needed.

- **Eager** (watched at attach): `src`, the first entry of `first`, `pick.index`, every `if` of `when`, and the children of `any`/`all` — recursively, the eager sources of those specs.
- **Lazy**: later `first` entries, `pick.from[i]`, `then`/`else` specs.
- `first`: entry `k > 0` is reached only when entry `k - 1` has **failed**: it delivered a value that is missing by value, or it is still `undefined` 3 data revisions after it was watched. Before that, evaluation of `first` returns missing without calling `lazy` for entry `k`.
- `pick.from[i]` and `then`/`else`: `lazy` registers on first selection; a newly selected entry reads `undefined` until its data arrives.
- Each source is watched once per page (tracked by canonical key) and stays watched for the page lifetime. Lazily watched slots are added to the slot table and linked to the binding that requested them, so later changes mark it dirty.

### 7.5 `pk-bind.js` data structures

```javascript
Slot    = { src: Source, value: undefined, watchedRev: 0, bindings: [Binding] }
Binding = { cell: Cell, role: 'state', spec: Spec, last: UNSET, dirty: true, dueAt: 0 }
Cell    = { index, token, ctl, widget, el, refs, local: {}, bindings: [Binding], suppressUntil: 0 }
```

`UNSET` is a private sentinel object, so the first evaluation always updates the DOM.

### 7.6 API

```javascript
PK.bind.init(adapter)
PK.bind.attach(cells)        // collect bindings via widget.bindings(ctl) plus the engine's 'enabled' binding; normalise each spec; watch primaries
PK.bind.detach()             // drop all slots/bindings (edit-mode re-render); watched vars stay registered in the adapter
PK.bind.tick(fromData)       // see §7.7
PK.bind.invalidate(cell)     // all bindings of cell: last = UNSET, dirty = true; request a frame
PK.bind.schedule(cell, ms)   // invalidate(cell) at now + ms (one timer per cell, earliest wins)
PK.bind.read(src)            // watch if needed, return current value (local: from the local store)
PK.bind.getLocal(name), PK.bind.setLocal(name, v)   // setLocal marks bindings of 'local:<name>' dirty
```

### 7.7 Tick algorithm

Triggered by `adapter.onData` (`fromData = true`), by local-var changes, by timers, and by a fallback interval equal to the poll interval (`fromData = false`).

```
if document.hidden: return
rev = adapter.revision()
if !fromData and rev == lastRev and no binding is dirty and no timer is due: return
if rev != lastRev:
  for each slot (non-local, non-const):
    v = adapter.read(slot.src)
    if !same(v, slot.value): slot.value = v; mark slot.bindings dirty
  lastRev = rev; emit pk:data
requestFrame(apply)

apply():
  for each dirty binding b:
    if b.cell.suppressUntil > now: keep dirty; schedule(b.cell, suppressUntil - now); continue
    if b.spec.everyMs and now < b.dueAt: keep dirty; schedule at dueAt; continue
    out = evaluate(b.spec, reader)
    b.dirty = false; b.dueAt = now + b.spec.everyMs
    if !same(out, b.last): b.last = out; safeCall(widget.update, b.cell, b.role, out, api)
```

`same(a, b)`: `a === b`, or both `NaN`. Every widget call is wrapped in `try/catch`; an exception is logged once per cell and the cell gets `pk-stale`.

**`enabled` binding.** For a control with `enabled`, `attach` adds a binding with role `enabled` that the engine handles itself (never passed to the widget): result `false` → `cell.disabled = true` and class `pk-disabled`; anything else → enabled.

### 7.8 Frames

`requestFrame(fn)` coalesces: at most one `requestAnimationFrame` pending; falls back to `setTimeout(fn, 16)` if `requestAnimationFrame` is missing.

### 7.9 Local variables

`local:` sources live in a map inside `pk-bind.js`, start `undefined` and are not persisted. `setLocal` updates the map and marks dependent bindings dirty, then requests a frame. `const:` sources evaluate to their value and never change.

## 8. Resolver (`pk-resolve.js`, DOM-free)

### 8.1 API

```javascript
PK.resolve(packId, registry)   // → { pack: ResolvedPack | null, problems: [Problem] }
```

`registry` defaults to `PK.registry`; tools pass their own. The resolver never throws; every failure becomes a problem. If any `error` problem prevents building a usable pack (unknown pack id, V-001 on the pack), `pack` is `null`.

### 8.2 Steps

1. Load raw objects: pack, vendor (`extends`), libraries (`uses`). Check `format`/`version` (V-001), ids (V-003), catalog consistency (V-005–V-008).
2. Start from `ENGINE_DEFAULTS = { adapter: 'aao', settingsDefaults: {}, theme: { vars: {}, groups: {}, styles: {} }, templates: {}, maps: {}, formats: {}, conventions: {} }`.
3. Apply vendor, then each library in `uses` order, then the pack, using the merge table in PACK-FORMAT §16. Record each library control under `<alias>.<id>` with `origin: 'library:<id>'`.
4. Apply `overrides` with `PK.util.merge1` (V-017 for unknown targets).
5. Resolve `scriptGroup`: pack `conventions.scriptGroup`, else vendor's; substitute `{vendor}`, `{aircraft}`, `{pack}`.
6. For each control (pack and library): expand templates (PACK-FORMAT §12), apply widget `defaults`, apply common defaults (`label` = id, `group` from id prefix, `span` 1), check fields against the widget `fields` (V-010, V-012, V-013, V-018), normalise state specs (`state`, `value`, `enabled`, `rows[].value`, `rows[].value2`) with `PK.transform.normalizeSpec`, parse actions (`action`, `release`, `dec`, `inc`, `positions[].action`) with `PK.expr.parseAction`. For `custom` controls, specs returned by the behavior's `bindings(ctl)` are normalised at attach time instead (the validator calls `bindings` to check them). Collect problems with `path` such as `controls.lts_master.state`.
7. Add the built-in `empty` control.
8. Normalise pages: defaults, `cols` (V-044), tokens (V-041, V-042), widths (V-043, V-015), placed cells (V-045), `noEdit` forced for `placed`. Build `pageAlias` (`legacyId → page id`) from `pages[].legacyIds` (V-047).
9. Check scripts (V-031, V-060–V-062) and adapter capabilities (V-022, V-032) using `PK.adapters` metadata if loaded, else a static table of known adapters' `kinds`.
10. Compute `controlOrder` (pack controls in definition order, then library controls) and `groups` (ordered unique list) for the picker.

### 8.3 ResolvedPack

```javascript
{
  id, title, vendor: { id, title }, adapter, storageKey, scriptGroup,
  settingsDefaults, theme: { vars, groups, styles }, maps, formats,
  controls: { '<token>': ResolvedControl }, controlOrder: [token], groups: [group],
  pages: [ResolvedPage], pageById: { id: ResolvedPage }, pageAlias: { legacyId: pageId },
  scripts: { LABEL: rpn }, scriptsXml, mock, legacyIds
}
ResolvedControl = { id, token, type, label, group, style, span, hint, tags, hidden, confirm, everyMs, origin, ...type fields (normalised) }
ResolvedPage    = { id, label, navLabel, kind, cols, rows, layout: [token], cells: [{ token, col, row, colSpan, rowSpan }], noEdit, hiddenByDefault, scroll, legacyIds }
```

`PK.resolvePageId(pack, id)` returns `id` when `pack.pageById[id]` exists, else `pack.pageAlias[id]`, else `null`.

The resolved pack is treated as read-only after resolve.

## 9. Input (`pk-input.js`)

One set of listeners on the grid element; no listeners on cells.

```javascript
PK.input.init(gridEl, cellAt)   // cellAt(index) → Cell
PK.input.suspend(flag)          // true while edit mode is active
```

Rules (iOS 12):

1. Listen to `touchstart`, `touchmove`, `touchend`, `touchcancel` with `{ passive: true }`, and `mousedown`, `mouseup`, `click`.
2. On `touchstart`: find the closest element with `data-pk-part` inside a `.pk-cell`; record `{ cell, part, x, y, t, moved: false }`; add `pk-pressed` to the part; emit `pk:activity`. If the widget declares `press`, call it (subject to the confirm guard, rule 6).
3. On `touchmove`: if the finger moved more than 10 px, mark `moved`, remove `pk-pressed`, and call `release` if a press is active. Do not `preventDefault` (scrolling must keep working in scrollable mode).
4. On `touchend`: remove `pk-pressed`; call `release` if pressed; if not `moved` and the duration is under 800 ms, run the tap. Record `lastTouchEnd = now`.
5. On `click`: ignore if `now - lastTouchEnd < 800` (the synthetic click after a touch). Otherwise (mouse) run the tap for the clicked part. `mousedown`/`mouseup` drive `press`/`release` for mouse users.
6. **Confirm guard** (`ctl.confirm`): the first tap adds `pk-armed` and a `<span class="pk-confirm">` with the prompt, and sets a 3 s disarm timer; a second tap within 3 s disarms and proceeds. For press-driven widgets, `press` is swallowed while not armed and the release counts as the arming tap.
7. **Tap:** add `pk-flash` for 150 ms (unless `showTouchFlash` is false), then `widget.tap(cell, part, api)` or, if the widget has no `tap`, `PK.actions.run(ctl.action, ctx)`.
8. While `suspend(true)`, every handler returns immediately (edit mode owns input).
9. Cells with `cell.disabled` (the `enabled` binding is `false`) ignore press and tap; `pk-pressed` is not added.

## 10. Actions (`pk-actions.js`)

```javascript
PK.actions.init(adapter)
PK.actions.run(action, ctx)   // action: string | object | array | canonical; ctx = { cell }
```

1. Canonicalise with `PK.expr.parseAction` if needed (cached per cell + field at resolve time; runtime parsing only for behavior-provided actions).
2. Dispatch by `op`:
   - `script`, `k`, `rpn`: `adapter.run(action)`; if refused, `PK.log.warn`.
   - `set`: `local:` → `PK.bind.setLocal`; else `adapter.run`.
   - `adjust`, `cycle`: compute the next value with `PK.bind.read(target)` (PACK-FORMAT §10.2), then dispatch a `set`. Targets are watched when the control is attached (extra bindings with role `target`, never passed to the widget), so a first tap does not read an unregistered `undefined`. If a sim target is still `undefined` at tap time (no data yet), the action is skipped and logged rather than writing a guessed value; `local:` targets are exempt and treat `undefined` as missing. Bounce direction is stored in `ctx.cell.local['dir:' + target.key]`. `cycle` with `onUnknown: 'skip'` and an unknown current value does nothing.
   - `switch`: `v = PK.transform.evaluate(on, reader)` using the binding engine's reader; its eager sources are watched when the control is attached (the resolver lists them as extra bindings with role `switch`, never passed to the widget), so the value is current at tap time. `key = String(v)` normalised as PACK-FORMAT §9.1; run `cases[key]` if present (`null` = nothing), else `def`.
   - `behavior`: `PK.registry.behaviors[id][method](args, api)`.
   - `seq`: run items in order; `gapMs > 0` uses `setTimeout` between items.
3. Wrap everything in `try/catch`; never throw.

The `api` object given to widgets and behaviors is built once in `pk-boot.js` from `PK.actions`, `PK.bind`, `PK.transform` and `PK.util` (members in [WIDGETS.md](WIDGETS.md) §12).

## 11. Layout and theme (`pk-layout.js`)

### 11.1 API

```javascript
PK.layout.render(pack, page, override)   // → { html, cells: [{ index, token, ctl, widget }] } — pure string building
PK.layout.mount(gridEl, rendered)        // innerHTML once; then fill cell.el and cell.refs → Cell[]
PK.layout.applyCols(gridEl, cols)        // inline grid-template-columns: repeat(cols, minmax(0, 1fr))
PK.layout.fit()                          // port of legacy fitGrid(), using #pk-main / #pk-grid and the edit dock padding
PK.layout.applyTheme(pack)               // one <style id="pk-theme"> element
```

`render` for `grid` pages: tokens from `override.layout` when present and the page is editable, else `page.layout`; `cols` from `override.cols` or `page.cols`. Each token → cell root (WIDGETS §1) + `widget.render(ctl, cx)`. Unknown tokens → `empty` markup with `pk-unknown`.

For `placed` pages: the grid gets `grid-template-rows: repeat(rows, auto)`; each cell root gets inline `grid-column: <col> / span <colSpan>; grid-row: <row> / span <rowSpan>` (with `-ms-`/`-webkit-` prefixes not needed on iOS 12).

`mount`: `grid.innerHTML = html`, then `cells[i].el = grid.children[i]` and `cells[i].refs = widget.refs ? widget.refs(el, ctl) : {}`.

### 11.2 Theme variables

`panelkit.css` defines defaults on `:root`; `theme.vars` may override only these:

| Variable | Use |
|----------|-----|
| `--pk-bg` | Page background |
| `--pk-fg` | Default text |
| `--pk-cell-bg`, `--pk-cell-fg`, `--pk-cell-border` | Default cell colours |
| `--pk-accent` | Active tab, focus, edit highlights |
| `--pk-on` | Default lit colour for indicators and lamps |
| `--pk-stale` | Colour for stale values |
| `--pk-radius` | Cell corner radius |
| `--pk-font` | Font stack (overridden by the settings font choice) |
| `--pk-nav-bg`, `--pk-nav-fg` | Nav bar |

Settings own their own variables (§12) and are not themeable.

### 11.3 Theme CSS generation

`applyTheme` builds one string and sets it as the text of `<style id="pk-theme">`:

```css
:root{--pk-bg:#0b0f12;--pk-accent:#3fb950}
.pk-g-lts{--pk-g-bg:#2b2410;--pk-g-fg:#ffd27a;--pk-g-border:#6b5320}
.pk-s-int{--pk-g-bg:#33290f}
```

All group rules are written before all style rules, so a style overrides its cell's group colours (equal specificity, later wins). Group/style keys map `bg → --pk-g-bg`, `fg → --pk-g-fg`, `border → --pk-g-border`, `on → --pk-g-on`. Cell CSS uses `var(--pk-g-bg, var(--pk-cell-bg))` and so on. Values were checked by the resolver (V-051); `applyTheme` additionally drops any value containing `; { } < >`.

## 12. Settings (`pk-settings.js`)

### 12.1 Schema

Keys and ranges are identical to legacy `common/panel-settings.js` so stored settings keep working (G7).

| Key | Type | Range | Default | Effect |
|-----|------|-------|---------|--------|
| `pollIntervalMs` | int | 50–2000 | 100 | `adapter.setPollInterval` |
| `panelBtnFontPx` | int | 10–40 | 18 | `--pk-btn-font` |
| `panelGridRowMinPx` | int | 56–220 | 105 | `--pk-row-min` |
| `panelGridGapPx` | int | 4–32 | 14 | `--pk-gap-y` |
| `panelGridGapXPx` | int | 4–32 | 10 | `--pk-gap-x` |
| `panelRowAlign` | enum | `top`, `center`, `bottom` | `top` | classes `pk-row-align-*` |
| `navFontPx` | int | 10–22 | 13 | `--pk-nav-font` |
| `navMinHPx` | int | 32–64 | 42 | `--pk-nav-min-h` |
| `uiFontIndex` | int | 0–3 | 0 | `--pk-font` from the four legacy font stacks |
| `uiBrightnessPct` | int | 70–115 | 100 | `--pk-ui-brightness` overlay (never `body.style.filter`) |
| `dotScalePct` | int | 70–130 | 100 | `--pk-dot-scale` |
| `gaugeValScalePct` | int | 85–130 | 100 | `--pk-val-mult` |
| `reduceMotion` | bool | | false | class `pk-reduce-motion` |
| `showTouchFlash` | bool | | true | input flash on/off |
| `panelScrollable` | bool | | false | class `pk-scrollable`; `fit()` disabled |
| `navPages` | object | `{ <pageId>: bool }` | `true` except `hiddenByDefault` pages | visible tabs; unknown keys dropped, missing keys take the default |
| `autoHomePage` | string | page id or `''` | `''` | §14; unknown id → `''` |
| `autoHomeIdleSec` | int | 5–300 | 20 | §14 |

Defaults come from engine defaults → vendor `settingsDefaults` → pack `settingsDefaults` (V-080 / V-081 at validation).

Page ids in stored settings pass through `PK.resolvePageId(pack, id)` (§8.3): a page `id` is returned as is, an entry of some page's `legacyIds` returns that page's `id`, anything else is unknown. This applies to `navPages` keys, `autoHomePage`, the `?page=` query, `<storageKey>:last-page` reads and layout import keys (same rule as legacy `aliases` in `common/panel-settings.js`).

### 12.2 API

```javascript
PK.settings.SCHEMA                 // array of { key, type, min, max, step, options, label, section }
PK.settings.load(pack)             // → settings object (defaults merged with stored, clamped)
PK.settings.save(partial)          // merge, clamp, store, apply, emit pk:settings
PK.settings.apply(settings)        // CSS vars and root classes
PK.settings.get()                  // current object
PK.settings.renderForm(container)  // hub only: builds the form from SCHEMA (no hand-written fields)
```

Stored under `<storageKey>` as JSON, same shape as legacy.

## 13. Nav (`pk-nav.js`)

```javascript
PK.nav.render(navEl, pack, currentPageId)
```

Contract (same order as legacy, `pk-` prefixed):

```
a.pk-tab[data-pk-nav="<pageId>"]  (one per visible page, .pk-active on current)
button.pk-nav-tool.pk-nav-home.pk-nav-first   (⌂, .pk-on when this page is the auto-home page)
button.pk-nav-tool.pk-nav-edit                (EDIT / DONE; disabled look on noEdit pages)
a.pk-nav-gear                                 (⚙ → hub.html?pack=<id>#settings, contains span.pk-status)
```

- Tab `href`: `panel.html?pack=<id>&page=<pageId>`.
- In-app navigation (port of `common/nav-inapp.js`): capture `click` and, on iOS, `touchend` on `.pk-nav a` and set `location.href` programmatically so standalone web apps stay in-app.
- Re-render on `pk:settings` (tab visibility, home highlight).

## 14. Auto-home (`pk-autohome.js`)

Port of `panel-nav.js` behaviour:

- ⌂ tap toggles `autoHomePage` between this page and `''`.
- When `autoHomePage` is set and differs from the current page: a 1 s interval checks `now - lastActivity ≥ autoHomeIdleSec * 1000` and navigates to the home page. Activity = `pk:activity`, `touchstart`, `mousedown`, `mousemove`, `keydown`, `wheel`, `scroll` (passive listeners).
- Paused while edit mode is active.
- No interval when no home page is set or this is the home page.
- Writes `<storageKey>:last-page` on every page load.

## 15. Connection status (`pk-status.js`)

Polls `adapter.status()` every second; sets `span.pk-status` class `pk-status-<state>` (`connecting`, `live`, `stale`, `offline`) and emits `pk:status` on change. CSS: small dot on the gear; `live` uses `--pk-on`, `stale` amber, `offline` red, `connecting` grey. No text, no layout shift.

## 16. Edit mode (`pk-edit.js`, lazy)

Port of `common/panel-edit.js` with the same UX (Move/Delete modes, drag and drop with touch and mouse, picker, undo 40, palette, cols/rows steppers, JSON sheet, reset). Differences:

| Legacy | PanelKit |
|--------|----------|
| Rebuild via `SSPPanel` + re-bind polls | `PK.bind.detach()` → `PK.layout.render` + `mount` → `PK.bind.attach()` |
| Capture-phase click blocker | `PK.input.suspend(true)` |
| Picker previews from markup with ids/onclick stripped | `widget.render(ctl, { inert: true })` |
| Groups from token prefix | `ctl.group`; labels from `ctl.label`; search over token, label, `tags`, `hint` |
| `hidden` not supported | Controls with `hidden: true` are not offered |
| `bksq-layout(s)` export | `panelkit-layout(s)` export; legacy formats accepted on import (PACK-FORMAT §17) |
| Library controls n/a | Shown under their group with the library title as a chip |

Refuses `noEdit` pages with a notice. Saves to `<storageKey>:layout:<pageId>` on every change, format `{ layout: [token], cols }`.

## 17. Storage (`pk-store.js`)

```javascript
PK.store.get(key)          // parsed JSON or null; never throws
PK.store.set(key, value)   // JSON.stringify; returns false on quota/private-mode errors
PK.store.remove(key)
PK.store.keys = {
  settings: function (pack) { return pack.storageKey; },
  layout:   function (pack, pageId) { return pack.storageKey + ':layout:' + pageId; },
  recent:   function (pack) { return pack.storageKey + ':edit-recent'; },
  lastPage: function (pack) { return pack.storageKey + ':last-page'; },
  lastPack: function () { return 'pk:last-pack'; }
};
```

On first run, if `pk:last-pack` is absent and legacy `bksq-panels-last-aircraft` exists, map it through catalog `legacyIds` and store the pack id.

## 18. Boot (`pk-boot.js`)

`PK.boot()` runs at the end of `<body>`:

1. `q = PK.loader.query`, `entry = PK.loader.entry`. If the pack did not register → error page (§4.3).
2. `r = PK.resolve(entry.id)`; emit `pk:resolved`. If `r.pack` is null → error page listing the first five problems. If `q.debug`, show the problems overlay (§20).
3. `settings = PK.settings.load(pack)`; `PK.settings.apply(settings)`; `PK.layout.applyTheme(pack)`.
4. `page = pack.pageById[PK.resolvePageId(pack, q.page)]` or the first visible page (`navPages`); unknown page → first page. Store `page.id` (never the requested alias) under `keys.lastPage`.
5. `PK.nav.render(navEl, pack, page.id)`.
6. `override = page.noEdit ? null : PK.store.get(keys.layout(pack, page.id))`.
7. `rendered = PK.layout.render(pack, page, override)`; `cells = PK.layout.mount(grid, rendered)`; `applyCols`; `fit()` (unless scrollable); emit `pk:rendered`.
8. `adapter = PK.adapters.create(q.adapter || pack.adapter, { pollMs: settings.pollIntervalMs, mock: pack.mock })`.
9. `PK.bind.init(adapter)`; `PK.actions.init(adapter)`; `PK.bind.attach(cells)`; `PK.input.init(grid, cellAt)`.
10. `adapter.onData(function () { PK.bind.tick(true); })`; `adapter.start(settings.pollIntervalMs)`; fallback tick interval.
11. `PK.autohome.start(pack, page)`; `PK.status.start(adapter)`.
12. If `q.edit` and the page is editable: `PK.boot.enterEdit()` (lazy-loads `panelkit/chrome/pk-edit.js` by appending a script element, then `PK.edit.init(...)`).
13. On `resize` / `orientationchange`: `fit()` (debounced 150 ms).

## 19. Hub (`hub.html`)

- Lists catalog packs grouped by vendor (hidden packs omitted); remembers the choice in `pk:last-pack`.
- For the selected pack: the page list (links to `panel.html`), the settings form from `PK.settings.renderForm`, and the auto-home section.
- The nav bar is the same component as on panel pages (`PK.nav.render` in hub mode: tabs link to the pack's pages; ⌂ scrolls to the auto-home settings; EDIT opens the last page with `&edit=1`, skipping `noEdit` pages).
- Loads only `pk-core`, `catalog`, the selected pack's data files (for page names and settings defaults), `pk-resolve`, `pk-store`, `pk-settings`, `pk-nav`. No adapter.

## 20. Diagnostics

- `?debug=1`: mirrors `PK.log` to the console and shows a collapsible overlay with resolver problems and the last 50 log entries.
- Unknown tokens render with `pk-unknown` (dashed outline in debug mode only).
- `PK.diag()` (console) returns `{ pack, page, adapterStatus, slots: n, bindings: n, lastTickMs }`.

## 21. Node tooling infrastructure

`tools/lib/pk-node.js` exports:

```javascript
createSandbox()                 // vm context with window === context, console, no DOM
loadEngine(ctx, { runtime })    // runs DOM-free modules: pk-core, pk-expr, pk-transform, pk-resolve, pk-widgets (+ mock adapter)
loadCatalog(ctx)                // runs packs/catalog.js and every vendor/library/pack/behaviors file it lists
```

`tools/pk-test.js` discovers `panelkit/tests/*.test.js`. Each test file calls `test(name, fn)` and `assert.*` (Node's `assert`); the runner prints `ok`/`not ok` per test and exits non-zero on failure. DOM-dependent tests use `panelkit/tests/helpers/dom-stub.js` (a minimal element tree with `classList`, `children`, `getElementsByClassName`, `textContent`, `innerHTML` parsing for `pk-*` markup only).

## 22. iOS 12 checklist (every runtime file)

- ES5 syntax only; no `const`/`let`, arrows, template literals, classes, spread, destructuring, `for…of`, `async`.
- No `Array.prototype.includes`, `Object.assign`, `Object.values/entries`, `String.prototype.startsWith/endsWith/padStart`, `Element.closest`, `NodeList.forEach` (write helpers).
- No Pointer Events, no HTML5 drag and drop, no flexbox `gap`, no `position: sticky` reliance, no CSS `:is()`/`:where()`.
- Inputs in the hub and JSON sheet use 16 px font (prevents zoom).
- `touchmove` listeners that call `preventDefault` MUST be registered with `{ passive: false }` (edit mode drag only).
- Brightness uses the overlay variable, never `body.style.filter`.

## 23. Public API summary

| Namespace | Members |
|-----------|---------|
| `PK` | `version`, `FORMAT_VERSION`, `boot`, `resolve`, `resolvePageId`, `parseQuery`, `define*`, `registry`, `Problem`, `diag` |
| `PK.util` | §5.1 |
| `PK.log`, `PK.events` | §5.2, §5.3 |
| `PK.expr` | `parseSource`, `parseAction`, `sourceKey`, `actionKey` |
| `PK.transform` | `normalizeSpec`, `evaluate`, `applyMap`, `format`, `sources` |
| `PK.widgets`, `PK.adapters` | `define`, `get`/`create`, `types` |
| `PK.bind` | `init`, `attach`, `detach`, `tick`, `invalidate`, `schedule`, `read`, `getLocal`, `setLocal` |
| `PK.actions` | `init`, `run` |
| `PK.input` | `init`, `suspend` |
| `PK.layout` | `render`, `mount`, `applyCols`, `fit`, `applyTheme` |
| `PK.settings` | `SCHEMA`, `load`, `save`, `apply`, `get`, `renderForm` |
| `PK.nav`, `PK.autohome`, `PK.status` | `render`; `start`; `start` |
| `PK.edit` (lazy) | `init`, `exit`, `active`, `mode` |
| `PK.store` | `get`, `set`, `remove`, `keys` |
| `PK.loader` | `entry`, `query`, `hub` |
