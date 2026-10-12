# AGENTS.md — BKSQ AAO panels

Entry point for AI coding agents working in this repository.

## Goals

- Touch web panels for Black Square aircraft via **AxisAndOhs (AAO)** and MSFS.
- **iOS 12.5 / iPad mini 2** must remain usable (ES5 JavaScript, conservative DOM/CSS).
- Declarative layouts in `config/panels/*.js`; runtime polls sim state and updates lamps/gauges.
- On-device layout editing (edit mode) and a consistent bottom bar on every page, hub included.

## Hard constraints

1. **Keep all documentation up to date — in the same change, every time.** Any code, layout, button, setting, storage, format or behaviour change must update every doc it affects before you finish. Use the map below; if unsure, grep the docs for the thing you changed. Stale docs count as an unfinished task.
2. **ES5 only** in all project `.js` (except vendor `AaoWebApi.js` from AAO). Run `node tools/check-es5.js` before finishing.
3. **Do not rearrange shipped layouts** to “fix” UX — report issues in `docs/LAYOUT-AUDIT.md` via `tools/audit-layouts.js`.
4. Every `SSP_*` label in buttons must exist in the aircraft `bksq-*-scripts.xml`.
5. `getLVar` / `getAVar` are **cache reads**; first read registers vars on the AAO poll URL. Avoid registering fallback A-vars every tick.
6. Never commit `ref/` (gitignored local AnalogTBM copies).
7. **PanelKit** (the planned generic engine) is built only by following `docs/design/panelkit/IMPLEMENTATION-PLAN.md`: one work package per change, the spec is normative, and legacy files (`common/`, `aircraft/`, `index.html`) change only where the work package lists them. Switch-over (WP-28) and legacy removal (WP-29) need explicit user approval.

## Documentation map (what to update)

| If you change… | Update |
|----------------|--------|
| Anything a pilot sees or does (pages, buttons, settings, nav, edit mode, auto-home) | `docs/USER-GUIDE.md`, aircraft `README.md` |
| Files, boot order, storage keys, JSON formats, authoring steps, iOS rules | `docs/DEVELOPER-GUIDE.md` |
| Public APIs, poll kinds, DOM/CSS contracts, module ownership, boot sequence | `docs/ai/ARCHITECTURE.md`, `docs/ai/DESIGN-DETAIL.md` |
| Concepts, goals, performance budget | `docs/ai/CONCEPTS-AND-GOALS.md` |
| Layouts or button dictionaries | run `node tools/audit-layouts.js` (regenerates `docs/LAYOUT-AUDIT.md`) |
| Script labels / sim bindings | aircraft `CONFIG.md` |
| Quick start or doc links | `README.md` |
| Agent rules or constraints | this file |
| PanelKit design or a PanelKit work package | the docs the work package lists, and any `docs/design/panelkit/*` section it contradicts (`PACK-FORMAT.md` and `schemas/` must agree) |
| Anything user-visible | `CHANGELOG.txt` (current version section) |

## Invariants

- Events: `(>K:<eventGroup>-<SSP_LABEL>)` where `eventGroup` is in `BKSQ_AIRCRAFT.eventGroup`.
- Panel registry: `window.SSP_PANELS[pageId]` built by `SSPPanel` / `SSP_PANEL_FACTORY`.
- One page id everywhere: `aircraft.js` page `id` = `SSPRuntime.boot()` argument = `SSP_PANELS` key = `data-panel-nav`. A renamed id goes in the page's `aliases`. `tools/audit-layouts.js` flags mismatches.
- Boot: `SSPRuntime.boot('pageId')` after scripts load; panel pages load `panel-nav.js` after `panel-runtime.js`.
- Settings: `localStorage` key from `BKSQ_AIRCRAFT.storageKey`; poll ms via `SSP_GET_POLL_MS()`. Other keys are `<storageKey>:layout:<pageId>`, `:edit-recent`, `:last-page`.
- Nav bar (panel pages and hub): page tabs → ⌂ → EDIT → gear. Keep them identical; the hub gets its tools from `SSP_NAV_TOOLS.mountHub()`.
- CSS-positioned pages set `layoutEditDisabled: true` (panel) and `noEdit: true` (`aircraft.js` page entry).

## Where to look

| Topic | Path |
|-------|------|
| Human install/use | `docs/USER-GUIDE.md` |
| Authoring, storage keys, JSON formats | `docs/DEVELOPER-GUIDE.md` |
| HLD / boot / data flow | `docs/ai/ARCHITECTURE.md` |
| APIs, poll kinds, IDs, nav contract | `docs/ai/DESIGN-DETAIL.md` |
| Glossary, perf budget | `docs/ai/CONCEPTS-AND-GOALS.md` |
| Layout findings | `docs/LAYOUT-AUDIT.md` |
| Edit mode | `common/panel-edit.js` |
| Nav tools, auto-home | `common/panel-nav.js` |
| PanelKit (planned generic engine) | `docs/design/panelkit/README.md`, then `IMPLEMENTATION-PLAN.md` |

## What never to do

- Add `const`/`let`, arrows, templates, `async`/`await`, optional chaining in app code.
- Use Pointer Events, HTML5 drag-and-drop or flexbox `gap` (unsupported on iOS 12 Safari).
- Restore `@media` rules that change default `.grid` column count at 900px/600px (breaks 8-wide layouts on iPad mini portrait).
- Set `document.body.style.filter` for brightness (use `--ssp-ui-brightness` overlay pattern in `panel-settings.js`).
- Finish a change without updating the docs it affects.
- Force-push `main` or rewrite git history unless explicitly requested.

## Verification

```text
node tools/check-es5.js
node tools/audit-layouts.js
node aircraft/tbm850/tools/check-manifest.js
node aircraft/starship/tools/check-manifest.js
```

Then re-read the documentation map above and confirm each affected doc is updated.
