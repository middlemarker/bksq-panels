# TBM850 AAO touch panels (Black Square)

Aircraft-specific files for the unified `bksq-panels` package. Copy the whole package root, not this folder by itself.

## Register the script list

1. Copy `bksq-tbm850-scripts.xml` to a location AAO can load (or keep it beside the HTML). The name is TBM-specific so it is not confused with the Starship script list.
2. In AAO, add this file to **additional scripts** / script list import, the same way you register other aircraft AAO script lists.
3. Group name in XML: **`bksq-tbm-panel`**. Each control fires `SendEvent(1, '(>K:bksq-tbm-panel-<LABEL>)')` from `common.js`.

## Pages

| File | Content |
|------|---------|
| `pages/overhead.html` | Upper reference rows plus the reference-position PILOT MASK, PAX OXY, OXY, and HORN TEST buttons |
| `pages/avionics.html` | Remaining reference controls: EFIS, DH, fuel, AUX BP, TAWS, WXR range, XPDR power/mode/ident, AP trims, air conditioning, bleed, cabin temperature, panel lights |
| `pages/environment.html` | Compatibility redirect to `pages/avionics.html` |
| `../../index.html?aircraft=tbm850#settings` | Settings page for TBM look/feel, touch sizing, nav visibility, polling, and scroll mode |

## Static layout files

The TBM pages use static JavaScript only, with no modules or build step:

- `config/buttons.js` defines every supported control by name (`name -> minimal HTML + optional polls`).
- `config/panel-builder.js` builds the existing `innerHtml + polls` shape once at page load.
- `config/panels/*.js` stays short and describes layout by button names.

This keeps the pages easy to edit while remaining compatible with older Safari / iOS 12.5 devices.

## Optional check script

If Node.js is installed:

```text
node tools/check-manifest.js
```

This compares `SSP_TBM_*` strings under TBM JavaScript files with labels defined in `bksq-tbm850-scripts.xml`.

## `AaoWebApi.js`

The placeholder `<AAO_URL>` is replaced when AAO serves the file, same as the stock template.

## Pedestal

No pedestal page is included: cockpit switches such as starter and ignition are driven from `AnalogTBM.xml` with **L:** variables and generic **K:** events, not a stable set of `BKSQTbm850-*` web hooks. See **CONFIG.md** for a short gap list.
