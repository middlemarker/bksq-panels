/**
 * Bottom-nav tools: EDIT (layout editor) and the auto-home toggle, placed
 * before the settings gear. When a home page is set, any other panel page
 * returns to it after `autoHomeIdleSec` seconds without user input.
 *
 * Panel pages: SSPRuntime.boot() calls mount(). The hub (index.html) calls
 * mountHub() so the bar shows the same buttons in the same place.
 * ES5 / iOS 12.5.
 */
(function () {
  var IDLE_CHECK_MS = 1000;
  var _pageId = null;
  var _lastActivity = Date.now();
  var _idleTimer = null;
  var _editBtn = null;
  var _homeBtn = null;

  function lastPageKey() {
    var meta = window.BKSQ_AIRCRAFT || {};
    return (meta.storageKey || 'bksq-panels-ui') + ':last-page';
  }

  function readLastPage() {
    try {
      return localStorage.getItem(lastPageKey()) || '';
    } catch (e) {
      return '';
    }
  }

  function settings() {
    return window.SSP_UI_SETTINGS ? window.SSP_UI_SETTINGS.get() : {};
  }

  function findPage(id) {
    var pages = (window.BKSQ_AIRCRAFT && window.BKSQ_AIRCRAFT.pages) || [];
    var i;
    for (i = 0; i < pages.length; i++) {
      if (pages[i].id === id) return pages[i];
    }
    return null;
  }

  function isEditing() {
    return typeof SSPRuntime !== 'undefined' && SSPRuntime.isEditing();
  }

  function markActivity() {
    _lastActivity = Date.now();
  }

  function checkIdle() {
    var s = settings();
    var home = findPage(s.autoHomePage);
    if (!home || home.id === _pageId) return;
    if (isEditing()) {
      markActivity();
      return;
    }
    if (Date.now() - _lastActivity < s.autoHomeIdleSec * 1000) return;
    clearInterval(_idleTimer);
    _idleTimer = null;
    window.location.href = home.href;
  }

  function syncIdleTimer() {
    var s = settings();
    var needed = !!s.autoHomePage && s.autoHomePage !== _pageId;
    if (needed && !_idleTimer) {
      markActivity();
      _idleTimer = setInterval(checkIdle, IDLE_CHECK_MS);
    } else if (!needed && _idleTimer) {
      clearInterval(_idleTimer);
      _idleTimer = null;
    }
  }

  function renderHomeBtn() {
    if (!_homeBtn) return;
    var home = settings().autoHomePage;
    var homePage = findPage(home);
    var isHere = home === _pageId;
    _homeBtn.classList.toggle('active', isHere);
    _homeBtn.classList.toggle('nav-tool-armed', !!homePage && !isHere);
    _homeBtn.textContent = '\u2302 ' + (homePage && !isHere ? (homePage.navLabel || homePage.label) : 'AUTO');
    if (isHere) _homeBtn.title = 'Auto-home is set to this page. Tap to turn auto-home off.';
    else if (homePage) _homeBtn.title = 'Auto-home returns to ' + (homePage.label || homePage.id) + '. Tap to make this page home.';
    else _homeBtn.title = 'Auto-home is off. Tap to make this page home.';
  }

  function renderEditBtn() {
    if (!_editBtn) return;
    var on = isEditing();
    _editBtn.classList.toggle('active', on);
    _editBtn.textContent = on ? 'DONE' : 'EDIT';
  }

  function onHomeTap() {
    var s = settings();
    window.SSP_UI_SETTINGS.set({ autoHomePage: s.autoHomePage === _pageId ? '' : _pageId });
    markActivity();
  }

  function onEditTap() {
    if (isEditing()) {
      SSPRuntime.exitEditMode();
      renderEditBtn();
      return;
    }
    SSPRuntime.enterEditMode(renderEditBtn);
  }

  function makeBtn(cls, onTap) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'nav-tool ' + cls;
    b.addEventListener('click', onTap);
    return b;
  }

  function insertTools(nav, homeBtn, editBtn) {
    var gear = nav.querySelector('.nav-settings-gear');
    nav.setAttribute('data-nav-tools', '1');
    nav.insertBefore(homeBtn, gear);
    nav.insertBefore(editBtn, gear);
  }

  /* ---------- hub (settings screen) ---------- */

  function hubPageHref(page) {
    var meta = window.BKSQ_AIRCRAFT || {};
    return 'aircraft/' + meta.id + '/pages/' + page.href;
  }

  function renderHubButtons() {
    var home = findPage(settings().autoHomePage);
    var btns = document.querySelectorAll('.nav-bar .nav-tool-home');
    var i;
    for (i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('nav-tool-armed', !!home);
      btns[i].textContent = '\u2302 ' + (home ? (home.navLabel || home.label) : 'AUTO');
      btns[i].title = home ? 'Auto-home returns to ' + (home.label || home.id) + '. Tap to change it.' :
        'Auto-home is off. Tap to set it up.';
    }
  }

  function onHubHomeTap() {
    var sel = document.getElementById('selAutoHomePage');
    if (!sel) return;
    if (sel.scrollIntoView) sel.scrollIntoView({ block: 'center', behavior: 'smooth' });
    var row = sel.parentNode;
    if (row && row.classList) {
      row.classList.add('settings-flash');
      setTimeout(function () { row.classList.remove('settings-flash'); }, 1400);
    }
  }

  function onHubEditTap() {
    var pages = (window.BKSQ_AIRCRAFT && window.BKSQ_AIRCRAFT.pages) || [];
    var target = findPage(readLastPage());
    var i;
    if (target && target.noEdit) target = null;
    for (i = 0; i < pages.length && !target; i++) {
      if (!pages[i].noEdit) target = pages[i];
    }
    if (target) window.location.href = hubPageHref(target) + '?edit=1';
  }

  function markLastPageTab() {
    var last = readLastPage();
    var links = document.querySelectorAll('.nav-bar a[data-panel-nav]');
    var i;
    for (i = 0; i < links.length; i++) {
      links[i].classList.toggle('nav-last', !!last && links[i].getAttribute('data-panel-nav') === last);
    }
  }

  window.SSP_NAV_TOOLS = {
    mountHub: function () {
      var navs = document.querySelectorAll('.nav-bar');
      var i;
      for (i = 0; i < navs.length; i++) {
        if (navs[i].getAttribute('data-nav-tools')) continue;
        var home = makeBtn('nav-tool-home nav-tool-first', onHubHomeTap);
        var edit = makeBtn('nav-tool-edit', onHubEditTap);
        edit.textContent = 'EDIT';
        edit.title = 'Open the last panel page in edit mode';
        insertTools(navs[i], home, edit);
      }
      markLastPageTab();
      renderHubButtons();
      window.addEventListener('ssp-ui-settings-applied', renderHubButtons);
    },

    mount: function (pageId, panel) {
      var nav = document.querySelector('.nav-bar');
      if (!nav || nav.getAttribute('data-nav-tools')) return;
      _pageId = pageId;
      try {
        localStorage.setItem(lastPageKey(), pageId);
      } catch (e) {}
      _homeBtn = makeBtn('nav-tool-home nav-tool-first', onHomeTap);
      _editBtn = makeBtn('nav-tool-edit', onEditTap);
      if (panel && panel.layoutEditDisabled) _editBtn.classList.add('nav-tool-disabled');
      insertTools(nav, _homeBtn, _editBtn);

      var activity = ['touchstart', 'mousedown', 'mousemove', 'keydown', 'wheel'];
      var i;
      for (i = 0; i < activity.length; i++) {
        document.addEventListener(activity[i], markActivity, { capture: true, passive: true });
      }
      document.addEventListener('scroll', markActivity, { capture: true, passive: true });
      window.addEventListener('ssp-ui-settings-applied', function () {
        renderHomeBtn();
        syncIdleTimer();
      });

      renderHomeBtn();
      renderEditBtn();
      syncIdleTimer();
    }
  };
})();
