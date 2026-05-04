/**
 * Shared panel builder — turns a "list of named buttons" layout into the
 * runtime's `innerHtml` + `polls` shape, and exposes a small set of HTML
 * helpers so each aircraft's `config/buttons.js` only has to declare data,
 * not raw markup. Runs once per panel script load (build-time concat); the
 * runtime still does a single `grid.innerHTML = panel.innerHtml`, so there
 * is no per-frame cost beyond the existing implementation.
 *
 * Compatible with iOS 12.5 (ES5; no template literals, no const/let).
 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function attrs(id, fixed) {
    return (id ? ' id="' + id + '"' : '') + (fixed ? ' data-fixed-label="1"' : '');
  }

  /**
   * Action button. `label` is treated as raw HTML (so callers can include
   * &rarr;, <br>, etc., matching the existing inline markup verbatim).
   */
  function button(cls, label, js, id, ind, fixed) {
    var hasInd = !!ind;
    return '<button type="button" class="btn ' + cls + '"' +
      attrs(id, fixed || hasInd) +
      ' onclick="' + js + '">' +
      (hasInd ? '<span class="indicator" id="' + ind + '"></span>' : '') +
      (label == null ? '' : label) +
      '</button>';
  }

  /**
   * Helper that wires a button to `<sender>('<sspLabel>')`.
   * Default sender is `sendP` (used by Starship). TBM passes `sendTbmP`.
   */
  function sendButton(cls, label, sspLabel, opts) {
    opts = opts || {};
    var sender = opts.sender || 'sendP';
    return button(cls, label, sender + '(\'' + sspLabel + '\')', opts.id, opts.ind, opts.fixed);
  }

  /**
   * Dual-style button: header + N rows of `<label, lampId>` pairs.
   * `label` (header text) is escaped; row labels are raw HTML to allow
   * arrow glyphs / line breaks to match the original markup.
   */
  function dual(cls, hdr, js, id, rows) {
    var html = ['<button type="button" class="btn ' + cls + ' dual"' +
      attrs(id, true) + ' onclick="' + js + '"><div class="hdr">' +
      esc(hdr) + '</div>'];
    var i;
    rows = rows || [];
    for (i = 0; i < rows.length; i++) {
      html.push('<div class="row"><span>' + (rows[i][0] == null ? '' : rows[i][0]) +
        '</span><span class="lamp" id="' + rows[i][1] + '"></span></div>');
    }
    html.push('</button>');
    return html.join('');
  }

  /**
   * Gauge cell. `spec`:
   *   { cls, label, valId, unit, unitId } single-value form, OR
   *   { cls, label, rows: [{ subLeft, valId, subRight, valId2 }] } multi-row form.
   */
  function gauge(spec) {
    spec = spec || {};
    var cls = spec.cls || 'btn gauge';
    var html = ['<div class="' + cls + '"' + attrs(spec.id, false) + '>'];
    if (spec.label != null) {
      html.push('<span class="g-label"' + attrs(spec.labelId, false) + '>' + spec.label + '</span>');
    }
    if (spec.rows && spec.rows.length) {
      var i;
      for (i = 0; i < spec.rows.length; i++) {
        var r = spec.rows[i];
        html.push('<div class="g-row">');
        if (r.subLeft != null) html.push('<span class="g-sub">' + r.subLeft + '</span>');
        html.push('<span class="g-val" id="' + r.valId + '">\u2014</span>');
        if (r.subRight != null) html.push('<span class="g-sub">' + r.subRight + '</span>');
        if (r.valId2) html.push('<span class="g-val" id="' + r.valId2 + '">\u2014</span>');
        html.push('</div>');
      }
    } else if (spec.valId) {
      html.push('<span class="g-val" id="' + spec.valId + '">' + (spec.initial || '\u2014') + '</span>');
      if (spec.unit != null) {
        html.push('<span class="g-unit"' + attrs(spec.unitId, false) + '>' + spec.unit + '</span>');
      }
    }
    html.push('</div>');
    return html.join('');
  }

  function placeholder(label) {
    return '<button type="button" class="btn placeholder" tabindex="-1">' +
      (label == null ? '\u2014' : label) + '</button>';
  }

  /** Escape single backslashes and quotes for use inside single-quoted JS strings. */
  function qJs(s) {
    return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
  }

  /**
   * Test / hold-until style button: click calls `SSPRuntime.testHold(ssp, ms, btnId)`.
   * `opts`: id, ind (indicator span id), holdMs (default 1000), fixed
   */
  function holdButton(cls, label, sspLabel, opts) {
    opts = opts || {};
    var ms = opts.holdMs != null ? opts.holdMs : 1000;
    var onclick = 'SSPRuntime.testHold(\'' + qJs(sspLabel) + '\',' + ms + ',\'' + qJs(opts.id) + '\')';
    var hasInd = !!opts.ind;
    return '<button type="button" class="btn ' + cls + '"' +
      attrs(opts.id, opts.fixed || hasInd) +
      ' onclick="' + onclick + '">' +
      (hasInd ? '<span class="indicator" id="' + opts.ind + '"></span>' : '') +
      (label == null ? '' : label) +
      '</button>';
  }

  window.SSPPanelHelpers = {
    esc: esc,
    attrs: attrs,
    button: button,
    sendButton: sendButton,
    holdButton: holdButton,
    dual: dual,
    gauge: gauge,
    placeholder: placeholder
  };

  function pushPolls(out, polls) {
    if (!polls) return;
    var i;
    for (i = 0; i < polls.length; i++) out.push(polls[i]);
  }

  /**
   * Resolve a single layout token. Strings are looked up in `buttons`;
   * unknown names fall back to `buttons.empty` (or a built-in placeholder).
   * Objects with a `.length` (arrays) recurse — useful for grouping rows.
   * Plain objects with `.html`/`.polls` are inlined verbatim, allowing
   * one-off cells without having to add them to the dict.
   */
  function addToken(buttons, outHtml, outPolls, token) {
    if (token == null) token = 'empty';
    if (typeof token === 'string') {
      var def = buttons[token];
      if (!def) def = buttons.empty;
      if (!def) {
        outHtml.push(placeholder());
        return;
      }
      outHtml.push(def.html || '');
      pushPolls(outPolls, def.polls);
      return;
    }
    if (typeof token === 'object') {
      if (token.length != null) {
        addLayout(buttons, outHtml, outPolls, token);
        return;
      }
      if (token.html != null || token.polls != null) {
        outHtml.push(token.html || '');
        pushPolls(outPolls, token.polls);
        return;
      }
    }
  }

  function addLayout(buttons, outHtml, outPolls, layout) {
    if (!layout) return;
    var i;
    for (i = 0; i < layout.length; i++) addToken(buttons, outHtml, outPolls, layout[i]);
  }

  /**
   * Turn a `{ buttons, layout, ... }` spec into the runtime panel shape
   * (`renderMode: 'innerHtml'`, `innerHtml`, `polls`, plus passthroughs).
   */
  window.SSPPanel = function (spec) {
    spec = spec || {};
    var buttons = spec.buttons || {};
    var html = [];
    var polls = [];
    addLayout(buttons, html, polls, spec.layout);
    pushPolls(polls, spec.extraPolls);
    pushPolls(polls, spec.polls);
    var out = {
      renderMode: 'innerHtml',
      gridClass: spec.gridClass || 'grid',
      innerHtml: html.join(''),
      polls: polls
    };
    if (spec.id != null) out.id = spec.id;
    if (spec.title != null) out.title = spec.title;
    if (spec.pollIntervalMs != null) out.pollIntervalMs = spec.pollIntervalMs;
    if (spec.profiles != null) out.profiles = spec.profiles;
    if (spec.defaultProfile != null) out.defaultProfile = spec.defaultProfile;
    if (spec.skipFitGrid) out.skipFitGrid = true;
    return out;
  };

  /**
   * Convenience: bind a per-aircraft buttons dictionary so callers don't
   * have to pass `buttons:` on every panel. Returns a function with the
   * same signature as SSPPanel minus `buttons`.
   *
   *   window.StarshipPanel = SSP_PANEL_FACTORY(window.SSP_BUTTONS);
   *   window.SSP_PANELS.overhead = StarshipPanel({ layout: [...] });
   */
  window.SSP_PANEL_FACTORY = function (buttons, defaults) {
    defaults = defaults || {};
    return function (spec) {
      spec = spec || {};
      var merged = { buttons: spec.buttons || buttons };
      var k;
      for (k in defaults) {
        if (Object.prototype.hasOwnProperty.call(defaults, k) && spec[k] === undefined) {
          merged[k] = defaults[k];
        }
      }
      for (k in spec) {
        if (Object.prototype.hasOwnProperty.call(spec, k)) merged[k] = spec[k];
      }
      if (!merged.buttons) merged.buttons = buttons;
      return window.SSPPanel(merged);
    };
  };
})();
