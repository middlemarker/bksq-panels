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

## Reserved labels (defined, not yet on a page)

These `SSP_TBM_*` labels are defined in `bksq-tbm850-scripts.xml` and have matching button entries in `config/buttons.js` under the **UNUSED** banner. They are not placed on any `config/panels/*.js` layout yet — drop the button key into a layout array to activate one. All sim bindings were verified against `ref/AnalogTBM.xml`.

### Anti-Ice (intended for a future `pages/antiice.html`)

| Label | Button key | Sim binding |
|--------|-----------|-------------|
| `SSP_TBM_ICE_PITOT1_TOGGLE` | `ice_pitot1` | `A:CIRCUIT SWITCH ON:13` (PitotHeat1Circuit) |
| `SSP_TBM_ICE_PITOT2_TOGGLE` | `ice_pitot2` | `A:CIRCUIT SWITCH ON:14` (PitotHeat2Circuit) |
| `SSP_TBM_ICE_INERT_SEP_TOGGLE` | `ice_inertSep` | `L:var_InertialSeparatorSwitch` |
| `SSP_TBM_ICE_PROP_DEICE_TOGGLE` | `ice_propDeice` | `A:CIRCUIT SWITCH ON:24` (PropDeiceCircuit) |
| `SSP_TBM_ICE_AIRFRAME_DEICE_TOGGLE` | `ice_airframeDeice` | `L:var_airframeDeice` |
| `SSP_TBM_ICE_WS_L_TOGGLE` | `ice_wsL` | `L:var_windshieldHeatSwitch_L` |
| `SSP_TBM_ICE_WS_R_TOGGLE` | `ice_wsR` | `L:var_windshieldHeatSwitch_R` |

### Pedestal (intended for a future `pages/pedestal.html`)

| Label | Button key | Sim binding |
|--------|-----------|-------------|
| `SSP_TBM_PED_STARTER_TOGGLE` | `eng_starter` | `L:BKSQ_StarterSwitch` |
| `SSP_TBM_PED_IGNITION_TOGGLE` | `eng_ignition` | `L:BKSQ_IgnitionSwitch` (0/1) |
| `SSP_TBM_PED_COND_LEVER_CYCLE` | `eng_condLever` | `L:BKSQ_ConditionLever` cycles 0/1/2 = CUT-OFF / LOW IDLE / HIGH IDLE |
| `SSP_TBM_PED_EMER_PWR_INC` / `…_DEC` | `eng_emerPwrUp` / `eng_emerPwrDn` | `L:var_emergencyPowerLeverPosition` ±1, clamped 0–100 |
| `SSP_TBM_PED_PARK_BRAKE_TOGGLE` | `trim_parkBrake` | `K:PARKING_BRAKES` (stock MSFS) |
| `SSP_TBM_PED_EMER_GEAR_DOOR_TOGGLE` | `elec_emerGear` | `L:var_EmergencyGearDoor` |

### Weather Radar extended (intended for avionics page)

| Label | Button key | Sim binding |
|--------|-----------|-------------|
| `SSP_TBM_AVN_WXR_ALERT` | `avncs_wxrAlert` | `H:bksq_wradar1_radarAlertToggle` |
| `SSP_TBM_AVN_WXR_PROFILE` | `avncs_wxrProfile` | `H:bksq_wradar1_radarProfile` |
| `SSP_TBM_AVN_WXR_MAP` | `avncs_wxrMap` | `H:bksq_wradar1_radarMap` |
| `SSP_TBM_AVN_WXR_HOLD` | `avncs_wxrHold` | `H:bksq_wradar1_radarHold` |
| `SSP_TBM_AVN_WXR_TRACK_L` / `…_R` | `avncs_wxrTrackL` / `avncs_wxrTrackR` | `H:bksq_wradar1_radarTrackLeft` / `…Right` |
| `SSP_TBM_AVN_WXR_MODE_PUSH` | `avncs_wxrModePush` | `H:BKSQ_RadarModePush` |
| `SSP_TBM_AVN_WXR_TILT_INC` / `…_DEC` | `avncs_wxrTiltUp` / `avncs_wxrTiltDn` | `L:var_RadarTilt` ±1, clamped −15 to 90 |
| `SSP_TBM_AVN_WXR_BRI_INC` / `…_DEC` | `avncs_wxrBriUp` / `avncs_wxrBriDn` | `L:var_RadarBrightness` ±5, clamped 0–100 |
| `SSP_TBM_AVN_WXR_GAIN_INC` / `…_DEC` | `avncs_wxrGainUp` / `avncs_wxrGainDn` | `L:var_RadarGain` ±5, clamped 0–100 |

