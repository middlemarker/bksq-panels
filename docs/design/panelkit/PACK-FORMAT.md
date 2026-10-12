# PanelKit — pack format (normative)

This document and [schemas/panelkit.schema.json](schemas/panelkit.schema.json) define every authored file. Where they disagree, this document wins and the schema is a bug. Per-type control fields are in [WIDGETS.md](WIDGETS.md).

## 1. File wrappers

Every authored file is a `.js` file containing **one call** with a **JSON-compatible** object literal (ADR-001):

| File | Call | `format` |
|------|------|----------|
| `packs/catalog.js` | `PK.defineCatalog({...})` | `panelkit-catalog` |
| `packs/<vendor>/vendor.js` | `PK.defineVendor({...})` | `panelkit-vendor` |
| library file (any path listed in the catalog) | `PK.defineLibrary({...})` | `panelkit-library` |
| `packs/<vendor>/<aircraft>/pack.js` | `PK.definePack({...})` | `panelkit-pack` |
| `packs/<vendor>/<aircraft>/behaviors.js` (optional) | `PK.defineBehavior(id, impl)` (one or more) | — (code, see [WIDGETS.md](WIDGETS.md) §12) |

**JSON-compatible** means: only objects, arrays, strings, finite numbers, booleans and `null`. No functions, no `undefined`, no computed values, no variables, no comments inside values that change meaning. Comments (`/* */`, `//`) between entries are allowed. The validator checks this by round-tripping the captured object through `JSON.stringify` / `JSON.parse` and comparing (rule V-002).

Every data object MUST carry `format` and `version`. This document describes `version: 1`.

## 2. Identifiers

| Kind | Pattern | Example |
|------|---------|---------|
| Vendor id | `^[a-z][a-z0-9-]*$` | `blacksquare` |
| Pack id | `^[a-z][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$` (`<vendor>.<aircraft>`) | `blacksquare.tbm850` |
| Library id | same as pack id (`<vendor>.<name>`) | `blacksquare.kap140` |
| Library alias | `^[a-z][a-zA-Z0-9]*$` | `kap` |
| Control id (in its own file) | `^[a-zA-Z][a-zA-Z0-9_]*$` | `lts_master`, `avncs_gyro` |
| Control token (in a layout) | control id, or `<alias>.<libraryControlId>`, or `empty` | `kap.ap` |
| Page id | `^[a-z][a-zA-Z0-9_-]*$` | `overhead` |
| Template / map / format name | `^[a-zA-Z][a-zA-Z0-9_.-]*$` | `ltsDimmer`, `kap.btn` |
| Group | `^[a-z][a-z0-9]*$` | `lts` |
| Style | `^[a-z][a-z0-9-]*$` | `int` |
| Behavior id | `^[a-z][a-z0-9-]*(\.[a-zA-Z0-9_-]+)+$` | `blacksquare.starship.temp` |
| Script label | `^[A-Za-z0-9_.-]+$` | `SSP_TBM_OH_GYRO_TOGGLE` |

Reserved: the control id `empty` (built-in blank cell) and any control id starting with `pk`. Control ids MUST NOT contain `.` (the dot is reserved for library aliases).

## 3. Catalog

```javascript
PK.defineCatalog({
  format: 'panelkit-catalog',
  version: 1,
  vendors: [
    { id: 'blacksquare', title: 'Black Square', file: 'packs/blacksquare/vendor.js' }
  ],
  libraries: [
    { id: 'blacksquare.kap140', file: 'packs/blacksquare/lib-kap140.js' }
  ],
  packs: [
    {
      id: 'blacksquare.tbm850',
      title: 'TBM 850',
      vendor: 'blacksquare',
      dir: 'packs/blacksquare/tbm850/',
      files: ['pack.js'],
      uses: [],
      legacyIds: ['tbm850'],
      hidden: false
    }
  ]
});
```

| Field | Req | Notes |
|-------|-----|-------|
| `vendors[].file`, `libraries[].file` | yes | Path from repo root |
| `packs[].dir` | yes | Ends with `/`; `files` are relative to it |
| `packs[].files` | yes | Load order; MUST include `pack.js`; `behaviors.js` if present |
| `packs[].uses` | yes (may be `[]`) | Library ids; MUST equal the ids in the pack's `uses` (V-006) |
| `packs[].legacyIds` | no | Old aircraft ids (`starship`) for URL redirects and legacy JSON import |
| `packs[].hidden` | no | Hidden from the hub list (still loadable by URL) |

