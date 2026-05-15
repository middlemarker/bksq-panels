# TBM850 panel configuration

## AAO dispatch

- **Web:** `sendTbmP('SSP_TBM_…')` → `SendEvent(1, '(>K:bksq-tbm-panel-SSP_TBM_…)')`.
- **AAO XML:** `bksq-tbm850-scripts.xml`, group **`bksq-tbm-panel`**, one `<Script>` per label. Each CDATA block is the RPN sent for that label (`BKSQTbm850-*`, `BKSQTbm850custom-*`, `Scripts-*`, `H:`, `L:`, `A:CIRCUIT`, etc.); this file is the source of truth for what each `SSP_TBM_*` does in the sim.

## `SSP_TBM_*` → sim bindings (quick map)

| Label | Sim binding |
|--------|-------------|
| `SSP_TBM_OH_GYRO_TOGGLE` | `A:CIRCUIT SWITCH ON:57` / overhead label **GYRO** |
| `SSP_TBM_OH_RMI_TOGGLE` | Circuit 58 |
| `SSP_TBM_OH_ADI2_TOGGLE` | Circuit 59 |
| `SSP_TBM_OH_HSI2_TOGGLE` | Circuit 60 |
| `SSP_TBM_OH_LIGHTS_TEST` | `K:BKSQTbm850-oh_lights_test_push_and_release` |
| `SSP_TBM_OH_DEICE_LT_TEST` | `…deice_lights_test_push_and_release` |
| `SSP_TBM_OH_GEAR_DOWN_CHK` | `…landing_gear_down_check_push_and_release` |
| `SSP_TBM_OH_GEAR_LT_TEST` | `…landing_gear_light_test_push_and_release` |
| `SSP_TBM_OH_ITT_TEST` | `…itt_test_push_and_release` |
| `SSP_TBM_OH_ECS_LT_TEST` | `…ecs_light_test_push_and_release` |
| `SSP_TBM_OH_ANN_TEST_1` / `_2` | `…annunciator_test_1/2_push_and_release` |
| `SSP_TBM_OH_GEN_RESET_MAIN` | `K:BKSQTbm850custom-gen-main-reset` |
| `SSP_TBM_OH_GEN_RESET_STDBY` | `K:BKSQTbm850custom-gen-stdby-reset` |
| `SSP_TBM_OH_SOURCE_TOGGLE` | `L:BKSQ_SourceSwitch` alternates 1 ↔ 2 |
| `SSP_TBM_AVN_*` / `SSP_TBM_ENV_*` | See `bksq-tbm850-scripts.xml` CDATA and `config/panels/avionics.js` for the controls on the avionics page |

XPDR actions use **`SSP_TBM_AVN_XPDR_*`** from `common.js` only (not repeated in `config/panels/*.js`).

## Overhead instrument circuits (A:CIRCUIT indices)

These indices are what the overhead **GYRO** / RMI / ADI 2 / HSI 2 toggles drive. Index **61** is not used on this UI.

| Role | Index | Panel use |
|--------|-------|-----------|
| Remote compass (GYRO) | **57** | **GYRO** button |
| RMI | 58 | RMI |
| ADI 2 | 59 | ADI 2 |
| HSI 2 | 60 | HSI 2 |
| Radio altimeter 2 | **61** | Not bound here |

## Static UI layout

- `config/buttons.js` is the supported button dictionary. Each entry owns the small HTML snippet and any simple polls for that control.
- Shared **`common/panel-builder.js`** (loaded by each page) turns a panel `layout: ['buttonName', ...]` into the runtime's `innerHtml` and `polls` fields once at page load (`SSP_PANEL_FACTORY` → `TBMPanel`).
- `config/panels/overhead.js` holds the upper overhead rows and places PILOT MASK, PAX OXY, OXY, and HORN TEST in the same grid positions as on the overhead page.
- `config/panels/avionics.js` holds the avionics and environment controls; cells left empty there are intentional gaps in the grid.
- Root hub **`common/panel-settings.js`** applies the same configurable sizing/look-and-feel model to all aircraft pages, using static ES5 JavaScript for iOS 12.5 compatibility.

## Logic left in JavaScript (not in XML)

These need guards, ping-pong stepping, or A: reads that stay in `common.js` / `panels/overrides.js`:

- Generator switch (no toggle when **OFF**).
- AUX boost pump (no toggle when **OFF**).
- Bleed (no toggle when **OFF**).
- Air conditioning and AP trims (ping-pong through states).
- WXR mode (ping-pong through 0–3).
- DH mode UI (local `uiState` + three K-events per step).
- Fuel selector visual resync after K-event.
- LTS test hold indicator (`var_OverheadLightTestButton` + 2 s client hold).
- XPDR power/mode/ident (A: transponder state + throttled ident poll).

## Pedestal (no `tbm-pedestal.html`)

This package only ships **overhead** and **avionics** pages. Switches such as **starter**, **ignition**, **gear**, **flaps**, and some **trim** / power paths are handled in the aircraft with **L:** variables and generic **K:** events (for example `STARTER1_SET`, `TURBINE_IGNITION_SWITCH_SET1`) rather than the same **`BKSQTbm850-*`** style hooks used on the overhead. A pedestal web panel would need **new** aircraft-exposed events or **`SendScript`** RPN wired in AAO; that is out of scope here. Gaps to keep in mind if you extend the bundle:

- `L:BKSQ_StarterSwitch`, `L:BKSQ_IgnitionSwitch` (starting / ignition).
- Trim / AP disconnect linkage uses `L:BKSQ_AutopilotMasterSwitch`, `L:var_trimsDisabled` (partially covered on avionics as **AP TRIMS**).
- Gear and flap motors: no dedicated TBM850 **`BKSQTbm850-*`** web K-events in this repo for those motors.