### Oxygen detail (intended for overhead page)

| Label | Button key | Sim binding |
|--------|-----------|-------------|
| `SSP_TBM_OXY_COPILOT_MASK_TOGGLE` | `oxy_copilotMask` | `L:var_coPilotOxygen` |
| `SSP_TBM_OXY_PILOT_TOGGLE` | `oxy_pilotO2` | `L:var_pilotOxygen` (distinct from existing PILOT MASK K-event) |
| `SSP_TBM_OXY_ISOLATION_TOGGLE` | `oxy_isolate` | `L:var_oxygenIsolationValve` |

### Doors / visors (intended for overhead or a future misc page)

| Label | Button key | Sim binding |
|--------|-----------|-------------|
| `SSP_TBM_DOOR_PILOT_CYCLE` | `misc_pilotDoor` | `L:var_PilotDoorLockedLatching` cycles 0/1/2 |
| `SSP_TBM_DOOR_AFT_CYCLE` | `misc_aftDoor` | `L:var_AftDoorLockedLatching` cycles 0/1/2 |
| `SSP_TBM_DOOR_PILOT_LADDER_TOGGLE` | `misc_pilotLadder` | `L:var_PilotLadder` |
| `SSP_TBM_DOOR_AFT_LADDER_TOGGLE` | `misc_aftLadder` | `L:var_AftLadder` |
| `SSP_TBM_DOOR_VISOR_L_INC` / `…_DEC` | `misc_visorLUp` / `misc_visorLDn` | `L:var_Visor_L` ±5, clamped 0–100 |
| `SSP_TBM_DOOR_VISOR_R_INC` / `…_DEC` | `misc_visorRUp` / `misc_visorRDn` | `L:var_Visor_R` ±5, clamped 0–100 |

### Avionics extras (intended for avionics page)

| Label | Button key | Sim binding |
|--------|-----------|-------------|
| `SSP_TBM_AVN_EADI_BRI_INC` / `…_DEC` | `avncs_eadiBriUp` / `avncs_eadiBriDn` | `L:var_EADI_Brightness` ±5, clamped 0–100 |
| `SSP_TBM_AVN_EHSI_BRI_INC` / `…_DEC` | `avncs_ehsiBriUp` / `avncs_ehsiBriDn` | `L:var_EHSI_Brightness` ±5, clamped 0–100 |
| `SSP_TBM_AVN_RADIO1_MODE_CYCLE` | `avncs_radio1Mode` | `L:var_radio1Mode` cycles 0/1/2 |
| `SSP_TBM_AVN_RADIO2_MODE_CYCLE` | `avncs_radio2Mode` | `L:var_radio2Mode` cycles 0/1 |
| `SSP_TBM_AVN_PILOT_CWS` | `avncs_pilotCws` | `L:var_PilotCws` set 1 (momentary; sim resets) |
| `SSP_TBM_AVN_GEAR_HORN_MUTE` | `avncs_gearHornMute` | `L:var_GearWarningHorn` set 0 |
| `SSP_TBM_AVN_ALT_ALERT_ACK` | `avncs_altAlertAck` | `L:var_altitudeAlert` set 0 |
| `SSP_TBM_AVN_ETM_MODE_CYCLE` | `avncs_etmMode` | `L:var_EtmMode` cycles 0/1/2/3 |
