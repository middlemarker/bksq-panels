# PanelKit — migration from v0.3

How the Black Square Starship and TBM 850 move from the legacy engine (`common/`, `aircraft/`) to PanelKit packs without losing anything pilots rely on. Work packages WP-22 and WP-24 … WP-28 in [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) carry this out.

## 1. Principles

1. **Side by side.** Legacy files stay untouched and keep working until switch-over (ADR-010).
2. **Same ids.** Every legacy layout token becomes a control id with the same spelling (ADR-011).
3. **Same storage.** Each pack's `storageKey` is its legacy key, so settings and saved layouts carry over.
4. **Same layouts.** Shipped page layouts are converted 1:1, including empty cells and row order. Layout problems are reported, not fixed (`AGENTS.md` rule 3).
5. **Prove parity before switching** (§7).

## 2. Concept mapping

| v0.3 | PanelKit |
|------|----------|
| `window.BKSQ_AIRCRAFT` in `aircraft.js` | Pack header (`id`, `title`, `storageKey`, `conventions.scriptGroup`, `settingsDefaults`) + `pages[]` |
| `eventGroup` | `conventions.scriptGroup` |
| `pages[].href` + one HTML file per page | `pages[]` entry; one shared `panel.html` |
| `pages[].noEdit` + panel `layoutEditDisabled` | `pages[].noEdit` (forced for `kind: 'placed'`) |
| `config/buttons.js` token → `{ html, polls }` | `controls.<token>` → `{ type, label, action, state, ... }` |
| `SSPPanelHelpers.sendButton(cls, label, 'SSP_X')` | `type: 'button'`, `action: 'script:SSP_X'`, `style` from `cls` |
| `sendButton` with `ind` + `toggle` poll | `type: 'toggle'`, `state: 'L:<lvar>,<type>'` (+ `test` when `on` ≠ 1) |
| `toggleA` poll | `state: 'A:<expr>'` |
| `toggleOr` poll | `state: { any: [...] }` or `{ all: [...] }` |
| `holdButton` / `SSPRuntime.testHold` + `testLatched` poll | `type: 'hold'`, `holdMs`, `state` |
| `dual(...)` + `lamps` poll + `lampMaps.<name>` | `type: 'multi'`, `positions`, `state: { src, map }`, map in vendor/pack `maps` |
| `gauge({...})` + `lvarText`/`avarText` polls | `type: 'gauge'` or `type: 'readout'` with `format` |
| `placeholder('—')` / `empty` | built-in `empty` |
| `custom` poll + `SSP_PANEL_OVERRIDES.polls[id]` | Declarative control, or a behavior (§6) |
| `SSP_PANEL_OVERRIDES.onPoll(pageId)` | Declarative controls, or behaviors (§6) |
| `everyMs` on a poll | `everyMs` on the state spec |
| `getAVarIfMissing(primary, fallback)` | `fallback` / `first` (lazy) |
| `bksq-*-scripts.xml` (hand-maintained) | `pack.scripts` → generated `aao-scripts.xml` |
| `check-manifest.js` | V-031 in `pk-validate.js` |
| `tools/audit-layouts.js` | `pk-validate.js` + audit mode (V-041 … V-046) |
| CSS `.g-<name>` colour classes | `style: '<name>'` + `theme.styles.<name>` in the vendor profile |
| `SSP_LAYOUT_STORE`, `bksq-layout(s)` JSON | `PK.store`, `panelkit-layout(s)` JSON (legacy accepted on import) |

## 3. File mapping

