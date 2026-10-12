/**
 * Layout audit — regenerates docs/LAYOUT-AUDIT.md. Report only: never edits layouts.
 *
 * Runs the real config files (panel-builder.js, buttons.js, config/panels/*.js,
 * panels/overrides.js) in a Node vm sandbox and analyses what they produce:
 * unknown/duplicate tokens, duplicate DOM ids, dead poll targets, custom polls
 * without a handler, row comments that don't match the rendered rows, dead
 * panel files, page ids that differ between aircraft.js / boot() / nav links,
 * and buttons not placed on any page.
 *
 * Usage: node tools/audit-layouts.js
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..');
var outPath = path.join(root, 'docs', 'LAYOUT-AUDIT.md');
var AIRCRAFT = ['starship', 'tbm850'];

function noop() {}

function makeContext() {
  var classList = { add: noop, remove: noop, toggle: noop, contains: function () { return false; } };
  var ctx = {
    console: console,
    navigator: { userAgent: 'node' },
    location: { search: '', hash: '' },
    localStorage: { getItem: function () { return null; }, setItem: noop, removeItem: noop },
    setTimeout: function () { return 0; },
    clearTimeout: noop,
    setInterval: function () { return 0; },
    clearInterval: noop,
    addEventListener: noop,
    document: {
      getElementById: function () { return null; },
      querySelector: function () { return null; },
      querySelectorAll: function () { return []; },
      addEventListener: noop,
      createElement: function () { return { style: {}, classList: classList, setAttribute: noop, appendChild: noop }; },
      documentElement: { classList: classList, style: { setProperty: noop, removeProperty: noop } },
      body: { classList: classList, appendChild: noop }
    }
  };
  ctx.window = ctx;
  return vm.createContext(ctx);
}

function runFile(ctx, file) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
}

function listFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(function (f) { return f.slice(-ext.length) === ext; }).sort();
}

function htmlIds(html) {
  var ids = [];
  var re = /\sid="([^"]+)"/g;
  var m;
  while ((m = re.exec(html || '')) !== null) ids.push(m[1]);
  return ids;
}

function rootClass(html) {
  var m = /^\s*<\w+[^>]*\sclass="([^"]*)"/.exec(html || '');
  return m ? m[1] : '';
}

function tokenWidth(buttons, tok) {
  if (typeof tok !== 'string') return 1;
  var def = buttons[tok] || buttons.empty;
  var cls = def ? rootClass(def.html) : '';
  var m = /\bwide-(\d)\b/.exec(cls);
  return m ? Number(m[1]) : 1;
}

function isPositioned(buttons, layout) {
  var i;
  for (i = 0; i < layout.length; i++) {
    var def = typeof layout[i] === 'string' ? buttons[layout[i]] : null;
    if (def && /(^|\s)p-[a-z]/.test(rootClass(def.html))) return true;
  }
  return false;
}

/** Split the layout array source into ROW-comment sections: [{ label, tokens[] }]. */
function rowSections(source) {
  var start = source.search(/layout:\s*\[/);
  if (start < 0) return [];
  var body = source.slice(start);
  body = body.slice(body.indexOf('[') + 1);
  var depth = 1;
  var i;
  for (i = 0; i < body.length && depth > 0; i++) {
    if (body.charAt(i) === '[') depth++;
    else if (body.charAt(i) === ']') depth--;
  }
  body = body.slice(0, i - 1);
  var sections = [];
  var cur = null;
  var re = /\/\*([\s\S]*?)\*\/|'([^']*)'/g;
  var m;
  while ((m = re.exec(body)) !== null) {
    if (m[1] !== undefined) {
      var text = m[1].replace(/\s*\*\s*/g, ' ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
      if (/^ROW\b/i.test(text)) {
        cur = { label: text, tokens: [] };
        sections.push(cur);
      }
    } else if (cur) {
      cur.tokens.push(m[2]);
    }
  }
  return sections;
}