## 4. Vendor profile

```javascript
PK.defineVendor({
  format: 'panelkit-vendor',
  version: 1,
  id: 'blacksquare',
  title: 'Black Square',
  adapter: 'aao',
  conventions: { scriptGroup: 'bksq-{aircraft}-panel' },
  settingsDefaults: { panelBtnFontPx: 18, panelGridGapPx: 14 },
  theme: { vars: {}, groups: {}, styles: {} },
  templates: {},
  maps: {},
  formats: {}
});
```

`conventions.scriptGroup` is a pattern. Placeholders: `{vendor}` (vendor id), `{aircraft}` (part of the pack id after the dot), `{pack}` (full pack id). A pack MAY set its own `conventions.scriptGroup` (literal or pattern); the pack value wins.

## 5. Library

```javascript
PK.defineLibrary({
  format: 'panelkit-library',
  version: 1,
  id: 'blacksquare.kap140',
  title: 'KAP 140 autopilot',
  defaultAlias: 'kap',
  templates: {}, maps: {}, formats: {},
  controls: {
    ap: { type: 'toggle', label: 'AP', group: 'ap', action: 'script:KAP_AP', state: 'L:KAP_AP,Bool' }
  },
  scripts: { KAP_AP: '(L:KAP_AP, Bool) ! (>L:KAP_AP, Bool)' }
});
```

- Library controls are addressed as `<alias>.<id>` in layouts (`kap.ap`). The alias is `defaultAlias` unless the pack chooses another (`uses: [{ id: 'blacksquare.kap140', as: 'ap1' }]`).
- Library `scripts` join the pack's scripts (pack's `scriptGroup`) for XML generation and V-031.
- Library template/map/format names share one namespace with the pack. Libraries SHOULD prefix them with `<defaultAlias>.` (V-019 warns otherwise).

## 6. Pack

```javascript
PK.definePack({
  format: 'panelkit-pack',
  version: 1,
  id: 'blacksquare.tbm850',
  title: 'TBM 850',
  extends: 'blacksquare',
  sim: 'msfs',
  adapter: 'aao',
  storageKey: 'bksq-tbm850-ui-settings-v1',
  conventions: { scriptGroup: 'bksq-tbm-panel' },
  uses: [],
  overrides: {},
  settingsDefaults: { pollIntervalMs: 50, panelScrollable: true },
  theme: {},
  templates: {},
  maps: {},
  formats: {},
  controls: {},
  pages: [],
  scripts: {},
  scriptsXml: 'aao-scripts.xml',
  mock: {},
  notes: 'Free text for maintainers.'
});
```

| Field | Req | Default | Notes |
|-------|-----|---------|-------|
| `id`, `title` | yes | | |
| `extends` | no | none | Vendor id |
| `sim` | no | `'msfs'` | Informational |
| `adapter` | no | vendor's, else `'aao'` | Adapter id ([ADAPTERS.md](ADAPTERS.md)) |
| `storageKey` | no | `'pk:' + id` | Base for all storage keys; MUST NOT contain `:` unless it is the default. Legacy packs keep their v0.3 key (G7) |
| `conventions.scriptGroup` | if any `script:` action | vendor's | Literal or pattern (§4) |
| `uses` | no | `[]` | Library ids or `{ id, as }` |
| `overrides` | no | `{}` | `{ '<alias>.<id>': { field: value } }` — one-level merge into a library control |
| `settingsDefaults` | no | `{}` | Keys from DETAILED-DESIGN §12 only |
| `controls` | yes | | Map of control id → control (§7) |
| `pages` | yes | | Ordered list (§11); order = nav order |
| `scripts` | no | | `{ LABEL: 'RPN' }`; source of truth for the AAO XML (§13) |
| `scriptsXml` | no | `'aao-scripts.xml'` | File name inside the pack dir. With `scripts`: generated output. Without `scripts`: an external, hand-maintained XML that the validator reads labels from |
| `mock` | no | | Mock adapter data (§15) |

## 7. Controls