| Legacy | PanelKit |
|--------|----------|
| `aircraft/starship/aircraft.js` | `packs/blacksquare/starship/pack.js` (header + pages) |
| `aircraft/starship/config/buttons.js` | same `pack.js` (`controls`, `templates`) |
| `aircraft/starship/config/panels/*.js` | same `pack.js` (`pages[].layout`) |
| `aircraft/starship/panels/overrides.js` | declarative controls + `packs/blacksquare/starship/behaviors.js` |
| `aircraft/starship/bksq-starship-scripts.xml` | `pack.scripts` → `packs/blacksquare/starship/aao-scripts.xml` |
| `aircraft/starship/pages/*.html` | redirects to `panel.html` (switch-over) |
| `aircraft/tbm850/common.js` (`window.TBM`) | declarative controls (no behaviors expected) |
| `aircraft/tbm850/panels/overrides.js` | declarative controls |
| shared colours in `common/common.css` (`.g-*`) | `packs/blacksquare/vendor.js` `theme.styles` |
| `aircraft/*/README.md`, `CONFIG.md` | `packs/blacksquare/<aircraft>/README.md` (pilot setup) — CONFIG content moves into pack comments |

## 4. User data compatibility

| Data | Legacy key / form | PanelKit handling |
|------|-------------------|-------------------|
| Settings | `bksq-starship-ui-settings-v1`, `bksq-tbm850-ui-settings-v1` | Pack `storageKey` = legacy key; same setting names and ranges (DETAILED-DESIGN §12) |
| Saved layouts | `<storageKey>:layout:<pageId>` = `{ layout, cols }` | Same key and shape; tokens = control ids |
| Recent picks, last page | `:edit-recent`, `:last-page` | Same keys |
| Last aircraft | `bksq-panels-last-aircraft` = `starship` / `tbm850` | Mapped once through catalog `legacyIds` to `pk:last-pack` |
| Page ids | `overhead`, `ecs`, `antiice`, … / `overhead`, `avionics`, `efb` | Same page ids. Page `aliases` (TBM `avnenv`, retired in v0.4) become `pages[].legacyIds`; the settings loader maps them the same way |
| Bookmarks | `aircraft/<ac>/pages/<file>.html[?edit=1]` | Each legacy page file becomes a redirect to `panel.html?pack=blacksquare.<ac>&page=<id>` keeping `edit=1` |
| Exported JSON | `bksq-layout`, `bksq-layouts` with `aircraft` | Accepted on import (PACK-FORMAT §17) |

## 5. Legacy importer (`tools/pk-import-legacy.js`)

Produces a first draft of a pack from the legacy files. The draft is then completed by hand (§6) and validated.

```text
node tools/pk-import-legacy.js starship > packs/blacksquare/starship/pack.js
node tools/pk-import-legacy.js tbm850   > packs/blacksquare/tbm850/pack.js
```

Algorithm:

1. Run `aircraft.js`, `common/panel-builder.js`, `config/buttons.js` and every `config/panels/*.js` in a `vm` sandbox, exactly as `tools/audit-layouts.js` does, capturing the buttons dictionary, each panel spec (layout, cols, flags) and the source text of each panel file (for row comments).
2. For each token, classify by its HTML and polls:

| Legacy pattern | Draft control |
|----------------|---------------|
| root `<button>` with `onclick="sendP('X')"` or `sendTbmP('X')`, no polls | `button`, `action: 'script:X'` |
| same + `toggle` poll | `toggle`, `state: 'L:<lvar>,<lvarType>'`, plus `test: { eq: <on> }` when `on` ≠ 1 |
| same + `toggleA` poll | `toggle`, `state: 'A:<expr>'` |
| same + `toggleOr` poll | `toggle`, `state: { any: [...] }` (`combine: 'and'` → `all`) |
| `onclick="SSPRuntime.testHold('X', ms, 'id')"` (+ `testLatched`) | `hold`, `action: 'script:X'`, `holdMs: ms`, `state` from the poll |
| `dual` markup (`.hdr` + `.row` lamps) + `lamps` poll | `multi`, `positions` from the row labels, `state: { src: 'L:<lvar>,<type>', map: '<map>' }`, `action` from `onclick` |
| `gauge` markup + `lvarText`/`avarText` polls | `gauge` rows or `readout`, `format: { decimals }` from the poll |
| `placeholder` | omit (layouts use `empty`) |
| any other `onclick` (`cycleGenL()`, `TBM.toggleAuxBp()`, …) | `button` with `action: 'script:TODO_<function>'` and a `TODO` comment; resolved by §6 |
| `custom` poll ids | listed in the report; resolved by §6 |