function auditAircraft(acId) {
  var acDir = path.join(root, 'aircraft', acId);
  var ctx = makeContext();
  runFile(ctx, path.join(acDir, 'aircraft.js'));
  runFile(ctx, path.join(root, 'common', 'panel-builder.js'));
  runFile(ctx, path.join(acDir, 'config', 'buttons.js'));
  var buttons = ctx.SSP_BUTTONS || ctx.TBM_BUTTONS || {};

  var captured = null;
  var realPanel = ctx.SSPPanel;
  ctx.SSPPanel = function (spec) {
    captured = spec;
    return realPanel(spec);
  };

  var customHandlers = null;
  try {
    ctx.SSP_PANEL_OVERRIDES = { onPoll: noop };
    runFile(ctx, path.join(acDir, 'panels', 'overrides.js'));
    customHandlers = (ctx.SSP_PANEL_OVERRIDES && ctx.SSP_PANEL_OVERRIDES.polls) || {};
  } catch (e) {
    customHandlers = null;
  }

  var pageFiles = listFiles(path.join(acDir, 'pages'), '.html');
  var pageText = {};
  pageFiles.forEach(function (f) { pageText[f] = fs.readFileSync(path.join(acDir, 'pages', f), 'utf8'); });

  var placed = {};
  var sections = [];

  listFiles(path.join(acDir, 'config', 'panels'), '.js').forEach(function (pf) {
    var file = path.join(acDir, 'config', 'panels', pf);
    var source = fs.readFileSync(file, 'utf8');
    var findings = [];
    var before = {};
    var k;
    ctx.SSP_PANELS = ctx.SSP_PANELS || {};
    for (k in ctx.SSP_PANELS) before[k] = ctx.SSP_PANELS[k];
    captured = null;
    try {
      runFile(ctx, file);
    } catch (e) {
      sections.push({ aircraft: acId, id: pf, findings: ['**Load error:** ' + e.message] });
      return;
    }
    var panelId = null;
    for (k in ctx.SSP_PANELS) {
      if (before[k] !== ctx.SSP_PANELS[k]) panelId = k;
    }
    if (!panelId) panelId = pf.replace(/\.js$/, '');
    var panel = ctx.SSP_PANELS[panelId] || {};
    var spec = captured || {};
    var layout = spec.layout || [];
    var cols = spec.cols || panel.cols || 8;

    var loadedBy = pageFiles.filter(function (f) { return pageText[f].indexOf('panels/' + pf) >= 0; });
    if (!loadedBy.length) findings.push('**Dead file:** `config/panels/' + pf + '` is not loaded by any `pages/*.html`.');

    if (!captured) {
      findings.push('**Custom markup:** built without `SSPPanel` (' + (panel.gridClass || 'no gridClass') +
        '); token checks skipped. Keep `layoutEditDisabled: true`.');
      sections.push({ aircraft: acId, id: panelId, cols: '—', tokens: '—', findings: findings });
      return;
    }

    var unknown = [];
    var inline = 0;
    var seen = {};
    var dups = [];
    layout.forEach(function (t) {
      if (typeof t !== 'string') {
        inline++;
        return;
      }
      if (t === 'empty') return;
      placed[t] = true;
      if (!buttons[t]) unknown.push(t);
      if (seen[t] && dups.indexOf(t) < 0) dups.push(t);
      seen[t] = true;
    });
    if (unknown.length) findings.push('**Unknown tokens** (render as empty): `' + unknown.join('`, `') + '`.');
    if (dups.length) findings.push('**Duplicate tokens:** `' + dups.join('`, `') + '`.');
    if (inline) findings.push('**Inline cells:** ' + inline + ' non-string layout entr' + (inline === 1 ? 'y' : 'ies') + '; edit mode cannot open this page.');

    var ids = htmlIds(panel.innerHtml);
    var idCount = {};
    ids.forEach(function (id) { idCount[id] = (idCount[id] || 0) + 1; });
    var dupIds = Object.keys(idCount).filter(function (id) { return idCount[id] > 1; });
    if (dupIds.length) findings.push('**Duplicate DOM ids** (polls update only the first): `' + dupIds.join('`, `') + '`.');

    var dead = [];
    var noHandler = [];
    (panel.polls || []).forEach(function (p) {
      if (p.kind === 'custom') {
        if (customHandlers && !customHandlers[p.id]) noHandler.push(p.id);
        return;
      }
      if (p.btnId && !idCount[p.btnId]) dead.push('btn `' + p.btnId + '`');
      if (p.indId && !idCount[p.indId]) dead.push('indicator `' + p.indId + '`');
      if ((p.kind === 'lvarText' || p.kind === 'avarText') && p.id && !idCount[p.id]) dead.push('readout `' + p.id + '`');
      (p.lampIds || []).forEach(function (l) { if (!idCount[l]) dead.push('lamp `' + l + '`'); });
    });
    if (dead.length) findings.push('**Dead poll targets** (no matching element): ' + dead.join(', ') + '.');
    if (noHandler.length) findings.push('**Custom polls without a handler** in `panels/overrides.js`: `' + noHandler.join('`, `') + '`.');

    var positioned = isPositioned(buttons, layout);
    var totalWidth = 0;
    layout.forEach(function (t) { totalWidth += tokenWidth(buttons, t); });
    if (positioned) {
      findings.push('**CSS-positioned cells** (`p-*` classes): visual order does not follow the array; row checks skipped.' +
        (spec.layoutEditDisabled ? '' : ' Set `layoutEditDisabled: true`.'));
    } else if (totalWidth % cols !== 0) {
      findings.push('**Ragged last row:** layout fills ' + totalWidth + ' columns, not a multiple of ' + cols + '.');
    }

    if (!positioned) {
      rowSections(source).forEach(function (sec) {
        var w = 0;
        sec.tokens.forEach(function (t) { w += tokenWidth(buttons, t); });
        if (w && w !== cols) {
          findings.push('**Row comment mismatch:** `' + sec.label + '` covers ' + w + ' columns (' +
            (w / cols).toFixed(2).replace(/\.?0+$/, '') + ' rows of ' + cols + '). Suggest splitting or relabelling the comment.');
        }
        if (/centered|centred/i.test(sec.label) && w === cols) {
          var lead = 0;
          var trail = 0;
          while (lead < sec.tokens.length && sec.tokens[lead] === 'empty') lead++;
          while (trail < sec.tokens.length && sec.tokens[sec.tokens.length - 1 - trail] === 'empty') trail++;
          if (Math.abs(lead - trail) > 1) {
            findings.push('**Comment vs padding:** `' + sec.label + '` says centred but has ' + lead +
              ' empty cell(s) on the left and ' + trail + ' on the right.');
          }
        }
      });
    }

    var real = layout.filter(function (t) { return t !== 'empty'; }).length;
    sections.push({
      aircraft: acId,
      id: panelId,
      cols: cols,
      tokens: layout.length + ' (' + real + ' buttons)',
      findings: findings
    });
  });

  sections.push(auditPageIds(acId, ctx, pageFiles, pageText));

  var unused = Object.keys(buttons).filter(function (t) { return t !== 'empty' && !placed[t]; }).sort();
  return { sections: sections, unused: unused, buttonCount: Object.keys(buttons).length - (buttons.empty ? 1 : 0) };
}

