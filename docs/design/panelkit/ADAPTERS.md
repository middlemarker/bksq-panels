# PanelKit — sim adapters

An adapter connects the engine to a simulator bridge. The engine only ever calls the interface below; everything bridge-specific (URLs, RPN strings, `webApi`) stays inside the adapter file.

## 1. Interface

```javascript
PK.adapters.define('aao', function (options) {
  return {
    id: 'aao',
    kinds: {
      sources: ['L', 'A', 'E'],                 // engine handles 'local' and 'const' itself
      actions: ['script', 'k', 'rpn', 'set'],   // engine handles adjust/cycle/seq/behavior on top
      settable: ['L', 'A']                       // source kinds accepted by 'set'
    },
    start: function (pollMs) {},
    stop: function () {},
    setPollInterval: function (ms) {},
    watch: function (src) {},
    read: function (src) { return undefined; },
    revision: function () { return 0; },
    onData: function (fn) {},
    run: function (action) { return true; },
    status: function () { return { state: 'connecting', lastOkMs: 0, rttMs: 0 }; }
  };
});
```

| Member | Contract |
|--------|----------|
| `kinds` | Static capability lists. The validator uses them for V-022 / V-032; the engine refuses unsupported actions with a log entry |
| `start(pollMs)` | Begin talking to the bridge. Idempotent |
| `stop()` | Stop all timers and requests. Idempotent |
| `setPollInterval(ms)` | Change the poll interval (50–2000) without losing watched vars |
| `watch(src)` | Register a canonical source object (`{ kind, name, index, unit, key }`). Idempotent per `src.key`. MUST be cheap; registration may take effect on the next request |
| `read(src)` | Last known value from the cache, or `undefined`. MUST NOT trigger network work and MUST NOT register (call `watch` first) |
| `revision()` | Integer that increases after every successful data update |
| `onData(fn)` | Call `fn()` after each successful update (after `revision` increments). Multiple listeners allowed |
| `run(action)` | Execute a canonical action with `op` in `kinds.actions`. Returns `false` if refused. MUST NOT throw |
| `status()` | `state`: `connecting` (no success yet), `live` (last success within 3 × interval), `stale` (older), `offline` (≥ 3 consecutive failures). `lastOkMs`: `Date.now()` of last success. `rttMs`: last round trip |

Canonical actions passed to `run` (from [PACK-FORMAT.md](PACK-FORMAT.md) §10):

| `op` | Fields |
|------|--------|
| `script` | `label`, `group` |
| `k` | `event`, `value` |
| `rpn` | `code` |
| `set` | `target` (canonical source), `value` |

## 2. AxisAndOhs adapter (`panelkit/adapters/pk-adapter-aao.js`)

Wraps the existing `common/AaoWebApi.js` (single global instance created by the adapter, not by the page). It keeps every v0.3 network optimisation: one request in flight, cached request URL rebuilt only when the var set changes, adaptive interval on slow round trips, revision counter and `onData`.

### 2.1 Source mapping

| Canonical source | `GetSimVar` expression |
|------------------|------------------------|
| `L` | `'(L:' + name + ', ' + unit + ')'` |
| `A` | `'(A:' + name + (index ? ':' + index : '') + ', ' + unit + ')'` |
| `E` | `'(E:' + name + ', ' + unit + ')'` |

`watch` calls `webApi.GetSimVar(expr)` once per key (this registers the var on the poll URL). `read` calls `GetSimVar(expr)` again, which is a cache read for a registered var.

`GetSimVar` returns `0` (or `''` for string vars) from the moment a var is registered, before any response has carried it. `read` MUST return `undefined` until `webApi.hasValue(expr)` is true, so widgets show `pk-stale` instead of a false "off".

AaoWebApi treats a var as a string var when the expression contains `, String`; the adapter MUST write the unit `String` with that exact capitalisation (normalise `string`, `STRING`).

`AaoWebApi.js` contains the placeholder `<AAO_URL>`, which the AxisAndOhs web server replaces when it serves the file. Opened from `file://` or another server, the AAO adapter cannot connect; use `?adapter=mock`.

### 2.2 Action mapping