Common fields (all types):

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `type` | string | from template | Built-in types in [WIDGETS.md](WIDGETS.md); `custom` for behaviors |
| `use` | string or string[] | | Template name(s), applied left to right (§12) |
| `label` | string | control id | Plain text. `\n` renders as a line break. HTML is escaped (ADR-008) |
| `group` | string | id prefix before the first `_`, else `misc` | Colour family and picker chip |
| `style` | string | none | Colour variant independent of the group; class `pk-s-<style>`; overrides group colours |
| `span` | int 1–4 | 1 | Columns occupied in a grid page |
| `hint` | string | | Shown in the edit-mode picker |
| `tags` | string[] | | Extra picker search words |
| `hidden` | bool | false | Not offered in the picker (still placeable by JSON) |
| `confirm` | bool or string | false | Two-tap guard; string is the prompt (default `CONFIRM`) |
| `enabled` | state spec | always enabled | When the result is `false`, the cell gets `pk-disabled` and ignores taps; `undefined` counts as enabled |
| `everyMs` | int | | Default `everyMs` for this control's state specs |

Type-specific fields (`action`, `state`, `positions`, `value`, `rows`, …) are listed per type in [WIDGETS.md](WIDGETS.md) §2.

## 8. Sources and state specs

### 8.1 Source strings

```
source  = lvar | avar | evar | local | const
lvar    = "L:" name [ "," unit ]                 ; unit defaults to "Number"
avar    = "A:" name [ ":" index ] "," unit       ; unit required
evar    = "E:" name "," unit                     ; unit required
local   = "local:" ident                         ; engine-side variable, starts undefined
const   = "const:" literal                       ; number if it parses as one, else string
name    = 1*( any character except "," )         ; leading/trailing spaces trimmed
index   = 1*DIGIT
unit    = 1*( any character )                    ; trimmed; may contain spaces ("feet per minute")
ident   = [A-Za-z][A-Za-z0-9_]*
```

Parsing rules:

- Split `kind` at the first `:`. `L`, `A`, `E` are case-sensitive.
- For `A` and `E`, split the body at the **last** comma into name and unit. For `A`, a trailing `:<digits>` on the name is the index.
- **Canonical key** (used for de-duplication and in `mock.values`): `L:<name>,<unit>`, `A:<name>[:<index>],<unit>`, `E:<name>,<unit>`, `local:<ident>`, `const:<literal>` — no spaces around the comma. `L:var_X, Bool` and `L:var_X,Bool` are the same source.

### 8.2 State spec

A field that reads sim state (`state`, `value`, `enabled`, gauge `rows[].value`) accepts a source string (shorthand for `{ src: '<string>' }`) or an object. An object has **exactly one value producer** and any number of **transforms**:

| Producer | Type | Meaning |
|----------|------|---------|
| `src` | source | Read one source. May carry `fallback` |
| `fallback` | source or source[] | With `src` only: sugar for `first: [src, ...fallback]` |
| `first` | state spec[] | The first entry whose result is not missing. Each entry keeps its own transforms (e.g. a Kelvin primary with `offset: -273.15` and Celsius fallbacks) |
| `pick` | `{ index: <state spec>, from: [<state spec>, ...] }` | Selector: the result of `from[round(index)]` (e.g. a multimeter knob choosing one of six bus voltages); out-of-range index → missing |
| `when` | `[{ if: <state spec>, then: <value> }, ...]` plus optional `else: <value>` | Priority choice: the first `if` that is true picks its `then` (e.g. lamp RESET if the reset var is set, else ON if the alternator is on, else OFF) |
| `any` / `all` | state spec[] | Boolean OR / AND of the children |

In `then` / `else`, numbers, booleans and `null` are constants; a string is a **source** (`'const:OFF'` for a constant text); an object is a state spec.

| Transform | Type | Meaning |
|-----------|------|---------|
| `missing` | number/string | Value used when the producer's result is missing |
| `everyMs` | int | Re-evaluate at most this often (slow readouts: 250–1000) |
| `scale` | number | Multiply |
| `offset` | number | Add (after `scale`) |
| `clamp` | `[min, max]` | Limit |
| `round` | int ≥ 0 | Decimal places to round to |
| `map` | map name or inline map | §9.1 |
| `test` | object with exactly one of `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in` | Produces a boolean |
| `not` | bool | Invert the boolean result |

**Missing** means: `undefined`, `null`, `''`, or a value whose `Number()` is `NaN` when the unit is not `string`.

**Lazy registration.** Only `src`, the `if` specs of `when`, `pick.index` and the children of `any`/`all` are registered with the simulator up front. `first` entries after the first, `pick.from` entries and `then`/`else` specs are registered the first time they are needed (DETAILED-DESIGN §7.4).

**Evaluation order** (normative):

