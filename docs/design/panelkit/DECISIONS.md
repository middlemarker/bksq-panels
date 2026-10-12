# PanelKit — architecture decision records

Each record: context, decision, consequences, and alternatives considered. Status is **Accepted** unless noted. Changing a decision requires a new record that supersedes the old one.

## ADR-001 — Packs are `.js` files holding JSON-compatible data

**Context.** Packs must load on iOS 12 from a static server and from `file://`, must be validatable in Node without dependencies, and should be easy for non-programmers.
**Decision.** Each pack is a `.js` file with a single `PK.definePack({...})` call whose argument is JSON-compatible. Helper functions inside packs are not allowed; repetition is handled by templates (ADR-014).
**Consequences.** Synchronous `<script>` loading works everywhere, including `file://`. The validator captures the object in a `vm` sandbox and enforces JSON compatibility (V-002), so packs could be converted to `.json` later without changes. Authors lose the convenience of JS helpers.
**Alternatives.** Pure `.json` loaded with XHR: fails on `file://`, needs async boot. JS with helpers (v0.3 style): not validatable as data, encourages raw HTML.

## ADR-002 — Synchronous loader using `document.write`

**Context.** The pack decides which files to load (vendor, libraries, behaviors, adapter). ES modules and dynamic `import()` are unavailable on iOS 12.
**Decision.** `pk-loader.js` runs in `<head>` and writes parser-inserted `<script>` tags in order.
**Consequences.** Simple, ordered, no async boot logic; the v0.3 hub already does this. Chrome may warn about `document.write` only for cross-origin scripts on slow connections, which does not apply (same origin).
**Fallback if ever needed.** Replace the loader with a sequential `createElement('script')` chain and make `PK.boot()` wait for a `pk:loaded` event. Only the loader and boot change.

## ADR-003 — One generic page shell; navigation reloads the page

**Context.** v0.3 has one HTML file per page with copied nav bars and script lists.
**Decision.** A single `panel.html?pack=&page=`. Moving between pages is a normal navigation (full reload).
**Consequences.** No per-page files; the nav is generated. Memory is released on every page change, which matters on a 1 GB iPad. Page switches cost a reload, the same as v0.3.
**Alternatives.** In-place page switching: faster, but needs careful teardown of bindings, timers and listeners; deferred as a possible later improvement.

## ADR-004 — The engine generates markup; authors never write HTML or DOM ids

**Context.** Hand-picked ids caused duplicate-id bugs; raw HTML in buttons forced the picker to strip markup.
**Decision.** Widgets render markup from control data. Elements are found through `refs()` once at mount, not by id.
**Consequences.** The same control can appear twice on a page. Picker previews come from `render(ctl, { inert: true })`. Legacy CSS that targeted ids must be rewritten as group/style classes.

## ADR-005 — Delegated input instead of inline `onclick`

**Decision.** `pk-input.js` listens on the grid and resolves `data-pk-cell` / `data-pk-part`.
**Consequences.** One place handles iOS ghost clicks, scroll-vs-tap, press/hold, confirm guard and edit-mode suspension. No global functions are needed for buttons.

## ADR-006 — Dirty-checked bindings

**Context.** v0.3 re-applies every poll rule each tick.
**Decision.** Read each watched var once per data revision; evaluate only bindings whose inputs changed; write the DOM only when the evaluated output changed. Timers explicitly invalidate time-based state (latches, `everyMs`, optimistic windows).
**Consequences.** Idle ticks cost no DOM work. Time-based behaviour must go through `PK.bind.schedule`, which behaviors are required to use.

## ADR-007 — Simulator access through adapters

**Decision.** The engine talks to an adapter interface ([ADAPTERS.md](ADAPTERS.md)). AxisAndOhs is the first adapter; a mock adapter is mandatory for tests and desktop development.
**Consequences.** Packs declare which adapter they target; the validator checks capabilities. A different bridge needs only a new adapter file.

## ADR-008 — Labels are plain text

**Decision.** Labels are escaped; `\n` is the only formatting. HTML entities in legacy labels (`&rarr;`) become Unicode characters (`→`) during migration.
**Consequences.** Packs cannot inject markup, and imported data is safe by construction. Rich labels require a widget or behavior.

## ADR-009 — Behaviors as the code escape hatch

**Decision.** Logic that data cannot express goes into `PK.defineBehavior` in the pack's `behaviors.js`, using only the documented `api`.
**Consequences.** Packs stay mostly data; custom code is isolated, namespaced and reviewable. Behaviors that touch the DOM outside their cell or use raw timers are review failures.

## ADR-010 — Build next to the legacy engine (strangler)

**Decision.** PanelKit lives in new folders (`panelkit/`, `packs/`, `panel.html`, `hub.html`). Legacy files are not edited by PanelKit work packages, except the additive `AaoWebApi.js` hooks (ADAPTERS §2.3). Switch-over (WP-28) requires explicit user approval.
**Consequences.** Pilots keep a working panel during development; parity is compared side by side. Two engines coexist for a while, so docs must say which is current.

## ADR-011 — Preserve storage keys and token ids

**Decision.** Migrated packs set `storageKey` to their v0.3 key and keep every legacy layout token as the control id.
**Consequences.** Saved settings, layouts, recent picks and last page survive the switch with no migration code. Renaming a page later is covered by `pages[].legacyIds` (settings, last page and imports follow the new id; saved layouts under the old id are not moved). Renaming a control needs a compatibility alias (a future control-level field) or accepts that saved layouts show an empty cell.

## ADR-012 — Zero-dependency Node tooling with numbered rules

**Decision.** No npm packages. `tools/pk-validate.js` hand-codes the checks in PACK-FORMAT §18, each tagged with its rule id. JSON Schemas are provided for documentation and editor support but are not executed by the tools.
**Consequences.** Tools run anywhere Node runs. The rule table is the single checklist that implementers and reviewers share.

## ADR-013 — Pack scripts generate the AxisAndOhs XML

**Context.** v0.3 maintains script labels in JS and XML separately, then checks them with `check-manifest.js`.
**Decision.** `pack.scripts` is the source of truth; `tools/pk-build-xml.js` writes the XML users import into AxisAndOhs. Packs that cannot own their scripts may point `scriptsXml` at an external file, which is read but never written.
**Consequences.** Label drift becomes impossible for generated packs (V-031 at validation). The generated XML is committed so users can download it.

## ADR-014 — Templates instead of code helpers

**Decision.** Repetition (e.g. eleven identical three-lamp dimmers) is expressed with `templates` and `use`, merged by the rule in PACK-FORMAT §12.
**Consequences.** Pack data stays declarative and validatable. The one-level object merge for `state` lets a template carry the map while each control supplies its source.

## ADR-015 — Optimistic display is opt-in per control

**Context.** TBM handlers update visuals immediately and re-read 120 ms later.
**Decision.** `multi` supports `optimistic` with a bounded window (`optimisticMs`); other types rely on the next data revision.
**Consequences.** Fast feedback where the sim is slow to report, without masking real state for long.
