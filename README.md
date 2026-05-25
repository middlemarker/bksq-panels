# BlackSquare AAO web panels

Touch-panel pages for **Black Square** aircraft in **AxisAndOhs (AAO)**. Open them on any phone, tablet, or second monitor while MSFS is running. Tested on iPad Air 1 and iPad mini 2 running iOS 12.5.

**Supported aircraft:** Beechcraft Starship, TBM 850

## Screenshots

### Starship panels
<img src="./images/starship1.jpg" width="450">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="./images/starship2.jpg" width="450">

### Settings page
<img src="./images/settings1.jpg" width="450">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="./images/settings2.jpg" width="450">

### Poor man's SimPit
iPad Air as overhead panel, iPad mini 2 for pedestal / avionics.
<img src="./images/simpit.jpg" width="450">

---

## Installation

### Step 1 — Copy the folder

Copy the entire `bksq-panels` folder into the directory AAO uses for web content. This is the same folder where the stock AAO panel template lives, for example:

```
C:\Users\YourName\Documents\AAO\WebContent\bksq-panels\
```

Keep the folder structure intact — do **not** copy individual aircraft subfolders by themselves.

### Step 2 — Import the AAO script file for your aircraft

In AAO, go to **Script List → Import** and add the XML file for your aircraft:

| Aircraft | File to import |
|----------|----------------|
| Starship | `bksq-panels\aircraft\starship\bksq-starship-scripts.xml` |
| TBM 850 | `bksq-panels\aircraft\tbm850\bksq-tbm850-scripts.xml` |

You only need to import the file for the aircraft you fly. Importing both is fine.

### Step 3 — Open the panel hub

In AAO's web panel URL field (or in your browser), point to:

```
http://localhost:<AAO_PORT>/bksq-panels/index.html
```

Replace `<AAO_PORT>` with the port AAO uses — typically `8888`. The hub shows links to every panel page for your aircraft.

**MSFS must be running and AAO must be connected** before buttons will respond. Without the sim, you will see connection errors in the browser console — that is normal.

---

## Opening panels on a tablet or phone

1. Make sure your tablet / phone is on the **same Wi-Fi network** as your sim PC.
2. Find your PC's local IP address (run `ipconfig` in a command prompt, look for the IPv4 address — something like `192.168.1.10`).
3. Open this address in Safari / Chrome on your device:
   ```
   http://192.168.1.10:<AAO_PORT>/bksq-panels/index.html
   ```
4. **iOS tip:** tap the Share button → **Add to Home Screen**. The panels will open full-screen and navigation stays inside the app instead of jumping to Safari.

---

## Navigating the panels

- The **hub** (`index.html`) is the starting point. Select your aircraft and use the links to open each panel page.
- Inside a panel page, the **bottom bar** has tabs to switch between pages (Overhead, Avionics, etc.).
- The **gear icon** in the bottom bar returns to the hub settings.
- **Settings are saved per aircraft** in your browser and persist between sessions.

### Available pages

**Starship:** Overhead, ECS, Anti-Ice, Autopilot, MFD, Misc, Pedestal, Tests

**TBM 850:** Overhead, Avionics *(Pedestal is not included — see `aircraft/tbm850/README.md` for details)*

---

## Settings

Open settings from the hub (`index.html → gear icon`). Changes apply immediately and are saved in your browser.

| Setting | What it does |
|---------|--------------|
| **Aircraft** | Select Starship or TBM 850. Your choice is saved automatically — the same aircraft loads next time you open the hub, even without a URL parameter. |
| **Poll interval** | How often the panel reads sim variables (default 100 ms). Lower = more responsive, higher = less CPU. Minimum 50 ms. |
| **Button text size** | Scale the text on panel buttons to fit your screen. |
| **Touch flash** | Brief visual flash when you tap a button. |
| **Scrollable pages** | Allow panel pages to scroll if buttons overflow the screen height. |
| **Bottom nav tabs** | Show or hide individual page tabs for the current aircraft. |
| **Row height / gaps** | Adjust grid spacing for different screen sizes. |

---

## Modding — Changing and customising panels

This section explains how to rearrange, hide, or add buttons. No build tools or programming experience are required. Every file is plain JavaScript that you can edit in Notepad.

### Where the files are

```
bksq-panels/
  aircraft/
    tbm850/
      config/
        buttons.js          ← button definitions (HTML + what they do)
        panels/
          overhead.js       ← which buttons appear on the Overhead page, in what order
          avionics.js       ← which buttons appear on the Avionics page
    starship/
      config/
        buttons.js
        panels/
          overhead.js
          ecs.js
          antiice.js
          autopilot.js
          pedestal.js
          misc.js
          tests.js
```

**To change a page layout**, edit the corresponding `config/panels/<page>.js` file.  
**To change what a button does**, edit `config/buttons.js`.

---

### Rearranging or hiding buttons

Open `aircraft/tbm850/config/panels/overhead.js` (or the Starship equivalent). It looks like this:

```js
window.SSP_PANELS.overhead = TBMPanel({
  layout: [
    'avncs_gyro', 'avncs_rmi', 'avncs_adi2', 'avncs_hsi2', 'elec_genRstMain', 'elec_genRstStby', 'empty', 'empty',
    'lts_test',   'empty',     'empty',       'empty',       'elec_source',     'elec_generator',  'empty', 'empty',
    ...
  ]
});
```

Each string in the list is a button name. The list fills the grid **left to right, 8 per row**. `'empty'` is a blank spacer.

**To move a button to a different position**, cut the name from where it is and paste it where you want it. Keep the total count per row at 8.

**Example — move `lts_test` to the end of row 1:**

