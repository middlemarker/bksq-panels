window.SSP_PANELS = window.SSP_PANELS || {};
window.SSP_PANELS.antiice = StarshipPanel({
  id: 'antiice',
  gridClass: 'grid ice-grid',
  /* The `ice-grid` CSS positions each button by its `p-*` class, not by
   * source order, so this list is just the set of cells to render. */
  layout: [
    'ice_stallWarn', 'ice_pitotL', 'ice_pitotR',
    'ice_wsL', 'ice_wsR', 'ice_wsMod',
    'ice_gndIceDet', 'ice_antiskid',
    'ice_inertSepActL', 'ice_inertSepActR',
    'ice_ventL', 'ice_ventR',
    'ice_inertSepMainL', 'ice_inertSepMainR',
    'ice_fwdWingDeice', 'ice_mainWingDeice'
  ]
});
