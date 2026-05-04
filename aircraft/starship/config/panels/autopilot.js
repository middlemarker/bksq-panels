window.SSP_PANELS = window.SSP_PANELS || {};
window.SSP_PANELS.autopilot = StarshipPanel({
  id: 'autopilot',
  layout: [
    /* ROW 1: FIRE (L side, then R side) */
    'empty', 'empty', 'avncs_fireWallL', 'avncs_extingL', 'avncs_extingR', 'avncs_fireWallR', 'empty', 'empty',
    /* ROW 2: AP remaining */
    'avncs_fd', 'avncs_halfBank', 'avncs_desc', 'avncs_ias', 'avncs_iasProf', 'avncs_xfer', 'avncs_turb', 'avncs_cws',
    'avncs_ga', 'avncs_oatMode', 'avncs_bankDec', 'avncs_bankInc',
    /* ROW 3: XPDR */
    'avncs_xpdrSrc', 'avncs_xpdrPwr', 'avncs_xpdrMode', 'avncs_xpdrIdent',
    /* ROW 4: chrono + radio */
    'avncs_chrStSp', 'avncs_chrZero', 'avncs_chrSelL', 'avncs_chrSelR', 'avncs_mkrSound', 'avncs_dmeDec', 'avncs_dmeInc', 'empty',
    /* ROW 5: EICAS / CAS */
    'empty', 'empty', 'avncs_eicasOil', 'avncs_casUp', 'avncs_casDn', 'avncs_rtu833', 'empty', 'empty'
  ]
});
