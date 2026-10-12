# PanelKit — widgets (control types)

A **widget** renders and updates one control type. Pack authors pick a type with `type:`; engine developers implement types with `PK.widgets.define`. Common control fields (`label`, `group`, `style`, `span`, `confirm` …) are in [PACK-FORMAT.md](PACK-FORMAT.md) §7.

## 1. Cell DOM contract

The layout module (not the widget) writes the cell root; the widget writes the inner markup:

```html
<div class="pk-cell pk-t-toggle pk-g-lts pk-s-sign pk-span-2" data-pk-cell="12" data-pk-id="lts_master">
  …widget inner markup…
</div>
```

| Item | Rule |
|------|------|
| `pk-cell` | Every grid child; exactly one per layout entry, so `grid.children.length === layout.length` |
| `pk-t-<type>` | Control type |
| `pk-g-<group>` | Group; theme colours attach here |
| `pk-s-<style>` | Only when `style` is set |
| `pk-span-<n>` | Only when `span` > 1 (`grid-column: span n`) |
| `data-pk-cell` | Index in the page layout (0-based) |
| `data-pk-id` | Control token as written in the layout (`lts_master`, `kap.ap`, `empty`) |
| `data-pk-part` | On each tappable element inside the cell: `main`, `dec`, `inc`, or a behavior-defined name |
| Element ids | **Never.** Widgets find their elements with `refs()` at bind time (ADR-004) |
| Inline handlers | **Never.** Input is delegated (ADR-005) |
| Text | Labels go through `PK.util.escHtml`; `\n` becomes `<br>` |

State classes, toggled on the **cell root** unless noted:

| Class | Meaning |
|-------|---------|
| `pk-on` | Boolean state true (toggle, hold) |
| `pk-on` on `.pk-pos` | The active position of a `multi` |
| `pk-stale` | Bound value missing (no data yet, or var absent) |
| `pk-held` | Hold latch active or momentary press in progress |
| `pk-pending` | Optimistic display waiting for confirmation from data |
| `pk-armed` | Confirm guard armed (second tap fires) |
| `pk-disabled` | The control's `enabled` spec is `false`; taps are ignored and the cell is dimmed |
| `pk-pressed` | Finger down on a part (on the part element) |
| `pk-flash` | Brief tap feedback (removed after 150 ms; off when `showTouchFlash` is false) |
| `pk-unknown` | Token not found (runtime renders an empty cell with this class) |

## 2. Field table (used by the validator, V-012 / V-013)

| Type | Required | Optional |
|------|----------|----------|
| `empty` | — | — |
| `label` | `label` | — |
| `button` | `label`, `action` | `sublabel` |
| `toggle` | `label`, `action`, `state` | `labels`, `indicator` |
| `hold` | `label`, `action` | `mode`, `holdMs`, `release`, `state` |
| `multi` | `label`, `positions` | `state`, `action`, `advance`, `optimistic`, `optimisticMs`, `initial` |
| `readout` | `label`, `value` | `format`, `unit`, `action` |
| `gauge` | `label`, `rows` | — |
| `stepper` | `label`, `dec`, `inc` | `value`, `format`, `repeatMs`, `decLabel`, `incLabel` |
| `custom` | `behavior` | `props`, plus the behavior's own `fields` |

Common fields are always allowed. Each widget exposes this table as `impl.fields = { required: [...], optional: [...] }`; the validator reads it from the code, so the table above and the code cannot drift.

## 3. `empty`

Blank cell. The built-in control `empty` is `{ type: 'empty' }` and cannot be redefined.

```html
<div class="pk-hit pk-blank" aria-hidden="true"></div>
```

Not interactive. In edit mode CSS shows a `+` on it.

## 4. `label`

Static heading text for a cell.

```html
<div class="pk-hit pk-heading"><span class="pk-label">ENVIRONMENT</span></div>
```

## 5. `button`

Fires `action` on tap. No state.

```javascript
elec_genRstMain: { type: 'button', label: 'GEN RST MAIN', action: 'script:SSP_TBM_OH_GEN_RESET_MAIN' }
```

```html
<button type="button" class="pk-hit" data-pk-part="main"><span class="pk-label">GEN RST MAIN</span><span class="pk-sub">optional sublabel</span></button>
```

## 6. `toggle`

Fires `action` on tap; shows a boolean `state` with an indicator dot.

| Field | Default | Notes |
|-------|---------|-------|
| `state` | | State spec; result passed through `toBool` |
| `labels` | | `{ on: 'ON', off: 'OFF' }` — replaces the label text by state |
| `indicator` | `'dot'` | `'dot'` or `'none'` (colour the whole cell instead) |

```html
<button type="button" class="pk-hit" data-pk-part="main"><span class="pk-ind"></span><span class="pk-label">LIGHTS MASTER</span></button>
```

`update(state)`: `true` → add `pk-on`; `false` → remove `pk-on`; `undefined` → remove `pk-on`, add `pk-stale`. With `labels`, set the `.pk-label` text.

## 7. `hold`

A test or push button that stays lit for a while, or while pressed.