3. Class `btn g-<name>` → `style: '<name>'`. Group stays the token prefix (keeps v0.3 picker chips).
4. Labels: decode entities to Unicode (`&rarr;` → `→`, `&deg;` → `°`, `&minus;` → `−`, `&amp;` → `&`), `<br>` → `\n`, strip any other tags.
5. `lampMaps` functions used by the aircraft → `maps` entries using the table in §6.3.
6. Pages from `aircraft.js` `pages[]` (id, label, navLabel, `noEdit`) with layouts and `cols` from the panel specs; row comments copied from the source text.
7. Scripts: parse the legacy XML; every `<Script>` whose `<group>` equals the aircraft's `eventGroup` → `scripts[label] = rpn` in file order.
8. Print a report to stderr: `TODO` actions, `custom` polls, `onPoll` pages, tokens with ids targeted by override code.

The importer is deterministic (same input → byte-identical output) so it can be re-run while legacy files still change.

## 6. Converting imperative code

### 6.1 TBM 850 (`common.js`, `panels/overrides.js`) — target: no behaviors

| Legacy | Target |
|--------|--------|
Position lists are in the v0.3 lamp order (`config/buttons.js`); `(n)` is the position's `value`, matched against the state result. v0.3 labels never change at runtime (buttons with an indicator carry `data-fixed-label`), so no `labels` field is needed.

