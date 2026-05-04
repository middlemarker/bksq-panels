/**
 * Keeps bottom nav and in-app links inside the same WebView / standalone session on iOS.
 * Default <a> navigation often opens Mobile Safari; programmatic location avoids that.
 */
(function () {
  function findNavLink(el) {
    while (el && el !== document) {
      if (el.tagName === 'A') return el;
      el = el.parentNode;
    }
    return null;
  }

  function inNavBar(a) {
    var el = a;
    while (el && el !== document) {
      if (el.classList && el.classList.contains('nav-bar')) return true;
      el = el.parentNode;
    }
    return false;
  }

  /** Aircraft type buttons and any future in-overlay links (not in bottom nav). */
  function inSettingsOverlay(a) {
    var el = a;
    while (el && el !== document) {
      if (el.id === 'settingsOverlay') return true;
      if (el.classList && el.classList.contains('settings-overlay')) return true;
      el = el.parentNode;
    }
    return false;
  }

  function isExternalHref(href) {
    if (!href) return false;
    var h = href.trim();
    return (
      h.indexOf('http://') === 0 ||
      h.indexOf('https://') === 0 ||
      h.indexOf('//') === 0 ||
      h.indexOf('mailto:') === 0 ||
      h.indexOf('tel:') === 0
    );
  }

  function navigateInPlace(a) {
    var raw = a.getAttribute('href');
    if (raw == null || raw === '') return;
    if (raw.charAt(0) === '#' && raw.length > 1) {
      window.location.hash = raw.slice(1);
      return;
    }
    window.location.href = a.href;
  }

  function shouldHandle(a) {
    if (!a || !a.getAttribute) return false;
    var href = a.getAttribute('href');
    if (href == null || href === '') return false;
    if (!inNavBar(a) && !inSettingsOverlay(a)) return false;
    if (isExternalHref(href)) return false;
    if (a.getAttribute('data-settings-modal')) return false;
    return true;
  }

  function isFormFieldTouchTarget(el) {
    while (el && el !== document) {
      var t = el.tagName;
      if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA' || t === 'BUTTON' || t === 'OUTPUT') return true;
      if (t === 'LABEL') return true;
      el = el.parentNode;
    }
    return false;
  }

  function onPointerActivate(e) {
    if (e.type === 'touchend' && isFormFieldTouchTarget(e.target)) return;
    var a = findNavLink(e.target);
    if (!shouldHandle(a)) return;
    e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    navigateInPlace(a);
  }

  document.addEventListener('click', onPointerActivate, true);

  var ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  if (/iP(hone|od|ad)/.test(ua)) {
    document.addEventListener('touchend', onPointerActivate, { capture: true, passive: false });
  }
})();
