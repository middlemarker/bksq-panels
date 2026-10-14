# PanelKit — implementation plan

Work packages (WPs) for building PanelKit. Each WP is sized for one agent session and one commit. Read [README.md](README.md) and [HLD.md](HLD.md) first; the WP lists the other sections you need.

## 1. Rules for implementing agents

1. **One WP at a time.** Do exactly one WP per change. Commit message: `PanelKit WP-NN: <title>`. Do not start a WP whose dependencies are not merged.
2. **The spec is normative.** Read every section listed under *Spec* before writing code. Names, file paths, CSS classes, storage keys and rule ids MUST match the spec exactly.
3. **Do not guess.** If the spec is ambiguous, contradictory or impossible, stop that part and record a *Spec question* in the WP report (§5). Fixing the spec is a separate documentation change; a change to a decision also needs an entry in [DECISIONS.md](DECISIONS.md).
4. **Do not touch legacy files** (`common/`, `aircraft/`, `index.html`, `tools/audit-layouts.js`) unless the WP lists them under *Files*. Legacy remains the shipped product until WP-28.
5. **ES5 only**, and the iOS 12 checklist in [DETAILED-DESIGN.md](DETAILED-DESIGN.md) §22. Run `node tools/check-es5.js`.
6. **No dependencies.** No npm packages, no build step, no transpiler. Node tools use only Node built-ins.
7. **DOM-free modules stay DOM-free** (DETAILED-DESIGN §1): no `document`, `window.location`, `localStorage` or timers at load time or in public functions.
8. **Never throw to the UI.** Runtime failures go to `PK.log`; the resolver and validator report problems instead of throwing.
9. **Tests ship with the code.** Every WP adds `panelkit/tests/*.test.js` covering its acceptance criteria. Use the fake clock (`PK.util.now`) and fake timers from the test helpers; tests MUST NOT sleep.
10. **No public API beyond the spec.** Internal helpers are fine; anything other modules call MUST be in DETAILED-DESIGN §23 (add it there in the same change if a WP requires it).
11. **Keep the docs current** (`AGENTS.md` rule 1). Each WP lists the docs it must update; also update these design docs if the implementation reveals a needed clarification.
12. **Git hygiene.** Never push, force-push or rewrite history unless the user asks.

## 2. WP format

| Field | Meaning |
|-------|---------|
| Depends | WPs that must be merged first |
| Files | Files to create (**new**) or change (**edit**). Nothing else may change except docs listed under *Docs* |
| Spec | Sections to read; they define the behaviour |
| Tasks | What to build |
| Acceptance | Checks a reviewer runs; all must pass |
| Tests | Minimum test coverage |
| Docs | Docs to update in the same change |

## 3. Dependency graph

```
WP-00 ─ WP-01 ─ WP-02 ─┬─ WP-03 ─ WP-04 ─ WP-05 ─ WP-06
                       │                    │
                       │        WP-07 ─ WP-08
                       │          │
                       └──────── WP-09 (needs WP-04, WP-07)
                                   │
                     WP-10 (needs WP-05, WP-09) ─ WP-11 ─ WP-12 ─ WP-13
                                                                    │
            WP-14 ─ WP-15 ─ WP-16 ─ WP-17 ─ WP-18 ─ WP-19 ──────────┘ (all need WP-13)
                                                    │
            WP-20 (needs WP-06) · WP-21 (needs WP-06) · WP-22 (needs WP-06) · WP-23 (needs WP-13)
                                                    │
            WP-24 ─ WP-25 ─ WP-26 ─ WP-27 ─ WP-28 (user approval) ─ WP-29 (user approval)
```

## 4. Work packages

### Phase 0 — foundations

#### WP-00 Test runner and Node sandbox

- **Depends:** —
- **Files:** new `tools/pk-test.js`, `tools/lib/pk-node.js`, `panelkit/tests/helpers/dom-stub.js`, `panelkit/tests/helpers/fake-timers.js`, `panelkit/tests/runner.test.js`
- **Spec:** DETAILED-DESIGN §21; ADR-012
- **Tasks:**
  1. `pk-test.js`: discover `panelkit/tests/*.test.js` (sorted), run each in its own `vm` context with globals `test(name, fn)`, `assert` (Node `assert`), `require` limited to `./helpers/*` and `../../tools/lib/pk-node`. Print `ok N - name` / `not ok N - name` + error, a summary line, exit 1 on any failure. Optional argument: substring filter on file name.
  2. `pk-node.js`: `createSandbox()`, `loadEngine(ctx, opts)`, `loadCatalog(ctx)` as specified. `loadEngine` loads the module list in fixed order and skips files that do not exist yet only when `opts.partial` is true (used until WP-13).
  3. `dom-stub.js`: minimal element tree (`createElement`, `appendChild`, `removeChild`, `children`, `parentNode`, `classList`, `setAttribute`/`getAttribute`, `textContent`, `innerHTML` parser for engine markup only, `getElementsByClassName`, `addEventListener`/`dispatch`). Counts DOM writes in `stub.writes` (class changes, text changes, innerHTML sets).
  4. `fake-timers.js`: `install(ctx)` replaces `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` and `PK.util.now` (when present) with a manual clock; `tick(ms)` runs due callbacks in order.
