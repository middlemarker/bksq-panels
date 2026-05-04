window.SSP_PANELS = window.SSP_PANELS || {};
window.SSP_PANELS.ecs = StarshipPanel({
  id: 'ecs',
  layout: [
    /* ROW 1: BLEED / MODE */
    'ecs_bleedGauge', 'ecs_blwrGauge', 'ecs_bleedDec', 'ecs_bleedInc', 'ecs_bleed', 'ecs_staticSrc', 'ecs_tempMode', 'ecs_cockCab',
    /* ROW 2: TEMP + BLOWER */
    'ecs_ckptTmpGauge', 'ecs_ckptDec', 'ecs_ckptInc', 'ecs_cabTmpGauge', 'ecs_cabDec', 'ecs_cabInc', 'ecs_blwrDec', 'ecs_blwrInc',
    /* ROW 3: MAN/AUTO TEMP + UNITS */
    'ecs_manTmpGauge', 'ecs_manDec', 'ecs_manInc', 'ecs_setpointGauge', 'ecs_cabVentGauge', 'ecs_tempUnit', 'empty', 'empty',
    /* ROW 4: pressurization controls */
    'ecs_cabAltDec', 'ecs_cabAltInc', 'ecs_cabAltDecFast', 'ecs_cabAltIncFast', 'ecs_rateDec', 'ecs_rateInc', 'ecs_dumpDec', 'ecs_dumpInc',
    /* ROW 5: press gauges + air dist */
    'ecs_pressGoalGauge', 'ecs_cabAltGauge', 'ecs_cabinGauge', 'ecs_pltAirDec', 'ecs_pltAirInc', 'ecs_cpltAirDec', 'ecs_cpltAirInc', 'ecs_pneuPsiGauge',
    /* ROW 6: defrost + oxygen */
    'ecs_defrostDec', 'ecs_defrostInc', 'empty', 'ecs_oxySys', 'ecs_oxyPlt', 'ecs_oxyCplt', 'ecs_oxyPax', 'ecs_oxyPsiGauge'
  ]
});
