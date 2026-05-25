# Starship touch panels (Black Square)

Panel pages for the **Black Square Beechcraft Starship** in AAO. These files work as part of the `bksq-panels` package — copy the **whole package root**, not this folder alone.

For full installation instructions see the [root README](../../README.md).

---

## Importing the AAO script file

In AAO, go to **Script List → Import** and add:

```
bksq-panels\aircraft\starship\bksq-starship-scripts.xml
```

This registers the `bksq-starship-panel` script group that the buttons depend on. Without this step, tapping buttons will have no effect in the sim.

---

## Panel pages

| Page | How to open | What's on it |
|------|-------------|--------------|
| **Overhead** | Hub → Starship → Overhead | Flood and area light knobs, display and panel brightness knobs, cabin signs (NO SMOKE, SEAT BELT, etc.), external lights (landing, taxi, wing, nav, strobe, anti-collision), ground safety items (chocks, pitot cover, engine covers, gear pins, control lock, hide yoke) |
| **ECS** | Hub → Starship → ECS | Environmental control system, bleed air, pressurisation, oxygen |
| **Anti-Ice** | Hub → Starship → Anti-Ice | Wing, tail, engine, windshield anti-ice and de-ice controls |
| **Autopilot** | Hub → Starship → Autopilot (AP) | AP master, modes, fire controls, avionics deck switches, chronometer |
| **MFD** | Hub → Starship → MFD | MFD shell and display controls |
| **Misc** | Hub → Starship → Misc | Miscellaneous panel switches |
| **Pedestal** | Hub → Starship → Pedestal | Electrical, ignition, starters, propeller (autofeather, sync, governor), fuel, trim, parking brake |
| **Tests** | Hub → Starship → Tests | Test-hold buttons (press and hold to trigger) |

---

## Modding Starship panels

See the [root README modding section](../../README.md#modding--changing-and-customising-panels) for full step-by-step instructions with examples. The Starship-specific files to edit are:

| Task | File |
|------|------|
| Change button positions on Overhead | `config/panels/overhead.js` |
| Change button positions on ECS | `config/panels/ecs.js` |
| Change button positions on Anti-Ice | `config/panels/antiice.js` |
| Change button positions on Autopilot | `config/panels/autopilot.js` |
| Change button positions on Pedestal | `config/panels/pedestal.js` |
| Change button positions on Misc | `config/panels/misc.js` |
| Change what a button does, or add a new button | `config/buttons.js` |
| Custom per-tick logic for complex controls | `panels/overrides.js` |

### Starship button name prefixes

Button names in `config/buttons.js` and layout files use these prefixes:

| Prefix | System |
|--------|--------|
| `lts_` | Lighting (cabin, external, panel) |
| `gnd_` | Ground safety (chocks, covers, gear pins) |
| `ice_` | Anti-ice / de-ice |
| `avncs_` | Avionics, autopilot, fire, transponder, chrono |
| `ecs_` | Environmental, bleed, pressurisation, oxygen |
| `misc_` | Miscellaneous panel |
| `elec_` | Pedestal electrical |
| `eng_` | Ignition, starters |
| `prop_` | Propeller (autofeather, sync, governor) |
| `fuel_` | Fuel |
| `pedst_` | Pedestal avionics services |
| `trim_` | Trim, parking brake |
| `test_` | Test-hold buttons |

### Quick example — hide the Hide Yoke button on Overhead

Open `config/panels/overhead.js`. Find `'gnd_hideYoke'` in the ground safety row and replace it with `'empty'`:

```js
// Before
'gnd_chocks', 'gnd_pitotCovr', 'gnd_engCovr', 'gnd_gearPins', 'gnd_ctrlLock', 'gnd_hideYoke', 'empty', 'empty'

// After
'gnd_chocks', 'gnd_pitotCovr', 'gnd_engCovr', 'gnd_gearPins', 'gnd_ctrlLock', 'empty',        'empty', 'empty'
```

Save and refresh the browser.

### Quick example — move the TAXI light button to be next to LANDING

In `config/panels/overhead.js`, the external lights row currently reads:

```js
'lts_ldgWing', 'lts_ldgNose', 'lts_taxi', 'lts_wing', 'lts_nav', 'lts_strobeLo', 'lts_antiColl', 'lts_strobeFx',
```

To put TAXI right after the two LANDING buttons, swap it with `lts_wing`:

```js
'lts_ldgWing', 'lts_ldgNose', 'lts_wing', 'lts_taxi', 'lts_nav', 'lts_strobeLo', 'lts_antiColl', 'lts_strobeFx',
```

---

## Anti-Ice page note

The Anti-Ice page uses a special `gridClass: 'grid ice-grid'`. Buttons are positioned by CSS classes (`p-*`), so the **visual position does not follow left-to-right order** in the layout array. If you rearrange the anti-ice layout, check the result in the browser — the CSS classes on individual buttons control where they appear, not their position in the list.

---

## Verifying script labels (optional)

If you add a button that uses a new `SSP_STARSHIP_*` label, check it against the XML with Node.js:

```
node aircraft/starship/tools/check-manifest.js
```

This prints any labels that appear in the JavaScript but are missing from `bksq-starship-scripts.xml`, or vice versa. Node.js is not required for normal use.

---

## Further reading

- `CONFIG.md` in this folder — full panel object fields, cell schema, poll kinds reference
