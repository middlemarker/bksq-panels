# PanelKit — authoring guide (new aircraft and vendors)

This guide takes you from nothing to a working panel for a new aircraft. It uses a fictional vendor **ExampleSim** and aircraft **Cub**. Field reference: [PACK-FORMAT.md](PACK-FORMAT.md); control types: [WIDGETS.md](WIDGETS.md).

> PanelKit is a design in progress. Until its work packages land, the tools and files named here do not exist yet; the v0.3 authoring steps in `docs/DEVELOPER-GUIDE.md` still apply to the shipped aircraft.

## 1. Before you start

You need, for each cockpit control you want on the panel:

1. **What to send** when it is tapped: an AxisAndOhs script (RPN), a sim key event (`TOGGLE_NAV_LIGHTS`), or a variable to write.
2. **What to read** to show its state: an L-var (`L:var_NavLights,Bool`), an A-var (`A:LIGHT NAV,Bool`), or nothing.

Find L-vars with the MSFS developer mode *Behaviors* window (hover a switch, read its `(L:...)` expressions) or the aircraft's documentation. Test RPN in AxisAndOhs before putting it in the pack.

## 2. Create the files

```text
node tools/pk-new-pack.js --vendor examplesim --vendor-title "ExampleSim" --aircraft cub --title "Cub"
```

This creates:

```text
packs/examplesim/vendor.js          (only if the vendor is new)
packs/examplesim/cub/pack.js        skeleton with one page and one control
packs/examplesim/cub/README.md      pilot-facing notes
```

and adds the vendor and pack to `packs/catalog.js`. Open the result at `panel.html?pack=examplesim.cub&adapter=mock` in a desktop browser; it works without a simulator.

## 3. Fill in the pack header

```javascript
PK.definePack({
  format: 'panelkit-pack',
  version: 1,
  id: 'examplesim.cub',
  title: 'Cub',
  extends: 'examplesim',
  conventions: { scriptGroup: 'examplesim-cub-panel' },
  settingsDefaults: { pollIntervalMs: 100 },
  controls: {},
  pages: [],
  scripts: {}
});
```

`scriptGroup` is the AxisAndOhs script group. Every `script:` action becomes `(>K:<scriptGroup>-<LABEL>)`. Choose a group name unique to this aircraft.

## 4. Write scripts

Put each RPN snippet under a label. Use one prefix per aircraft and system, upper case:

```javascript
scripts: {
  CUB_LTS_NAV_TOGGLE: '(L:var_NavLights, Bool) ! (>L:var_NavLights, Bool)',
  CUB_ELEC_MASTER_TOGGLE: '1 (>K:TOGGLE_MASTER_BATTERY)',
  CUB_ENG_MAGS_CYCLE: '(L:var_Mags, Number) 1 + 4 % (>L:var_Mags, Number)'
}
```

`node tools/pk-build-xml.js examplesim.cub` writes `packs/examplesim/cub/aao-scripts.xml`. Pilots import that file into AxisAndOhs once.

## 5. Define controls — recipes

Control ids look like `<system>_<name>` (`lts_nav`). The part before `_` becomes the colour group and the picker chip unless you set `group`.

### 5.1 Push button (no state)

```javascript
elec_genReset: { type: 'button', label: 'GEN RESET', action: 'script:CUB_ELEC_GEN_RESET' }
```

### 5.2 On/off switch with an L-var

```javascript
lts_nav: { type: 'toggle', label: 'NAV LTS', action: 'script:CUB_LTS_NAV_TOGGLE', state: 'L:var_NavLights,Bool' }
```

### 5.3 On/off switch read from an A-var, with a fallback

```javascript
elec_master: { type: 'toggle', label: 'MASTER', action: 'script:CUB_ELEC_MASTER_TOGGLE',
  state: { src: 'L:var_BatteryMaster,Bool', fallback: 'A:ELECTRICAL MASTER BATTERY,Bool' } }
```

The fallback is only registered with the simulator if the L-var turns out to be missing.

### 5.4 Switch whose "on" value is not 1