- **Acceptance:** `node tools/pk-test.js` passes; a deliberately failing test (local only, not committed) makes it exit 1; `node tools/check-es5.js` passes.
- **Tests:** runner self-test (passing test, assertion counting, filter argument); dom-stub write counting; fake timers ordering.
- **Docs:** `docs/DEVELOPER-GUIDE.md` (tools table: `pk-test.js`).

#### WP-01 ES5 guard for PanelKit code

- **Depends:** WP-00
- **Files:** edit `tools/check-es5.js`; new `panelkit/tests/check-es5.test.js`
- **Spec:** DETAILED-DESIGN §2, §22; `AGENTS.md` constraint 2
- **Tasks:**
  1. Make `check-es5.js` usable as a module (`module.exports = { scanText: fn }`, CLI only when `require.main === module`).
  2. For files under `panelkit/`, `packs/` and `tools/pk-*.js` / `tools/lib/`, also flag: `class ` declarations, `for (… of …)`, `.includes(`, `.startsWith(`, `.endsWith(`, `.padStart(`, `.padEnd(`, `Object.values(`, `Object.entries(`, `.forEach(` on `querySelectorAll` results (pattern `querySelectorAll(...).forEach`), destructuring in `var` (`var {` / `var [`). Legacy files keep the current rule set.
- **Acceptance:** repository still passes; each new pattern is flagged in a fixture string; legacy files unaffected.
- **Tests:** `scanText` positive and negative cases for every pattern, including path scoping.
- **Docs:** `docs/DEVELOPER-GUIDE.md` (what the ES5 check covers); `AGENTS.md` verification list unchanged.

### Phase 1 — core (all DOM-free)

#### WP-02 Core module

- **Depends:** WP-01
- **Files:** new `panelkit/core/pk-core.js`, `panelkit/tests/core.test.js`
- **Spec:** DETAILED-DESIGN §5 (all), §23; PACK-FORMAT §1, §2
- **Tasks:** `PK` namespace and version constants; `PK.util` exactly per §5.1; `PK.log` ring buffer; `PK.events` with listener isolation; registries and `define*` (§5.4) including V-004 on duplicates; `PK.widgets` and `PK.adapters` registries (definition storage only); `PK.parseQuery`; `PK.Problem(rule, level, path, message)` constructor/factory.
- **Acceptance:** module loads in `createSandbox()` with no DOM; all §5.1 functions behave as specified.
- **Tests:** every util function (edge cases: `escHtml` on all five characters, `null`; `merge1` nested plain objects vs arrays; `looseEq('1', 1)`, `looseEq('a', 'a')`; `toBool`/`isMissing` table from PACK-FORMAT §8.2); log ring size 200; event listener exception isolation; duplicate define → V-004 logged and first kept; `parseQuery` with encoded values, flags and unknown keys.
- **Docs:** none beyond spec clarifications.

#### WP-03 Expression grammar

- **Depends:** WP-02
- **Files:** new `panelkit/core/pk-expr.js`, `panelkit/tests/expr.test.js`
- **Spec:** DETAILED-DESIGN §6; PACK-FORMAT §8.1, §10.1, §18 (rules V-020 … V-039)
- **Tasks:** `parseSource`, `parseAction`, `sourceKey`, `actionKey` producing the canonical objects of §6.2 / §6.3. Shorthand strings (`script:`, `k:`, `rpn:`, `behavior:`), arrays as `seq`, and every object form including `switch` (with `null` cases) and `cycle.onUnknown`. Return `{ value, problems }`; never throw.
- **Acceptance:** canonical keys contain no spaces around commas; `L:name` defaults to unit `Number`; invalid input yields problems with the right rule ids.
- **Tests:** one test per row of the PACK-FORMAT §8.1 and §10.1 tables; round trip `parse → key → parse`; malformed strings (`A:` without unit, unknown prefix, empty label) → expected rule ids.
- **Docs:** none.