Before:
```js
'avncs_gyro', 'avncs_rmi', 'avncs_adi2', 'avncs_hsi2', 'elec_genRstMain', 'elec_genRstStby', 'empty',   'empty',
'lts_test',   'empty',     ...
```

After:
```js
'avncs_gyro', 'avncs_rmi', 'avncs_adi2', 'avncs_hsi2', 'elec_genRstMain', 'elec_genRstStby', 'lts_test', 'empty',
'empty',      'empty',     ...
```

**To hide a button**, replace its name with `'empty'`:

```js
// Before — GYRO button is visible
'avncs_gyro', 'avncs_rmi', ...

// After — GYRO button hidden, blank space in its place
'empty', 'avncs_rmi', ...
```

After saving, **refresh the panel page in your browser** — no AAO restart needed.

---

### Adding a new button

Adding a button is a two-step process: define the button, then add it to a layout.

#### Step 1 — Define the button in `config/buttons.js`

Open `aircraft/tbm850/config/buttons.js` (or the Starship version). Find the section that matches the system you want to control (e.g. `avncs_` for avionics, `lts_` for lights). Add a new entry:

```js
// Simple button that sends one event when tapped
avncs_myNewButton: {
  html: sspButton('g-efis', 'MY LABEL', 'SSP_TBM_AVN_EFIS_PTR_R')
},
```

- First argument `'g-efis'` is the button style class (controls the colour stripe). Use an existing class from nearby buttons.
- Second argument `'MY LABEL'` is the text shown on the button.
- Third argument `'SSP_TBM_…'` is the AAO script label this button triggers. It must match a label defined in `bksq-tbm850-scripts.xml`.

**TBM 850 available style classes:**

| Class | Used for |
|-------|----------|
| `g-instr` | Instruments (GYRO, RMI, ADI) |
| `g-gen` | Generator / electrical |
| `g-power` | Power source |
| `g-lts` | Lights tests |
| `g-efis` | EFIS / avionics |
| `g-fuel` | Fuel |
| `g-oxy` | Oxygen |
| `g-taws` | TAWS / terrain |
| `g-wxr` | Weather radar |
| `g-xpdr` | Transponder |
| `g-ecs` | Air conditioning / bleed |

#### Step 2 — Add the button name to a layout

Open the panel layout file where you want the button to appear, e.g. `config/panels/avionics.js`, and add `'avncs_myNewButton'` in the position you want:

```js
layout: [
  'avncs_efisPtrR', 'avncs_efisPtrL', 'avncs_efisComposite', 'avncs_myNewButton', ...
]
```

Save both files, then refresh the browser.

---

### Adding a button that shows on/off state

If you want the button to light up when a switch is ON, add a `polls` entry:

```js
avncs_myToggle: {
  html: sspButton('g-efis', 'MY SW', 'SSP_TBM_AVN_MY_SWITCH', 'mySwBtn', 'mySwInd'),
  polls: [{ kind: 'toggle', btnId: 'mySwBtn', indId: 'mySwInd', lvar: 'var_MySwitchState', lvarType: 'Bool' }]
},
```

- `'mySwBtn'` and `'mySwInd'` are HTML element IDs — they just need to be unique strings.
- `lvar: 'var_MySwitchState'` is the MSFS L-variable name to read for the on/off state.
- The button indicator glows when the L-variable is non-zero.

For a sim A-variable (not L-variable), use `kind: 'toggleA'` and `expr:` instead:

```js
polls: [{ kind: 'toggleA', btnId: 'myBtn', indId: 'myInd', expr: 'CIRCUIT SWITCH ON:57, Bool' }]
```

---

### Verifying your AAO script labels (optional)

If you add a button that uses a new `SSP_TBM_*` or `SSP_STARSHIP_*` label, you can check it against the XML with Node.js:

```
node aircraft/tbm850/tools/check-manifest.js
node aircraft/starship/tools/check-manifest.js
```

This prints any labels that exist in the JavaScript but are missing from the XML (or vice versa). Node.js is free to install and not required for normal use.

---

### Testing without MSFS running

You can preview layout changes in a browser without AAO or MSFS:

```
python -m http.server 8080
```

Open `http://127.0.0.1:8080/index.html`. Buttons and layout render normally; tapping a button will show a console error (expected — AAO is not there). This is useful for checking that the grid looks right before flying.

---

## File layout reference

```
index.html                     Hub: aircraft selector + settings
common/
  AaoWebApi.js                 AAO bridge (auto-configured by AAO)
  common.js                    Shared helpers (sendP, getLVar, getAVar)
  panel-builder.js             Turns layout token lists into HTML
  panel-runtime.js             Boot, poll loop, button state updates
  panel-settings.js            Settings UI and CSS variable application
aircraft/
  starship/
    aircraft.js                Aircraft meta, page list, default settings
    config/buttons.js          All Starship button definitions
    config/panels/*.js         Per-page layout (list of button names)
    pages/*.html               Panel pages (thin shells, no content to edit)
    panels/overrides.js        Custom per-tick logic for complex controls
    bksq-starship-scripts.xml  AAO script labels for Starship
  tbm850/
    aircraft.js
    config/buttons.js          All TBM 850 button definitions
    config/panels/*.js         Per-page layout
    pages/*.html
    panels/overrides.js
    bksq-tbm850-scripts.xml    AAO script labels for TBM 850
```

---

## Further reading

- `aircraft/starship/README.md` — Starship-specific page list and notes
- `aircraft/tbm850/README.md` — TBM 850-specific page list and pedestal gap notes
- `aircraft/starship/CONFIG.md` — Developer reference: panel object fields, poll kinds
- `aircraft/tbm850/CONFIG.md` — TBM 850 script label map and circuit indices