1. **Produce** `v`:
   - `src`: `v = read(src)`.
   - `first`: evaluate entries in order; `v` = the first result that is not missing (missing if none).
   - `pick`: `i = evaluate(pick.index)`; if `i` is missing or `Math.round(i)` is outside `from`, `v` is missing; else `v = evaluate(from[Math.round(i)])`.
   - `when`: evaluate each `if` in order with `toBool`; the first `true` gives `v = value(then)`. If none is true: `v = value(else)` when every `if` was defined, else `v` is missing (no data yet).
   - `any` / `all`: children to booleans. `any`: true if any child is true; missing only if all children are undefined; else false. `all`: missing if any child is undefined; else true when all are true. Then apply `not` and **stop** (no other transforms).
2. If `v` is missing: `v = missing` if defined, else the result is `undefined` — stop.
3. If any of `scale`, `offset`, `clamp`, `round` is set, or `map` has `ranges`: `v = Number(v)`, then scale → offset → clamp → round, in that order.
4. If `map`: `v = applyMap(map, v)` (§9.1).
5. If `test`: `v = compare(v, test)` (boolean). Apply `not` (also allowed without `test`: `not` of `toBool(v)`).
6. Result is `v`.

`toBool(v)`: `true` for `true`, non-zero finite numbers, and strings other than `''`, `'0'` and `'false'`; otherwise `false`. `undefined` stays `undefined` where noted.

Examples:

```javascript
/* Kelvin L-var with Celsius fallbacks */
value: { first: [{ src: 'L:var_FuelTemperature', offset: -273.15 }, 'A:ENG OIL TEMPERATURE:1,celsius', 'A:AMBIENT TEMPERATURE,celsius'] }

/* Lamp index: 0 RST, 1 ON, 2 OFF */
state: { when: [{ if: 'L:VAR_GENERATORRESET_L,Bool', then: 0 }, { if: 'A:GENERAL ENG MASTER ALTERNATOR:1,Bool', then: 1 }], else: 2 }

/* Text OFF in one mode, a number otherwise */
value: { when: [{ if: { src: 'L:var_EnvironmentalModeKnob', test: { eq: 1 } }, then: 'const:OFF' }], else: 'L:var_CabinTempSetPoint' }
```

## 9. Maps and formats

### 9.1 Maps

```javascript
maps: {
  ohDimmer: { ranges: [{ lt: 25, out: 0 }, { lt: 75, out: 1 }], default: 2, missing: 0 },
  iceWs:    { values: { '0': 2, '1': 1 }, default: 0 },
  wiper4:   { values: { '0': 0, '1': 1, '2': 2 }, default: 3 }
}
```

`applyMap(map, x)`:

1. If `x` is missing: return `map.missing` if defined, else `undefined`.
2. `key = String(isFiniteNumber(Number(x)) ? Number(x) : x)`. If `map.values` has own property `key`: return it.
3. For each entry of `map.ranges` in order, with exactly one of `lt`, `lte`, `gt`, `gte`: if `Number(x)` satisfies it, return `out`.
4. Return `map.default` if defined, else `x` unchanged.

### 9.2 Formats

```javascript
formats: {
  int:      { decimals: 0 },
  psi1:     { decimals: 1, suffix: ' PSI' },
  xpdrMode: { enum: ['OFF', 'STBY', 'TST', 'ON', 'ALT', 'GND'] },
  code4:    { decimals: 0, pad: 4 }
}
```

| Field | Meaning |
|-------|---------|
| `decimals` | `toFixed(decimals)` for numbers |
| `pad` | Minimum integer digits, zero-padded (`7` → `0007`) |
| `sign` | Prefix `+` for positive numbers |
| `enum` | Array (index by rounded number) or object (by `String(v)`); unmatched values fall through to number formatting |
| `prefix`, `suffix` | Added around the text |
| `upper` | Upper-case the text |
| `missing` | Text for missing values (default `—`, U+2014) |

Order: missing → enum → number formatting (`decimals`, `pad`, `sign`) → `upper` → prefix/suffix. Non-numeric strings skip number formatting.

A field that takes a format accepts a format name or an inline format object.

## 10. Actions

### 10.1 Forms

