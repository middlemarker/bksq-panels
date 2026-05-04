/* global AaoWebApi */
window.SSP_PANELS = window.SSP_PANELS || {};
window.BKSQ_AIRCRAFT = window.BKSQ_AIRCRAFT || {};
var webApi = new AaoWebApi();

function setVh() {
  document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
}
setVh();
window.addEventListener('resize', setVh, { passive: true });
window.addEventListener('orientationchange', function () { setTimeout(setVh, 350); }, { passive: true });

var iOS12 = /iP(hone|od|ad).*OS 12_/i.test(navigator.userAgent) || /Version\/12\./.test(navigator.userAgent);
document.documentElement.style.setProperty('--vhFix', iOS12 ? '24px' : '0px');

function getAircraftEventGroup() {
  return window.BKSQ_AIRCRAFT && window.BKSQ_AIRCRAFT.eventGroup ? window.BKSQ_AIRCRAFT.eventGroup : 'bksq-panel';
}

function sendPanelEvent(label) {
  try {
    webApi.SendEvent(1, '(>K:' + getAircraftEventGroup() + '-' + label + ')');
  } catch (e) {}
}
function sendP(label) { sendPanelEvent(label); }
function sendTbmP(label) { sendPanelEvent(label); }
function sendK(label) { sendPanelEvent(label); }
function sendKC(label) { sendPanelEvent(label); }
function sendKS(label) { sendPanelEvent(label); }
function sendH(evt) { sendPanelEvent(evt); }
function sendSimK(evt) {
  try { webApi.SendScript('1 (>K:' + evt + ')'); } catch (e) {}
}

function setLVar(name, type, val) {
  try { webApi.SendScript(val + ' (>L:' + name + ', ' + type + ')'); } catch (e) {}
}
function getLVar(name, type) {
  try { return webApi.GetSimVar('(L:' + name + ', ' + type + ')'); } catch (e) { return undefined; }
}
function getAVar(expr) {
  try { return webApi.GetSimVar('(A:' + expr + ')'); } catch (e) { return undefined; }
}

function fitGrid() {
  var main = document.querySelector('main');
  var grid = document.getElementById('grid');
  var mainRect, gridRect, scaleH, scaleW, scale;
  if (!main || !grid) return;
  if (document.documentElement.classList.contains('ssp-panel-scrollable')) {
    grid.style.webkitTransform = 'none';
    grid.style.transform = 'none';
    return;
  }
  grid.style.webkitTransform = 'none';
  grid.style.transform = 'none';
  void grid.offsetHeight;
  mainRect = main.getBoundingClientRect();
  gridRect = grid.getBoundingClientRect();
  scaleH = Math.min(1, (mainRect.height - 2) / gridRect.height);
  scaleW = Math.min(1, (mainRect.width - 12) / gridRect.width);
  scale = Math.min(scaleH, scaleW);
  if (scale < 0.999) {
    grid.style.webkitTransform = 'scale(' + scale + ')';
    grid.style.transform = 'scale(' + scale + ')';
  }
}

function setToggleVisual(btnId, indId, isOn, onLabel, offLabel) {
  var btn = document.getElementById(btnId);
  var ind = document.getElementById(indId);
  if (!ind) return;
  isOn = !!isOn;
  if (btn && !btn.getAttribute('data-fixed-label') && onLabel != null && arguments.length >= 5) {
    var newText = isOn ? ' ' + offLabel : ' ' + onLabel;
    if (btn._sspLabel !== newText) {
      var tn = null;
      var c;
      for (c = btn.lastChild; c; c = c.previousSibling) {
        if (c.nodeType === 3) {
          tn = c;
          break;
        }
      }
      if (tn) tn.nodeValue = newText;
      btn._sspLabel = newText;
    }
  }
  if (ind._sspOn === isOn) return;
  ind._sspOn = isOn;
  if (isOn) ind.classList.add('on');
  else ind.classList.remove('on');
}

function setLamps(lampIds, activeIdx) {
  var i, el, want;
  for (i = 0; i < lampIds.length; i++) {
    el = document.getElementById(lampIds[i]);
    if (!el) continue;
    want = (i === activeIdx);
    if (el._sspOn === want) continue;
    el._sspOn = want;
    if (want) el.classList.add('on');
    else el.classList.remove('on');
  }
}

function setValDisplay(id, val) {
  var el = document.getElementById(id);
  if (!el) return;
  var text = (val !== undefined && val !== null) ? String(val) : '-';
  if (el._sspText === text) return;
  el._sspText = text;
  el.textContent = text;
}

function renderLayout(targetId, layoutHtml) {
  var el = document.getElementById(targetId);
  if (!el) return false;
  el.innerHTML = layoutHtml || '';
  return true;
}

var activeBtn = null;
function findButton(el) {
  while (el && el !== document) {
    if (el.classList && el.classList.contains('btn')) return el;
    el = el.parentNode;
  }
  return null;
}
function flashButton(btn) {
  if (!btn || !btn.classList || btn.classList.contains('placeholder') || btn.classList.contains('disabled')) return;
  btn.classList.add('flash', 'pressed');
  if (navigator.vibrate) {
    try { navigator.vibrate(8); } catch (e) {}
  }
  clearTimeout(btn._flashTimeout);
  btn._flashTimeout = setTimeout(function () { btn.classList.remove('flash'); }, 220);
  activeBtn = btn;
}
function clearPressed() {
  if (activeBtn) {
    activeBtn.classList.remove('pressed');
    activeBtn = null;
  }
}

try {
  webApi.StartAPI(typeof window.SSP_GET_POLL_MS === 'function' ? window.SSP_GET_POLL_MS() : 100);
} catch (e) {}

window.addEventListener('load', function () { setTimeout(fitGrid, 20); }, { passive: true });
window.addEventListener('resize', function () { setTimeout(fitGrid, 60); }, { passive: true });
window.addEventListener('orientationchange', function () { setTimeout(fitGrid, 420); }, { passive: true });

document.addEventListener('touchstart', function (e) { flashButton(findButton(e.target)); }, { capture: true, passive: true });
document.addEventListener('mousedown', function (e) { flashButton(findButton(e.target)); }, { capture: true, passive: true });
document.addEventListener('touchend', clearPressed, { capture: true, passive: true });
document.addEventListener('touchcancel', clearPressed, { capture: true, passive: true });
document.addEventListener('mouseup', clearPressed, { capture: true, passive: true });
document.addEventListener('mouseleave', clearPressed, { capture: true, passive: true });
window.addEventListener('blur', clearPressed, { passive: true });
document.addEventListener('visibilitychange', function () { if (document.hidden) clearPressed(); }, { passive: true });