```javascript
ice_pitot: { type: 'toggle', label: 'PITOT HT', action: 'script:CUB_ICE_PITOT',
  state: { src: 'L:var_PitotHeat', test: { eq: 100 } } }
```

### 5.5 Three-position switch that cycles itself in the sim

```javascript
lts_panel: { type: 'multi', label: 'PANEL LTS', action: 'script:CUB_LTS_PANEL_CYCLE',
  positions: [{ label: 'OFF' }, { label: 'DIM' }, { label: 'BRT' }],
  state: { src: 'L:var_PanelLightKnob', map: 'knob3' } }
```

with a map in the pack (or vendor):

```javascript
maps: { knob3: { ranges: [{ lt: 25, out: 0 }, { lt: 75, out: 1 }], default: 2, missing: 0 } }
```

### 5.6 Selector with one script per position (bounce: OFF → LOW → HIGH → LOW → OFF)

```javascript
ecs_fan: { type: 'multi', label: 'FAN', advance: 'bounce',
  positions: [
    { label: 'OFF',  value: 0, action: 'script:CUB_FAN_OFF' },
    { label: 'LOW',  value: 1, action: 'script:CUB_FAN_LOW' },
    { label: 'HIGH', value: 2, action: 'script:CUB_FAN_HIGH' }
  ],
  state: 'L:var_FanSpeed' }
```

### 5.7 Selector the sim does not report (remember it locally)

Leave out `state`; the engine remembers the position and shows it immediately.

```javascript
avncs_dhMode: { type: 'multi', label: 'DH MODE', advance: 'bounce', initial: 1,
  positions: [
    { label: 'TEST', action: 'script:CUB_DH_TEST' },
    { label: 'NORM', action: 'script:CUB_DH_NORM' },
    { label: 'SET',  action: 'script:CUB_DH_SET' }
  ] }
```

### 5.8 Write a variable directly (no script)

```javascript
ecs_heatInc: { type: 'button', label: 'HEAT +', action: { adjust: 'L:var_CabinHeat', by: 10, min: 0, max: 100 } }
eng_mags:    { type: 'multi', label: 'MAGS',
  positions: [{ label: 'OFF' }, { label: 'R' }, { label: 'L' }, { label: 'BOTH' }],
  action: { cycle: 'L:var_Mags', values: [0, 1, 2, 3] }, state: 'L:var_Mags' }
```

Only switch between two positions, and never leave OFF from the panel:

```javascript
elec_gen: { type: 'multi', label: 'GEN',
  positions: [{ label: 'OFF', value: 0 }, { label: 'MAIN', value: 1 }, { label: 'STBY', value: 2 }],
  action: { cycle: 'L:var_GenSwitch', values: [1, 2], onUnknown: 'skip' }, state: 'L:var_GenSwitch' }
```

### 5.9 Different action depending on state

```javascript
avncs_xpdrPwr: { type: 'toggle', label: 'XPDR', state: { src: 'A:TRANSPONDER STATE:1,Enum', test: { ne: 0 } },
  action: { switch: 'A:TRANSPONDER STATE:1,Enum',
    cases: { '0': 'script:CUB_XPDR_STBY' }, default: 'script:CUB_XPDR_OFF' } }
```

### 5.10 Stepper with readout and hold-to-repeat

```javascript
avncs_baro: { type: 'stepper', label: 'BARO', repeatMs: 120,
  dec: 'k:KOHLSMAN_DEC', inc: 'k:KOHLSMAN_INC',
  value: { src: 'A:KOHLSMAN SETTING HG:1,inHg', everyMs: 250 }, format: { decimals: 2 } }
```

### 5.11 Readouts

```javascript
eng_oilP:  { type: 'readout', label: 'OIL P', value: { src: 'A:GENERAL ENG OIL PRESSURE:1,psi', everyMs: 500 },
  format: { decimals: 0, suffix: ' PSI' } },
avncs_wxr: { type: 'readout', label: 'WX MODE', value: { src: 'L:var_radarMode', clamp: [0, 5], round: 0 },
  format: { enum: ['OFF', 'STBY', 'TST', 'ON', 'NAV', 'LOG'] } },
elec_volts: { type: 'gauge', label: 'VOLTS', rows: [
  { left: 'BUS', value: { src: 'A:ELECTRICAL MAIN BUS VOLTAGE,volts', everyMs: 500 }, format: { decimals: 1 } }
] }
```

