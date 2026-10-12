/**
 * Layout edit mode. Built on touch + mouse events because iOS 12.5 Safari has
 * neither Pointer Events nor HTML5 drag-and-drop on touch.
 *
 * MOVE mode    drag cell -> cell swaps, drag cell -> CLEAR empties,
 *              tap a cell opens the in-place picker next to it.
 * DELETE mode  tap a button to remove it.
 * Palette      optional strip; drag a token onto a cell to place it.
 */
(function () {
  var DRAG_START_PX = 6;
  var MOUSE_AFTER_TOUCH_MS = 800;
  var EDGE_SCROLL_PX = 44;
  var UNDO_LIMIT = 40;
  var RECENT_LIMIT = 12;
  var PICK_MAX_W = 600;
  var PICK_MAX_RESULTS_H = 340;
  var FORMAT_PAGE = 'bksq-layout';
  var FORMAT_ALL = 'bksq-layouts';
  // iOS 12 Safari ignores <a download> and navigates to the blob instead.
  var CAN_DOWNLOAD = !/iP(hone|od|ad).* OS (9|10|11|12)_/.test(navigator.userAgent) && typeof Blob !== 'undefined';

  function metaKey(suffix) {
    var meta = window.BKSQ_AIRCRAFT || {};
    return (meta.storageKey || 'bksq-panels-ui') + ':' + suffix;
  }

  function getButtonsDict() {
    if (window.SSP_BUTTONS) return window.SSP_BUTTONS;
    if (window.TBM_BUTTONS) return window.TBM_BUTTONS;
    return null;
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function readOverride(pageId) {
    return readJson(metaKey('layout:' + pageId), null);
  }

  function readRecent() {
    var a = readJson(metaKey('edit-recent'), []);
    return a && a.length != null ? a : [];
  }

  function pushRecent(tok) {
    var a = readRecent();
    var out = [tok];
    var i;
    for (i = 0; i < a.length && out.length < RECENT_LIMIT; i++) {
      if (a[i] !== tok) out.push(a[i]);
    }
    writeJson(metaKey('edit-recent'), out);
  }

  function rebuildPanel(panel, layout, cols) {
    var buttons = getButtonsDict();
    if (!buttons || !window.SSPPanel) return null;
    return window.SSPPanel({
      buttons: buttons,
      layout: layout,
      cols: cols,
      gridClass: panel.gridClass
    });
  }

  window.SSP_LAYOUT_STORE = window.SSP_LAYOUT_STORE || {};
  window.SSP_LAYOUT_STORE.getOverride = readOverride;
  window.SSP_LAYOUT_STORE.save = function (pageId, data) {
    writeJson(metaKey('layout:' + pageId), data);
  };
  window.SSP_LAYOUT_STORE.reset = function (pageId) {
    try {
      localStorage.removeItem(metaKey('layout:' + pageId));
    } catch (e) {}
  };
  if (!window.SSP_LAYOUT_STORE.mergePanel) {
    window.SSP_LAYOUT_STORE.mergePanel = function () {};
  }

  function gridEl() {
    return document.getElementById('grid');
  }

  function childOf(container, el) {
    while (el && el !== document && el.parentNode !== container) el = el.parentNode;
    return el && el.parentNode === container ? el : null;
  }

  function indexIn(container, el) {
    var kids = container.children;
    var i;
    for (i = 0; i < kids.length; i++) {
      if (kids[i] === el) return i;
    }
    return -1;
  }

  function upWithClass(el, cls) {
    while (el && el !== document) {
      if (el.classList && el.classList.contains(cls)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function eventPoint(e) {
    var t = e;
    if (e.changedTouches && e.changedTouches.length) t = e.changedTouches[0];
    else if (e.touches && e.touches.length) t = e.touches[0];
    return { x: t.clientX, y: t.clientY };
  }

  function tokenGroup(tok) {
    var i = tok.indexOf('_');
    return i > 0 ? tok.slice(0, i) : 'other';
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** Inert copy of a button's markup: no ids (would duplicate live cells), no sim onclick. */
  function inertHtml(html) {
    return String(html || '').replace(/\s(id|onclick)="[^"]*"/g, '');
  }

  function labelText(html) {
    return String(html || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[#a-z0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '');
  }

  function pageIds() {
    var pages = (window.BKSQ_AIRCRAFT && window.BKSQ_AIRCRAFT.pages) || [];
    var out = [];
    var i;
    for (i = 0; i < pages.length; i++) out.push(pages[i].id);
    return out;
  }

  /** JSON array of tokens, one grid row per line. */
  function layoutJson(layout, cols, pad) {
    var lines = [];
    var i;
    var j;
    for (i = 0; i < layout.length; i += cols) {
      var row = [];
      for (j = i; j < Math.min(i + cols, layout.length); j++) row.push(JSON.stringify(layout[j]));
      lines.push(pad + '  ' + row.join(', '));
    }
    return '[\n' + lines.join(',\n') + '\n' + pad + ']';
  }

  function cleanLayout(arr) {
    if (!arr || typeof arr.length !== 'number' || !arr.length) return null;
    var out = [];
    var i;
    for (i = 0; i < arr.length; i++) out.push(typeof arr[i] === 'string' && arr[i] ? arr[i] : 'empty');
    return out;
  }

  function cleanCols(c, fallback) {
    c = Number(c);
    return isFinite(c) && c >= 1 && c <= 12 ? Math.round(c) : fallback;
  }

  function stripIds(root) {
    var withId = root.querySelectorAll('[id]');
    var i;
    root.removeAttribute('id');
    root.removeAttribute('onclick');
    for (i = 0; i < withId.length; i++) withId[i].removeAttribute('id');
  }

  var HINTS = {
    move: 'Tap a cell to choose a button. Drag to swap, drag onto CLEAR to empty.',
    'delete': 'Tap buttons to remove them.'
  };

  var E = (window.SSP_PANEL_EDIT = {
    active: false,
    mode: 'move',
    _pageId: null,
    _panel: null,
    _layout: null,
    _cols: 8,
    _dock: null,
    _drag: null,
    _dropEl: null,
    _lastTouchAt: 0,
    _eventsBound: false,
    _undo: [],
    _pick: null,
    _pickEl: null,
    _pickBackdrop: null,
    _tiles: null,
    _pickHideUsed: false,
    _pickChain: false,
    _sheetEl: null,
    _sheetBack: null,
    _sheetOpen: false,
    _sheetScope: 'page',

    init: function (pageId, panel) {
      if (E.active) return true;
      if (panel.layoutEditDisabled || panel.renderMode !== 'innerHtml') {
        E._notice('Layout edit is not available on this page (CSS-positioned or custom shell).');
        return false;
      }
      var o = readOverride(pageId);
      var tokens = [];
      var cols = panel.cols != null ? panel.cols : 8;
      if (o && o.layout && o.layout.length) {
        tokens = o.layout.slice();
        if (o.cols != null) cols = o.cols;
      } else if (panel.sourceLayout && panel.sourceLayout.length) {
        tokens = panel.sourceLayout.slice();
      }
      var grid = gridEl();
      if (!tokens.length || !grid || grid.children.length !== tokens.length) {
        E._notice('This page has composite layout entries and cannot be edited here.');
        return false;
      }
      E._pageId = pageId;
      E._panel = panel;
      E._layout = tokens;
      E._cols = cols;
      E._undo = [];
      E.active = true;
      document.documentElement.classList.add('ssp-edit-mode');
      E._mountDock();
      E._bindEvents();
      E._setMode('move');
      E._markCells();
      E._refit();
      return true;
    },

    exit: function () {
      if (!E.active) return;
      E._closePicker();
      E._closeSheet();
      E._endDrag();
      E.active = false;
      document.documentElement.classList.remove('ssp-edit-mode');
      document.documentElement.classList.remove('ssp-edit-del');
      document.documentElement.style.removeProperty('--ssp-edit-dock-h');
      if (E._dock && E._dock.parentNode) E._dock.parentNode.removeChild(E._dock);
      E._dock = null;
      var grid = gridEl();
      var i;
      if (grid) {
        for (i = 0; i < grid.children.length; i++) grid.children[i].classList.remove('ssp-edit-cell');
      }
      E._refit();
    },

    _refit: function () {
      if (typeof fitGrid === 'function') setTimeout(fitGrid, 20);
    },

    _notice: function (msg) {
      var n = document.createElement('div');
      n.className = 'ssp-edit-notice';
      n.textContent = msg;
      document.body.appendChild(n);
      setTimeout(function () {
        if (n.parentNode) n.parentNode.removeChild(n);
      }, 3500);
    },

    /* ---------- layout state ---------- */

    _pushUndo: function () {
      E._undo.push({ layout: E._layout.slice(), cols: E._cols });
      if (E._undo.length > UNDO_LIMIT) E._undo.shift();
    },

    _undoLast: function () {
      var s = E._undo.pop();
      if (!s) return;
      E._layout = s.layout;
      E._cols = s.cols;
      E._save();
    },

    _change: function (fn) {
      E._pushUndo();
      fn();
      E._save();
    },

    _save: function () {
      window.SSP_LAYOUT_STORE.save(E._pageId, { layout: E._layout, cols: E._cols });
      E._renderGrid();
      E._syncToolbar();
    },

    _renderGrid: function () {
      var panel = E._panel;
      var rebuilt = rebuildPanel(panel, E._layout, E._cols);
      if (!rebuilt) return;
      panel.innerHtml = rebuilt.innerHtml;
      panel.polls = rebuilt.polls;
      panel.sourceLayout = rebuilt.sourceLayout;
      panel.cols = E._cols;
      var grid = gridEl();
      if (!grid) return;
      grid.innerHTML = panel.innerHtml;
      if (typeof SSPRuntime !== 'undefined') {
        SSPRuntime._applyGridCols(grid, panel);
        SSPRuntime._bindPollElements(panel);
      }
      E._markCells();
      E._refit();
    },

    _markCells: function () {
      var grid = gridEl();
      if (!grid) return;
      var i;
      for (i = 0; i < grid.children.length; i++) grid.children[i].classList.add('ssp-edit-cell');
      E._markUsedPalette();
    },

    _usedSet: function () {
      var used = {};
      var i;
      for (i = 0; i < E._layout.length; i++) used[E._layout[i]] = true;
      return used;
    },

    _setMode: function (m) {
      E.mode = m;
      if (m !== 'move') E._closePicker();
      document.documentElement.classList.toggle('ssp-edit-del', m === 'delete');
      E._syncToolbar();
    },

    _configSnippet: function () {
      var factory = window.TBMPanel ? 'TBMPanel' : 'StarshipPanel';
      var lines = ['window.SSP_PANELS.' + E._pageId + ' = ' + factory + '({'];
      var layout = E._layout;
      var cols = E._cols;
      var i;
      var j;
      var row;
      lines.push("  id: '" + E._pageId + "',");
      lines.push('  cols: ' + cols + ',');
      lines.push('  layout: [');
      for (i = 0; i < layout.length; i += cols) {
        row = [];
        for (j = i; j < Math.min(i + cols, layout.length); j++) row.push("'" + layout[j] + "'");
        lines.push('    ' + row.join(', ') + (i + cols < layout.length ? ',' : ''));
      }
      lines.push('  ]');
      lines.push('});');
      return lines.join('\n');
    },

    /* ---------- dock / toolbar ---------- */

    _mountDock: function () {
      var dock = document.createElement('div');
      dock.className = 'ssp-edit-dock';
      dock.innerHTML =
        '<div class="ssp-edit-bar">' +
        '<div class="ssp-edit-seg">' +
        '<button type="button" class="ssp-edit-tool" data-act="modeMove">&#10021; Move</button>' +
        '<button type="button" class="ssp-edit-tool ssp-edit-tool-del" data-act="modeDelete">&#10005; Delete</button>' +
        '</div>' +
        '<button type="button" class="ssp-edit-tool" data-act="undo" id="sspEditUndo">&#8630; Undo</button>' +
        '<button type="button" class="ssp-edit-tool" data-act="palette" id="sspEditPaletteBtn">Palette</button>' +
        '<div class="ssp-edit-trash" id="sspEditTrash">&#10005; Clear</div>' +
        '<div class="ssp-edit-stepper">' +
        '<button type="button" class="ssp-edit-tool ssp-edit-step" data-act="colsDec">&minus;</button>' +
        '<span id="sspEditCols"></span>' +
        '<button type="button" class="ssp-edit-tool ssp-edit-step" data-act="colsInc">+</button>' +
        '</div>' +
        '<div class="ssp-edit-stepper">' +
        '<button type="button" class="ssp-edit-tool ssp-edit-step" data-act="rowRem">&minus;</button>' +
        '<span id="sspEditRows"></span>' +
        '<button type="button" class="ssp-edit-tool ssp-edit-step" data-act="rowAdd">+</button>' +
        '</div>' +
        '<button type="button" class="ssp-edit-tool" data-act="json">{ } JSON</button>' +
        '<button type="button" class="ssp-edit-tool ssp-edit-tool-del" data-act="reset">Reset page</button>' +
        '<span class="ssp-edit-hint" id="sspEditHint"></span>' +
        '</div>' +
        '<div class="ssp-edit-palette" id="sspEditPalette"></div>';
      document.body.appendChild(dock);
      E._dock = dock;
      E._buildPalette(document.getElementById('sspEditPalette'));
      dock.addEventListener('click', function (e) {
        var b = upWithClass(e.target, 'ssp-edit-tool');
        if (b) E._toolAction(b.getAttribute('data-act'));
      });
      E._syncToolbar();
      E._updateDockHeight();
    },

    _updateDockHeight: function () {
      if (!E._dock) return;
      document.documentElement.style.setProperty('--ssp-edit-dock-h', (E._dock.offsetHeight + 8) + 'px');
      E._refit();
    },

    _toggleDockSection: function (cls, btnId) {
      var on = !E._dock.classList.contains(cls);
      E._dock.classList.toggle(cls, on);
      var b = document.getElementById(btnId);
      if (b) b.classList.toggle('active', on);
      E._updateDockHeight();
    },

    _syncToolbar: function () {
      if (!E._dock) return;
      var btns = E._dock.querySelectorAll('[data-act="modeMove"],[data-act="modeDelete"]');
      var i;
      for (i = 0; i < btns.length; i++) {
        var act = btns[i].getAttribute('data-act');
        btns[i].classList.toggle('active', (act === 'modeMove') === (E.mode === 'move'));
      }
      var undo = document.getElementById('sspEditUndo');
      if (undo) undo.classList.toggle('disabled', !E._undo.length);
      var c = document.getElementById('sspEditCols');
      if (c) c.textContent = E._cols + ' cols';
      var r = document.getElementById('sspEditRows');
      if (r) r.textContent = Math.ceil(E._layout.length / E._cols) + ' rows';
      var h = document.getElementById('sspEditHint');
      if (h) h.textContent = HINTS[E.mode] || '';
    },

    _buildPalette: function (box) {
      var tiles = E._tileData();
      var html = [];
      var lastGroup = null;
      var i;
      for (i = 0; i < tiles.length; i++) {
        if (tiles[i].group !== lastGroup) {
          html.push('<span class="ssp-edit-palette-group">' + escHtml(tiles[i].group) + '</span>');
          lastGroup = tiles[i].group;
        }
        html.push('<div class="ssp-edit-palette-item" data-token="' + escHtml(tiles[i].token) + '">' +
          escHtml(tiles[i].label || tiles[i].token) + '</div>');
      }
      box.innerHTML = html.join('');
    },

    _markUsedPalette: function () {
      if (!E._dock) return;
      var used = E._usedSet();
      var items = E._dock.querySelectorAll('.ssp-edit-palette-item');
      var i;
      for (i = 0; i < items.length; i++) {
        items[i].classList.toggle('used', !!used[items[i].getAttribute('data-token')]);
      }
    },

    _toolAction: function (act) {
      if (act === 'modeMove') E._setMode('move');
      else if (act === 'modeDelete') E._setMode('delete');
      else if (act === 'undo') E._undoLast();
      else if (act === 'palette') E._toggleDockSection('show-palette', 'sspEditPaletteBtn');
      else if (act === 'json') E._openSheet('page');
      else if (act === 'colsDec') {
        if (E._cols > 1) E._change(function () { E._cols--; });
      } else if (act === 'colsInc') {
        if (E._cols < 12) E._change(function () { E._cols++; });
      } else if (act === 'rowAdd') {
        E._change(function () {
          var c;
          for (c = 0; c < E._cols; c++) E._layout.push('empty');
        });
      } else if (act === 'rowRem') {
        E._removeLastRow();
      } else if (act === 'reset') {
        if (!window.confirm('Discard your layout for this page and restore the shipped one?')) return;
        window.SSP_LAYOUT_STORE.reset(E._pageId);
        window.location.reload();
      }
    },

    _removeLastRow: function () {
      var start = E._layout.length - E._cols;
      var c;
      if (start < 1) return;
      for (c = start; c < E._layout.length; c++) {
        if (E._layout[c] !== 'empty') {
          E._notice('The last row still has buttons. Delete them first.');
          return;
        }
      }
      E._change(function () { E._layout.length = start; });
    },

    /* ---------- pointer handling ---------- */

    _bindEvents: function () {
      if (E._eventsBound) return;
      E._eventsBound = true;
      document.addEventListener('click', function (e) {
        if (!E.active) return;
        var grid = gridEl();
        if (grid && childOf(grid, e.target)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
      document.addEventListener('touchstart', function (e) {
        E._lastTouchAt = Date.now();
        if (e.touches.length > 1) {
          E._endDrag();
          return;
        }
        E._onStart(e, true);
      }, { capture: true, passive: true });
      document.addEventListener('touchmove', function (e) { E._onMove(e, true); }, { capture: true, passive: false });
      document.addEventListener('touchend', function (e) { E._onEnd(e); }, { capture: true, passive: true });
      document.addEventListener('touchcancel', function () { E._endDrag(); }, { capture: true, passive: true });
      document.addEventListener('mousedown', function (e) {
        if (Date.now() - E._lastTouchAt < MOUSE_AFTER_TOUCH_MS || e.button !== 0) return;
        E._onStart(e, false);
      }, true);
      document.addEventListener('mousemove', function (e) { E._onMove(e, false); }, true);
      document.addEventListener('mouseup', function (e) {
        if (Date.now() - E._lastTouchAt < MOUSE_AFTER_TOUCH_MS) return;
        E._onEnd(e);
      }, true);
      document.addEventListener('keydown', function (e) {
        if (!E.active) return;
        var typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
        if (e.key === 'Escape' || e.keyCode === 27) {
          if (E._sheetOpen) E._closeSheet();
          else if (E._pick) E._closePicker();
          else if (E.mode === 'delete') E._setMode('move');
        } else if (!typing && (e.ctrlKey || e.metaKey) && (e.key === 'z' || e.keyCode === 90)) {
          e.preventDefault();
          E._undoLast();
        }
      });
      window.addEventListener('resize', function () {
        if (!E.active) return;
        E._closePicker();
        E._updateDockHeight();
      });
    },

    _onStart: function (e, isTouch) {
      if (!E.active || E._pick || E._sheetOpen) return;
      var p = eventPoint(e);
      var grid = gridEl();
      var cell = grid ? childOf(grid, e.target) : null;
      var d = null;
      if (cell) {
        d = { source: 'cell', index: indexIn(grid, cell), el: cell };
      } else {
        var item = upWithClass(e.target, 'ssp-edit-palette-item');
        if (item) d = { source: 'palette', token: item.getAttribute('data-token'), el: item };
      }
      if (!d) return;
      d.touch = isTouch;
      d.startX = p.x;
      d.startY = p.y;
      d.started = false;
      d.target = null;
      E._drag = d;
      if (!isTouch) e.preventDefault();
    },

    _onMove: function (e, isTouch) {
      var d = E._drag;
      if (!d || d.touch !== isTouch) return;
      var p = eventPoint(e);
      var dx = p.x - d.startX;
      var dy = p.y - d.startY;
      var draggable = !(d.source === 'cell' && E.mode === 'delete');
      // iOS decides on the first touchmove whether to scroll; after that preventDefault is ignored.
      if (isTouch && d.source === 'cell' && draggable) e.preventDefault();
      if (!d.started) {
        if (Math.abs(dx) < DRAG_START_PX && Math.abs(dy) < DRAG_START_PX) return;
        if (!draggable || (d.source === 'palette' && isTouch && Math.abs(dx) > Math.abs(dy))) {
          E._drag = null;
          return;
        }
        E._beginDrag(d);
      }
      e.preventDefault();
      d.ghost.style.webkitTransform = 'translate(' + dx + 'px,' + dy + 'px)';
      d.ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      E._edgeScroll(p);
      E._updateTarget(d, p);
    },

    _onEnd: function (e) {
      var d = E._drag;
      if (!d) return;
      if (d.started) {
        E._updateTarget(d, eventPoint(e));
        var t = d.target;
        E._endDrag();
        E._drop(d, t);
        return;
      }
      E._drag = null;
      if (d.source === 'cell') E._tapCell(d.index);
    },

    _tapCell: function (i) {
      if (E.mode === 'delete') {
        if (E._layout[i] !== 'empty') E._change(function () { E._layout[i] = 'empty'; });
        return;
      }
      E._openPicker(i);
    },

    _beginDrag: function (d) {
      var r = d.el.getBoundingClientRect();
      var ghost = d.el.cloneNode(true);
      stripIds(ghost);
      ghost.classList.remove('ssp-edit-cell');
      ghost.classList.add('ssp-edit-ghost');
      ghost.style.left = r.left + 'px';
      ghost.style.top = r.top + 'px';
      ghost.style.width = r.width + 'px';
      ghost.style.height = r.height + 'px';
      document.body.appendChild(ghost);
      d.ghost = ghost;
      d.started = true;
      d.el.classList.add('ssp-edit-dragging');
      document.documentElement.classList.add('ssp-edit-drag-active');
    },

    _edgeScroll: function (p) {
      if (!document.documentElement.classList.contains('ssp-panel-scrollable')) return;
      var main = document.querySelector('main');
      if (!main) return;
      var r = main.getBoundingClientRect();
      var top = r.top + (parseFloat(window.getComputedStyle(main).paddingTop) || 0);
      if (p.y < top + EDGE_SCROLL_PX) main.scrollTop -= 12;
      else if (p.y > r.bottom - EDGE_SCROLL_PX) main.scrollTop += 12;
    },

    _updateTarget: function (d, p) {
      var el = document.elementFromPoint(p.x, p.y);
      var grid = gridEl();
      var hit = null;
      var target = null;
      var cell = grid && el ? childOf(grid, el) : null;
      if (cell) {
        hit = cell;
        target = { type: 'cell', index: indexIn(grid, cell) };
      } else if (d.source === 'cell' && el && upWithClass(el, 'ssp-edit-trash')) {
        hit = document.getElementById('sspEditTrash');
        target = { type: 'trash' };
      }
      if (hit === d.el) {
        hit = null;
        target = null;
      }
      if (E._dropEl !== hit) {
        if (E._dropEl) E._dropEl.classList.remove('ssp-edit-drop');
        if (hit) hit.classList.add('ssp-edit-drop');
        E._dropEl = hit;
      }
      d.target = target;
    },

    _endDrag: function () {
      var d = E._drag;
      E._drag = null;
      if (E._dropEl) E._dropEl.classList.remove('ssp-edit-drop');
      E._dropEl = null;
      document.documentElement.classList.remove('ssp-edit-drag-active');
      if (!d) return;
      if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
      if (d.el) d.el.classList.remove('ssp-edit-dragging');
    },

    _drop: function (d, t) {
      if (!t) return;
      var layout = E._layout;
      if (d.source === 'cell') {
        if (t.type === 'cell' && t.index !== d.index) {
          E._change(function () {
            var tmp = layout[d.index];
            layout[d.index] = layout[t.index];
            layout[t.index] = tmp;
          });
        } else if (t.type === 'trash') {
          E._change(function () { layout[d.index] = 'empty'; });
        }
      } else if (d.source === 'palette' && t.type === 'cell') {
        pushRecent(d.token);
        E._change(function () { layout[t.index] = d.token; });
      }
    },

    /* ---------- in-place picker ---------- */

    _tileData: function () {
      if (E._tiles) return E._tiles;
      var buttons = getButtonsDict() || {};
      var list = [];
      var k;
      for (k in buttons) {
        if (!Object.prototype.hasOwnProperty.call(buttons, k) || k === 'empty') continue;
        var html = buttons[k] && buttons[k].html;
        var label = labelText(html);
        list.push({
          token: k,
          group: tokenGroup(k),
          label: label,
          search: (k + ' ' + label).toLowerCase(),
          html: inertHtml(html)
        });
      }
      list.sort(function (a, b) {
        if (a.group !== b.group) return a.group < b.group ? -1 : 1;
        return a.token < b.token ? -1 : a.token > b.token ? 1 : 0;
      });
      E._tiles = list;
      return list;
    },

    _ensurePicker: function () {
      if (E._pickEl) return;
      var tiles = E._tileData();
      var back = document.createElement('div');
      back.className = 'ssp-pick-backdrop';
      back.addEventListener('click', function () { E._closePicker(); });
      var el = document.createElement('div');
      el.className = 'ssp-pick';
      el.setAttribute('role', 'dialog');
      var html = [
        '<div class="ssp-pick-caret"></div>',
        '<div class="ssp-pick-title"><span id="sspPickTitle"></span>',
        '<button type="button" class="ssp-pick-x" data-pick="close" aria-label="Close">&#10005;</button></div>',
        '<input type="search" class="ssp-pick-search" id="sspPickSearch" placeholder="Search buttons\u2026" ',
        'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />',
        '<div class="ssp-pick-chips" id="sspPickChips"></div>',
        '<div class="ssp-pick-grid" id="sspPickGrid">'
      ];
      var i;
      for (i = 0; i < tiles.length; i++) {
        html.push('<div class="ssp-pick-tile" data-i="' + i + '" title="' + escHtml(tiles[i].token) + '">' +
          '<div class="ssp-pick-prev">' + tiles[i].html + '</div>' +
          '<div class="ssp-pick-cap">' + escHtml(tiles[i].token) + '</div></div>');
      }
      html.push('<div class="ssp-pick-none" id="sspPickNone">No matching buttons</div></div>');
      html.push(
        '<div class="ssp-pick-foot">' +
        '<button type="button" class="ssp-pick-btn ssp-pick-btn-del" data-pick="clear" id="sspPickClear">&#10005; Clear cell</button>' +
        '<span class="ssp-pick-count" id="sspPickCount"></span>' +
        '<label class="ssp-pick-opt"><input type="checkbox" id="sspPickHideUsed" />Hide placed</label>' +
        '<label class="ssp-pick-opt"><input type="checkbox" id="sspPickChain" />Then next empty</label>' +
        '</div>'
      );
      el.innerHTML = html.join('');
      document.body.appendChild(back);
      document.body.appendChild(el);
      E._pickEl = el;
      E._pickBackdrop = back;
      var tileEls = el.querySelectorAll('.ssp-pick-tile');
      for (i = 0; i < tiles.length; i++) tiles[i].el = tileEls[i];

      el.addEventListener('click', function (e) {
        var tile = upWithClass(e.target, 'ssp-pick-tile');
        if (tile) {
          E._pickToken(tiles[Number(tile.getAttribute('data-i'))].token);
          return;
        }
        var chip = upWithClass(e.target, 'ssp-pick-chip');
        if (chip) {
          if (chip.classList.contains('disabled')) return;
          E._pick.chip = chip.getAttribute('data-chip');
          E._renderChips();
          E._applyPickFilter();
          return;
        }
        var act = e.target.getAttribute && e.target.getAttribute('data-pick');
        if (act === 'close') E._closePicker();
        else if (act === 'clear') E._pickClear();
      });
      var search = document.getElementById('sspPickSearch');
      search.addEventListener('input', function () {
        if (!E._pick) return;
        E._pick.query = search.value.toLowerCase().replace(/^\s+|\s+$/g, '');
        if (E._pick.query && (E._pick.chip === 'suggest' || E._pick.chip === 'recent')) {
          E._pick.chip = 'all';
          E._renderChips();
        }
        E._applyPickFilter();
      });
      search.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.keyCode === 13) && E._pick && E._pick.first) {
          e.preventDefault();
          E._pickToken(E._pick.first.token);
        }
      });
      document.getElementById('sspPickHideUsed').addEventListener('change', function (e) {
        E._pickHideUsed = !!e.target.checked;
        E._applyPickFilter();
      });
      document.getElementById('sspPickChain').addEventListener('change', function (e) {
        E._pickChain = !!e.target.checked;
      });
    },

    _openPicker: function (i) {
      var grid = gridEl();
      var cell = grid && grid.children[i];
      if (!cell) return;
      E._ensurePicker();
      var tiles = E._tiles;
      var used = E._usedSet();
      var cols = E._cols;
      var near = {};
      var pageGroups = {};
      var n;
      var j;
      var neighbours = [];
      if (i % cols > 0) neighbours.push(i - 1);
      if (i % cols < cols - 1) neighbours.push(i + 1);
      neighbours.push(i - cols, i + cols);
      var rowStart = i - (i % cols);
      for (j = rowStart; j < rowStart + cols; j++) neighbours.push(j);
      for (j = 0; j < neighbours.length; j++) {
        n = E._layout[neighbours[j]];
        if (n && n !== 'empty') near[tokenGroup(n)] = true;
      }
      for (j = 0; j < E._layout.length; j++) {
        if (E._layout[j] !== 'empty') pageGroups[tokenGroup(E._layout[j])] = true;
      }
      var suggestCount = 0;
      for (j = 0; j < tiles.length; j++) {
        tiles[j].used = !!used[tiles[j].token];
        tiles[j].suggest = !tiles[j].used && !!near[tiles[j].group];
        if (tiles[j].suggest) suggestCount++;
        tiles[j].el.classList.toggle('used', tiles[j].used);
      }
      if (!suggestCount) {
        for (j = 0; j < tiles.length; j++) {
          tiles[j].suggest = !tiles[j].used && !!pageGroups[tiles[j].group];
        }
      }
      var recent = readRecent();
      var recentSet = {};
      for (j = 0; j < recent.length; j++) recentSet[recent[j]] = true;

      E._pick = { index: i, chip: 'suggest', query: '', recent: recentSet, first: null };
      E._renderChips();
      if (E._chipCount('suggest') === 0) {
        E._pick.chip = 'all';
        E._renderChips();
      }

      var cur = E._layout[i];
      var row = Math.floor(i / cols) + 1;
      var col = (i % cols) + 1;
      var curTile = null;
      for (j = 0; j < tiles.length; j++) {
        if (tiles[j].token === cur) curTile = tiles[j];
      }
      document.getElementById('sspPickTitle').textContent = 'Row ' + row + ' \u00b7 Col ' + col +
        (cur === 'empty' ? '  \u2014  empty cell' : '  \u2014  replacing ' + (curTile ? curTile.label || cur : cur));
      document.getElementById('sspPickClear').classList.toggle('disabled', cur === 'empty');
      document.getElementById('sspPickHideUsed').checked = E._pickHideUsed;
      document.getElementById('sspPickChain').checked = E._pickChain;
      var search = document.getElementById('sspPickSearch');
      search.value = '';
      E._applyPickFilter();

      cell.classList.add('ssp-edit-target');
      E._pickBackdrop.classList.add('on');
      E._pickEl.classList.add('on');
      E._positionPicker(cell);
      var grid2 = document.getElementById('sspPickGrid');
      if (grid2) grid2.scrollTop = 0;
      if (!('ontouchstart' in window)) search.focus();
    },

    _chipCount: function (chip) {
      var tiles = E._tiles;
      var n = 0;
      var j;
      for (j = 0; j < tiles.length; j++) {
        if (E._inChip(tiles[j], chip)) n++;
      }
      return n;
    },

    _inChip: function (t, chip) {
      if (chip === 'all') return true;
      if (chip === 'suggest') return !!t.suggest;
      if (chip === 'recent') return !!E._pick.recent[t.token];
      return chip === 'g:' + t.group;
    },

    _renderChips: function () {
      var tiles = E._tiles;
      var groups = [];
      var counts = {};
      var j;
      for (j = 0; j < tiles.length; j++) {
        if (!counts[tiles[j].group]) {
          counts[tiles[j].group] = 0;
          groups.push(tiles[j].group);
        }
        counts[tiles[j].group]++;
      }
      var chips = [{ id: 'suggest', label: '\u2605 For this spot', n: E._chipCount('suggest') }];
      var nRecent = E._chipCount('recent');
      if (nRecent) chips.push({ id: 'recent', label: 'Recent', n: nRecent });
      chips.push({ id: 'all', label: 'All', n: tiles.length });
      for (j = 0; j < groups.length; j++) chips.push({ id: 'g:' + groups[j], label: groups[j], n: counts[groups[j]] });
      var html = [];
      for (j = 0; j < chips.length; j++) {
        html.push('<span class="ssp-pick-chip' + (chips[j].id === E._pick.chip ? ' active' : '') +
          (chips[j].n ? '' : ' disabled') + '" data-chip="' + escHtml(chips[j].id) + '">' +
          escHtml(chips[j].label) + '<b>' + chips[j].n + '</b></span>');
      }
      document.getElementById('sspPickChips').innerHTML = html.join('');
    },

    _applyPickFilter: function () {
      var p = E._pick;
      if (!p) return;
      var tiles = E._tiles;
      var shown = 0;
      var j;
      if (p.first) p.first.el.classList.remove('ssp-pick-first');
      p.first = null;
      for (j = 0; j < tiles.length; j++) {
        var t = tiles[j];
        var vis = E._inChip(t, p.chip) &&
          (!p.query || t.search.indexOf(p.query) >= 0) &&
          !(E._pickHideUsed && t.used);
        t.el.style.display = vis ? '' : 'none';
        if (vis) {
          shown++;
          if (!p.first) p.first = t;
        }
      }
      if (p.first && p.query) p.first.el.classList.add('ssp-pick-first');
      document.getElementById('sspPickCount').textContent = shown + ' button' + (shown === 1 ? '' : 's');
      document.getElementById('sspPickNone').style.display = shown ? 'none' : '';
    },

    _positionPicker: function (cell) {
      var el = E._pickEl;
      var results = document.getElementById('sspPickGrid');
      var caret = el.querySelector('.ssp-pick-caret');
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var nav = document.querySelector('.nav-bar');
      var topLimit = 8;
      var bottomLimit = vh - (nav ? nav.offsetHeight : 0) - 8;
      var w = Math.min(PICK_MAX_W, vw - 16);
      el.style.width = w + 'px';
      results.style.maxHeight = Math.round(Math.min(PICK_MAX_RESULTS_H, vh * 0.42)) + 'px';
      var h = el.offsetHeight;
      var room = bottomLimit - topLimit;
      if (h > room) {
        results.style.maxHeight = Math.max(90, results.offsetHeight - (h - room)) + 'px';
        h = el.offsetHeight;
      }
      var r = cell.getBoundingClientRect();
      var top;
      var caretSide = '';
      if (r.bottom + 12 + h <= bottomLimit) {
        top = r.bottom + 12;
        caretSide = 'up';
      } else if (r.top - 12 - h >= topLimit) {
        top = r.top - 12 - h;
        caretSide = 'down';
      } else {
        top = Math.max(topLimit, Math.round((topLimit + bottomLimit - h) / 2));
      }
      var cx = r.left + r.width / 2;
      var left = Math.max(8, Math.min(vw - w - 8, Math.round(cx - w / 2)));
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      caret.className = 'ssp-pick-caret' + (caretSide ? ' ' + caretSide : ' hidden');
      caret.style.left = Math.max(16, Math.min(w - 32, Math.round(cx - left - 8))) + 'px';
    },

    _closePicker: function () {
      if (!E._pick) return;
      var grid = gridEl();
      var cell = grid && grid.children[E._pick.index];
      if (cell) cell.classList.remove('ssp-edit-target');
      E._pick = null;
      if (E._pickEl) E._pickEl.classList.remove('on');
      if (E._pickBackdrop) E._pickBackdrop.classList.remove('on');
      var s = document.getElementById('sspPickSearch');
      if (s) s.blur();
    },

    _pickToken: function (tok) {
      if (!E._pick) return;
      var i = E._pick.index;
      E._closePicker();
      pushRecent(tok);
      if (E._layout[i] !== tok) E._change(function () { E._layout[i] = tok; });
      if (!E._pickChain) return;
      var j;
      for (j = i + 1; j < E._layout.length; j++) {
        if (E._layout[j] === 'empty') {
          setTimeout(function (next) {
            return function () { if (E.active) E._openPicker(next); };
          }(j), 80);
          return;
        }
      }
    },

    _pickClear: function () {
      if (!E._pick) return;
      var i = E._pick.index;
      E._closePicker();
      if (E._layout[i] !== 'empty') E._change(function () { E._layout[i] = 'empty'; });
    },

    /* ---------- JSON import / export sheet ---------- */

    _exportText: function (scope) {
      var meta = window.BKSQ_AIRCRAFT || {};
      if (scope === 'config') return E._configSnippet();
      if (scope === 'page') {
        return '{\n' +
          '  "format": "' + FORMAT_PAGE + '",\n' +
          '  "version": 1,\n' +
          '  "aircraft": ' + JSON.stringify(meta.id || '') + ',\n' +
          '  "page": ' + JSON.stringify(E._pageId) + ',\n' +
          '  "cols": ' + E._cols + ',\n' +
          '  "layout": ' + layoutJson(E._layout, E._cols, '  ') + '\n}';
      }
      var ids = pageIds();
      var parts = [];
      var i;
      var o;
      for (i = 0; i < ids.length; i++) {
        o = ids[i] === E._pageId ? { layout: E._layout, cols: E._cols } : readOverride(ids[i]);
        if (!o || !o.layout || !o.layout.length) continue;
        var cols = o.cols || 8;
        parts.push('    ' + JSON.stringify(ids[i]) + ': {\n' +
          '      "cols": ' + cols + ',\n' +
          '      "layout": ' + layoutJson(o.layout, cols, '      ') + '\n    }');
      }
      return '{\n' +
        '  "format": "' + FORMAT_ALL + '",\n' +
        '  "version": 1,\n' +
        '  "aircraft": ' + JSON.stringify(meta.id || '') + ',\n' +
        '  "pages": {' + (parts.length ? '\n' + parts.join(',\n') + '\n  ' : '') + '}\n}';
    },

    _buildSheet: function () {
      var back = document.createElement('div');
      back.className = 'ssp-json-backdrop';
      back.addEventListener('click', function () { E._closeSheet(); });
      var el = document.createElement('div');
      el.className = 'ssp-json';
      el.setAttribute('role', 'dialog');
      el.innerHTML =
        '<div class="ssp-pick-title"><span>Layout JSON</span>' +
        '<button type="button" class="ssp-pick-x" data-json="close" aria-label="Close">&#10005;</button></div>' +
        '<div class="ssp-json-tabs">' +
        '<button type="button" class="ssp-pick-chip" data-scope="page">This page</button>' +
        '<button type="button" class="ssp-pick-chip" data-scope="all">All pages</button>' +
        '<button type="button" class="ssp-pick-chip" data-scope="config">Config code</button>' +
        '</div>' +
        '<p class="ssp-json-info" id="sspJsonInfo"></p>' +
        '<textarea class="ssp-json-text" id="sspJsonText" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>' +
        '<div class="ssp-json-msg" id="sspJsonMsg"></div>' +
        '<div class="ssp-json-actions">' +
        '<button type="button" class="ssp-pick-btn" data-json="copy">Copy</button>' +
        (CAN_DOWNLOAD ? '<button type="button" class="ssp-pick-btn" data-json="download">Download</button>' : '') +
        '<button type="button" class="ssp-pick-btn ssp-json-import" data-json="file">Load file&hellip;</button>' +
        '<input type="file" id="sspJsonFile" accept=".json,application/json,text/plain" style="display:none" />' +
        '<button type="button" class="ssp-pick-btn ssp-json-apply ssp-json-import" data-json="apply">Apply import</button>' +
        '</div>';
      document.body.appendChild(back);
      document.body.appendChild(el);
      E._sheetEl = el;
      E._sheetBack = back;
      el.addEventListener('click', function (e) {
        var t = e.target;
        var scope = t.getAttribute && t.getAttribute('data-scope');
        if (scope) {
          E._setSheetScope(scope);
          return;
        }
        var act = t.getAttribute && t.getAttribute('data-json');
        if (act === 'close') E._closeSheet();
        else if (act === 'copy') E._copySheetText();
        else if (act === 'download') E._downloadSheetText();
        else if (act === 'file') document.getElementById('sspJsonFile').click();
        else if (act === 'apply') E._applyImport(document.getElementById('sspJsonText').value);
      });
      document.getElementById('sspJsonFile').addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          document.getElementById('sspJsonText').value = String(reader.result || '');
          E._sheetMsg('Loaded ' + f.name + '. Review it, then tap Apply import.', false);
        };
        reader.onerror = function () { E._sheetMsg('Could not read ' + f.name + '.', true); };
        reader.readAsText(f);
        e.target.value = '';
      });
    },

    _openSheet: function (scope) {
      E._closePicker();
      if (!E._sheetEl) E._buildSheet();
      E._sheetOpen = true;
      E._sheetBack.classList.add('on');
      E._sheetEl.classList.add('on');
      document.getElementById('sspJsonText').style.height =
        Math.max(120, Math.min(380, window.innerHeight - 290)) + 'px';
      E._setSheetScope(scope);
    },

    _closeSheet: function () {
      if (!E._sheetOpen) return;
      E._sheetOpen = false;
      E._sheetBack.classList.remove('on');
      E._sheetEl.classList.remove('on');
      document.getElementById('sspJsonText').blur();
    },

    _setSheetScope: function (scope) {
      E._sheetScope = scope;
      var tabs = E._sheetEl.querySelectorAll('[data-scope]');
      var i;
      for (i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i].getAttribute('data-scope') === scope);
      E._sheetEl.classList.toggle('ssp-json-readonly', scope === 'config');
      var info = {
        page: 'This page\u2019s layout. To import, paste JSON here (a page or an All pages export) or load a file, then tap Apply import.',
        all: 'Every page you have customised for this aircraft; pages still on the shipped layout are not included. Apply import restores all pages in the pasted JSON.',
        config: 'Paste-ready code for config/panels/' + E._pageId + '.js to make this layout the shipped default.'
      };
      document.getElementById('sspJsonInfo').textContent = info[scope] +
        (CAN_DOWNLOAD ? '' : ' (iOS 12 cannot save downloads: use Copy.)');
      var ta = document.getElementById('sspJsonText');
      ta.readOnly = scope === 'config';
      ta.value = E._exportText(scope);
      E._sheetMsg('', false);
    },

    _sheetMsg: function (msg, isError) {
      var m = document.getElementById('sspJsonMsg');
      if (!m) return;
      m.textContent = msg;
      m.classList.toggle('error', !!isError);
    },

    _copySheetText: function () {
      var ta = document.getElementById('sspJsonText');
      var ok = false;
      ta.focus();
      ta.select();
      try {
        ta.setSelectionRange(0, ta.value.length);
      } catch (e) {}
      try {
        ok = document.execCommand('copy');
      } catch (e2) {}
      ta.blur();
      E._sheetMsg(ok ? 'Copied to clipboard.' : 'Copy is blocked here: select the text and copy it manually.', !ok);
    },

    _downloadSheetText: function () {
      var meta = window.BKSQ_AIRCRAFT || {};
      var ac = meta.id || 'aircraft';
      var scope = E._sheetScope;
      var name = scope === 'config' ? E._pageId + '.js' :
        scope === 'all' ? 'bksq-' + ac + '-layouts.json' : 'bksq-' + ac + '-' + E._pageId + '-layout.json';
      var blob = new Blob([document.getElementById('sspJsonText').value], {
        type: scope === 'config' ? 'text/javascript' : 'application/json'
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      E._sheetMsg('Saved ' + name + '.', false);
    },

    _applyImport: function (text) {
      var data = null;
      var meta = window.BKSQ_AIRCRAFT || {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        E._sheetMsg('Not valid JSON: ' + e.message, true);
        return;
      }
      if (!data || typeof data !== 'object') {
        E._sheetMsg('Expected a JSON object with "layout" or "pages".', true);
        return;
      }
      if (data.aircraft && meta.id && data.aircraft !== meta.id &&
          !window.confirm('This JSON is for "' + data.aircraft + '" but you are editing "' + meta.id + '". Import anyway?')) {
        return;
      }
      var known = {};
      var ids = pageIds();
      var i;
      for (i = 0; i < ids.length; i++) known[ids[i]] = true;
      var current = null;
      var imported = 0;
      var skipped = [];
      var k;
      if (data.pages && typeof data.pages === 'object') {
        for (k in data.pages) {
          if (!Object.prototype.hasOwnProperty.call(data.pages, k)) continue;
          var p = data.pages[k] || {};
          var lay = cleanLayout(p.layout);
          if (!known[k] || !lay) {
            skipped.push(k);
            continue;
          }
          var entry = { layout: lay, cols: cleanCols(p.cols, 8) };
          if (k === E._pageId) current = entry;
          else window.SSP_LAYOUT_STORE.save(k, entry);
          imported++;
        }
      } else {
        var lay1 = cleanLayout(data.layout);
        if (!lay1) {
          E._sheetMsg('No "layout" array found.', true);
          return;
        }
        current = { layout: lay1, cols: cleanCols(data.cols, E._cols) };
        imported = 1;
      }
      if (!imported) {
        E._sheetMsg('Nothing to import' + (skipped.length ? ' (unknown pages: ' + skipped.join(', ') + ')' : '') + '.', true);
        return;
      }
      var unknown = 0;
      if (current) {
        var buttons = getButtonsDict() || {};
        for (i = 0; i < current.layout.length; i++) {
          if (current.layout[i] !== 'empty' && !buttons[current.layout[i]]) unknown++;
        }
        E._change(function () {
          E._layout = current.layout;
          E._cols = current.cols;
        });
      }
      E._setSheetScope(E._sheetScope);
      E._sheetMsg('Imported ' + imported + ' page' + (imported === 1 ? '' : 's') + '.' +
        (skipped.length ? ' Skipped unknown pages: ' + skipped.join(', ') + '.' : '') +
        (unknown ? ' ' + unknown + ' unknown button name' + (unknown === 1 ? '' : 's') + ' on this page show as empty.' : '') +
        (imported > (current ? 1 : 0) ? ' Other pages use their imported layout when you open them.' : ''), false);
    }
  });
})();
