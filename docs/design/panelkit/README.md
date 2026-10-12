# PanelKit — generic touch-panel system (design)

**Status:** Proposed design, not implemented. The v0.3 engine in `common/` and `aircraft/` stays authoritative until the migration work packages in [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) reach parity and the user approves the switch.

PanelKit generalises the Black Square panels into a vendor- and aircraft-neutral engine. Aircraft are described by **packs**: data files that list controls, pages and sim bindings, with no HTML, no DOM ids and no per-page HTML files. Vendors share conventions, themes and reusable control sets through **vendor profiles** and **libraries**. The simulator connection sits behind an **adapter**, so AxisAndOhs is the first backend rather than a hard dependency.

## Who reads what

| Reader | Read first | Then |
|--------|-----------|------|
| Implementing agent (any tier) | [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) → your work package | The spec sections the work package links to |
| Reviewer / architect | [HLD.md](HLD.md) | [DECISIONS.md](DECISIONS.md), [DETAILED-DESIGN.md](DETAILED-DESIGN.md) |
| Aircraft / vendor author | [AUTHORING-GUIDE.md](AUTHORING-GUIDE.md) | [PACK-FORMAT.md](PACK-FORMAT.md), [WIDGETS.md](WIDGETS.md) |
| Adapter author | [ADAPTERS.md](ADAPTERS.md) | [DETAILED-DESIGN.md](DETAILED-DESIGN.md) §6–§8 |
| Whoever migrates Starship / TBM | [MIGRATION.md](MIGRATION.md) | [PACK-FORMAT.md](PACK-FORMAT.md) |

## Documents

| File | Contents |
|------|----------|
| [HLD.md](HLD.md) | Problem, goals, constraints, architecture, data model, runtime flow, extension points, performance, security, phasing |
| [DETAILED-DESIGN.md](DETAILED-DESIGN.md) | Module-by-module spec: files, public APIs (ES5 signatures), data structures, algorithms, DOM and storage contracts |
| [PACK-FORMAT.md](PACK-FORMAT.md) | Normative format for catalog, vendor profiles, libraries and packs; source and action grammar; merge rules; validation rule table |
| [WIDGETS.md](WIDGETS.md) | Built-in control types: fields, rendered DOM, state classes, input behaviour; behaviors (custom code) API |
| [ADAPTERS.md](ADAPTERS.md) | Sim adapter interface, AxisAndOhs adapter mapping, mock adapter, conformance tests |
| [AUTHORING-GUIDE.md](AUTHORING-GUIDE.md) | Step-by-step guide and pattern cookbook for new aircraft and vendors |
| [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | Ordered work packages with files, tasks, acceptance criteria and tests |
| [MIGRATION.md](MIGRATION.md) | Legacy → PanelKit mapping, user-data compatibility, Starship and TBM conversion, parity checklist |
| [DECISIONS.md](DECISIONS.md) | Architecture decision records (ADR-001 …) |
| [schemas/](schemas/) | JSON Schema (draft-07) for packs and layout exports; normative together with PACK-FORMAT.md |

## Conventions in these documents

- **MUST / SHOULD / MAY** follow RFC 2119. A MUST is an acceptance criterion; breaking one fails review.
- Code samples are **ES5** (the runtime target is iOS 12.5 Safari). Node tooling is also written in ES5 style for consistency.
- `PK.x.y()` names are the public API. Names starting with `_` are internal and may change.
- Paths are relative to the repository root.
- "Legacy" means the v0.3 engine (`common/*.js`, `aircraft/*/`).

## Glossary (new terms)

| Term | Meaning |
|------|---------|
| **Engine** | The vendor-neutral runtime under `panelkit/` |
| **Catalog** | `packs/catalog.js` — the list of vendors, libraries and packs the hub can open |
| **Vendor profile** | Shared defaults for one vendor: theme, script-group convention, templates, maps, settings defaults |
| **Library** | A reusable set of controls (e.g. a common autopilot head) that several packs can include under an alias |
| **Pack** | One aircraft: controls, pages, scripts, theme overrides, settings defaults |
| **Control** | A named, placeable thing on a page (`lts_master`). Has a **type** (widget), label, group, bindings |
| **Widget** | Engine code that renders and updates one control type (`toggle`, `multi`, `readout` …) |
| **Template** | Partial control definition that other controls reuse through `use` |
| **Source** | Read-only binding to a value: `L:var_X,Bool`, `A:CIRCUIT SWITCH ON:57,Bool`, `local:dhMode` |
| **State spec** | A source plus transforms (fallback, scale, map, test …) producing the value a widget displays |
| **Action** | What a tap does: run a named script, send a key event, set or adjust a variable, call a behavior |
| **Adapter** | Engine module that talks to a simulator bridge (AxisAndOhs first; mock for tests) |
| **Behavior** | Registered ES5 code for the rare control that data cannot describe |
| **Cell** | One slot of a page layout; holds one control instance |
| **Resolved pack** | The merged, normalised result of engine defaults + vendor + libraries + pack |
| **Problem** | A validation finding with a rule id (`V-012`), level (`error`/`warn`) and path |