A readout picking one of several values by a selector knob:

```javascript
elec_meter: { type: 'readout', label: 'METER', format: { decimals: 1, suffix: ' V' },
  value: { pick: { index: 'L:var_MeterSelect', from: ['L:var_BusVoltsL', 'L:var_BusVoltsR', 'L:var_BattVolts'] } } }
```

### 5.12 Test buttons

```javascript
lts_annTest: { type: 'hold', label: 'ANN TEST', action: 'script:CUB_ANN_TEST', holdMs: 2000 }
lts_fireTest: { type: 'hold', label: 'FIRE TEST', mode: 'momentary',
  action: { set: 'L:var_FireTest,Bool', value: 1 }, release: { set: 'L:var_FireTest,Bool', value: 0 } }
```

### 5.13 Guarded and conditional controls

```javascript
eng_fireExt: { type: 'button', label: 'FIRE EXT', action: 'script:CUB_FIRE_EXT', confirm: 'DISCHARGE?' }
ecs_manHeat: { type: 'stepper', label: 'MAN HEAT', dec: 'script:CUB_HEAT_DEC', inc: 'script:CUB_HEAT_INC',
  enabled: { src: 'L:var_HeatMode', test: { eq: 0 } } }
```

### 5.14 Two events with one tap

```javascript
lts_allOff: { type: 'button', label: 'ALL LTS OFF', action: { seq: ['script:CUB_NAV_OFF', 'script:CUB_STROBE_OFF'], gapMs: 50 } }
```

### 5.15 Section heading

```javascript
hdr_engine: { type: 'label', label: 'ENGINE' }
```

## 6. Remove repetition with templates

When several controls share a shape, put the shared part in a template:

```javascript
templates: {
  dimmer: { type: 'multi', group: 'lts', style: 'int',
    positions: [{ label: 'OFF' }, { label: 'LOW' }, { label: 'BRT' }], state: { map: 'knob3' } }
},
controls: {
  lts_instr: { use: 'dimmer', label: 'INSTR', action: 'script:CUB_INSTR_CYCLE', state: 'L:var_InstrKnob' },
  lts_flood: { use: 'dimmer', label: 'FLOOD', action: 'script:CUB_FLOOD_CYCLE', state: 'L:var_FloodKnob' }
}
```

The control's `state` string is merged with the template's `state` object, so the map is kept. Arrays such as `positions` are replaced, not merged.

## 7. Lay out pages

```javascript
pages: [
  { id: 'main', label: 'Main panel', navLabel: 'MAIN', cols: 6, layout: [
    /* ROW 1: electrical */ 'elec_master', 'elec_gen', 'elec_volts', 'empty', 'empty', 'empty',
    /* ROW 2: lights */     'lts_nav', 'lts_panel', 'lts_instr', 'lts_flood', 'empty', 'empty',
    /* ROW 3: engine */     'hdr_engine', 'eng_mags', 'eng_oilP', 'eng_fireExt', 'empty', 'empty'
  ] },
  { id: 'avionics', label: 'Avionics', navLabel: 'AVN', cols: 6, layout: [
    'avncs_xpdrPwr', 'avncs_baro', 'avncs_wxr', 'avncs_dhMode', 'empty', 'empty'
  ] }
]
```

- Keep each row's cells on one line with a `/* ROW n: … */` comment; the audit checks the comment against the rendered rows.
- Fill gaps with `'empty'` so rows stay aligned. A control with `span: 2` uses two columns.
- Use 8 columns for iPad-sized panels unless you have a reason not to. Pilots can change columns and move controls in edit mode.
- For a page that must mirror a physical arrangement (controls at fixed positions, nothing movable), use `kind: 'placed'` with `cells` ([PACK-FORMAT.md](PACK-FORMAT.md) §11). Edit mode is off for those pages.