#### WP-04 State specs, maps and formats

- **Depends:** WP-03
- **Files:** new `panelkit/core/pk-transform.js`, `panelkit/tests/transform.test.js`
- **Spec:** DETAILED-DESIGN §7.1–§7.4; PACK-FORMAT §8.2, §9
- **Tasks:** `normalizeSpec` (single producer rule V-026, `fallback` sugar, constant values), `evaluate(spec, reader)`, `applyMap`, `format`, `sources(spec)` returning eager and lazy sources (§7.4).
- **Acceptance:** evaluation follows the numbered algorithm in PACK-FORMAT §8.2 exactly, including transform order and `any`/`all` missing rules.
- **Tests:** each producer (`src`, `first`, `pick`, `when`, `any`, `all`) with missing inputs; transform order (`scale` → `offset` → `clamp` → `round` → `map` → `test` → `not`); every map rule (values, ranges, default, missing); every format option; the three PACK-FORMAT §8.2 examples; lazy sources (`first` registers only the first entry eagerly).
- **Docs:** none.

#### WP-05 Resolver, catalog, widget field tables, demo pack

- **Depends:** WP-04
- **Files:** new `panelkit/core/pk-resolve.js`, `panelkit/runtime/pk-widgets.js` (registry entries with `fields` and `defaults` only; `render`/`update`/`tap` arrive in WP-10/WP-11), `packs/catalog.js`, `packs/examples/demo/pack.js`, `packs/examples/vendor.js`, `panelkit/tests/resolve.test.js`
- **Spec:** DETAILED-DESIGN §8; PACK-FORMAT §3–§7, §11, §12, §14, §16, §20; WIDGETS §2 and each type's field table
- **Tasks:** implement the ten resolver steps of §8.2 and the `ResolvedPack` shape of §8.3, including `pageAlias`, `PK.resolvePageId`, template expansion, library aliasing, `overrides`, script-group substitution and `controlOrder`/`groups`. Declare the field tables and defaults of every built-in widget type in `pk-widgets.js`. Create the catalog with the `examples` vendor and the `examples.demo` pack from PACK-FORMAT §20 (`hidden: true`).
- **Acceptance:** `PK.resolve('examples.demo')` returns a pack with zero `error` problems; resolve never throws on malformed input.
- **Tests:** merge precedence table (PACK-FORMAT §16) case by case; template merge (one level, plain objects only); library control ids `<alias>.<id>`; `overrides` on an unknown target → V-017; `scriptGroup` placeholders; page defaults, `noEdit` forced for `placed`; `legacyIds` → `pageAlias`, duplicate → V-047; `resolvePageId` for id, alias and unknown; fuzz: 50 random mutations of the demo pack never throw.
- **Docs:** none.

#### WP-06 Validator CLI

- **Depends:** WP-05
- **Files:** new `tools/pk-validate.js`, `panelkit/tests/validate.test.js`, `panelkit/tests/fixtures/` (one small pack per rule)
- **Spec:** PACK-FORMAT §18 (all rules), §13 (V-031); DETAILED-DESIGN §21; MIGRATION §7 (`--list`)
- **Tasks:** CLI `node tools/pk-validate.js [packId|--all] [--json] [--list] [--audit]`. Loads the catalog via `pk-node.js`, resolves, adds validator-only rules, prints `LEVEL V-NNN path: message` lines sorted by pack, level, rule. `--list` prints one line per control (`id | type | label | action keys | state sources`). `--audit` adds layout rules (V-041 … V-047) and row-comment checks ported from `tools/audit-layouts.js`. Exit code 1 if any `error`.
- **Acceptance:** `node tools/pk-validate.js --all` exits 0 on the demo pack; every rule id in §18 has a fixture that triggers exactly that rule.
- **Tests:** fixture loop (rule id ↔ fixture); output ordering; exit codes; `--json` shape.
- **Docs:** `docs/DEVELOPER-GUIDE.md` (tools table); `AGENTS.md` verification list (add `node tools/pk-test.js` and `node tools/pk-validate.js --all`).

### Phase 2 — runtime

#### WP-07 Adapter registry use and mock adapter

