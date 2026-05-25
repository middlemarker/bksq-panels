# TBM 850 touch panels (Black Square)

Panel pages for the **Black Square TBM 850** in AAO. These files work as part of the `bksq-panels` package — copy the **whole package root**, not this folder alone.

For full installation instructions see the [root README](../../README.md).

---

## Importing the AAO script file

In AAO, go to **Script List → Import** and add:

```
bksq-panels\aircraft\tbm850\bksq-tbm850-scripts.xml
```

This registers the `bksq-tbm-panel` script group that the buttons depend on. Without this step, tapping buttons will have no effect in the sim.

---

## Panel pages

| Page | How to open | What's on it |
|------|-------------|--------------|
| **Overhead** | Hub → TBM 850 → Overhead | Instrument circuits (GYRO, RMI, ADI 2, HSI 2), Generator reset (MAIN / STDBY), Power source switch, Lights test buttons (LTS TST, DE-ICE LT TST, GEAR CHK DN, GEAR LT TST, ITT TST, ECS LT TEST, ANN LT 1/2), Oxygen (PILOT MASK, PAX OXY, OXY MASTER), HORN TEST |
| **Avionics** | Hub → TBM 850 → Avionics | EFIS pointer L/R and Composite, DH −/+ and DH Mode, ANN LT LVL, TAWS Test / Terrain Inhibit / ANN LT, WXR Mode / Range −/+, Fuel Shift, Fuel Selector, AUX Boost Pump, Transponder power / mode / ident, AP Trims, Air conditioning, Bleed, Cabin temperature |
| **Environment** | (redirect) | Opens Avionics — all environment controls are on that page |

---

## Pedestal — not included

The TBM 850 **starter, ignition, gear, and flaps** controls are not covered by this package. Those switches use generic MSFS K-events and L-variables (`STARTER1_SET`, `L:BKSQ_StarterSwitch`, etc.) rather than the `BKSQTbm850-*` hook style used on the overhead and avionics pages.

Adding a pedestal page would require wiring new RPN scripts in AAO. See `CONFIG.md` for the specific L-variable names involved.

---

## Modding TBM 850 panels

See the [root README modding section](../../README.md#modding--changing-and-customising-panels) for full step-by-step instructions with examples. The TBM 850-specific files to edit are:

| Task | File |
|------|------|
| Change button positions on Overhead | `config/panels/overhead.js` |
| Change button positions on Avionics | `config/panels/avionics.js` |
| Change what a button does, or add a new button | `config/buttons.js` |
| Custom per-tick logic for multi-state controls | `panels/overrides.js` |

### TBM 850 button name prefixes

Button names in `config/buttons.js` and layout files use these prefixes:

| Prefix | System |
|--------|--------|
| `avncs_` | Instruments, EFIS, TAWS, DH, transponder, AP trims |
| `elec_` | Generator, power source |
| `lts_` | Lights tests |
| `fuel_` | Fuel selector, AUX boost pump, fuel shift |
| `ecs_` | Air conditioning, bleed, cabin temperature |
| `oxy_` | Oxygen masks and master |
| `misc_` | Horn test |

### Pre-defined extra buttons (not yet on any page)

`config/buttons.js` has an **`UNUSED — not placed on any page`** banner near the bottom. Below it are ~40 additional buttons that are already wired to the sim and listed in `bksq-tbm850-scripts.xml`, but no page layout uses them yet. They cover anti-ice, pedestal (starter / ignition / condition lever / emergency power / parking brake), extended weather radar (alert / profile / map / hold / track / tilt / brightness / gain), oxygen detail (copilot mask / pilot O2 / isolation valve), doors / visors, and avionics extras (EADI/EHSI brightness, radio modes, CWS, gear horn mute, ETM).

**To enable one**, copy its key from `config/buttons.js` into the `layout` array of an existing page (or a new one):

```js
layout: [
  ...
  'avncs_wxrAlert', 'avncs_wxrProfile', 'avncs_wxrMap', 'avncs_wxrHold',
  ...
]
```

See the full label-to-sim-binding map in `CONFIG.md` → **Reserved labels (defined, not yet on a page)**.

### Quick example — hide the HORN TEST button

Open `config/panels/overhead.js`. Find `'misc_hornTest'` and replace it with `'empty'`:

```js
// Before
'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'misc_hornTest'

// After
'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'
```

Save the file and refresh the panel in your browser.

---

## Verifying script labels (optional)

If you add a button that uses a new `SSP_TBM_*` label, check it against the XML with Node.js:

```
node aircraft/tbm850/tools/check-manifest.js
```

This prints any labels that appear in the JavaScript but are missing from `bksq-tbm850-scripts.xml`, or vice versa. Node.js is not required for normal use.

---

## Further reading

- `CONFIG.md` in this folder — full `SSP_TBM_*` label map, circuit indices, logic that stays in JavaScript
