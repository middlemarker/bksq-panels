# TBM850 panel configuration

## AAO dispatch

- **Web:** `sendTbmP('SSP_TBM_…')` → `SendEvent(1, '(>K:bksq-tbm-panel-SSP_TBM_…)')`.
- **AAO XML:** `bksq-tbm850-scripts.xml`, group **`bksq-tbm-panel`**, one `<Script>` per label; CDATA matches the former `reference/tbmoverhead/index.html` one-liners (`BKSQTbm850-*`, `BKSQTbm850custom-*`, `Scripts-*`, `H:`, `L:`, `A:CIRCUIT`).

## `SSP_TBM_*` → legacy names (quick map)

| Label | Former mechanism |
|--------|------------------|
| `SSP_TBM_OH_GYRO_TOGGLE` | `A:CIRCUIT SWITCH ON:57` / reference label **GYRO** |
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
| `SSP_TBM_AVN_*` / `SSP_TBM_ENV_*` | See `bksq-tbm850-scripts.xml` CDATA for the controls currently present on the reference-derived avionics page |

XPDR actions use **`SSP_TBM_AVN_XPDR_*`** from `common.js` only (not repeated in `config/panels/*.js`).

## Circuit indices vs `AnalogTBM.xml`

Macros in `reference/tbmoverhead/AnalogTBM.xml` (examples):

| Macro | Index | Panel use |
|--------|-------|-----------|
| `RemoteCompassCircuit` | **57** | **GYRO** button, matching the reference page label |
| `RMICircuit` | 58 | RMI |
| `ADI2Circuit` | 59 | ADI 2 |
| `HSI2Circuit` | 60 | HSI 2 |
| `RadioAltimeter2Circuit` | **61** | Not bound on this UI (legacy single page also did not use 61) |

## Static UI layout

- `config/buttons.js` is the supported button dictionary. Each entry owns the small HTML snippet and any simple polls for that control.
- Shared **`common/panel-builder.js`** (loaded by each page) turns a panel `layout: ['buttonName', ...]` into the runtime's `innerHtml` and `polls` fields once at page load (`SSP_PANEL_FACTORY` → `TBMPanel`).
- `config/panels/overhead.js` keeps the upper reference rows and also places PILOT MASK, PAX OXY, OXY, and HORN TEST in their original reference-grid positions.
- `config/panels/avionics.js` keeps the remaining reference avionics/environment controls with those moved positions left empty.
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

## Pedestal gaps (no `tbm-pedestal.html`)

`AnalogTBM.xml` ties **starter**, **ignition**, **gear**, **flaps**, and **trim** power to **L:** variables and generic **K:** events (e.g. `STARTER1_SET`, `TURBINE_IGNITION_SWITCH_SET1`) inside aircraft logic. There is no parallel set of `BKSQTbm850-*` names like the overhead uses, so a pedestal web page would need **new** aircraft-exposed events or careful `SendScript` RPN. Out of scope for this bundle; list for future work:

- `L:BKSQ_StarterSwitch`, `L:BKSQ_IgnitionSwitch` (see “Starting and Ignition Controller” in `AnalogTBM.xml`).
- Trim / AP disconnect linkage uses `L:BKSQ_AutopilotMasterSwitch`, `L:var_trimsDisabled` (partially covered here as **AP TRIMS**).
- Gear and flap motors: circuit macros `GearMotorCircuit`, `FlapMotorCircuit`, etc., without dedicated TBM850 web K-events in the legacy `index.html`.