- **Depends:** WP-02
- **Files:** new `panelkit/adapters/pk-adapter-mock.js`, `panelkit/tests/adapter-conformance.test.js`, `panelkit/tests/mock-adapter.test.js`
- **Spec:** ADAPTERS §1, §3, §5; PACK-FORMAT §15
- **Tasks:** mock adapter with manual ticks, `values`, `rules`, `drift`, seeded PRNG, `_actions` log; conformance suite A1–A9 written as a function `runConformance(name, makeAdapter)` so WP-08 can reuse it.
- **Acceptance:** conformance A1–A9 pass for the mock.
- **Tests:** conformance; rules (`on` action → `set`), drift determinism with a seed.
- **Docs:** none.

#### WP-08 AxisAndOhs adapter

- **Depends:** WP-07
- **Files:** new `panelkit/adapters/pk-adapter-aao.js`, `panelkit/tests/helpers/fake-xhr.js`, `panelkit/tests/aao-adapter.test.js`; edit `common/AaoWebApi.js` (**additive only**: `hasValue`, `getLastOkTime`, `getFailureCount`)
- **Spec:** ADAPTERS §2 (all), §5
- **Tasks:** map sources and actions per §2.1 / §2.2; `read` returns `undefined` until `webApi.hasValue(expr)`; status per §2.3; options §2.4. Add the three `AaoWebApi` methods without changing existing behaviour.
- **Acceptance:** conformance A1–A9 pass against `AaoWebApi` driven by `fake-xhr.js`; legacy pages still work (manual smoke test of one Starship page with AAO or the fake server); `node tools/audit-layouts.js` and both `check-manifest.js` pass.
- **Tests:** conformance; string unit normalisation; `<AAO_URL>` handling; malformed JSON response keeps polling (regression for the v0.4 fix).
- **Docs:** `docs/ai/DESIGN-DETAIL.md` (`AaoWebApi` section: new methods).

#### WP-09 Binding engine

- **Depends:** WP-04, WP-07
- **Files:** new `panelkit/runtime/pk-bind.js`, `panelkit/tests/bind.test.js`
- **Spec:** DETAILED-DESIGN §7.4–§7.9; HLD §10; ADR-006
- **Tasks:** slots per canonical source, bindings per cell role, eager/lazy registration, tick algorithm (§7.7), `everyMs`, frames (§7.8), `schedule`, `invalidate`, local variables (§7.9), `enabled` binding.
- **Acceptance:** an idle tick performs zero DOM writes (dom-stub counter) and zero `evaluate` calls for unchanged slots; lazy sources register only when needed.
- **Tests:** dirty checking; `everyMs` with fake clock; lazy `first` (second source registered only after the first is missing); `schedule` re-evaluates at the right time; detach releases bindings; a throwing widget update is logged and other cells still update.
- **Docs:** none.

#### WP-10 Built-in widgets

- **Depends:** WP-05, WP-09
- **Files:** edit `panelkit/runtime/pk-widgets.js`; new `panelkit/tests/widgets.test.js`
- **Spec:** WIDGETS §1–§11, §13
- **Tasks:** `render`, `refs`, `bindings`, `update`, `tap`, `press`/`release` for `empty`, `label`, `button`, `toggle`, `hold`, `multi`, `readout`, `gauge`, `stepper`, honouring the cell DOM contract (classes, `data-pk-*`, no ids, no inline handlers, escaped labels).
- **Acceptance:** generated markup matches the WIDGETS examples; state classes exactly as listed in §1.
- **Tests:** markup per type (including `pk-s-<style>` and `pk-span-N`); label escaping and `\n`; `toggle` stale state; `hold` latch timing and momentary press/release; `multi` current-position and tap algorithm (wrap, bounce, none, values, optimistic window); `gauge` roles; `stepper` repeat with fake timers.
- **Docs:** none.

#### WP-11 Actions, behaviors and the custom widget

- **Depends:** WP-10
- **Files:** new `panelkit/runtime/pk-actions.js`, `panelkit/tests/actions.test.js`, `panelkit/tests/behaviors.test.js`; edit `panelkit/runtime/pk-widgets.js` (`custom` type)
- **Spec:** DETAILED-DESIGN §10; PACK-FORMAT §10; WIDGETS §12
- **Tasks:** dispatcher for every canonical action; target registration for `adjust`/`cycle`/`switch`; no-data taps ignored and logged; per-control bounce direction; `seq` with `gapMs`; behavior API (`run`, `read`, `getLocal`, `setLocal`, `invalidate`, `schedule`, `now`, `esc`, `format`, `log`); `custom` widget delegating to behaviors.
- **Acceptance:** every PACK-FORMAT §10.2 rule has a test; the WIDGETS §12 temperature example works against the mock adapter.
- **Tests:** each action form via the mock's `_actions`; `adjust` min/max/wrap; `cycle` wrap/bounce/`onUnknown`; `switch` cases, `null` case, default, no data; `seq` timing; a throwing behavior is contained.
- **Docs:** none.

