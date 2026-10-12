/**
 * ES5 / iOS 12.5 guard — scans project .js (skips node_modules).
 * Usage: node tools/check-es5.js
 */
var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var skipDirs = { node_modules: true, '.git': true };
var skipFiles = { 'AaoWebApi.js': true, 'check-es5.js': true, 'audit-layouts.js': true };

var patterns = [
  { re: /\bconst\s+[A-Za-z_$]/, msg: 'const declaration' },
  { re: /\blet\s+[A-Za-z_$]/, msg: 'let declaration' },
  { re: /=>/, msg: 'arrow function' },
  { re: /`/, msg: 'template literal' },
  { re: /\.\.\./, msg: 'spread/rest' },
  { re: /\bObject\.assign\s*\(/, msg: 'Object.assign' },
  { re: /\bArray\.from\s*\(/, msg: 'Array.from' },
  { re: /\basync\s+function\b/, msg: 'async function' },
  { re: /\bawait\s+/, msg: 'await' },
  { re: /\bPromise\s*\(/, msg: 'Promise constructor' },
  { re: /\bfetch\s*\(/, msg: 'fetch()' },
  { re: /\.closest\s*\(/, msg: 'Element.closest' },
  { re: /\.classList\.replace\s*\(/, msg: 'classList.replace' },
  { re: /\?\?/, msg: 'nullish coalescing' },
  { re: /\?\./, msg: 'optional chaining' }
];

function walk(dir, out) {
  var entries = fs.readdirSync(dir);
  var i;
  for (i = 0; i < entries.length; i++) {
    var name = entries[i];
    if (skipDirs[name]) continue;
    var full = path.join(dir, name);
    var st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.slice(-3) === '.js') out.push(full);
  }
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function checkFile(filePath) {
  if (skipFiles[path.basename(filePath)]) return [];
  var text = stripComments(fs.readFileSync(filePath, 'utf8'));
  var lines = text.split('\n');
  var hits = [];
  var i;
  var p;
  for (i = 0; i < lines.length; i++) {
    for (p = 0; p < patterns.length; p++) {
      if (patterns[p].re.test(lines[i])) {
        hits.push({ line: i + 1, msg: patterns[p].msg, text: lines[i].trim().slice(0, 120) });
        break;
      }
    }
  }
  return hits;
}

var files = [];
walk(root, files);
var total = 0;
files.forEach(function (f) {
  var hits = checkFile(f);
  if (!hits.length) return;
  var rel = path.relative(root, f);
  console.error(rel + ':');
  hits.forEach(function (h) {
    console.error('  L' + h.line + ' ' + h.msg + ': ' + h.text);
    total++;
  });
});

if (total) {
  console.error('check-es5: ' + total + ' issue(s) in ' + files.length + ' files scanned.');
  process.exit(1);
}
console.log('check-es5: OK (' + files.length + ' files)');
