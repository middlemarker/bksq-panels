window.SSP_PANELS = window.SSP_PANELS || {};
window.SSP_PANELS.overhead = StarshipPanel({
  id: 'overhead',
  layout: [
    /* ROW 1: overhead flood + area knobs (centered) */
    'empty', 'lts_instrIndir', 'lts_ckptArea', 'lts_stormFlood', 'lts_mapPlt', 'lts_mapCplt', 'empty', 'empty',
    /* ROW 2: display + panel brightness knobs (centered) */
    'empty', 'lts_pltDisp', 'lts_ctrDisp', 'lts_mainPanel', 'lts_console', 'lts_subpanel', 'lts_cpltDisp', 'empty',
    /* ROW 3: signs + cabin switches */
    'lts_master', 'lts_cabOvhd', 'lts_cabAisle', 'lts_bar', 'lts_noSmoke', 'lts_seatBelt', 'lts_entryCkpt', 'lts_door',
    /* ROW 4: external lights */
    'lts_ldgWing', 'lts_ldgNose', 'lts_taxi', 'lts_wing', 'lts_nav', 'lts_strobeLo', 'lts_antiColl', 'lts_strobeFx',
    /* ROW 5: ground safety (centered) */
    'gnd_chocks', 'gnd_pitotCovr', 'gnd_engCovr', 'gnd_gearPins', 'gnd_ctrlLock', 'gnd_hideYoke', 'empty', 'empty'
  ]
});
