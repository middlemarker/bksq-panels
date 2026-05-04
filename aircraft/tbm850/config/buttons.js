/**
 * TBM850 buttons — same category prefixes as Starship for shared mental model:
 *   lts_   lighting / panel lights tests
 *   avncs_ EFIS, TAWS, WX, AP trims, DH, transponder
 *   elec_  power source & generator
 *   fuel_  fuel sel / aux / shift
 *   ecs_   air, bleed, cabin temp (environment)
 *   oxy_   oxygen
 *   misc_  horn etc.
 */
(function () {
  var H = window.SSPPanelHelpers;
  var esc = H.esc;
  var placeholder = H.placeholder;

  function actionButton(cls, label, js, id, ind) {
    return H.button(cls, label, js, id, ind);
  }

  function sspButton(cls, label, ssp, id, ind) {
    return H.sendButton(cls, label, ssp, { id: id, ind: ind, sender: 'sendTbmP' });
  }

  function dual(cls, hdr, js, id, rows) {
    return H.dual(cls, hdr, js, id, rows);
  }

  window.TBM_BUTTONS = {
    empty: { html: placeholder('-') },

    avncs_gyro: {
      html: sspButton('g-instr', 'GYRO', 'SSP_TBM_OH_GYRO_TOGGLE', 'gyroBtn', 'gyroInd'),
      polls: [{ kind: 'toggleA', btnId: 'gyroBtn', indId: 'gyroInd', expr: 'CIRCUIT SWITCH ON:57, Bool' }]
    },
    avncs_rmi: {
      html: sspButton('g-instr', 'RMI', 'SSP_TBM_OH_RMI_TOGGLE', 'rmiBtn', 'rmiInd'),
      polls: [{ kind: 'toggleA', btnId: 'rmiBtn', indId: 'rmiInd', expr: 'CIRCUIT SWITCH ON:58, Bool' }]
    },
    avncs_adi2: {
      html: sspButton('g-instr', 'ADI 2', 'SSP_TBM_OH_ADI2_TOGGLE', 'adi2Btn', 'adi2Ind'),
      polls: [{ kind: 'toggleA', btnId: 'adi2Btn', indId: 'adi2Ind', expr: 'CIRCUIT SWITCH ON:59, Bool' }]
    },
    avncs_hsi2: {
      html: sspButton('g-instr', 'HSI 2', 'SSP_TBM_OH_HSI2_TOGGLE', 'hsi2Btn', 'hsi2Ind'),
      polls: [{ kind: 'toggleA', btnId: 'hsi2Btn', indId: 'hsi2Ind', expr: 'CIRCUIT SWITCH ON:60, Bool' }]
    },
    elec_genRstMain: { html: sspButton('g-gen', 'GEN RST MAIN', 'SSP_TBM_OH_GEN_RESET_MAIN') },
    elec_genRstStby: { html: sspButton('g-gen', 'GEN RST STDBY', 'SSP_TBM_OH_GEN_RESET_STDBY') },
    elec_source: { html: dual('g-power', 'SOURCE', 'TBM.toggleSourceSwitch()', 'srcSwitchToggle', [['GPU', 'srcGpuLamp'], ['BAT', 'srcBatLamp'], ['OFF', 'srcOffLamp']]) },
    elec_generator: { html: dual('g-power', 'GENERATOR', 'TBM.toggleGenSwitch()', 'genSwitchToggle', [['STDBY', 'genStbyLamp'], ['MAIN', 'genMainLamp'], ['OFF', 'genOffLamp']]) },
    lts_test: { html: actionButton('g-lts', 'LTS TST', 'TBM.lightsTest()', 'ltsBtn', 'ltsInd') },
    lts_deiceLtTest: { html: sspButton('g-lts', 'DE-ICE LT TST', 'SSP_TBM_OH_DEICE_LT_TEST') },
    lts_gearChkDown: { html: sspButton('g-lts', 'GEAR CHK DN', 'SSP_TBM_OH_GEAR_DOWN_CHK') },
    lts_gearLtTest: { html: sspButton('g-lts', 'GEAR LT TST', 'SSP_TBM_OH_GEAR_LT_TEST') },
    lts_ittTest: { html: sspButton('g-lts', 'ITT TST', 'SSP_TBM_OH_ITT_TEST') },
    lts_ecsLtTest: { html: sspButton('g-lts', 'ECS LT TEST', 'SSP_TBM_OH_ECS_LT_TEST') },
    lts_annLt1: { html: sspButton('g-lts', 'ANN LT 1', 'SSP_TBM_OH_ANN_TEST_1') },
    lts_annLt2: { html: sspButton('g-lts', 'ANN LT 2', 'SSP_TBM_OH_ANN_TEST_2') },

    avncs_efisPtrR: { html: sspButton('g-efis', 'EFIS &rarr;', 'SSP_TBM_AVN_EFIS_PTR_R') },
    avncs_efisPtrL: { html: sspButton('g-efis', 'EFIS &larr;', 'SSP_TBM_AVN_EFIS_PTR_L') },
    avncs_efisComposite: { html: sspButton('g-efis', 'EFIS CMPST', 'SSP_TBM_AVN_EFIS_COMPOSITE') },
    avncs_annBright: { html: sspButton('g-ann', 'ANN LT LVL', 'SSP_TBM_AVN_ANN_BRIGHT') },
    fuel_shift: { html: sspButton('g-fuel', 'FUEL SHIFT', 'SSP_TBM_AVN_FUEL_SHIFT') },
    fuel_sel: { html: dual('g-fuel', 'FUEL SEL', 'TBM.toggleFuelSel()', 'fuelSelToggle', [['AUTO', 'fuelSelAutoLamp'], ['MAN', 'fuelSelManLamp']]) },
    fuel_auxBp: { html: dual('g-fuel', 'AUX BP', 'TBM.toggleAuxBp()', 'auxBpToggle', [['AUTO', 'auxAutoLamp'], ['ON', 'auxOnLamp'], ['OFF', 'auxOffLamp']]) },
    oxy_pilotMask: { html: sspButton('g-oxy', 'PILOT MASK', 'SSP_TBM_AVN_PILOT_MASK') },
    avncs_dhDec: { html: sspButton('g-efis', 'DH &minus;', 'SSP_TBM_AVN_DH_DEC') },
    avncs_dhInc: { html: sspButton('g-efis', 'DH +', 'SSP_TBM_AVN_DH_INC') },
    avncs_dhMode: { html: dual('g-efis', 'DH MODE', 'TBM.cycleDhMode()', 'dhModeBtn', [['TEST', 'dhTestLamp'], ['NORM', 'dhNormLamp'], ['DH SET', 'dhSetLamp']]) },
    avncs_tawsTest: { html: sspButton('g-taws', 'TAWS TEST', 'SSP_TBM_AVN_TAWS_TEST', 'tawsTestBtn', 'tawsTestInd') },
    avncs_tawsInhb: {
      html: sspButton('g-taws', 'TERR INHB', 'SSP_TBM_AVN_TAWS_TERR_INHB_TOGGLE', 'tawsInhbBtn', 'tawsInhbInd'),
      polls: [{ kind: 'toggle', btnId: 'tawsInhbBtn', indId: 'tawsInhbInd', lvar: 'var_TerrainInhibited', lvarType: 'Bool' }]
    },
    avncs_tawsAnn: { html: sspButton('g-taws', 'TAWS ANN LT', 'SSP_TBM_AVN_TAWS_ANN_LT', 'tawsAnnBtn', 'tawsAnnInd') },
    avncs_apTrims: { html: dual('g-instr', 'AP TRIMS', 'TBM.cycleApTrims()', 'apTrimsToggle', [['ON', 'apOnLamp'], ['AP OFF', 'apOffLamp'], ['OFF', 'apNoneLamp']]) },
    avncs_wxrMode: { html: '<button type="button" class="btn g-wxr dual" id="wxrModeBtn" onclick="TBM.cycleWxrMode()" data-fixed-label="1"><div class="hdr">WXR MODE</div><div class="row"><span>MODE</span><span id="wxrModeVal">OFF</span></div></button>' },
    avncs_wxrRngDec: { html: sspButton('g-wxr', 'WXR RNG &minus;', 'SSP_TBM_AVN_WXR_RNG_DEC') },
    avncs_wxrRngInc: { html: sspButton('g-wxr', 'WXR RNG +', 'SSP_TBM_AVN_WXR_RNG_INC') },
    avncs_xpdrMode: { html: dual('g-xpdr', 'XPDR MODE', 'TBM.toggleXpdrMode()', 'xpdrModeToggle', [['ALT', 'xpdrAltLamp'], ['STDBY', 'xpdrStbyLamp']]) },
    avncs_xpdrIdent: { html: actionButton('g-xpdr', 'XPDR IDENT', 'TBM.xpdrIdent()', 'xpdrIdentBtn', 'xpdrIdentInd') },
    avncs_xpdrPwr: { html: actionButton('g-xpdr', 'XPDR PWR', 'TBM.toggleXpdrPwr()', 'xpdrPwrToggle', 'xpdrPwrInd') },

    ecs_airCond: { html: dual('g-env', 'AIR COND', 'TBM.toggleAirCond()', 'airCondToggle', [['ON', 'acOnLamp'], ['FAN', 'acFanLamp'], ['OFF', 'acOffLamp']]) },
    ecs_fanFlow: { html: dual('g-env', 'FAN FLOW', 'TBM.toggleFanFlow()', 'fanFlowToggle', [['AUTO', 'fanAutoLamp'], ['LO', 'fanLoLamp']]) },
    ecs_bleed: { html: dual('g-env', 'BLEED', 'TBM.toggleBleed()', 'bleedToggle', [['HI', 'bleedHiLamp'], ['AUTO', 'bleedAutoLamp']]) },
    oxy_pax: {
      html: sspButton('g-oxy', 'PAX OXY', 'SSP_TBM_ENV_PAX_OXY_TOGGLE', 'paxOxyToggle', 'paxOxyInd'),
      polls: [{ kind: 'toggle', btnId: 'paxOxyToggle', indId: 'paxOxyInd', lvar: 'var_passengerOxygen', lvarType: 'Bool' }]
    },
    oxy_master: {
      html: sspButton('g-oxy', 'OXY', 'SSP_TBM_ENV_OXY_MASTER_TOGGLE', 'oxyToggle', 'oxyInd'),
      polls: [{ kind: 'toggle', btnId: 'oxyToggle', indId: 'oxyInd', lvar: 'var_oxygenMaster', lvarType: 'Bool' }]
    },
    ecs_cabinTempDec: { html: sspButton('g-env', 'CABIN TEMP &minus;', 'SSP_TBM_ENV_CABIN_TEMP_DEC') },
    ecs_cabinTempInc: { html: sspButton('g-env', 'CABIN TEMP +', 'SSP_TBM_ENV_CABIN_TEMP_INC') },
    lts_panelDec: { html: sspButton('g-lts', 'PANEL LT &minus;', 'SSP_TBM_ENV_PANEL_LT_DEC') },
    lts_panelInc: { html: sspButton('g-lts', 'PANEL LT +', 'SSP_TBM_ENV_PANEL_LT_INC') },
    misc_hornTest: { html: sspButton('g-horn', 'HORN TEST', 'SSP_TBM_ENV_HORN_TEST') }
  };

  window.TBMPanel = window.SSP_PANEL_FACTORY(window.TBM_BUTTONS, { gridClass: 'grid' });
})();
