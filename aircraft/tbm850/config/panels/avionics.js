window.SSP_PANELS.avionics = TBMPanel({
  pollIntervalMs: 50,
  gridClass: 'grid',
  layout: [
    'avncs_efisPtrR', 'avncs_efisPtrL', 'avncs_efisComposite', 'avncs_annBright', 'fuel_shift', 'fuel_sel', 'fuel_auxBp', 'empty',
    'avncs_dhDec', 'avncs_dhInc', 'avncs_dhMode', 'empty', 'empty', 'empty', 'empty', 'empty',
    'ecs_airCond', 'ecs_fanFlow', 'ecs_bleed', 'empty', 'avncs_tawsTest', 'avncs_tawsInhb', 'avncs_tawsAnn', 'empty',
    'avncs_apTrims', 'avncs_wxrMode', 'avncs_wxrRngDec', 'avncs_wxrRngInc', 'empty', 'ecs_cabinTempDec', 'ecs_cabinTempInc', 'empty',
    'lts_panelDec', 'lts_panelInc', 'empty', 'empty', 'avncs_xpdrPwr', 'avncs_xpdrMode', 'avncs_xpdrIdent', 'empty'
  ]
});
