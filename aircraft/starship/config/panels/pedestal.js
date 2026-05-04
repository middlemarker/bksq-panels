window.SSP_PANELS = window.SSP_PANELS || {};
window.SSP_PANELS.pedestal = StarshipPanel({
  id: 'pedestal',
  layout: [
    /* ROW 1: electrical gauges + volt select. The first two gauges are
     * `wide-2`, so the row only has 6 slots. */
    'elec_battAmpGauge', 'elec_voltsDcGauge', 'elec_rLoadGauge', 'elec_voltModeGauge', 'elec_voltDec', 'elec_voltInc',
    /* ROW 2: left engine column + primary elec */
    'eng_autoIgnL', 'eng_autoIgnR', 'elec_batt', 'elec_genL', 'elec_genR', 'elec_battAmps', 'elec_extPwr', 'elec_busTie',
    /* ROW 3: left prop cluster + pedestal avionics services */
    'prop_autoFeather', 'prop_sync', 'empty', 'pedst_stbyGyro', 'pedst_stbyIndPwr', 'pedst_gndComm', 'pedst_altnBlow', 'elec_gpuPed',
    /* ROW 4: fuel primary (shifted right) */
    'empty', 'prop_overspdGov', 'empty', 'fuel_qtyL', 'fuel_xfer', 'fuel_qtyR', 'empty', 'empty',
    /* ROW 5: start + fuel test/readout */
    'eng_starterL', 'eng_starterR', 'fuel_stbyPumpL', 'fuel_aftQtyL', 'fuel_temp', 'fuel_aftQtyR', 'fuel_stbyPumpR', 'empty',
    /* ROW 6: lower pedestal — trim + brake */
    'empty', 'empty', 'empty', 'trim_pitch', 'trim_roll', 'trim_rudder', 'trim_prkBrk', 'empty'
  ]
});