| Form | Example | Canonical (`op`) |
|------|---------|------------------|
| `'script:<LABEL>'` | `'script:SSP_TBM_OH_GYRO_TOGGLE'` | `{ op: 'script', label, group }` — group from `conventions.scriptGroup` |
| `{ script, group }` | `{ script: 'X', group: 'other-panel' }` | same, explicit group |
| `'k:<EVENT>'` / `'k:<EVENT>=<n>'` | `'k:TOGGLE_NAV_LIGHTS'` | `{ op: 'k', event, value }` (value default 1) |
| `{ k, value }` | `{ k: 'HEADING_BUG_SET', value: 180 }` | same |
| `'rpn:<code>'` / `{ rpn }` | `'rpn:1 (>K:BKSQTbm850-x)'` | `{ op: 'rpn', code }` — adapter-specific; prefer `script:` (V-036) |
| `{ set, value }` | `{ set: 'L:BKSQ_SourceSwitch,Number', value: 2 }` | `{ op: 'set', target, value }` |
| `{ adjust, by, min, max, wrap }` | `{ adjust: 'L:var_CockpitBlowerKnob,Number', by: 1, min: 0, max: 10 }` | `{ op: 'adjust', ... }` |
| `{ cycle, values, mode, onUnknown }` | `{ cycle: 'L:var_airconState,Number', values: [0, 1, 2], mode: 'bounce' }` | `{ op: 'cycle', ... }` |
| `{ switch, cases, default }` | `{ switch: 'A:TRANSPONDER STATE:1,Enum', cases: { '0': 'script:XPDR_STBY' }, default: 'script:XPDR_OFF' }` | `{ op: 'switch', on: Spec, cases: { key: Action or null }, def: Action or null }` |
| `'behavior:<id>'` / `'behavior:<id>#<method>'` / `{ behavior, method, args }` | `'behavior:blacksquare.starship.temp#run'` | `{ op: 'behavior', id, method, args }` (method default `run`) |
| `[a, b, ...]` / `{ seq, gapMs }` | `['script:A', 'script:B']` | `{ op: 'seq', items, gapMs }` (array: `gapMs` 0) |

### 10.2 Semantics

- `set` / `adjust` / `cycle` targets MUST be `L:`, `A:` or `local:` sources (V-032).
- `adjust` / `cycle` targets are registered with the simulator as soon as the control is on screen. If the target has not delivered any data yet at tap time, the tap is ignored (logged) instead of writing a guessed value. `local:` targets are the exception: they start `undefined` and count as missing.
- `adjust`: `cur = read(target)`; a delivered but missing value (e.g. `''`) counts as `min` if defined, else 0. `next = cur + by`. With `wrap: true`, values past `max` wrap to `min` and vice versa; otherwise clamp to `[min, max]`. Then `set`.
- `cycle`: `i = index of cur in values` (loose numeric equality; not found → -1). If `i` is -1 and `onUnknown` is `'skip'`, do nothing (e.g. a GEN switch that only alternates MAIN/STBY and must not leave OFF); the default `'first'` continues. `wrap`: `next = (i + 1) % n`. `bounce`: direction starts at +1 and flips at either end; the direction is remembered per control instance and per target. Then `set values[next]`.
- `switch`: evaluate the state spec `switch`; if the result is `undefined` (no data yet), ignore the tap (logged) as for `adjust` / `cycle`. Otherwise `key = String(result)` (numbers normalised as in §9.1). Run `cases[key]` if the key exists (a `null` case does nothing), else `default` (absent or `null`: nothing). Covers "if the transponder is off send STANDBY, otherwise send OFF".
- `seq`: runs items in order; with `gapMs > 0` each item waits that long after the previous one.
- An action never throws to the UI; failures are logged (`PK.log.warn`).

## 11. Pages

```javascript
pages: [
  { id: 'overhead', label: 'Overhead (OH)', navLabel: 'OH', cols: 8, layout: [
    /* ROW 1 */ 'avncs_gyro', 'avncs_rmi', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'
  ] },
  { id: 'antiice', label: 'Anti-ice', navLabel: 'ICE', kind: 'placed', cols: 8, rows: 3, cells: [
    { token: 'ice_fwdWing', col: 4, row: 1, colSpan: 2 },
    { token: 'ice_mainWing', col: 6, row: 1, colSpan: 2 }
  ] }
]
```