#### WP-12 Input, layout and theme

- **Depends:** WP-11
- **Files:** new `panelkit/runtime/pk-input.js`, `panelkit/runtime/pk-layout.js`, `panelkit/css/panelkit.css`, `panelkit/tests/input.test.js`, `panelkit/tests/layout.test.js`
- **Spec:** DETAILED-DESIGN §9, §11; WIDGETS §1; PACK-FORMAT §11, §14
- **Tasks:** delegated touch/mouse input (ghost-click suppression, scroll-vs-tap threshold, confirm guard, flash, disabled cells, press/release routing, `suspend`); grid and placed rendering, `applyCols`, `fit`; theme CSS generation with all group rules before all style rules; CSS for every class in WIDGETS §1 and the variables in §11.2.
- **Acceptance:** demo pack renders correctly in a desktop browser using a temporary test harness page (not committed); no flexbox `gap`, no Pointer Events.
- **Tests:** synthetic touch sequences (tap, scroll, cancel, double-fire suppression); confirm flow; layout HTML for grid, spans and placed pages; generated theme CSS order.
- **Docs:** none.

#### WP-13 Storage, loader, boot and the panel shell

- **Depends:** WP-12, WP-08
- **Files:** new `panelkit/core/pk-store.js`, `panelkit/pk-loader.js`, `panelkit/runtime/pk-boot.js`, `panel.html`, `panelkit/tests/loader.test.js`, `panelkit/tests/boot.test.js`
- **Spec:** DETAILED-DESIGN §3.1, §4, §17, §18; HLD §11
- **Tasks:** store wrapper and key schema; loader script list from the catalog and fixed tables only; error page with escaped id; boot steps 1–13 (edit mode entry stays a no-op until WP-17).
- **Acceptance:** `panel.html?pack=examples.demo&adapter=mock` works in desktop Chrome and on an iOS 12 iPad (or Safari 12 simulator); `?pack=../../x` shows the error page and loads nothing; `?adapter=evil` is ignored.
- **Tests:** loader output for the demo pack (document.write stub); legacy-id lookup; boot with dom-stub and mock adapter (render, bind, tick, page fallback via `resolvePageId`, last-page write).
- **Docs:** `docs/DEVELOPER-GUIDE.md` (how to open a PanelKit page during development).

### Phase 3 — chrome

#### WP-14 Settings

- **Depends:** WP-13
- **Files:** new `panelkit/chrome/pk-settings.js`, `panelkit/tests/settings.test.js`
- **Spec:** DETAILED-DESIGN §12
- **Tasks:** schema, load (defaults chain, clamping, legacy shapes such as `panelRowPadPct`, `navPages` object, page alias resolution), save, apply (CSS variables, root classes, brightness overlay), `renderForm`.
- **Acceptance:** a v0.3 settings JSON (copy from a real device or `panel-settings.js` defaults) loads with identical values.
- **Tests:** every key's clamp range; legacy `panelRowPadPct`; `navPages` with an alias key; unknown `autoHomePage` → `''`; brightness never sets `body.style.filter`.
- **Docs:** none.

#### WP-15 Nav and auto-home

- **Depends:** WP-14
- **Files:** new `panelkit/chrome/pk-nav.js`, `panelkit/chrome/pk-autohome.js`, `panelkit/tests/nav.test.js`
- **Spec:** DETAILED-DESIGN §13, §14; legacy `common/panel-nav.js`, `common/nav-inapp.js` (read only)
- **Tasks:** nav markup contract and order (tabs → ⌂ → EDIT → gear); in-app navigation; auto-home idle timer, paused in edit mode; last-page write.
- **Acceptance:** nav order and behaviour match v0.3 side by side.
- **Tests:** markup order and classes; hidden tabs; ⌂ toggling; idle navigation with fake clock; no timer on the home page or with no home page.
- **Docs:** none.

#### WP-16 Status and diagnostics

- **Depends:** WP-15
- **Files:** new `panelkit/chrome/pk-status.js`, `panelkit/tests/status.test.js`; edit `panelkit/runtime/pk-boot.js` (debug overlay, `PK.diag`)
- **Spec:** DETAILED-DESIGN §15, §20
- **Tasks:** status dot states; `pk:status` events; `?debug=1` overlay; `PK.diag()`.
- **Acceptance:** stopping the mock adapter turns the dot `stale` then `offline`.
- **Tests:** state transitions with fake clock; `PK.diag()` shape.
- **Docs:** none.