/** aircraft.js page id = boot() argument = SSP_PANELS key = data-panel-nav value. */
function auditPageIds(acId, ctx, pageFiles, pageText) {
  var pages = (ctx.BKSQ_AIRCRAFT && ctx.BKSQ_AIRCRAFT.pages) || [];
  var known = {};
  var byHref = {};
  var findings = [];
  pages.forEach(function (p) {
    known[p.id] = true;
    byHref[p.href] = p;
  });
  pages.forEach(function (p) {
    var html = pageText[p.href];
    if (html === undefined) {
      findings.push('**Missing page file:** `' + p.id + '` points to `pages/' + p.href + '`.');
      return;
    }
    var m = /SSPRuntime\.boot\('([^']*)'\)/.exec(html);
    var bootId = m ? m[1] : null;
    if (bootId !== p.id) {
      findings.push('**Page id mismatch:** `aircraft.js` id `' + p.id + '` but `pages/' + p.href + '` boots `' + bootId +
        '`. Nav visibility and auto-home use the first; last page and saved layouts the second.');
    }
    if (!ctx.SSP_PANELS || !ctx.SSP_PANELS[p.id]) {
      findings.push('**No panel registered** as `SSP_PANELS.' + p.id + '`.');
    }
  });
  pageFiles.forEach(function (f) {
    var redirect = /http-equiv="refresh"/i.test(pageText[f]);
    if (!byHref[f] && !redirect) findings.push('**Unlisted page file:** `pages/' + f + '` is not in `aircraft.js` `pages[]`.');
    var re = /data-panel-nav="([^"]*)"/g;
    var m;
    while ((m = re.exec(pageText[f])) !== null) {
      if (!known[m[1]]) findings.push('**Unknown nav id:** `pages/' + f + '` links `data-panel-nav="' + m[1] + '"`.');
    }
  });
  return { aircraft: acId, id: 'page ids', cols: '—', tokens: pages.length + ' pages', findings: findings };
}

var results = AIRCRAFT.map(function (ac) { return { id: ac, data: auditAircraft(ac) }; });

var md = [];
md.push('# Layout audit');
md.push('');
md.push('Generated by `node tools/audit-layouts.js` from the real config files. **Layouts are not modified** — this report lists findings and suggestions only. Saved on-device layouts (edit mode) are not covered.');
md.push('');
md.push('## Summary');
md.push('');
md.push('| Aircraft | Page | Cols | Cells | Findings |');
md.push('|----------|------|------|-------|----------|');
results.forEach(function (r) {
  r.data.sections.forEach(function (s) {
    md.push('| ' + r.id + ' | ' + s.id + ' | ' + s.cols + ' | ' + s.tokens + ' | ' + s.findings.length + ' |');
  });
});
md.push('');
results.forEach(function (r) {
  r.data.sections.forEach(function (s) {
    md.push('## ' + r.id + ' / ' + s.id);
    md.push('');
    if (!s.findings.length) md.push('- No issues found.');
    s.findings.forEach(function (f) { md.push('- ' + f); });
    md.push('');
  });
});
md.push('## Buttons not placed on any page');
md.push('');
md.push('Defined in `config/buttons.js` but not in any shipped layout. They are available in the edit-mode picker.');
md.push('');
results.forEach(function (r) {
  md.push('- **' + r.id + '** (' + r.data.unused.length + ' of ' + r.data.buttonCount + '): ' +
    (r.data.unused.length ? '`' + r.data.unused.join('`, `') + '`' : 'none'));
});
md.push('');

fs.writeFileSync(outPath, md.join('\n'), 'utf8');
var total = 0;
results.forEach(function (r) { r.data.sections.forEach(function (s) { total += s.findings.length; }); });
console.log('Wrote ' + outPath + ' (' + total + ' findings)');
