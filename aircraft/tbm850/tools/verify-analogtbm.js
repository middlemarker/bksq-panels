/**
 * Verify TBM850 panel bindings against local AnalogTBM.xml (not in git).
 * Usage: node tools/verify-analogtbm.js [path/to/AnalogTBM.xml]
 * Default path: ../../../ref/AnalogTBM.xml
 */
var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var analogPath = process.argv[2] || path.join(root, '..', '..', 'ref', 'AnalogTBM.xml');
var panelXml = path.join(root, 'bksq-tbm850-scripts.xml');
var buttonsJs = path.join(root, 'config', 'buttons.js');
var commonJs = path.join(root, 'common.js');

function read(file) {
  if (!fs.existsSync(file)) {
    console.error('Missing file:', file);
    process.exit(2);
  }
  return fs.readFileSync(file, 'utf8');
}

function uniq(arr) {
  var out = [];
  var seen = {};
  arr.forEach(function (x) {
    if (!seen[x]) {
      seen[x] = true;
      out.push(x);
    }
  });
  return out.sort();
}

function extractPanelBindings(text) {
  var scriptBodies = [];
  var reCdata = /<script><!\[CDATA\[([\s\S]*?)\]\]><\/script>/g;
  var m;
  while ((m = reCdata.exec(text)) !== null) scriptBodies.push(m[1]);
  var body = scriptBodies.join('\n');
  var lvars = [];
  var hevents = [];
  var kevents = [];
  var circuits = [];
  var reL = /L:([A-Za-z0-9_]+)/g;
  var reH = />\s*H:([A-Za-z0-9_]+)/g;
  var reK = />\s*K:([^)\s]+)/g;
  var reIE = />\s*IE:([^)\s]+)/g;
  var reC = /CIRCUIT SWITCH ON:(\d+)/g;
  var ievents = [];
  while ((m = reL.exec(body)) !== null) lvars.push(m[1]);
  while ((m = reH.exec(body)) !== null) hevents.push(m[1]);
  while ((m = reK.exec(body)) !== null) kevents.push(m[1]);
  while ((m = reIE.exec(body)) !== null) ievents.push(m[1]);
  while ((m = reC.exec(body)) !== null) circuits.push(parseInt(m[1], 10));
  return {
    lvars: uniq(lvars),
    hevents: uniq(hevents),
    kevents: uniq(kevents),
    ievents: uniq(ievents),
    circuits: uniq(circuits.map(String)).map(Number)
  };
}

function extractCircuitMacros(text) {
  var macros = {};
  var re = /<Macro Name="([^"]+Circuit)">(\d+)<\/Macro>/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    macros[m[1]] = parseInt(m[2], 10);
  }
  return macros;
}

function extractPollRefs(text) {
  var lvars = [];
  var aexpr = [];
  var reL = /lvar:\s*'([^']+)'/g;
  var reA = /expr:\s*'([^']+)'/g;
  var m;
  while ((m = reL.exec(text)) !== null) lvars.push(m[1]);
  while ((m = reA.exec(text)) !== null) aexpr.push(m[1]);
  return { lvars: uniq(lvars), aexpr: uniq(aexpr) };
}

function extractCommonLvars(text) {
  var lvars = [];
  var re = /getLVar\('([^']+)'/g;
  var m;
  while ((m = re.exec(text)) !== null) lvars.push(m[1]);
  return uniq(lvars);
}

function hasLvar(analog, name) {
  var re = new RegExp('L:' + name + '[\\s,>]', 'i');
  return re.test(analog);
}

function hasHevent(analog, name) {
  return analog.indexOf('H:' + name) !== -1 || analog.indexOf('(&gt;H:' + name) !== -1;
}

var analog = read(analogPath);
var panelText = read(panelXml);
var buttonsText = read(buttonsJs);
var commonText = read(commonJs);

var panel = extractPanelBindings(panelText);
var polls = extractPollRefs(buttonsText);
var commonLvars = extractCommonLvars(commonText);
var macros = extractCircuitMacros(analog);

var missingL = [];
var missingH = [];
var externalK = [];
var badCircuits = [];

panel.lvars.forEach(function (lv) {
  if (!hasLvar(analog, lv)) missingL.push(lv);
});
polls.lvars.concat(commonLvars).forEach(function (lv) {
  if (!hasLvar(analog, lv) && missingL.indexOf(lv) === -1) missingL.push(lv);
});

panel.hevents.forEach(function (h) {
  if (!hasHevent(analog, h)) missingH.push(h);
});

panel.kevents.forEach(function (k) {
  if (analog.indexOf(k) === -1 && analog.indexOf(k.replace(/&gt;/g, '>')) === -1) {
    externalK.push(k);
  }
});

panel.circuits.forEach(function (idx) {
  var found = false;
  Object.keys(macros).forEach(function (name) {
    if (macros[name] === idx) found = true;
  });
  if (!found) badCircuits.push(idx);
});

console.log('AnalogTBM:', analogPath);
console.log('Panel L-vars:', panel.lvars.length, '| H-events:', panel.hevents.length, '| K-events:', panel.kevents.length, '| IE-events:', panel.ievents.length);
console.log('Circuit macros:', Object.keys(macros).length);

if (missingL.length) {
  console.error('\nL-vars NOT found in AnalogTBM (' + missingL.length + '):');
  missingL.sort().forEach(function (x) {
    console.error('  ', x);
  });
}

if (missingH.length) {
  console.error('\nH-events NOT found in AnalogTBM (' + missingH.length + '):');
  missingH.sort().forEach(function (x) {
    console.error('  ', x);
  });
}

if (badCircuits.length) {
  console.error('\nCIRCUIT indices without macro (' + badCircuits.length + '):');
  badCircuits.sort().forEach(function (x) {
    console.error('  ', x);
  });
}

if (panel.ievents.length) {
  console.log('\nInput Events (IE — AS330 / NAVCOM, verify in sim event watcher):');
  panel.ievents.sort().forEach(function (x) {
    console.log('  ', x);
  });
}

if (externalK.length) {
  console.log('\nK-events external to AnalogTBM (expected for BKSQTbm850-* / Scripts-*):', externalK.length);
  externalK.sort().forEach(function (x) {
    console.log('  ', x);
  });
}

var pollIssues = [];
polls.lvars.forEach(function (lv) {
  if (!hasLvar(analog, lv)) pollIssues.push('poll lvar missing: ' + lv);
});
if (polls.lvars.indexOf('var_AutoFuelSelectorSwitch') !== -1) {
  pollIssues.push('var_AutoFuelSelectorSwitch is not in AnalogTBM; use A:CIRCUIT SWITCH ON:40 (FuelSelectorCircuit)');
}

var exitCode = missingL.length + missingH.length + badCircuits.length + pollIssues.length ? 1 : 0;

if (pollIssues.length) {
  console.error('\nPoll / UI issues:');
  pollIssues.forEach(function (x) {
    console.error('  ', x);
  });
}

if (!exitCode) {
  console.log('\nOK — panel bindings align with AnalogTBM (external K-events listed above are normal).');
}

process.exit(exitCode);