| Canonical action | AaoWebApi call |
|------------------|----------------|
| `script` | `webApi.SendEvent(1, '(>K:' + group + '-' + label + ')')` — identical to v0.3 `sendPanelEvent` |
| `k` | `webApi.SendScript(value + ' (>K:' + event + ')')` |
| `rpn` | `webApi.SendScript(code)` |
| `set` on `L` | `webApi.SendScript(value + ' (>L:' + name + ', ' + unit + ')')` |
| `set` on `A` | `webApi.SendScript(value + ' (>A:' + name + (index ? ':' + index : '') + ', ' + unit + ')')` |

String values are quoted for RPN (`'text'`); numbers are written with `String(n)`.

### 2.3 Status

`AaoWebApi` needs three read-only additions (allowed: the file is already maintained in this repo):

| Addition | Implementation |
|----------|----------------|
| `hasValue(expr)` | `true` once a response has contained `expr` in `getvars` / `getstringvars` (set a `_seen[expr]` flag in `_dataRequestListener`) |
| `getLastOkTime()` | `Date.now()` recorded after each successfully parsed response |
| `getFailureCount()` | Consecutive failures (XHR `error`, or a response that fails to parse); reset to 0 on success |

A response that fails to parse already counts as a failed poll and polling continues (fixed in v0.4). Nothing else in `AaoWebApi.js` changes.

### 2.4 Options

| Option | Source | Default |
|--------|--------|---------|
| `pollMs` | Settings `pollIntervalMs` | 100 |
| `baseUrl` | `?aao=` query parameter (dev only) | Same origin, as v0.3 |

## 3. Mock adapter (`panelkit/adapters/pk-adapter-mock.js`)

In-memory simulator for tests (Node) and desktop development (`?adapter=mock`). It MUST NOT use XHR or the DOM.

- **State:** a map from canonical key to value, seeded from `pack.mock.values`. Watched keys without a seed read `undefined` until the first tick, then `0` (so `pk-stale` paths are testable).
- **Ticks:** a timer every `pollMs` (in the browser) increments `revision` and fires `onData`. In Node tests, the test calls `adapter._tick()` manually; `start` does not create timers when `options.manual` is true.
- **Rules:** `run({ op: 'script', label })` looks up `pack.mock.rules['script:' + label]` and applies each op (`toggle`, `set`, `adjust`, `cycle` as in PACK-FORMAT §10.2). `k`/`rpn` actions are recorded but change nothing unless a rule exists for `'k:<EVENT>'`. `set` writes the value.
- **Drift:** each tick moves each `drift` key by a small random step inside its range (seeded PRNG when `options.seed` is set, so tests are deterministic).
- **Recording:** `adapter._actions` keeps the last 200 actions for assertions.
- **Status:** always `live` after `start`.
- `kinds`: sources `L`, `A`, `E`; actions `script`, `k`, `rpn`, `set`; settable `L`, `A`.

## 4. Writing a new adapter

Examples: a WebSocket bridge, SimConnect via a local relay, X-Plane via a web plugin.

1. Create `panelkit/adapters/pk-adapter-<id>.js`, ES5, no DOM access except network APIs (`XMLHttpRequest`, `WebSocket`, which iOS 12 supports).
2. Implement every member of §1. Declare honest `kinds`; anything not declared is rejected before reaching you.
3. Map canonical sources and actions in one table, documented in a new section of this file.
4. Add the adapter to the loader's adapter table (DETAILED-DESIGN §4.2).
5. Pass the conformance tests below.

## 5. Conformance tests (`panelkit/tests/adapter-conformance.test.js`)

Run against the mock adapter always, and against any other adapter with a stubbed transport:

| # | Test |
|---|------|
| A1 | `watch` twice with the same key registers once |
| A2 | `read` before any data returns `undefined` |
| A3 | After a successful update, `revision()` increases by exactly 1 and every `onData` listener runs once |
| A4 | `run` with an op not in `kinds.actions` returns `false` and does not throw |
| A5 | `stop()` then `start()` resumes updates without re-watching |
| A6 | `setPollInterval` changes the request cadence and keeps watched keys |
| A7 | Transport failure three times in a row → `status().state === 'offline'`; next success → `live` |
| A8 | `read` never triggers a request (count transport calls) |
| A9 | AAO only: `script` action produces exactly `(>K:<group>-<label>)` with value 1 |