| Legacy (token) | Target |
|--------|--------|
| `TBM.toggleSourceSwitch` (`elec_source`) | `multi`, positions GPU (2), BAT (1), OFF (0); `action: 'script:SSP_TBM_OH_SOURCE_TOGGLE'`; `state: { src: 'L:BKSQ_SourceSwitch', map: { values: { '1': 1, '2': 2 }, default: 0 } }` (v0.3 lights OFF for any other value). No `optimistic`: v0.3 re-reads the L-var 80 ms after the tap, which normal polling covers |
| `TBM.toggleGenSwitch` (`elec_generator`) | `multi`, STDBY (2), MAIN (1), OFF (0); `action: { cycle: 'L:BKSQ_GeneratorSwitch', values: [1, 2], onUnknown: 'skip' }` (OFF or no value: tap does nothing); `state: 'L:BKSQ_GeneratorSwitch'` |
| `TBM.toggleFuelSel` (`fuel_sel`) | `multi`, AUTO (1), MAN (0); `action: 'script:SSP_TBM_AVN_FUEL_SEL_AUTO'`; `state: 'A:CIRCUIT SWITCH ON:40,Bool'` |
| `TBM.toggleAuxBp` (`fuel_auxBp`) | `multi`, AUTO (2), ON (1), OFF (0); `action: { cycle: 'L:BKSQ_fuelPumpSwitch', values: [2, 1], onUnknown: 'skip' }`; `state: 'L:BKSQ_fuelPumpSwitch'` |
| `TBM.toggleBleed` (`ecs_bleed`) | `multi`, HI (2), AUTO (1); `action: { cycle: 'L:var_bleedState', values: [2, 1], onUnknown: 'skip' }`; `state: 'L:var_bleedState'` (0 lights neither) |
| `TBM.toggleFanFlow` (`ecs_fanFlow`) | `multi`, AUTO (1), LO (0); `action: 'script:SSP_TBM_ENV_FAN_FLOW_TOGGLE'`; `state: 'L:var_FanSwitch,Bool'` (v0.3 polls it as `Bool`) |
| `TBM.toggleAirCond` (`ecs_airCond`) | `multi`, ON (2), FAN (1), OFF (0); `action: { cycle: 'L:var_airconState', values: [0, 1, 2], mode: 'bounce' }`; `state: 'L:var_airconState'` |
| `TBM.cycleApTrims` (`avncs_apTrims`) | `multi`, ON (2), AP OFF (1), OFF (0); `action: { cycle: 'L:BKSQ_AutopilotMasterSwitch', values: [0, 1, 2], mode: 'bounce' }`; `state: 'L:BKSQ_AutopilotMasterSwitch'` |
| `TBM.cycleWxrMode` (`avncs_wxrMode`) | `readout`, label `WXR MODE`; `value: { src: 'L:var_radarMode', clamp: [0, 5], round: 0 }`; `format: { enum: ['OFF', 'STBY', 'TST', 'ON', 'NAV', 'LOG'] }`; `action: { switch: 'L:var_radarMode', cases: { '4': { set: 'L:var_radarMode', value: 3 }, '5': { set: 'L:var_radarMode', value: 3 } }, default: { cycle: 'L:var_radarMode', values: [0, 1, 2, 3], mode: 'bounce' } }`. The `cases` reproduce v0.3, which steps NAV/LOG down to ON; a plain `cycle` would jump to OFF |
| `TBM.cycleDhMode` (`avncs_dhMode`) | `multi`, positions TEST / NORM / DH SET with actions `script:SSP_TBM_AVN_DH_MODE_TEST` / `_NORM` / `_DH_SET`; no `state`; `initial: 1`; `advance: 'bounce'` (optimistic by default without `state`) |
| `TBM.lightsTest` + `polls.tbmLts` (`lts_test`) | `hold`, label `LTS TST`, `mode: 'latch'`, `holdMs: 2000`, `action: 'script:SSP_TBM_OH_LIGHTS_TEST'`, `state: { src: 'L:var_OverheadLightTestButton', test: { eq: 1 } }` |
| `TBM.toggleXpdrPwr` (`avncs_xpdrPwr`) | `toggle`, label `XPDR PWR`; `state: { src: 'A:TRANSPONDER STATE:1,Enum', test: { ne: 0 } }`; `action: { switch: 'A:TRANSPONDER STATE:1,Enum', cases: { '0': 'script:SSP_TBM_AVN_XPDR_STDBY' }, default: 'script:SSP_TBM_AVN_XPDR_OFF' }` |
| `TBM.toggleXpdrMode` (`avncs_xpdrMode`) | `multi`, ALT (4), STDBY (1); `state: 'A:TRANSPONDER STATE:1,Enum'`; `action: { switch: 'A:TRANSPONDER STATE:1,Enum', cases: { '0': null, '4': 'script:SSP_TBM_AVN_XPDR_STDBY' }, default: 'script:SSP_TBM_AVN_XPDR_ALT' }` |
| `TBM.xpdrIdent` (`avncs_xpdrIdent`) | `toggle`, label `XPDR IDENT`; `action: 'script:SSP_TBM_AVN_XPDR_IDENT'`; `state: { src: 'A:TRANSPONDER IDENT:1,Bool', everyMs: 300 }` |
| `onPoll` branches for `xpdrStateVal`, `xpdrSt0`…`5` | Drop: no TBM token renders these elements |
| `onPoll('avionics')` / `onPoll('overhead')` lamp refreshes | Covered by the `state` specs above |

Known differences, accepted unless the parity review says otherwise:

- Before the first data arrives, v0.3 read `0` and could act (XPDR PWR sent STANDBY). PanelKit ignores the tap until the source has data (PACK-FORMAT §10.2).
- v0.3 kept the bounce direction in one global per function; PanelKit keeps it per control. Same result with one control per variable.

Verify each row against the legacy code while converting; the table is the intended mapping, the code is the truth.

### 6.2 Starship (`panels/overrides.js`) — target: at most two behaviors

