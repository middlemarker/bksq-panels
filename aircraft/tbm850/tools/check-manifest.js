/**
 * Optional dev check: SSP_TBM_* labels in TBM JS vs bksq-tbm850-scripts.xml
 * Usage: node tools/check-manifest.js
 */
var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var xmlPath = path.join(root, 'bksq-tbm850-scripts.xml');
var cfgDirs = [path.join(root, 'config'), path.join(root, 'config', 'panels')];
var cfgFiles = [path.join(root, 'common.js')];

function readXmlLabels() {
  var xml = fs.readFileSync(xmlPath, 'utf8');
  var re = /<label>(SSP_TBM_[A-Z0-9_]+)<\/label>/g;
  var set = {};
  var m;
  while ((m = re.exec(xml)) !== null) {
    set[m[1]] = true;
  }
  return set;
}

function readConfigSsps() {
  var found = {};
  var re = /SSP_TBM_[A-Z0-9_]+/g;
  for (var d = 0; d < cfgDirs.length; d++) {
    var cfgDir = cfgDirs[d];
    var files = fs.readdirSync(cfgDir).filter(function (f) {
      return f.slice(-3) === '.js';
    });
    for (var i = 0; i < files.length; i++) {
      var text = fs.readFileSync(path.join(cfgDir, files[i]), 'utf8');
      var m;
      while ((m = re.exec(text)) !== null) {
        found[m[0]] = true;
      }
    }
  }
  for (var f = 0; f < cfgFiles.length; f++) {
    var text = fs.readFileSync(cfgFiles[f], 'utf8');
    var m;
    while ((m = re.exec(text)) !== null) {
      found[m[0]] = true;
    }
  }
  return found;
}

var xmlLabels = readXmlLabels();
var cfgSsps = readConfigSsps();
var missing = [];
var extra = [];

Object.keys(cfgSsps).forEach(function (k) {
  if (!xmlLabels[k]) missing.push(k);
});

Object.keys(xmlLabels).forEach(function (k) {
  if (!cfgSsps[k]) extra.push(k);
});

if (missing.length) {
  console.error('In panel configs but NOT in XML (' + missing.length + '):');
  missing.sort().forEach(function (x) {
    console.error('  ', x);
  });
}

console.log(
  'SSP_TBM in configs:',
  Object.keys(cfgSsps).length,
  '| XML panel scripts:',
  Object.keys(xmlLabels).length
);
console.log('Config labels missing from XML:', missing.length);
console.log('XML labels not referenced in config JS (informational):', extra.length);

process.exit(missing.length ? 1 : 0);