#### WP-17 Edit mode: arranging

- **Depends:** WP-16
- **Files:** new `panelkit/chrome/pk-edit.js`, `panelkit/tests/edit.test.js`; edit `panelkit/runtime/pk-boot.js` (`enterEdit`, lazy load)
- **Spec:** DETAILED-DESIGN §16; legacy `common/panel-edit.js` (read only); `docs/USER-GUIDE.md` edit-mode section
- **Tasks:** Move/Delete modes, touch and mouse drag and drop, undo (40), cols/rows steppers, reset, save on every change, `noEdit` refusal, input suspension, auto-home pause.
- **Acceptance:** every edit-mode step in the user guide works with PanelKit on desktop and iOS 12.
- **Tests:** layout operations (move, swap, delete, undo, cols change preserving tokens); storage key and format.
- **Docs:** none (user guide changes come with WP-28).

#### WP-18 Edit mode: picker and JSON

- **Depends:** WP-17
- **Files:** edit `panelkit/chrome/pk-edit.js`; new `panelkit/tests/edit-json.test.js`
- **Spec:** DETAILED-DESIGN §16; PACK-FORMAT §17; [schemas/layout-export.schema.json](schemas/layout-export.schema.json)
- **Tasks:** picker (search over token, label, tags, hint; group chips; suggestions; recent; hide placed; then-next-empty; library chips; `hidden` controls excluded; inert previews); JSON sheet export (`page`, `all`, `config`) and import (new and legacy formats, `legacyIds` for packs and pages, unknown tokens → `empty`, confirmation on pack mismatch).
- **Acceptance:** a v0.3 `bksq-layouts` export imports into PanelKit unchanged.
- **Tests:** export matches the schema; import of each accepted format; alias page keys; malformed JSON messages.
- **Docs:** none.

#### WP-19 Hub

- **Depends:** WP-18
- **Files:** new `hub.html`, `panelkit/tests/hub.test.js`
- **Spec:** DETAILED-DESIGN §3.2, §19; PACK-FORMAT §3
- **Tasks:** pack list grouped by vendor; page list; generated settings form; hub nav with ⌂ and EDIT behaviour; `pk:last-pack` including migration from `bksq-panels-last-aircraft`.
- **Acceptance:** hub works on iOS 12; selecting a pack and a page opens `panel.html` correctly.
- **Tests:** last-pack migration; hidden packs omitted; EDIT target skips `noEdit` pages.
- **Docs:** none.

### Phase 4 — author tooling

#### WP-20 AAO script XML generator

- **Depends:** WP-06
- **Files:** new `tools/pk-build-xml.js`, `panelkit/tests/build-xml.test.js`
- **Spec:** PACK-FORMAT §13; ADR-013
- **Tasks:** `node tools/pk-build-xml.js <packId>` writes `<pack dir>/aao-scripts.xml` from `pack.scripts` in definition order; `--check` exits 1 if the file on disk differs.
- **Acceptance:** byte-identical output across runs; generated XML imports into AxisAndOhs (manual check once).
- **Tests:** escaping of `&`, `<`, `>` in RPN; ordering; `--check`.
- **Docs:** `docs/DEVELOPER-GUIDE.md` tools table.

#### WP-21 Pack scaffolder

- **Depends:** WP-06
- **Files:** new `tools/pk-new-pack.js`, `panelkit/tests/new-pack.test.js`
- **Spec:** [AUTHORING-GUIDE.md](AUTHORING-GUIDE.md) §2–§3; PACK-FORMAT §3, §6
- **Tasks:** `node tools/pk-new-pack.js --vendor <id> [--vendor-title "<title>"] --aircraft <id> --title "<title>"` (exactly as AUTHORING-GUIDE §2 shows) creates the pack folder, a starter `pack.js` with one page, and the catalog entry (and the vendor file if the vendor is new). Refuses to overwrite.
- **Acceptance:** a freshly scaffolded pack passes `pk-validate` and opens with `adapter=mock`.
- **Tests:** generated files validate; refusal to overwrite; id format errors.
- **Docs:** AUTHORING-GUIDE if the command line differs from what it shows.

#### WP-22 Legacy importer