| Legacy | Target |
|--------|--------|
| `cycleFwdDeice`, `cycleMainDeice`, `cycleGenL/R`, `cycleStarterL/R`, `cycleAutoFeather`, `cyclePropGov`, `cyclePitchTrim`, `cycleFuelXfer`, `cycleBusTie`, `cycleTempMode`, `cycleBleed`, `bleedInc/Dec`, `cabinAlt*`, `cabinRate*`, `ckptTemp*`, `cabTemp*`, `combTemp*`, `voltSelInc/Dec`, `togglePrkBrk`, `toggleCockCabMode` (each a single `sendP`) | Plain `action: 'script:<label>'` on the control |
| `pulseStdbyPwr`, `aftQtyPush` (hold scripts) | `button` or `hold` with the `_HOLD` script |
| `blowerInc/Dec` (adjust two L-vars) | `action: [{ adjust: 'L:var_CockpitBlowerKnob', by: 1, min: 0, max: 10 }, { adjust: 'L:var_CabinBlowerKnob', by: 1, min: 0, max: 10 }]` |
| `cycleBlower` (`pingPong` on two L-vars) | `seq` of two `cycle` actions, values `[0..10]`, `mode: 'bounce'` |
| `pollEcs` lamps and toggles (`tmManLamp…`, `cockCabBtn`, oxygen, static source) | `multi` / `toggle` state specs with maps; `cpOxy` OR → `any` |
| `pollEcs` numeric readouts (bleed, blowers, press alt, cab alt, diff, rate, pneumatic L/R with A-var fallbacks, oxygen pressure with two fallbacks) | `readout` / `gauge` with `format` and `fallback` / `first` |
| `pollEcs` temperature readouts (°C/°F by `BKSQ_CABINTEMPDISPLAYFORCECELSIUS`, label suffix, computed auto setpoint, OFF in mode 1) | **Behavior** `blacksquare.starship.temp` ([WIDGETS.md](WIDGETS.md) §12) |
| `pollEcs` `dimBtn` (dim temp steppers by mode) | `enabled: { src: 'L:var_EnvironmentalModeKnob', test: { eq: 2 } }` (auto) / `{ eq: 0 }` (manual) |
| `pollPedestal` lamps (gen RST/ON/OFF, bus tie, standby, ignition, autofeather, governor, starters, transfer, pitch trim) | `multi` with `when` (priority) or `map` |
| `pollPedestal` toggles (batt, GPU, ext pwr, batt amps, avionics blower, ground comm, prop sync, pumps, aft tank, roll/rudder trim, park brake) | `toggle` state specs (`any` for the two-spelling aft tank vars) |
| `pollPedestal` voltmeter (`VOLT_SOURCE_LVARS[mode]` with per-mode fallbacks, mode label) | `readout` with `pick: { index: { src: 'L:var_MultimeterMode', missing: 0 }, from: [six first specs] }`; the EXT PWR fallback is `{ when: [{ if: { all: ['L:bksq_ExternalPowerAvailable,Bool', 'L:bksq_ExternalPowerOn,Bool'] }, then: 'const:28.1' }], else: 'const:0' }`; mode label is a second readout or gauge row with `format: { enum: ['L GEN', 'CTR BUS', 'R GEN', 'TRIP FED', 'EXT PWR', 'BATT'] }` |
| `pollPedestal` generator load %, battery amps/load, fuel quantity with KG/LBS and aft-tank selection | **Behavior** `blacksquare.starship.pedestal` (three-level fallback formula with last-good memory; unit switching) |
| `pollPedestal` fuel temperature (Kelvin L-var, Celsius fallbacks) | `readout` with `first` (PACK-FORMAT §8.2 example) |
| XPDR `toggleXpdrPwr`, `toggleXpdrMode`, `xpdrIdent` | Plain actions `script:SSP_AVNCS_XPDR_PWR_TOGGLE`, `_MODE_TOGGLE`, `_IDENT_PRESS` (the Starship scripts toggle in the sim, unlike the TBM). State: power `{ src: 'A:TRANSPONDER STATE:1,Enum', test: { ne: 0 } }`; mode lamps ALT (4) / STDBY (1) on the same source; ident `{ src: 'A:TRANSPONDER IDENT:1,Bool', everyMs: 300 }` |
| `polls.rtu833Both` (COM 8.33 lamp) | `toggle` state `{ all: [{ src: 'A:COM SPACING MODE:1,Enum', test: { ne: 0 } }, { src: 'A:COM SPACING MODE:2,Enum', test: { ne: 0 } }] }` |
| `iceWsL/R`, `iceFwdWing`, `iceMainWing`, `wiper4`, `ohStorm`, `ohDimmer`, `ecsTempMode`, `ecsBleed`, `ecsStatic` lamp maps | `maps` (§6.3) |