## 8. Colours

```javascript
theme: {
  groups: {
    lts:  { bg: '#2b2410', fg: '#ffd27a', border: '#6b5320' },
    elec: { bg: '#10202b', fg: '#9ad0ff', border: '#20506b' }
  },
  styles: { int: { bg: '#33290f' } }
}
```

`groups` colour a whole system; `styles` (set with `style: 'int'` on a control or template) override the group colours for that control, whatever its group. Put colours in the vendor profile when all your aircraft share them; override per pack only where they differ.

## 9. When you have a second aircraft: the vendor profile

Move shared things from the pack into `packs/examplesim/vendor.js`: `theme`, `templates`, `maps`, `formats`, `settingsDefaults`, and the script-group pattern:

```javascript
conventions: { scriptGroup: 'examplesim-{aircraft}-panel' }
```

Each pack then only needs `extends: 'examplesim'`.

## 10. Reusing a control set: libraries

If several aircraft share a unit (an autopilot head, a radio), define it once:

```javascript
PK.defineLibrary({
  format: 'panelkit-library', version: 1,
  id: 'examplesim.ap100', title: 'AP-100 autopilot', defaultAlias: 'ap',
  controls: {
    master: { type: 'toggle', label: 'AP', group: 'ap', action: 'script:AP100_MASTER', state: 'L:ap100_master,Bool' },
    hdg:    { type: 'toggle', label: 'HDG', group: 'ap', action: 'script:AP100_HDG', state: 'L:ap100_hdg,Bool' }
  },
  scripts: { AP100_MASTER: '(L:ap100_master, Bool) ! (>L:ap100_master, Bool)', AP100_HDG: '(L:ap100_hdg, Bool) ! (>L:ap100_hdg, Bool)' }
});
```

List it in the catalog, add `uses: ['examplesim.ap100']` to the pack (and the catalog entry), and place `ap.master`, `ap.hdg` in layouts. Change one label for this aircraft with `overrides: { 'ap.hdg': { label: 'HDG SEL' } }`.

## 11. Custom code (last resort)

If no recipe fits, write a behavior in `behaviors.js` and add the file to the catalog entry's `files`. Read [WIDGETS.md](WIDGETS.md) §12 first: behaviors use only the `api` object, never globals or raw timers.

## 12. Validate and test

```text
node tools/pk-validate.js examplesim.cub
node tools/pk-build-xml.js examplesim.cub
node tools/check-es5.js
```

1. Fix every **error**; read every **warn**.
2. Desktop: open `panel.html?pack=examplesim.cub&adapter=mock&debug=1`. Add `mock.values` and `mock.rules` so switches respond.
3. Gallery: `panelkit/dev/gallery.html?pack=examplesim.cub` shows every control with mock data.
4. Device: import `aao-scripts.xml` into AxisAndOhs, open the hub on the iPad, select the aircraft, and check every control against the sim.

## 13. Checklist

- [ ] Every control on a page has a real action and, where the sim reports it, a state.
- [ ] `pk-validate` passes with no errors.
- [ ] `aao-scripts.xml` regenerated and committed.
- [ ] Pack `README.md` lists pages, setup steps (XML import) and known limitations.
- [ ] Tested with the mock adapter and on a device.
- [ ] Repository docs updated per `AGENTS.md` (catalog/aircraft list in `README.md`, `CHANGELOG.txt`).

## 14. Common mistakes

| Symptom | Cause | Rule |
|---------|-------|------|
| Validator: unknown token | Typo in a layout entry | V-041 |
| Button does nothing in the sim | Script not imported in AxisAndOhs, or wrong `scriptGroup` | V-031, V-035 |
| Lamp never lights | Wrong unit (`Bool` vs `Number`) or the on-value is not 1 (use `test`) | — |
| A-var rejected | Missing unit after the comma | V-021 |
| Two controls share a look by copy-paste | Use a template | — |
| Label shows `&rarr;` literally | Labels are plain text; type `→` | ADR-008 |
