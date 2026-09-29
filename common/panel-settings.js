(function () {
  function getMeta() {
    return window.BKSQ_AIRCRAFT || {};
  }
  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }
  function setUiVh() {
    try { document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px'); } catch (e) {}
  }
  setUiVh();
  window.addEventListener('resize', setUiVh, { passive: true });
  window.addEventListener('orientationchange', function () { setTimeout(setUiVh, 350); }, { passive: true });

  var FONT_STACKS = [
    '"DIN Alternate","DIN Condensed","Roboto Condensed","Eurostile","Orbitron",system-ui,-apple-system,Segoe UI,sans-serif',
    'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    '"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    'Consolas,"Courier New","Lucida Console",monospace',
    'Georgia,"Times New Roman",Times,serif',
    'Arial,Helvetica,sans-serif'
  ];

  function defaultNavPages() {
    var pages = getMeta().pages || [];
    var out = {};
    var i;
    for (i = 0; i < pages.length; i++) out[pages[i].id] = pages[i].hiddenByDefault ? false : true;
    return out;
  }

  function normalizePanelRowAlign(v) {
    if (v === 'center' || v === 'bottom') return v;
    return 'top';
  }

  function alignToPadPct(v) {
    v = normalizePanelRowAlign(v);
    if (v === 'center') return 50;
    if (v === 'bottom') return 100;
    return 0;
  }

  function padPctToAlign(v) {
    v = Number(v);
    if (!isFinite(v)) return 'top';
    if (v >= 75) return 'bottom';
    if (v >= 25) return 'center';
    return 'top';
  }

  function defaults() {
    var m = getMeta();
    var d = m.defaults || {};
    return {
      navPages: defaultNavPages(),
      panelBtnFontPx: d.panelBtnFontPx || 18,
      panelGridRowMinPx: d.panelGridRowMinPx || 105,
      panelGridGapPx: d.panelGridGapPx || 14,
      panelGridGapXPx: d.panelGridGapXPx || 10,
      panelRowAlign: normalizePanelRowAlign(d.panelRowAlign || padPctToAlign(d.panelRowPadPct)),
      navFontPx: d.navFontPx || 13,
      navMinHPx: d.navMinHPx || 42,
      pollIntervalMs: d.pollIntervalMs || 100,
      uiFontIndex: d.uiFontIndex || 0,
      uiBrightnessPct: d.uiBrightnessPct || 100,
      dotScalePct: d.dotScalePct || 100,
      gaugeValScalePct: d.gaugeValScalePct || 100,
      reduceMotion: !!d.reduceMotion,
      showTouchFlash: d.showTouchFlash !== false,
      panelScrollable: !!d.panelScrollable
    };
  }

  function storageKey() {
    return getMeta().storageKey || ('bksq-panels-ui-settings-' + (getMeta().id || 'default'));
  }

  function clampPollMs(v) {
    v = Number(v);
    if (!isFinite(v)) v = defaults().pollIntervalMs || 100;
    return Math.max(50, Math.min(2000, Math.round(v)));
  }

  function mergeNavPages(dst, src) {
    var k;
    if (!src || typeof src !== 'object' || !dst) return;
    for (k in src) {
      if (Object.prototype.hasOwnProperty.call(src, k) && Object.prototype.hasOwnProperty.call(dst, k)) dst[k] = !!src[k];
    }
  }

  function ensureNavPages(s) {
    var def = defaultNavPages();
    var k;
    if (!s.navPages || typeof s.navPages !== 'object') s.navPages = clone(def);
    for (k in def) {
      if (Object.prototype.hasOwnProperty.call(def, k) && typeof s.navPages[k] !== 'boolean') s.navPages[k] = !!def[k];
    }
    return s;
  }

  var NUM_KEYS = [
    'panelBtnFontPx', 'panelGridRowMinPx', 'panelGridGapPx', 'panelGridGapXPx',
    'navFontPx', 'navMinHPx', 'pollIntervalMs', 'uiFontIndex', 'uiBrightnessPct',
    'dotScalePct', 'gaugeValScalePct'
  ];

  function nOr(n, fallback) {
    n = Number(n);
    return isFinite(n) ? n : fallback;
  }

  function clampAll(s) {
    var d = defaults();
    s.panelBtnFontPx = Math.max(10, Math.min(40, nOr(s.panelBtnFontPx, d.panelBtnFontPx)));
    s.panelGridRowMinPx = Math.max(56, Math.min(220, nOr(s.panelGridRowMinPx, d.panelGridRowMinPx)));
    s.panelGridGapPx = Math.max(4, Math.min(32, nOr(s.panelGridGapPx, d.panelGridGapPx)));
    s.panelGridGapXPx = Math.max(4, Math.min(32, nOr(s.panelGridGapXPx, d.panelGridGapXPx)));
    s.panelRowAlign = normalizePanelRowAlign(s.panelRowAlign);
    s.navFontPx = Math.max(10, Math.min(22, nOr(s.navFontPx, d.navFontPx)));
    s.navMinHPx = Math.max(32, Math.min(64, nOr(s.navMinHPx, d.navMinHPx)));
    s.pollIntervalMs = clampPollMs(s.pollIntervalMs);
    s.uiFontIndex = Math.max(0, Math.min(FONT_STACKS.length - 1, Math.round(nOr(s.uiFontIndex, d.uiFontIndex))));
    s.uiBrightnessPct = Math.max(70, Math.min(115, Math.round(nOr(s.uiBrightnessPct, d.uiBrightnessPct))));
    s.dotScalePct = Math.max(70, Math.min(130, Math.round(nOr(s.dotScalePct, d.dotScalePct))));
    s.gaugeValScalePct = Math.max(85, Math.min(130, Math.round(nOr(s.gaugeValScalePct, d.gaugeValScalePct))));
    if (typeof s.reduceMotion !== 'boolean') s.reduceMotion = !!d.reduceMotion;
    if (typeof s.showTouchFlash !== 'boolean') s.showTouchFlash = !!d.showTouchFlash;
    if (typeof s.panelScrollable !== 'boolean') s.panelScrollable = !!d.panelScrollable;
    return ensureNavPages(s);
  }

  function load() {
    var s = defaults();
    var raw, o, i, key, n;
    try {
      raw = localStorage.getItem(storageKey());
      if (!raw) return clampAll(ensureNavPages(s));
      o = JSON.parse(raw);
      if (o.navPages) mergeNavPages(s.navPages, o.navPages);
      for (i = 0; i < NUM_KEYS.length; i++) {
        key = NUM_KEYS[i];
        if (o[key] !== undefined && o[key] !== null) {
          n = Number(o[key]);
          if (isFinite(n)) s[key] = n;
        }
      }
      if (typeof o.panelRowAlign === 'string') s.panelRowAlign = o.panelRowAlign;
      else if (o.panelRowPadPct !== undefined && o.panelRowPadPct !== null) s.panelRowAlign = padPctToAlign(o.panelRowPadPct);
      if (typeof o.reduceMotion === 'boolean') s.reduceMotion = o.reduceMotion;
      if (typeof o.showTouchFlash === 'boolean') s.showTouchFlash = o.showTouchFlash;
      if (typeof o.panelScrollable === 'boolean') s.panelScrollable = o.panelScrollable;
    } catch (e) {
      s = defaults();
    }
    return clampAll(ensureNavPages(s));
  }

  function save(settings) {
    try {
      var out = clone(settings);
      out.panelRowAlign = normalizePanelRowAlign(out.panelRowAlign);
      out.panelRowPadPct = alignToPadPct(out.panelRowAlign);
      localStorage.setItem(storageKey(), JSON.stringify(out));
    } catch (e) {}
  }

  function applyCssVars(s) {
    var r = document.documentElement.style;
    var fi = Math.max(0, Math.min(FONT_STACKS.length - 1, Math.round(s.uiFontIndex)));
    r.setProperty('--ssp-btn-font', s.panelBtnFontPx + 'px');
    r.setProperty('--ssp-grid-row-min', s.panelGridRowMinPx + 'px');
    r.setProperty('--ssp-grid-gap-y', s.panelGridGapPx + 'px');
    r.setProperty('--ssp-grid-gap-x', s.panelGridGapXPx + 'px');
    r.setProperty('--ssp-row-pad-pct', String(alignToPadPct(s.panelRowAlign)));
    r.setProperty('--ssp-nav-font', s.navFontPx + 'px');
    r.setProperty('--ssp-nav-min-h', s.navMinHPx + 'px');
    r.setProperty('--ssp-ui-font', FONT_STACKS[fi]);
    r.setProperty('--ssp-dot-scale', (s.dotScalePct / 100).toFixed(3));
    r.setProperty('--ssp-gauge-val-mult', (s.gaugeValScalePct / 100).toFixed(3));
  }

  function applyPreviewToGrid(el, s) {
    var cells, j;
    if (!el) return;
    el.style.gap = s.panelGridGapPx + 'px ' + s.panelGridGapXPx + 'px';
    el.style.gridTemplateRows = '';
    el.style.gridAutoRows = 'minmax(' + s.panelGridRowMinPx + 'px, 1fr)';
    cells = el.querySelectorAll('.btn');
    for (j = 0; j < cells.length; j++) cells[j].style.fontSize = s.panelBtnFontPx + 'px';
  }

  function applyVisibility(s) {
    var links, i, el, id, on, b;
    document.documentElement.classList.toggle('ssp-reduce-motion', !!s.reduceMotion);
    document.documentElement.classList.toggle('ssp-no-touch-flash', !s.showTouchFlash);
    document.documentElement.classList.toggle('ssp-panel-scrollable', !(document.body && document.body.classList.contains('ssp-index-hub')) && !!s.panelScrollable);
    document.documentElement.classList.toggle('ssp-row-align-center', s.panelRowAlign === 'center');
    document.documentElement.classList.toggle('ssp-row-align-bottom', s.panelRowAlign === 'bottom');
    try {
      b = s.uiBrightnessPct;
      if (document.body) document.body.style.filter = b === 100 ? '' : 'brightness(' + (b / 100).toFixed(3) + ')';
    } catch (e2) {}
    links = document.querySelectorAll('.nav-bar a[data-panel-nav]');
    for (i = 0; i < links.length; i++) {
      el = links[i];
      id = el.getAttribute('data-panel-nav');
      on = id && s.navPages[id] !== false;
      el.classList.toggle('ssp-nav-hidden', !on);
    }
  }

  var _lastAppliedPollMs = null;
  function applyAaoPoll() {
    try {
      if (typeof webApi === 'undefined' || !webApi) return;
      if (_lastAppliedPollMs === current.pollIntervalMs) return;
      _lastAppliedPollMs = current.pollIntervalMs;
      if (webApi.StopAPI) webApi.StopAPI();
      if (webApi.StartAPI) webApi.StartAPI(current.pollIntervalMs);
    } catch (e) {}
  }

  function dispatchApplied(settings) {
    try {
      window.dispatchEvent(new CustomEvent('ssp-ui-settings-applied', { detail: settings }));
    } catch (e) {
      var ev = document.createEvent('CustomEvent');
      ev.initCustomEvent('ssp-ui-settings-applied', false, false, settings);
      window.dispatchEvent(ev);
    }
  }

  var current = clampAll(load());
  window.SSP_GET_POLL_MS = function () { return clampPollMs(current.pollIntervalMs); };
  window.SSP_GET_ROW_PAD_PCT = function () { return alignToPadPct(current.panelRowAlign); };
  window.SSP_UI_FONT_LABELS = ['Cockpit (DIN / Eurostile)', 'System UI', 'Segoe / Roboto', 'Monospace', 'Serif', 'Arial / Helvetica'];

  window.SSP_UI_SETTINGS = {
    STORAGE_KEY: storageKey(),
    defaults: defaults(),
    load: load,
    save: save,
    get: function () { return clone(current); },
    apply: function (settings) {
      current = clampAll(settings || current);
      applyCssVars(current);
      applyVisibility(current);
      applyPreviewToGrid(document.getElementById('settingsPreviewGrid'), current);
      applyPreviewToGrid(document.getElementById('settingsMixPreviewGrid'), current);
      applyAaoPoll();
      try {
        if (typeof window.SSPRuntime !== 'undefined' && typeof SSPRuntime.setPollInterval === 'function') SSPRuntime.setPollInterval(current.pollIntervalMs);
      } catch (e3) {}
      if (typeof window.fitGrid === 'function') setTimeout(function () { try { window.fitGrid(); } catch (e4) {} }, 0);
      dispatchApplied(current);
    },
    set: function (partial) {
      var next = clone(current);
      var i, key, n;
      if (partial) {
        if (partial.navPages) mergeNavPages(next.navPages, partial.navPages);
        if (typeof partial.reduceMotion === 'boolean') next.reduceMotion = partial.reduceMotion;
        if (typeof partial.showTouchFlash === 'boolean') next.showTouchFlash = partial.showTouchFlash;
        if (typeof partial.panelScrollable === 'boolean') next.panelScrollable = partial.panelScrollable;
        if (typeof partial.panelRowAlign === 'string') next.panelRowAlign = partial.panelRowAlign;
        else if (partial.panelRowPadPct !== undefined && partial.panelRowPadPct !== null) next.panelRowAlign = padPctToAlign(partial.panelRowPadPct);
        for (i = 0; i < NUM_KEYS.length; i++) {
          key = NUM_KEYS[i];
          if (partial[key] !== undefined && partial[key] !== null) {
            n = Number(partial[key]);
            if (isFinite(n)) next[key] = n;
          }
        }
      }
      current = clampAll(next);
      save(current);
      window.SSP_UI_SETTINGS.apply(current);
    },
    reset: function () {
      current = clampAll(defaults());
      save(current);
      window.SSP_UI_SETTINGS.apply(current);
      return current;
    }
  };

  function bindSettingsNav() {
    var overlay = document.getElementById('settingsOverlay');
    var gearModals = document.querySelectorAll('a.nav-settings-gear[data-settings-modal]');
    var g;
    function setAllGears(on) {
      var gears = document.querySelectorAll('a.nav-settings-gear');
      var i;
      for (i = 0; i < gears.length; i++) gears[i].classList.toggle('active', !!on);
    }
    function openSettingsOverlay(e) {
      if (e) e.preventDefault();
      if (!overlay) {
        window.location.assign(getSettingsHref());
        return;
      }
      overlay.classList.add('on');
      document.documentElement.classList.add('ssp-settings-open');
      if (document.body) document.body.style.overflow = 'hidden';
      setUiVh();
      setAllGears(true);
      try { history.replaceState(null, '', '#settings'); } catch (x) {}
      try { window.dispatchEvent(new CustomEvent('ssp-settings-opened')); } catch (x2) {}
    }
    function getSettingsHref() {
      var id = getMeta().id || '';
      return '../../../index.html?aircraft=' + encodeURIComponent(id) + '#settings';
    }
    window.SSP_UI_SETTINGS_NAV_CLOSE = function () {
      setAllGears(false);
      document.documentElement.classList.remove('ssp-settings-open');
      try {
        if (window.location.hash === '#settings') history.replaceState(null, '', window.location.pathname.split('/').pop() || 'index.html');
      } catch (e) {}
    };
    for (g = 0; g < gearModals.length; g++) {
      gearModals[g].addEventListener('click', openSettingsOverlay);
    }
    if (overlay && (window.location.hash === '#settings' || overlay.classList.contains('on'))) openSettingsOverlay();
  }

  function bindSettingsForm() {
    var overlay = document.getElementById('settingsOverlay');
    var closeBtn = document.getElementById('settingsClose');
    var resetBtn = document.getElementById('settingsReset');
    var sel = document.getElementById('selUiFont');
    var rowAlignSel = document.getElementById('selRowAlign');

    function attrN(el, name) {
      var v = Number(el.getAttribute(name));
      return isFinite(v) ? v : null;
    }
    function clampToRange(rng, v) {
      var mn = attrN(rng, 'min');
      var mx = attrN(rng, 'max');
      var st = attrN(rng, 'step') || 1;
      if (mn != null) v = Math.max(mn, v);
      if (mx != null) v = Math.min(mx, v);
      if (st > 0) v = Math.round(v / st) * st;
      return v;
    }
    function setBoth(rngId, numId, val) {
      var rng = document.getElementById(rngId);
      var num = document.getElementById(numId);
      if (rng) rng.value = String(val);
      if (num && document.activeElement !== num) num.value = String(val);
    }
    function sync() {
      var s = window.SSP_UI_SETTINGS.get();
      var c, pages, i, navCb, navId;
      if (sel) sel.value = String(s.uiFontIndex);
      if (rowAlignSel) rowAlignSel.value = normalizePanelRowAlign(s.panelRowAlign);
      c = document.getElementById('chkReduceMotion'); if (c) c.checked = !!s.reduceMotion;
      c = document.getElementById('chkTouchFlash'); if (c) c.checked = !!s.showTouchFlash;
      c = document.getElementById('chkPanelScrollable'); if (c) c.checked = !!s.panelScrollable;
      setBoth('rngPollMs', 'numPollMs', s.pollIntervalMs);
      setBoth('rngPanelFont', 'numPanelFont', s.panelBtnFontPx);
      setBoth('rngGaugeVal', 'numGaugeVal', s.gaugeValScalePct);
      setBoth('rngBright', 'numBright', s.uiBrightnessPct);
      setBoth('rngDotScale', 'numDotScale', s.dotScalePct);
      setBoth('rngGridRow', 'numGridRow', s.panelGridRowMinPx);
      setBoth('rngGridGapY', 'numGridGapY', s.panelGridGapPx);
      setBoth('rngGridGapX', 'numGridGapX', s.panelGridGapXPx);
      setBoth('rngNavFont', 'numNavFont', s.navFontPx);
      setBoth('rngNavH', 'numNavH', s.navMinHPx);
      pages = getMeta().pages || [];
      for (i = 0; i < pages.length; i++) {
        navId = pages[i].id;
        navCb = document.getElementById('navChk_' + navId);
        if (navCb) navCb.checked = !!s.navPages[navId];
      }
    }
    function commitValue(key, raw, rng) {
      var v = Number(raw);
      if (!isFinite(v)) return;
      if (rng) v = clampToRange(rng, v);
      var patch = {};
      patch[key] = v;
      window.SSP_UI_SETTINGS.set(patch);
      sync();
    }
    function wireNumeric(rngId, numId, key) {
      var rng = document.getElementById(rngId);
      var num = document.getElementById(numId);
      if (!rng) return;
      function fromRange() { commitValue(key, rng.value, rng); }
      rng.addEventListener('input', fromRange);
      rng.addEventListener('change', fromRange);
      rng.addEventListener('touchend', fromRange, { passive: true });
      rng.addEventListener('pointerup', fromRange);
      if (!num) return;
      num.addEventListener('input', function () {
        var v = Number(num.value);
        if (!isFinite(v)) return;
        var mn = attrN(rng, 'min');
        var mx = attrN(rng, 'max');
        if (mn != null && v < mn) return;
        if (mx != null && v > mx) return;
        var patch = {};
        patch[key] = v;
        window.SSP_UI_SETTINGS.set(patch);
        if (rng) rng.value = String(v);
      });
      num.addEventListener('change', function () { commitValue(key, num.value, rng); });
      num.addEventListener('blur', function () { commitValue(key, num.value, rng); });
      num.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); commitValue(key, num.value, rng); num.blur(); }
      });
    }
    function wireCheckbox(id, key) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () {
        var patch = {};
        patch[key] = el.checked;
        window.SSP_UI_SETTINGS.set(patch);
        sync();
      });
    }
    function buildFontSelect() {
      var labels = window.SSP_UI_FONT_LABELS || [];
      var i, o, nOpt, nLab;
      if (!sel) return;
      if (sel.getAttribute('data-ssp-font-wired') === '1') return;
      nOpt = sel.options ? sel.options.length : 0;
      nLab = labels.length;
      if (nLab > 0 && nOpt !== nLab) {
        sel.innerHTML = '';
        for (i = 0; i < nLab; i++) {
          o = document.createElement('option');
          o.value = String(i);
          o.textContent = labels[i];
          sel.appendChild(o);
        }
      }
      sel.setAttribute('data-ssp-font-wired', '1');
      sel.addEventListener('change', function () {
        window.SSP_UI_SETTINGS.set({ uiFontIndex: Number(sel.value) });
        sync();
      });
    }
    function bindRowAlignSelect() {
      function apply() {
        window.SSP_UI_SETTINGS.set({ panelRowAlign: rowAlignSel.value });
        sync();
      }
      if (!rowAlignSel) return;
      rowAlignSel.addEventListener('change', apply);
      rowAlignSel.addEventListener('input', apply);
    }
    function buildNavChecks() {
      var box = document.getElementById('navPageChecks');
      var pages = getMeta().pages || [];
      var s = window.SSP_UI_SETTINGS.get();
      var i, page, lab, cb;
      if (!box || box.getAttribute('data-built')) return;
      box.setAttribute('data-built', '1');
      for (i = 0; i < pages.length; i++) {
        page = pages[i];
        lab = document.createElement('label');
        cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = 'navChk_' + page.id;
        cb.checked = !!s.navPages[page.id];
        (function (pid) {
          cb.addEventListener('change', function () {
            var patch = { navPages: {} };
            patch.navPages[pid] = document.getElementById('navChk_' + pid).checked;
            window.SSP_UI_SETTINGS.set(patch);
          });
        })(page.id);
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode(page.label || page.id));
        box.appendChild(lab);
      }
    }
    if (!document.getElementById('settingsPanel')) return;
    buildFontSelect();
    bindRowAlignSelect();
    buildNavChecks();
    wireNumeric('rngPollMs', 'numPollMs', 'pollIntervalMs');
    wireNumeric('rngPanelFont', 'numPanelFont', 'panelBtnFontPx');
    wireNumeric('rngGaugeVal', 'numGaugeVal', 'gaugeValScalePct');
    wireNumeric('rngBright', 'numBright', 'uiBrightnessPct');
    wireNumeric('rngDotScale', 'numDotScale', 'dotScalePct');
    wireNumeric('rngGridRow', 'numGridRow', 'panelGridRowMinPx');
    wireNumeric('rngGridGapY', 'numGridGapY', 'panelGridGapPx');
    wireNumeric('rngGridGapX', 'numGridGapX', 'panelGridGapXPx');
    wireNumeric('rngNavFont', 'numNavFont', 'navFontPx');
    wireNumeric('rngNavH', 'numNavH', 'navMinHPx');
    wireCheckbox('chkReduceMotion', 'reduceMotion');
    wireCheckbox('chkTouchFlash', 'showTouchFlash');
    wireCheckbox('chkPanelScrollable', 'panelScrollable');
    if (closeBtn && overlay) closeBtn.addEventListener('click', function () {
      overlay.classList.remove('on');
      if (document.body) document.body.style.overflow = '';
      if (typeof window.SSP_UI_SETTINGS_NAV_CLOSE === 'function') window.SSP_UI_SETTINGS_NAV_CLOSE();
    });
    if (resetBtn) resetBtn.addEventListener('click', function () { window.SSP_UI_SETTINGS.reset(); sync(); });
    window.addEventListener('ssp-settings-opened', sync);
    window.addEventListener('ssp-ui-settings-applied', sync);
    sync();
  }

  try {
    window.SSP_UI_SETTINGS.apply(current);
  } catch (eApply) {}

  function bootSettingsUi() {
    window.SSP_UI_SETTINGS.apply(current);
    bindSettingsNav();
    bindSettingsForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSettingsUi);
  } else {
    bootSettingsUi();
  }
})();
