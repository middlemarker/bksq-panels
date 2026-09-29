(function () {
  window.BKSQ_AIRCRAFT = {
    id: 'starship',
    title: 'Starship',
    eventGroup: 'bksq-starship-panel',
    storageKey: 'bksq-starship-ui-settings-v1',
    defaults: {
      pollIntervalMs: 100,
      panelBtnFontPx: 18,
      panelGridRowMinPx: 105,
      panelGridGapPx: 14,
      panelGridGapXPx: 10,
      panelScrollable: false
    },
    pages: [
      { id: 'overhead', label: 'Overhead (OH)', navLabel: 'OH', href: 'overhead.html' },
      { id: 'ecs', label: 'ECS', navLabel: 'ECS', href: 'ecs.html' },
      { id: 'antiice', label: 'Anti-ice (ICE)', navLabel: 'ICE', href: 'antiice.html' },
      { id: 'autopilot', label: 'Avionics (AVNCS)', navLabel: 'AVNCS', href: 'autopilot.html' },
      { id: 'mfd', label: 'MFD', navLabel: 'MFD', href: 'mfd.html' },
      { id: 'misc', label: 'Misc (Msc)', navLabel: 'Msc', href: 'misc.html' },
      { id: 'pedestal', label: 'Pedestal (Ped)', navLabel: 'Ped', href: 'pedestal.html' },
      { id: 'tests', label: 'Tests', navLabel: 'Tests', href: 'tests.html' }
    ]
  };
})();