| Field | Req | Default | Notes |
|-------|-----|---------|-------|
| `id`, `label` | yes | | `label` is shown in the hub and settings |
| `navLabel` | no | `label` | Short tab text |
| `kind` | no | `'grid'` | `'grid'`: `layout` flows left to right; `'placed'`: explicit positions |
| `cols` | no | 8 | 1–12 |
| `layout` | grid | | Array of control tokens. Unknown tokens render as empty cells at runtime and fail validation (V-041) |
| `rows`, `cells` | placed | | `cells[]`: `{ token, col, row, colSpan?, rowSpan? }`, 1-based, MUST stay inside `cols` × `rows` and MUST NOT overlap (V-045) |
| `noEdit` | no | `false`; always `true` for `placed` | Edit mode refuses the page |
| `hiddenByDefault` | no | false | Tab hidden until enabled in settings |
| `scroll` | no | | `true`/`false` forces the scrollable-page setting for this page |
| `legacyIds` | no | | Retired page ids. Settings (`navPages`, `autoHomePage`), `?page=`, the last-page key and layout import map them to `id` (DETAILED-DESIGN §12.1). MUST NOT collide with any page `id` or other `legacyIds` entry (V-047) |

Comments such as `/* ROW 1 */` in `layout` are for humans; the audit tool compares them with rendered rows.

## 12. Templates

```javascript
templates: {
  ltsDimmer: {
    type: 'multi', group: 'lts', style: 'int',
    positions: [{ label: 'OFF' }, { label: 'LOW' }, { label: 'BRT' }],
    state: { map: 'ohDimmer' }
  }
},
controls: {
  lts_instrIndir: { use: 'ltsDimmer', label: 'INSTR INDIR',
    action: 'script:SSP_OH_DIMMER_INSTR_INDIR_CYCLE', state: 'L:var_InstrumentIndirectLightingKnob' }
}
```

Expansion (normative):

1. Collect layers: the templates named in `use` (left to right), each first expanded recursively (max depth 4; cycles are V-011), then the control itself.
2. In every layer, normalise state-spec fields (`state`, `value`, `enabled`) from a string to `{ src: string }`.
3. Merge layers left to right: for each key, if both values are plain objects the result is a shallow merge (later keys win); otherwise the later value replaces the earlier one. Arrays (e.g. `positions`, `rows`, `tags`) are replaced, never concatenated.
4. Remove `use`.

In the example, `state` becomes `{ map: 'ohDimmer', src: 'L:var_InstrumentIndirectLightingKnob' }`.

## 13. Scripts (AxisAndOhs)

`scripts` maps script labels to RPN. `tools/pk-build-xml.js` writes `<dir>/<scriptsXml>` in the format AxisAndOhs imports:

```xml
<?xml version="1.0" encoding="utf-8"?>
<ScriptList xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <scripts>
    <Script><group>bksq-tbm-panel</group><label>SSP_TBM_OH_GYRO_TOGGLE</label><script><![CDATA[...]]></script></Script>
  </scripts>
</ScriptList>
```

Labels are written in the order they appear in `scripts`, library scripts after pack scripts. RPN MUST NOT contain `]]>` (V-062). Without `scripts`, `scriptsXml` names an external XML that is read, never written.

## 14. Theme

```javascript
theme: {
  vars:   { '--pk-bg': '#0b0f12', '--pk-accent': '#3fb950' },
  groups: { lts: { bg: '#2b2410', fg: '#ffd27a', border: '#6b5320' } },
  styles: { int: { bg: '#33290f' } }
}
```

- `vars`: only names in the theme variable table (DETAILED-DESIGN §11.2); others warn (V-050).
- `groups.<group>` and `styles.<style>`: any of `bg`, `fg`, `border`, `on` (lit indicator/lamp colour). A style overrides the group colours of any control that sets it.
- Values MUST NOT contain `;`, `{`, `}`, `<` or `>` (V-051).

## 15. Mock data

```javascript
mock: {
  values: { 'L:var_MasterPanelLights,Bool': 1, 'A:CIRCUIT SWITCH ON:57,Bool': 0 },
  rules: {
    'script:SSP_TBM_OH_GYRO_TOGGLE': [{ toggle: 'A:CIRCUIT SWITCH ON:57,Bool' }],
    'script:SSP_ECS_BLEED_MODE_INC': [{ adjust: 'L:var_bleedState,Number', by: 1, min: 0, max: 5 }]
  },
  drift: { 'A:GENERAL ENG OIL PRESSURE:1,psi': [55, 65] }
}
```

Keys use canonical source keys (§8.1) and canonical action strings. Rule ops: `toggle`, `set` + `value`, `adjust` (as §10.2), `cycle` (as §10.2). `drift` makes a value wander inside `[min, max]` for readout testing.

## 16. Merge and precedence