- **Depends:** WP-06
- **Files:** new `tools/pk-import-legacy.js`, `panelkit/tests/import-legacy.test.js`
- **Spec:** [MIGRATION.md](MIGRATION.md) §2, §3, §5, §6.3
- **Tasks:** implement the importer algorithm (§5) including classification table, label decoding, `g-*` → `style`, lamp maps, page conversion with row comments, script extraction, stderr report. Deterministic output.
- **Acceptance:** running twice gives identical output; drafts for both aircraft resolve with no errors other than the reported `TODO` actions.
- **Tests:** classification of one token of each legacy pattern (use small fixtures, not the full aircraft files); entity decoding; determinism.
- **Docs:** none.

#### WP-23 Widget gallery and performance check

- **Depends:** WP-13 (and WP-11 for all widgets)
- **Files:** new `panelkit/dev/gallery.html`; edit `packs/examples/demo/pack.js` (one control of every widget type and style)
- **Spec:** HLD §10; WIDGETS (all); DETAILED-DESIGN §20
- **Tasks:** gallery page that boots the demo pack with the mock adapter and shows per-tick script time and DOM-write count; a "stress" toggle that changes 10 values per tick.
- **Acceptance:** on an iPad mini 2: idle ticks show 0 DOM writes; stress ticks stay under 4 ms on average. Record numbers in the WP report.
- **Tests:** demo pack validates; every widget type present.
- **Docs:** `docs/ai/CONCEPTS-AND-GOALS.md` (measured performance numbers).

### Phase 5 — migration

#### WP-24 Black Square vendor profile

- **Depends:** WP-19, WP-22
- **Files:** new `packs/blacksquare/vendor.js`; edit `packs/catalog.js`
- **Spec:** PACK-FORMAT §4, §9, §14; MIGRATION §2, §6.3
- **Tasks:** vendor id `blacksquare`, `conventions.scriptGroup: 'bksq-{aircraft}-panel'`; theme `groups` and `styles` ported from the `.g-*` rules in `common/common.css` (one style per legacy class, same name without `g-`); shared `maps` from MIGRATION §6.3; `settingsDefaults` common to both aircraft.
- **Acceptance:** every `g-*` class used by either aircraft has a `styles` entry; colours match v0.3 side by side.
- **Tests:** validate passes (V-052 clean for both aircraft once their packs exist).
- **Docs:** none.

#### WP-25 TBM 850 pack

- **Depends:** WP-24, WP-20
- **Files:** new `packs/blacksquare/tbm850/pack.js`, `packs/blacksquare/tbm850/aao-scripts.xml` (generated), `packs/blacksquare/tbm850/README.md`; edit `packs/catalog.js`
- **Spec:** MIGRATION §4, §5, §6.1, §7; AUTHORING-GUIDE
- **Tasks:** run the importer, then resolve every `TODO` using MIGRATION §6.1. `storageKey: 'bksq-tbm850-ui-settings-v1'`, `conventions.scriptGroup: 'bksq-tbm-panel'` (differs from the vendor pattern), `legacyIds: ['tbm850']`, page `avionics` with `legacyIds: ['avnenv']`. **No `behaviors.js`.**
- **Acceptance:** `pk-validate` clean; generated XML has exactly the labels of the `bksq-tbm-panel` group in `aircraft/tbm850/bksq-tbm850-scripts.xml`; TBM rows of the MIGRATION §7 checklist pass with the mock adapter and the simulator.
- **Tests:** a test that compares the generated script label set with the legacy XML; per-control action log comparison for every TBM control (mock adapter vs expected labels).
- **Docs:** `packs/blacksquare/tbm850/README.md` (pilot setup, copied and adapted from `aircraft/tbm850/README.md`).

#### WP-26 Starship pack: grid pages

- **Depends:** WP-25
- **Files:** new `packs/blacksquare/starship/pack.js`, `packs/blacksquare/starship/aao-scripts.xml` (generated), `packs/blacksquare/starship/README.md`; edit `packs/catalog.js`
- **Spec:** MIGRATION §6.2, §6.3, §7
- **Tasks:** import, then convert every declarative row of MIGRATION §6.2 for the grid pages (`overhead`, `ecs`, `autopilot`, `misc`, `pedestal`, `tests`). Temperature readouts and pedestal gen-load / fuel readouts are placeholders (`readout` showing `—`) until WP-27. `storageKey: 'bksq-starship-ui-settings-v1'`, `legacyIds: ['starship']`.
- **Acceptance:** `pk-validate` clean except V-046 infos; script label set equals the legacy `bksq-starship-panel` group; Starship rows of the parity checklist pass for all declarative controls.
- **Tests:** script label set comparison; action log comparison per control.
- **Docs:** pack README.

