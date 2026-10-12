# User guide — BKSQ AAO panels

## What you get

Each aircraft has several **pages** (Overhead, Avionics, etc.). Each page is an 8-column grid of large touch buttons. Tapping a button sends a command to the sim through AAO. Some buttons show on/off lamps that update from sim variables.

## Installation

1. Copy the entire `bksq-panels` folder into AAO’s web content directory. Keep the internal folder structure.
2. Import the aircraft script XML in AAO (Script List → Import). You only need the file for the plane you fly.
3. Open the hub URL in a browser attached to AAO (`index.html`).

Without MSFS running and AAO connected, buttons will not affect the sim; layout and settings still work.

## Opening on a phone or tablet

1. Same Wi‑Fi as the sim PC.
2. Find the PC’s IPv4 address (`ipconfig` on Windows).
3. Browse to `http://<IP>:<AAO_PORT>/bksq-panels/index.html`.
4. **iOS:** Share → **Add to Home Screen** for a full-screen app-like experience.

## Navigation

- **Hub** (`index.html`) — aircraft choice and display settings.
- **Bottom bar** — the same bar on every panel page and on the settings screen: page tabs on the left, then **⌂** (auto-home), **EDIT** and the **gear** (settings) on the right.
  - On a panel page, ⌂ and EDIT act on that page (see [Auto-home](#auto-home) and [Edit mode](#edit-mode)).
  - On the settings screen, **⌂** jumps to the Auto-home settings, **EDIT** reopens the last panel page you used in edit mode, and that page's tab is underlined so you can see where you came from.
- Settings and layouts are stored **per aircraft** in the browser (`localStorage`).

### Pages by aircraft

| Starship | TBM 850 |
|----------|---------|
| Overhead, ECS, Anti-Ice, AVNCS (autopilot), MFD, Misc, Pedestal, Tests | Overhead, AVN/ENV (avionics), EFB |

TBM pedestal controls are not in this package; see [aircraft/tbm850/README.md](../aircraft/tbm850/README.md).

## Settings (hub)

| Setting | Effect |
|---------|--------|
| Aircraft | Starship or TBM 850; remembered next visit |
| Poll interval | How often the panel reads sim variables (50–2000 ms). Lower = snappier, more CPU/network |
| Button text / readout size | Scale text and gauge values |
| Screen brightness | UI dimming (does not change sim lighting) |
| Indicators & lamps | Dot/lamp size |
| Touch flash | Brief highlight on tap |
| Scrollable pages | Allow vertical scroll if the grid is taller than the screen |
| Bottom nav tabs | Show/hide individual page links |
| Row height / gaps | Grid spacing |
| Row align | Top / center / bottom of the viewport |
| Auto-home page | Page to return to when idle (`Off` disables). Same setting as the ⌂ nav button |
| Return after idle | Seconds without a touch before returning home (5–300, default 20) |

## Edit mode

Rearrange **which button sits in which grid cell** by drag and drop, without editing files on the PC.

Tap **EDIT** on the right side of the bottom bar (or open the page with `?edit=1`). A compact toolbar appears at the top and the nav button changes to **DONE**. Buttons do not send sim commands while editing, and every change is saved immediately in this browser (per page) and applied whenever the page loads.

**Modes** (switch at the left of the toolbar):

- **Move** — drag a cell onto another to swap them; drag a cell onto **CLEAR** to empty it; **tap any cell** to open the button picker for that spot. Empty cells show a **+**.
- **Delete** — every button shows a red **×**; tap buttons to remove them. Press Esc (keyboard) or tap Move to go back.

**Button picker** (tap a cell in Move mode): a popover opens right next to the cell, sized to stay on screen, showing miniature previews of the real buttons.

- **★ For this spot** — buttons not yet on the page from the same systems as the neighbouring cells (falls back to the systems used on the page).
- **Recent** — your last placed buttons. **All**, or one chip per system (`avncs`, `lts`, `ecs`…) with counts.
- **Search** matches button labels and token names; Enter places the first result.
- Buttons already on the page are marked **ON PAGE**; **Hide placed** removes them from the list.
- **Then next empty** — after placing, the picker jumps to the next empty cell, so a row can be filled in a few taps.
- **Clear cell** empties the spot. Tap outside the picker to close it.

**Other tools:** **Undo** (also Ctrl/Cmd+Z; last 40 changes), **Palette** (optional strip to drag buttons from), column and row steppers (a row can only be removed once it is empty), **{ } JSON** (below), and **Reset page** (asks first, then restores the shipped layout).

### Layout JSON (import / export)

**{ } JSON** opens a sheet with three tabs:

| Tab | Shows | Use it to |
|-----|-------|-----------|
| **This page** | This page's layout as JSON | Back up one page or copy it to another device |
| **All pages** | Every page you have customised for this aircraft (pages still on the shipped layout are left out) | Back up or move your whole setup |
| **Config code** | Read-only `config/panels/<page>.js` snippet | Make your layout the shipped default in the repo |

Actions:

- **Copy** — copies the text to the clipboard.
- **Download** — saves a `.json` (or `.js`) file. Not shown on iOS 12, which cannot save downloads; use Copy there.
- **Load file…** — reads a `.json` file into the text box so you can check it.
- **Apply import** — imports whatever is in the text box. A single-page export goes to the current page; an All pages export restores every page it contains (other pages use it the next time you open them). Unknown pages are skipped, unknown button names show as empty cells, and you are asked before importing JSON made for a different aircraft. Import can be undone with **Undo** for the current page.

**Limitations:** Anti-Ice (Starship) and MFD use CSS-positioned layouts; EDIT is dimmed there and shows a message instead of editing, and saved layouts are never applied to them.

## Auto-home

The **⌂** button next to EDIT marks the current page as the home page. When a home page is set, any other panel page returns to it after the idle time from settings (default 20 seconds without a touch). The button shows **⌂ AUTO** highlighted on the home page, and the home page's name on other pages; tap it on the home page to turn auto-home off. Auto-home pauses while edit mode is active.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Buttons do nothing | MSFS running, AAO connected, correct script XML imported |
| Blank button where you expected a control | Typo in layout token — see [LAYOUT-AUDIT.md](LAYOUT-AUDIT.md) |
| Grid looks wrong on iPad mini | Use settings row height / scroll; column count is fixed per page (8 by default) |
| Slow on old iPad | Raise poll interval (e.g. 150–250 ms) in settings |
| A page looks different from the shipped layout | You (or an import) saved a custom layout: EDIT → **Reset page** |
| Panel keeps jumping to another page | Auto-home is set: tap ⌂ on the home page or set **Home page** to Off in settings |