Layers, later wins: **engine defaults → vendor → libraries (in `uses` order) → pack → pilot data** (saved settings, saved layouts).

| Kind of field | Rule |
|---------------|------|
| Dictionaries: `templates`, `maps`, `formats`, `scripts`, `theme.groups`, `theme.styles` | Union by key; a later layer replaces the whole entry |
| Settings-like: `conventions`, `settingsDefaults`, `theme.vars` | Union by key; later wins per key |
| `controls` | Pack ids and `<alias>.<id>` library ids never collide; `overrides` merges one level into library controls |
| Scalars and arrays | Later replaces |

## 17. Layout export / import

Edit mode exports and imports:

```json
{ "format": "panelkit-layout", "version": 1, "pack": "blacksquare.starship", "page": "overhead", "cols": 8, "layout": ["lts_master", "empty"] }
```

```json
{ "format": "panelkit-layouts", "version": 1, "pack": "blacksquare.starship", "pages": { "overhead": { "cols": 8, "layout": ["lts_master"] } } }
```

Import MUST also accept: legacy `bksq-layout` / `bksq-layouts` (field `aircraft` matched against the pack's `legacyIds`), and a bare `{ "layout": [...], "cols": n }`. Non-string tokens become `empty`; `cols` outside 1–12 falls back to the page's `cols`; unknown pages are skipped with a notice; a pack mismatch asks for confirmation. Schema: [schemas/layout-export.schema.json](schemas/layout-export.schema.json).

## 18. Validation rules

Levels: **error** fails `tools/pk-validate.js` (exit code 1); **warn** is printed; **info** appears only in the audit report. The runtime collects the same problems and shows them in the dev overlay (`?debug=1`).

| Id | Level | Rule |
|----|-------|------|
| V-001 | error | Missing or wrong `format`, or unsupported `version` |
| V-002 | error | Data not JSON-compatible |
| V-003 | error | Identifier does not match its pattern (§2) |
| V-004 | error | Duplicate id (catalog entries, pages in a pack, behaviors) |
| V-005 | error | Catalog file missing, or the file defines a different id |
| V-006 | error | Catalog `uses` differs from the pack's `uses` |
| V-007 | error | `extends` names a vendor not in the catalog |
| V-008 | error | `uses` names an unknown library, or two libraries share an alias |
| V-010 | error | Control has no `type` after expansion, or the type is unknown |
| V-011 | error | Unknown template, template cycle, or depth > 4 |
| V-012 | error | Required field for the type missing ([WIDGETS.md](WIDGETS.md) §2) |
| V-013 | warn | Field not known for the type (typo guard) |
| V-014 | error | Reserved control id, or id contains `.` |
| V-015 | error | `span` not an integer 1–4, or wider than the page |
| V-016 | warn | Interactive control with empty label |
| V-017 | error | `overrides` targets an unknown library control |
| V-018 | error | `multi` has fewer than 2 or more than 6 positions |
| V-019 | warn | Library template/map/format name not prefixed with its alias |
| V-020 | error | Source string cannot be parsed, or unknown kind |
| V-021 | error | `A:` / `E:` source without unit |
| V-022 | error | Source kind not supported by the pack's adapter |
| V-023 | error | Unknown map or format name |
| V-024 | error | `test` has zero or several operators, or an unknown one |
| V-025 | warn | `everyMs` below 100 or above 10000 |
| V-026 | error | State spec with zero or several producers (`src`, `first`, `pick`, `when`, `any`, `all`), an empty list, `pick` without `index`, or `fallback` without `src` |
| V-030 | error | Action cannot be parsed, or unknown op |
| V-031 | error | `script:` label not in scripts (or in the external `scriptsXml`), or neither exists |
| V-032 | error | `set`/`adjust`/`cycle` target not settable, or not supported by the adapter |
| V-033 | error | Behavior id not registered, or method missing |
| V-034 | error | `cycle` without `values`, or `adjust` without `by` |
| V-035 | error | `script:` action but no `scriptGroup` resolvable |
| V-036 | warn | `rpn:` action (adapter-specific) |
| V-037 | warn | `switch` action with no `cases` and no `default` |
| V-040 | error | Page without `layout` (grid) or `cells` (placed) |
| V-041 | error | Unknown token in a layout or placed cell |
| V-042 | warn | Same control placed twice on one page |
| V-043 | warn | Grid width not a multiple of `cols` (ragged last row) |
| V-044 | error | `cols` not an integer 1–12 |
| V-045 | error | Placed cell out of bounds or overlapping |
| V-046 | info | Control not placed on any page |
| V-047 | error | Duplicate page id, or a page `legacyIds` entry equal to a page id or another legacy id |
| V-050 | warn | Unknown theme variable |
| V-051 | error | Theme value contains a forbidden character |
| V-052 | warn | Group or style used by a control has no theme entry |
| V-060 | error | Script labels that differ only in case |
| V-061 | info | Script defined but not used by any action |
| V-062 | error | RPN contains `]]>` |
| V-070 | warn | Mock rule key is not a known script action |
| V-080 | warn | Unknown `settingsDefaults` key |
| V-081 | error | `settingsDefaults` value outside its range |
| V-090 | error | `storageKey` contains `:` (non-default) |

## 19. Versioning

- `version` is an integer per format. Adding optional fields does not change it.
- A breaking change bumps the version; the engine then supports both versions for at least one release, and `tools/pk-validate.js` reports which files need upgrading.
- The engine exposes `PK.FORMAT_VERSION` (highest supported).

## 20. Complete example

The demo pack used by tests and the gallery (`packs/examples/demo/pack.js`, adapter `mock`):

```javascript
PK.definePack({
  format: 'panelkit-pack',
  version: 1,
  id: 'examples.demo',
  title: 'Demo (mock)',
  adapter: 'mock',
  conventions: { scriptGroup: 'demo-panel' },
  maps: { dimmer3: { ranges: [{ lt: 25, out: 0 }, { lt: 75, out: 1 }], default: 2, missing: 0 } },
  formats: { psi: { decimals: 0, suffix: ' PSI' } },
  templates: {
    dimmer: { type: 'multi', group: 'lts', positions: [{ label: 'OFF' }, { label: 'LOW' }, { label: 'BRT' }], state: { map: 'dimmer3' } }
  },
  controls: {
    lts_nav: { type: 'toggle', label: 'NAV', action: 'script:DEMO_NAV_TOGGLE', state: 'L:demo_nav,Bool' },
    lts_panel: { use: 'dimmer', label: 'PANEL', action: 'script:DEMO_PANEL_CYCLE', state: 'L:demo_panel' },
    eng_start: { type: 'hold', label: 'START', action: 'script:DEMO_START', holdMs: 1500, confirm: true },
    eng_oil: { type: 'readout', label: 'OIL', value: { src: 'A:GENERAL ENG OIL PRESSURE:1,psi', everyMs: 500 }, format: 'psi' },
    ecs_fan: { type: 'stepper', label: 'FAN', dec: { adjust: 'L:demo_fan', by: -1, min: 0, max: 5 },
      inc: { adjust: 'L:demo_fan', by: 1, min: 0, max: 5 }, value: 'L:demo_fan', format: { decimals: 0 } },
    ecs_mode: { type: 'multi', label: 'MODE', advance: 'bounce',
      positions: [{ label: 'OFF', value: 0 }, { label: 'AUTO', value: 1 }, { label: 'MAN', value: 2 }],
      action: { cycle: 'L:demo_mode', values: [0, 1, 2], mode: 'bounce' }, state: 'L:demo_mode' },
    hdr_ecs: { type: 'label', label: 'ENVIRONMENT' }
  },
  pages: [
    { id: 'main', label: 'Main', navLabel: 'MAIN', cols: 4, layout: [
      'lts_nav', 'lts_panel', 'eng_start', 'eng_oil',
      'hdr_ecs', 'ecs_fan', 'ecs_mode', 'empty'
    ] }
  ],
  scripts: {
    DEMO_NAV_TOGGLE: '(L:demo_nav, Bool) ! (>L:demo_nav, Bool)',
    DEMO_PANEL_CYCLE: '(L:demo_panel, Number) 50 + 150 % (>L:demo_panel, Number)',
    DEMO_START: '1 (>L:demo_start, Bool)'
  },
  mock: {
    values: { 'L:demo_nav,Bool': 0, 'L:demo_panel,Number': 0, 'L:demo_fan,Number': 2, 'L:demo_mode,Number': 0 },
    rules: {
      'script:DEMO_NAV_TOGGLE': [{ toggle: 'L:demo_nav,Bool' }],
      'script:DEMO_PANEL_CYCLE': [{ cycle: 'L:demo_panel,Number', values: [0, 50, 100] }]
    },
    drift: { 'A:GENERAL ENG OIL PRESSURE:1,psi': [55, 65] }
  }
});
```
