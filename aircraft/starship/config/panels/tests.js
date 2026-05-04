window.SSP_PANELS = window.SSP_PANELS || {};
window.SSP_PANELS.tests = StarshipPanel({
  id: 'tests',
  title: 'Starship Tests',
  gridClass: 'grid tests-grid',
  layout: [
    'test_fireExtL', 'test_fireExtR', 'test_fireDetL', 'test_fireDetR',
    'test_flapMonL', 'test_flapMonR', 'test_auxBatt', 'test_battMon', 'test_press',
    'test_fuelLo', 'test_stallWarn', 'test_vmoMmo', 'test_ldgGr', 'test_annun',
    'test_bleedAir', 'test_deiceVac', 'test_deiceStby', 'test_deiceMain',
    'empty', 'empty', 'empty', 'test_pneuPsi', 'empty', 'empty', 'empty'
  ]
});
