(function () {
  window.BKSQ_AIRCRAFT = {
    id: 'tbm850',
    title: 'TBM850',
    eventGroup: 'bksq-tbm-panel',
    storageKey: 'bksq-tbm850-ui-settings-v1',
    defaults: {
      pollIntervalMs: 50,
      panelBtnFontPx: 18,
      panelGridRowMinPx: 110,
      panelGridGapPx: 14,
      panelGridGapXPx: 10,
      panelScrollable: true
    },
    pages: [
      { id: 'overhead', label: 'Overhead (OH)', navLabel: 'OH', href: 'overhead.html' },
      { id: 'avnenv', label: 'Avionics + Env (AVN/ENV)', navLabel: 'AVN/ENV', href: 'avionics.html' }
    ]
  };
})();