If converting reveals logic that fits neither a declarative form nor these two behaviors, stop and record it in the work package report; do not add a third behavior without review (G1).

### 6.3 Lamp maps → `maps`

| Legacy function | `maps` entry |
|-----------------|--------------|
| `wiper4` | `{ values: { '0': 0, '1': 1, '2': 2 }, default: 3 }` |
| `iceWsL`, `iceWsR` | `{ values: { '0': 2, '1': 1 }, default: 0 }` |
| `iceFwdWing`, `iceMainWing`, `ecsTempMode` | `{ values: { '0': 0, '2': 2 }, default: 1 }` |
| `ohStorm` | `{ values: { '0': 0, '1': 1 }, default: 2 }` |
| `ohDimmer` | `{ ranges: [{ lt: 25, out: 0 }, { lt: 75, out: 1 }], default: 2, missing: 0 }` |
| `ecsBleed` | state spec `{ src: 'L:var_BleedAirValveSwitch', round: 0, map: { ranges: [{ lt: 0, out: 0 }, { gt: 5, out: 0 }], missing: 0 } }` |
| `ecsStatic` | `{ values: { '1': 0 }, default: 1 }` |

`ecsBleed` rounds before the range check (PACK-FORMAT §8.2 step 3), so 5.3 shows position 5 where v0.3 showed 0. The bleed switch only reports integers, so this is accepted.

## 7. Parity checklist

Switch-over (WP-28) needs every box ticked for both aircraft, on desktop with the mock adapter and on an iPad mini 2 (iOS 12.5) with the simulator.

**Pilot features**

- [ ] Hub lists both aircraft and remembers the last one (including a legacy `bksq-panels-last-aircraft` value).
- [ ] Every page from v0.3 exists with the same id, tab label and order; hidden-by-default pages behave the same.
- [ ] Nav bar order: tabs → ⌂ → EDIT → gear, identical on panel pages and the hub.
- [ ] Auto-home: set/clear from ⌂ and from settings; returns after the idle time; paused in edit mode.
- [ ] Settings: every v0.3 setting present, same ranges, existing stored values load unchanged.
- [ ] Edit mode: Move/Delete, drag and drop on iOS 12, picker (search, chips, suggestions, recent, hide placed, then-next-empty), undo, palette, cols/rows steppers, reset, JSON export/import (new and legacy formats).
- [ ] Saved v0.3 layouts appear unchanged on first PanelKit load.
- [ ] `?edit=1` and legacy page bookmarks open the right page.
- [ ] Brightness, scrollable mode, fit-to-screen, row alignment, touch flash, reduce motion.

**Per control** (generate the list with `pk-validate --list <pack>`)

- [ ] Label text matches (entities converted).
- [ ] Tap sends the same script label / event as v0.3 (compare with the mock adapter's action log against a v0.3 log captured with a stubbed `webApi`).
- [ ] Lamps/indicators match v0.3 for every state value used by the aircraft.
- [ ] Readouts show the same text for the same inputs (format, decimals, fallbacks).

**Quality**

- [ ] `pk-validate` clean for both packs; generated XML labels equal the legacy XML labels for the aircraft's group.
- [ ] Idle tick causes no DOM writes (instrumented check in the gallery).
- [ ] All verification commands in `AGENTS.md` pass.

## 8. Switch-over and rollback (WP-28, needs user approval)

1. Replace `index.html` with the PanelKit hub (keep the legacy hub as `legacy/index.html`).
2. Replace each `aircraft/<ac>/pages/<file>.html` with a redirect page (meta refresh + `location.replace`) to `panel.html?pack=…&page=…`, preserving `edit=1`.
3. Move legacy engine files to `legacy/` (do not delete in the same change); update docs and `AGENTS.md` (constraints, nav contract, storage keys now describe PanelKit).
4. Tag the release.

Rollback: restore `index.html` and the page files from the previous tag; storage is shared, so no data migration is needed in either direction.
