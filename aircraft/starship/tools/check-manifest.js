/**
 * Optional dev check: SSP_* labels in config/panels/*.js vs bksq-starship-scripts.xml
 * Usage: node tools/check-manifest.js
 */
var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var xmlPath = path.join(root, 'bksq-starship-scripts.xml');
var cfgDir = path.join(root, 'config', 'panels');

function readXmlLabels() {
  var xml = fs.readFileSync(xmlPath, 'utf8');
  var re = /<label>(SSP_[A-Z0-9_]+)<\/label>/g;
  var set = {};
  var m;
  while ((m = re.exec(xml)) !== null) {
    set[m[1]] = true;
  }
  return set;
}

function readConfigSsps() {
  var files = fs.readdirSync(cfgDir).filter(function (f) {
    return f.slice(-3) === '.js';
  });
  var found = {};
  var re = /SSP_[A-Z0-9_]+/g;
  var scan = function (text) {
    var m;
    while ((m = re.exec(text)) !== null) {
      found[m[0]] = true;
    }
  };
  for (var i = 0; i < files.length; i++) {
    scan(fs.readFileSync(path.join(cfgDir, files[i]), 'utf8'));
  }
  var buttonsPath = path.join(root, 'config', 'buttons.js');
  if (fs.existsSync(buttonsPath)) {
    scan(fs.readFileSync(buttonsPath, 'utf8'));
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
  'SSP in configs:',
  Object.keys(cfgSsps).length,
  '| XML panel scripts:',
  Object.keys(xmlLabels).length
);
console.log('Config labels missing from XML:', missing.length);
console.log('XML labels not referenced in config/panels (informational):', extra.length);

process.exit(missing.length ? 1 : 0);