#### WP-27 Starship behaviors and placed pages

- **Depends:** WP-26
- **Files:** new `packs/blacksquare/starship/behaviors.js`; edit `packs/blacksquare/starship/pack.js`, `packs/catalog.js` (`files`)
- **Spec:** WIDGETS §12; MIGRATION §6.2; PACK-FORMAT §11 (`kind: 'placed'`)
- **Tasks:** behaviors `blacksquare.starship.temp` and `blacksquare.starship.pedestal` (at most these two; anything else is a Spec question); convert `antiice` and `mfd` to `kind: 'placed'` pages reproducing the v0.3 CSS positions.
- **Acceptance:** remaining Starship parity rows pass; behaviors have unit tests with the mock adapter.
- **Tests:** °C/°F switching, auto setpoint fallback, OFF in mode 1; generator load fallback levels and last-good memory; KG/LBS and aft-tank selection.
- **Docs:** none.

#### WP-28 Parity sign-off and switch-over — **requires explicit user approval**

- **Depends:** WP-27, WP-23
- **Files:** edit `index.html` (becomes the PanelKit hub), each `aircraft/*/pages/*.html` (redirects), `AGENTS.md`, `README.md`, `docs/USER-GUIDE.md`, `docs/DEVELOPER-GUIDE.md`, `docs/ai/*`, `CHANGELOG.txt`; move legacy engine to `legacy/`
- **Spec:** MIGRATION §7, §8
- **Tasks:** complete the parity checklist on desktop and iPad mini 2 and attach the results to the WP report; ask the user for approval; then perform the MIGRATION §8 steps; rewrite the agent and human docs so they describe PanelKit as the shipped engine.
- **Acceptance:** user approval recorded; all verification commands pass; old bookmarks (including `?edit=1`) land on the right PanelKit page; v0.3 settings and layouts appear unchanged on a device that used v0.3.
- **Tests:** redirect pages map every legacy page id; full test suite.
- **Docs:** all listed under *Files*; tag a release only if the user asks.

#### WP-29 Legacy retirement — **requires explicit user approval**

- **Depends:** WP-28 plus one released version in use
- **Files:** delete `legacy/`, `tools/audit-layouts.js`, `aircraft/*/tools/check-manifest.js` (replaced by `pk-validate`); edit `AGENTS.md`, docs, `CHANGELOG.txt`
- **Spec:** MIGRATION §8
- **Tasks:** remove legacy code once the user confirms; keep redirect pages; update every doc and the verification list.
- **Acceptance:** no references to removed files remain (`git grep`); verification commands pass.
- **Tests:** full suite.
- **Docs:** all affected.

## 5. WP report

Put this in the commit message body (or PR description):

```
WP-NN <title>
Done: <one line per task>
Tests: <files and counts>
Verification: <commands run, all green?>
Spec questions: <none | list with section references>
Deviations: <none | what and why>
Docs updated: <list>
```

## 6. Definition of done (every WP)

- All acceptance checks pass and the tests listed are present and green.
- Verification commands (§7) pass.
- No `TODO` or commented-out code without a matching note in the WP report.
- Docs listed under *Docs* are updated, plus `CHANGELOG.txt` when anything user-visible changed.
- The reviewer checklist (§8) is satisfied.

## 7. Verification commands

```text
node tools/check-es5.js
node tools/pk-test.js                 (from WP-00)
node tools/pk-validate.js --all       (from WP-06)
node tools/pk-build-xml.js --check    (from WP-20, per pack)
node tools/audit-layouts.js           (legacy, until WP-29)
node aircraft/tbm850/tools/check-manifest.js     (until WP-29)
node aircraft/starship/tools/check-manifest.js   (until WP-29)
```

## 8. Reviewer checklist

- [ ] Only files listed in the WP changed (plus docs).
- [ ] Public names match DETAILED-DESIGN §23; markup matches WIDGETS §1.
- [ ] ES5 and the iOS 12 checklist; no Pointer Events, HTML5 drag and drop or flexbox `gap`.
- [ ] DOM-free modules do not touch DOM, storage or timers.
- [ ] No user-provided text reaches `innerHTML` unescaped.
- [ ] Errors are logged, never thrown to the UI.
- [ ] Idle ticks cause no DOM writes (for runtime WPs).
- [ ] Tests cover every acceptance criterion and do not sleep.
- [ ] Docs and `CHANGELOG.txt` updated as required.