| Field | Default | Notes |
|-------|---------|-------|
| `mode` | `'latch'` | `'latch'`: tap fires `action` and lights for `holdMs`. `'momentary'`: finger down fires `action`, finger up fires `release` |
| `holdMs` | 1000 | Latch duration |
| `release` | | Action on finger up (momentary only) |
| `state` | | Optional; lit = state true **or** latch/press active |

Markup as `toggle`. Latch: on tap set `cell.local.holdUntil = now + holdMs`, add `pk-held`, and ask the binding engine to re-evaluate at `holdUntil` (`api.schedule`). Momentary: `press` adds `pk-held` and runs `action`; `release` (or a cancelled touch) removes it and runs `release`. In momentary mode a plain tap does nothing extra.

## 8. `multi`

A switch with 2–6 positions, one lamp per position (legacy "dual" buttons: dimmers, SOURCE, GENERATOR, AUX BP).

| Field | Default | Notes |
|-------|---------|-------|
| `positions` | | `[{ label, value?, action? }]`, 2–6 entries (V-018). If any entry has `action`, all MUST |
| `state` | | State spec giving the current position |
| `action` | | Used on tap when positions have no actions (the sim cycles itself) |
| `advance` | `'wrap'` | `'wrap'`, `'bounce'`, `'none'` — how the next position is chosen |
| `optimistic` | `true` without `state`, else `false` | Show the next position immediately |
| `optimisticMs` | 800 | How long optimistic display overrides `state` |
| `initial` | 0 | Starting position when there is no `state` |

A `multi` MUST have either position actions or `action`; otherwise it is display-only and MUST say so with `advance: 'none'` and no actions.

```html
<button type="button" class="pk-hit" data-pk-part="main">
  <span class="pk-hdr">SOURCE</span>
  <span class="pk-pos"><span class="pk-pos-label">GPU</span><span class="pk-lamp"></span></span>
  <span class="pk-pos"><span class="pk-pos-label">BAT</span><span class="pk-lamp"></span></span>
  <span class="pk-pos"><span class="pk-pos-label">OFF</span><span class="pk-lamp"></span></span>
</button>
```

**Current position** `cur`:

1. If `state` is set and its result is not `undefined`: if any position has `value`, `cur` = first `i` with `looseEq(positions[i].value, result)`, else `-1`; otherwise `cur = Math.round(Number(result))` when inside `[0, n-1]`, else `-1`.
2. Otherwise `cur = cell.local.pos` (starts at `initial`).

**Tap:**

1. `cur < 0` is treated as `-1` for `wrap` (next = 0) and as `0` for `bounce`.
2. `wrap`: `next = (cur + 1) % n`. `bounce`: `dir = cell.local.dir || 1`; if `cur + dir` leaves `[0, n-1]`, flip `dir`; `next = cur + dir`; store `dir`. `none`: `next = cur`.
3. Run `positions[next].action` if positions have actions, else `action`.
4. If optimistic: `cell.local.pos = next`, show `next`, add `pk-pending`; when `state` exists, ignore state updates for `optimisticMs`, then remove `pk-pending` and re-evaluate.

`update(index)`: add `pk-on` to `.pk-pos` number `index`, remove it from the others; `-1` lights none and adds `pk-stale` when the result was `undefined`.

## 9. `readout`

Text value with optional unit, optionally tappable.

```javascript
eng_oil: { type: 'readout', label: 'OIL', value: { src: 'A:GENERAL ENG OIL PRESSURE:1,psi', everyMs: 500 }, format: 'psi' }
```

```html
<div class="pk-hit"><span class="pk-label">OIL</span><span class="pk-val">—</span><span class="pk-unit">PSI</span></div>
```

With `action`, the root inner element is `<button type="button" class="pk-hit" data-pk-part="main">`. `update(value)`: `.pk-val` text = `PK.transform.format(format, value)`; missing → format's `missing` text and `pk-stale`.

## 10. `gauge`

Up to four rows of one or two values (legacy `gauge()`).

```javascript
elec_volts: { type: 'gauge', label: 'DC VOLTS', rows: [
  { left: 'L', value: 'A:ELECTRICAL GENALT BUS VOLTAGE:1,volts', format: { decimals: 1 },
    right: 'R', value2: 'A:ELECTRICAL GENALT BUS VOLTAGE:2,volts', format2: { decimals: 1 } }
] }
```

```html
<div class="pk-hit"><span class="pk-label">DC VOLTS</span>
  <div class="pk-row"><span class="pk-sub">L</span><span class="pk-val">—</span><span class="pk-sub">R</span><span class="pk-val">—</span></div>
</div>
```

Binding roles are `r<i>a` and `r<i>b` (`r0a`, `r0b`, …).

## 11. `stepper`

Decrement / increment pair with an optional readout.

| Field | Default | Notes |
|-------|---------|-------|
| `dec`, `inc` | | Actions |
| `value`, `format` | | Optional readout between the buttons |
| `repeatMs` | 0 | > 0: holding a button repeats every `repeatMs` (min 80) after a 400 ms delay |
| `decLabel`, `incLabel` | `−`, `+` | Button text |

