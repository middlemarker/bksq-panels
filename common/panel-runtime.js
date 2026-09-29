/**
 * Starship panel runtime — ES5-friendly. Loads after common.js + config/panels/*.js
 * Boot: SSPRuntime.boot('panelId')
 */
window.SSP_PANELS = window.SSP_PANELS || {};
window.SSP_PANEL_OVERRIDES = window.SSP_PANEL_OVERRIDES || { onPoll: function() {} };

var SSPRuntime = (window.SSPRuntime = {
  _holdUntil: {},
  _pollTimer: null,
  _panelId: null,

  lampMaps: {
    wiper4: function (v) {
      v = Number(v);
      if (v === 0) return 0;
      if (v === 1) return 1;
      if (v === 2) return 2;
      return 3;
    },
    iceWsL: function (v) {
      v = Number(v);
      return v === 0 ? 2 : v === 1 ? 1 : 0;
    },
    iceWsR: function (v) {
      v = Number(v);
      return v === 0 ? 2 : v === 1 ? 1 : 0;
    },
    iceFwdWing: function (v) {
      v = Number(v);
      return v === 0 ? 0 : v === 2 ? 2 : 1;
    },
    iceMainWing: function (v) {
      v = Number(v);
      return v === 0 ? 0 : v === 2 ? 2 : 1;
    },
    ohStorm: function (v) {
      v = Number(v);
      return v === 0 ? 0 : v === 1 ? 1 : 2;
    },
    ohDimmer: function (v) {
      if (v === undefined || v === null) v = 0;
      v = Number(v);
      if (v < 25) return 0;
      if (v < 75) return 1;
      return 2;
    },
    ecsTempMode: function (v) {
      v = Number(v);
      return v === 0 ? 0 : v === 2 ? 2 : 1;
    },
    ecsBleed: function (v) {
      v = Number(v);
      if (v < 0 || v > 5 || isNaN(v)) return 0;
      return Math.round(v);
    },
    ecsStatic: function (v) {
      return v == 1 ? 0 : 1;
    }
  },

  testHold: function (ssp, holdMs, btnId) {
    if (!ssp) return;
    var ms = holdMs || 1000;
    if (btnId) SSPRuntime._holdUntil[btnId] = Date.now() + ms;
    sendP(ssp);
  },

  isHeld: function (btnId) {
    if (!btnId) return false;
    var t = SSPRuntime._holdUntil[btnId] || 0;
    return Date.now() < t;
  },

  applyProfile: function (panel) {
    var m = typeof location !== 'undefined' && location.search && location.search.match(/profile=([^&]+)/);
    var name = m ? decodeURIComponent(m[1]) : panel.defaultProfile;
    if (!name || !panel.profiles || !panel.profiles[name]) return;
    var p = panel.profiles[name];
    var grid = document.getElementById('grid');
    if (p.gridClass && grid) grid.className = p.gridClass;
    if (p.bodyClass) document.body.classList.add(p.bodyClass);
  },

  _readL: function (name, type) {
    return getLVar(name, type);
  },

  _truthy: function (poll, v) {
    var on = poll.on;
    if (on === 'gt0') return Number(v) > 0;
    if (on === 'eq1') return v == 1;
    if (typeof on === 'number') return v == on;
    return v == 1;
  },

  _applyPoll: function (poll) {
    var kind = poll.kind;
    if (kind === 'toggle') {
      var v = SSPRuntime._readL(poll.lvar, poll.lvarType || 'Bool');
      var on = SSPRuntime._truthy(poll, v);
      setToggleVisual(poll.btnId, poll.indId, on);
      return;
    }
    if (kind === 'toggleOr') {
      var checks = poll.checks || [];
      var combineAnd = poll.combine === 'and';
      var on = combineAnd;
      for (var i2 = 0; i2 < checks.length; i2++) {
        var c = checks[i2];
        var cv = SSPRuntime._readL(c.lvar, c.lvarType || 'Bool');
        var co = c.on;
        var ok = co === 'gt0' ? Number(cv) > 0 : cv == (co !== undefined ? co : 1);
        if (combineAnd) {
          if (!ok) {
            on = false;
            break;
          }
        } else if (ok) {
          on = true;
          break;
        }
      }
      setToggleVisual(poll.btnId, poll.indId, on);
      return;
    }
    if (kind === 'toggleA') {
      var av0 = getAVar(poll.expr);
      setToggleVisual(poll.btnId, poll.indId, av0 == 1);
      return;
    }
    if (kind === 'testLatched') {
      var held = SSPRuntime.isHeld(poll.btnId);
      var lv = SSPRuntime._readL(poll.lvar, poll.lvarType || 'Bool');
      var on2 = !!(held || lv == 1);
      setToggleVisual(poll.btnId, poll.indId, on2);
      var b = document.getElementById(poll.btnId);
      if (b && b._sspLatched !== on2) {
        b._sspLatched = on2;
        if (on2) b.classList.add('latched');
        else b.classList.remove('latched');
      }
      return;
    }
    if (kind === 'lamps') {
      var raw = SSPRuntime._readL(poll.lvar, poll.lvarType || 'Number');
      var fn = SSPRuntime.lampMaps[poll.map];
      if (!fn) return;
      var idx = fn(raw);
      setLamps(poll.lampIds, idx);
      return;
    }
    if (kind === 'lvarText') {
      var vt = SSPRuntime._readL(poll.lvar, poll.lvarType || 'Number');
      setValDisplay(poll.id, vt !== undefined && vt !== null ? String(vt) : undefined);
      return;
    }
    if (kind === 'avarText') {
      var av = getAVar(poll.expr);
      if (av !== undefined && av !== null && poll.decimals !== undefined) {
        av = Number(av);
        av = isNaN(av) ? undefined : av.toFixed(poll.decimals);
      }
      setValDisplay(poll.id, av !== undefined && av !== null ? String(av) : undefined);
      return;
    }
    if (kind === 'custom') {
      var h = window.SSP_PANEL_OVERRIDES && window.SSP_PANEL_OVERRIDES.polls && window.SSP_PANEL_OVERRIDES.polls[poll.id];
      if (typeof h === 'function') h(poll);
    }
  },

  _appendCell: function (parent, cell) {
    if (!cell || cell.enabled === false) return;
    var t = cell.type || 'button';
    if (t === 'placeholder') {
      var ph = document.createElement('button');
      ph.className = cell.classes || 'btn placeholder';
      ph.setAttribute('tabindex', '-1');
      ph.textContent = cell.label || '\u2014';
      if (cell.id) ph.id = cell.id;
      parent.appendChild(ph);
      return;
    }
    if (t === 'html') {
      var wrap = document.createElement('div');
      if (cell.id) wrap.id = cell.id;
      if (cell.classes) wrap.className = cell.classes;
      wrap.innerHTML = cell.html || '';
      parent.appendChild(wrap);
      return;
    }
    if (t === 'gauge') {
      var g = document.createElement('div');
      g.className = cell.classes || 'btn gauge';
      if (cell.id) g.id = cell.id;
      var gl = document.createElement('span');
      gl.className = 'g-label';
      gl.textContent = cell.gaugeLabel || '';
      g.appendChild(gl);
      var spec = cell.gauge;
      if (spec && spec.rows) {
        for (var r = 0; r < spec.rows.length; r++) {
          var row = spec.rows[r];
          var gr = document.createElement('div');
          gr.className = 'g-row';
          if (row.subLeft) {
            var sl = document.createElement('span');
            sl.className = 'g-sub';
            sl.textContent = row.subLeft;
            gr.appendChild(sl);
          }
          var gv = document.createElement('span');
          gv.className = 'g-val';
          if (row.valId) gv.id = row.valId;
          gv.textContent = '\u2014';
          gr.appendChild(gv);
          if (row.subRight) {
            var sr = document.createElement('span');
            sr.className = 'g-sub';
            sr.textContent = row.subRight;
            gr.appendChild(sr);
          }
          if (row.valId2) {
            var gv2 = document.createElement('span');
            gv2.className = 'g-val';
            gv2.id = row.valId2;
            gv2.textContent = '\u2014';
            gr.appendChild(gv2);
          }
          g.appendChild(gr);
        }
      } else if (cell.valId) {
        var gv0 = document.createElement('span');
        gv0.className = 'g-val';
        gv0.id = cell.valId;
        gv0.textContent = '\u2014';
        g.appendChild(gv0);
      }
      parent.appendChild(g);
      return;
    }
    if (t === 'dual') {
      var db = document.createElement('button');
      db.className = cell.classes || 'btn dual';
      if (cell.id) db.id = cell.id;
      SSPRuntime._wireAction(db, cell);
      var hdr = document.createElement('div');
      hdr.className = 'hdr';
      hdr.textContent = cell.hdr || '';
      db.appendChild(hdr);
      var lampRows = cell.lampRows || [];
      for (var j = 0; j < lampRows.length; j++) {
        var lr = lampRows[j];
        var rowEl = document.createElement('div');
        rowEl.className = 'row';
        var sp = document.createElement('span');
        sp.textContent = lr.label || '';
        rowEl.appendChild(sp);
        var lamp = document.createElement('span');
        lamp.className = 'lamp';
        if (lr.lampId) lamp.id = lr.lampId;
        rowEl.appendChild(lamp);
        db.appendChild(rowEl);
      }
      parent.appendChild(db);
      return;
    }
    var btn = document.createElement('button');
    btn.className = cell.classes || 'btn';
    if (cell.id) btn.id = cell.id;
    SSPRuntime._wireAction(btn, cell);
    var lab = cell.label || '';
    if (cell.indicatorId) {
      var ind0 = document.createElement('span');
      ind0.className = 'indicator';
      ind0.id = cell.indicatorId;
      btn.appendChild(ind0);
    }
    if (lab.indexOf('\n') >= 0) {
      var parts = lab.split('\n');
      for (var p = 0; p < parts.length; p++) {
        if (p) btn.appendChild(document.createElement('br'));
        btn.appendChild(document.createTextNode(parts[p]));
      }
    } else {
      btn.appendChild(document.createTextNode(lab));
    }
    parent.appendChild(btn);
  },

  _wireAction: function (el, cell) {
    var a = cell.action;
    if (!a) return;
    if (a.ssp) {
      el.onclick = function () {
        sendP(a.ssp);
      };
      return;
    }
    if (a.hold && a.hold.ssp) {
      var hid = cell.id;
      var hms = a.hold.ms || 1000;
      var hssp = a.hold.ssp;
      el.onclick = function () {
        SSPRuntime.testHold(hssp, hms, hid);
      };
      return;
    }
    if (a.nav) {
      var nav = a.nav;
      el.onclick = function () {
        window.location.assign(nav);
      };
      return;
    }
    if (a.noop) {
      el.onclick = function () {};
    }
  },

  _renderRows: function (grid, panel) {
    var rows = panel.rows || [];
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var c = 0; c < row.length; c++) {
        SSPRuntime._appendCell(grid, row[c]);
      }
    }
  },

  _renderCells: function (grid, panel) {
    var cells = panel.cells || [];
    for (var i = 0; i < cells.length; i++) {
      SSPRuntime._appendCell(grid, cells[i]);
    }
  },

  boot: function (panelId) {
    var panel = window.SSP_PANELS[panelId];
    if (!panel) return;
    SSPRuntime._panelId = panelId;
    var grid = document.getElementById('grid');
    if (!grid) return;
    SSPRuntime.applyProfile(panel);
    var gc = panel.gridClass || 'grid';
    grid.className = gc;
    grid.innerHTML = '';
    var mode = panel.renderMode || 'rows';
    if (mode === 'innerHtml') {
      grid.innerHTML = panel.innerHtml || '';
    } else if (mode === 'cells') {
      SSPRuntime._renderCells(grid, panel);
    } else {
      SSPRuntime._renderRows(grid, panel);
    }
    if (!panel.skipFitGrid && typeof fitGrid === 'function') {
      setTimeout(fitGrid, 20);
    }
    if (SSPRuntime._pollTimer) {
      clearInterval(SSPRuntime._pollTimer);
      SSPRuntime._pollTimer = null;
    }
    var pollMs = typeof window.SSP_GET_POLL_MS === 'function' ? window.SSP_GET_POLL_MS() : 100;
    SSPRuntime._pollTimer = setInterval(function () {
      SSPRuntime._runPollTick();
    }, pollMs);
  },

  setPollInterval: function (ms) {
    if (SSPRuntime._pollTimer) {
      clearInterval(SSPRuntime._pollTimer);
      SSPRuntime._pollTimer = null;
    }
    var interval = Number(ms);
    if (!isFinite(interval) && typeof window.SSP_GET_POLL_MS === 'function') interval = window.SSP_GET_POLL_MS();
    if (!isFinite(interval)) interval = 100;
    interval = Math.max(50, Math.min(2000, Math.round(interval)));
    if (!SSPRuntime._panelId) return;
    SSPRuntime._pollTimer = setInterval(function () {
      SSPRuntime._runPollTick();
    }, interval);
  },

  _runPollTick: function () {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (SSPRuntime._tickPending) return;
    SSPRuntime._tickPending = true;
    var raf = (typeof window !== 'undefined' && window.requestAnimationFrame)
      ? window.requestAnimationFrame
      : function (cb) { return setTimeout(cb, 0); };
    raf(function () {
      SSPRuntime._tickPending = false;
      var pid = SSPRuntime._panelId;
      var panel = window.SSP_PANELS[pid];
      if (!panel) return;
      try {
        var polls = panel.polls || [];
        for (var i = 0; i < polls.length; i++) {
          SSPRuntime._applyPoll(polls[i]);
        }
        if (window.SSP_PANEL_OVERRIDES && typeof window.SSP_PANEL_OVERRIDES.onPoll === 'function') {
          window.SSP_PANEL_OVERRIDES.onPoll(pid, { panel: panel });
        }
      } catch (e) {}
    });
  }
});