```html
<div class="pk-hit pk-stepper">
  <button type="button" class="pk-dec" data-pk-part="dec">−</button>
  <span class="pk-mid"><span class="pk-label">FAN</span><span class="pk-val">—</span></span>
  <button type="button" class="pk-inc" data-pk-part="inc">+</button>
</div>
```

Without `repeatMs`, a tap on a part runs its action. With `repeatMs`, finger down runs the action once and starts repeating after 400 ms; finger up stops; the following tap event is ignored.

## 12. Behaviors (custom code)

Use a behavior only when data cannot describe the control. The expected case in the shipped aircraft is the Starship ECS temperature readouts, whose unit (°C or °F) and label depend on a second variable. Behaviors live in the pack's `behaviors.js`:

```javascript
PK.defineBehavior('blacksquare.starship.temp', {
  fields: { required: ['label', 'props'], optional: [] },

  /* Widget part — used by controls with type: 'custom', behavior: '<id>'.
     props: { tempF: <state spec, °F>, celsius: <state spec, boolean> } */
  render: function (ctl, cx) {
    return '<div class="pk-hit"><span class="pk-label">' + cx.esc(ctl.label) + '</span>' +
      '<span class="pk-val">\u2014</span></div>';
  },
  refs: function (root) {
    return {
      label: root.getElementsByClassName('pk-label')[0],
      val: root.getElementsByClassName('pk-val')[0]
    };
  },
  bindings: function (ctl) {
    return [
      { role: 'tempF', spec: ctl.props.tempF },
      { role: 'celsius', spec: ctl.props.celsius }
    ];
  },
  update: function (cell, role, value, api) {
    cell.local[role] = value;
    var c = cell.local.celsius === true;
    var f = cell.local.tempF;
    var shown = f === undefined ? undefined : (c ? (f - 32) * 5 / 9 : f);
    cell.refs.label.textContent = cell.ctl.label + ' \u00b0' + (c ? 'C' : 'F');
    cell.refs.val.textContent = api.format({ decimals: 0 }, shown);
  },

  /* Action part — used by actions 'behavior:<id>' (method run) or 'behavior:<id>#<method>'.
     Illustrative only; the real Starship unit switch is a plain script action. */
  run: function (args, api) {
    api.log.info('temp behavior action', args);
  }
});
```

A control using it:

```javascript
ecs_cabTemp: { type: 'custom', behavior: 'blacksquare.starship.temp', label: 'CAB TMP', props: {
  tempF: { src: 'L:var_CabinTemperature', fallback: ['L:VAR_CABINTEMPERATURE', 'A:AMBIENT TEMPERATURE,fahrenheit'] },
  celsius: { src: 'L:BKSQ_CABINTEMPDISPLAYFORCECELSIUS,Bool', test: { eq: 1 } }
} }
```

**The `api` object** (the only thing a behavior may use besides its arguments):

| Member | Purpose |
|--------|---------|
| `run(action)` | Run any action (string, object or array form) |
| `read(src)` | Current value of a source (registers it if needed) |
| `getLocal(name)`, `setLocal(name, v)` | Engine-side variables (`local:` sources); setting one re-evaluates dependent bindings |
| `invalidate(cell)` | Force the cell's bindings to re-apply |
| `schedule(cell, ms)` | Re-evaluate the cell after `ms` (use instead of `setTimeout`) |
| `now()` | `Date.now()` |
| `esc(s)` | HTML-escape |
| `format(fmt, v)` | Same as readout formatting |
| `log` | `PK.log` |

**Rules:** ES5 only. Touch the DOM only inside `cell.el`. No globals, no `setTimeout`/`setInterval` (use `api.schedule`), no direct adapter or `webApi` calls (use `api.run`), handle `undefined` values, never throw (the engine catches and logs, but a throwing behavior leaves its cell stale). Behavior ids are namespaced `<vendor>.<aircraft>.<name>`.

## 13. Adding a widget type (engine developers)

1. Implement in `panelkit/runtime/pk-widgets.js` (built-ins) or a new `panelkit/widgets/pk-w-<type>.js` that the loader includes.
2. `PK.widgets.define('<type>', impl)` where `impl` has:

| Member | Required | Signature |
|--------|----------|-----------|
| `fields` | yes | `{ required: [], optional: [] }` |
| `defaults` | no | Field defaults applied by the resolver |
| `interactive` | yes | `true` if the cell has tappable parts |
| `render` | yes | `(ctl, cx) → html` — `cx = { index, inert, esc }`. With `inert: true` (picker previews) omit `data-pk-part` |
| `refs` | no | `(rootEl, ctl) → object` — called once after mount |
| `bindings` | no | `(ctl) → [{ role, spec }]` |
| `update` | no | `(cell, role, value, api)` — called only when the value changed |
| `tap` | no | `(cell, part, api)` — default runs `ctl.action` |
| `press`, `release` | no | `(cell, part, api)` — finger down / up; declaring `press` makes the input module send press events for this type |

3. Loading the file MUST NOT touch the DOM (the validator loads widgets in Node to read `fields`).
4. Add the type to §2 and give it a section here, add CSS in `panelkit/css/panelkit.css`, a gallery entry, and unit tests for render (string) and update (with a DOM stub).
