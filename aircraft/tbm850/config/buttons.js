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
    avncs_xpdrFunc: { html: sspButton('g-xpdr', 'XPDR FUNC', 'SSP_TBM_AVN_XPDR_FUNC') },
    avncs_xpdrStartStop: { html: sspButton('g-xpdr', 'XPDR ST/SP', 'SSP_TBM_AVN_XPDR_STARTSTOP') },
    avncs_xpdrClr: { html: sspButton('g-xpdr', 'XPDR CLR', 'SSP_TBM_AVN_XPDR_CLR') },

    misc_efb: {
      html: sspButton('g-misc', 'EFB<br>SHOW / HIDE', 'SSP_TBM_MISC_TABLET_TOGGLE', 'tabletBtn', 'tabletInd'),
      polls: [{ kind: 'toggle', btnId: 'tabletBtn', indId: 'tabletInd', lvar: 'bksq_TabletVisible', lvarType: 'Bool' }]
    },
    misc_efbTiltUp: { html: sspButton('g-misc', 'EFB TILT<br>&uarr; UP', 'SSP_TBM_MISC_TABLET_UP') },
    misc_efbSavePos: { html: sspButton('g-misc', 'EFB DEFAULT<br>POSITION', 'SSP_TBM_MISC_TABLET_SAVE') },
    misc_efbTiltLeft: { html: sspButton('g-misc', 'EFB TILT<br>&larr; LEFT', 'SSP_TBM_MISC_TABLET_LEFT') },
    misc_efbTiltDown: { html: sspButton('g-misc', 'EFB TILT<br>&darr; DOWN', 'SSP_TBM_MISC_TABLET_DOWN') },
    misc_efbTiltRight: { html: sspButton('g-misc', 'EFB TILT<br>RIGHT &rarr;', 'SSP_TBM_MISC_TABLET_RIGHT') },

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
    misc_hornTest: { html: sspButton('g-horn', 'HORN TEST', 'SSP_TBM_ENV_HORN_TEST') },

    /* ================================================================ *
     * UNUSED - not placed on any config/panels/*.js layout yet.        *
     * To enable one, copy its key (e.g. 'ice_pitot1') into the layout  *
     * array of an existing page (overhead.js / avionics.js) or a new   *
     * page, then refresh the panel in the browser.                     *
     * Each entry notes the page it is intended for.                    *
     * Sim bindings verified against ref/AnalogTBM.xml.                 *
     * ================================================================ */

    /* ---- Anti-Ice (future antiice.html / panels/antiice.js) ---- */
    ice_pitot1: {
      html: sspButton('g-env', 'PITOT 1', 'SSP_TBM_ICE_PITOT1_TOGGLE', 'pitot1Btn', 'pitot1Ind'),
      polls: [{ kind: 'toggleA', btnId: 'pitot1Btn', indId: 'pitot1Ind', expr: 'CIRCUIT SWITCH ON:13, Bool' }]
    },
    ice_pitot2: {
      html: sspButton('g-env', 'PITOT 2', 'SSP_TBM_ICE_PITOT2_TOGGLE', 'pitot2Btn', 'pitot2Ind'),
      polls: [{ kind: 'toggleA', btnId: 'pitot2Btn', indId: 'pitot2Ind', expr: 'CIRCUIT SWITCH ON:14, Bool' }]
    },
    ice_inertSep: {
      html: sspButton('g-env', 'INERT SEP', 'SSP_TBM_ICE_INERT_SEP_TOGGLE', 'inertSepBtn', 'inertSepInd'),
      polls: [{ kind: 'toggle', btnId: 'inertSepBtn', indId: 'inertSepInd', lvar: 'var_InertialSeparatorSwitch', lvarType: 'Bool' }]
    },
    ice_propDeice: {
      html: sspButton('g-env', 'PROP DEICE', 'SSP_TBM_ICE_PROP_DEICE_TOGGLE', 'propDeiceBtn', 'propDeiceInd'),
      polls: [{ kind: 'toggleA', btnId: 'propDeiceBtn', indId: 'propDeiceInd', expr: 'CIRCUIT SWITCH ON:24, Bool' }]
    },
    ice_airframeDeice: {
      html: sspButton('g-env', 'AF DEICE', 'SSP_TBM_ICE_AIRFRAME_DEICE_TOGGLE', 'afDeiceBtn', 'afDeiceInd'),
      polls: [{ kind: 'toggle', btnId: 'afDeiceBtn', indId: 'afDeiceInd', lvar: 'var_airframeDeice', lvarType: 'Bool' }]
    },
    ice_wsL: {
      html: sspButton('g-env', 'WS HEAT L', 'SSP_TBM_ICE_WS_L_TOGGLE', 'wsLBtn', 'wsLInd'),
      polls: [{ kind: 'toggle', btnId: 'wsLBtn', indId: 'wsLInd', lvar: 'var_windshieldHeatSwitch_L', lvarType: 'Bool' }]
    },
    ice_wsR: {
      html: sspButton('g-env', 'WS HEAT R', 'SSP_TBM_ICE_WS_R_TOGGLE', 'wsRBtn', 'wsRInd'),
      polls: [{ kind: 'toggle', btnId: 'wsRBtn', indId: 'wsRInd', lvar: 'var_windshieldHeatSwitch_R', lvarType: 'Bool' }]
    },

    /* ---- Pedestal (future pedestal.html / panels/pedestal.js) ---- */
    eng_starter: {
      html: sspButton('g-power', 'STARTER', 'SSP_TBM_PED_STARTER_TOGGLE', 'starterBtn', 'starterInd'),
      polls: [{ kind: 'toggle', btnId: 'starterBtn', indId: 'starterInd', lvar: 'BKSQ_StarterSwitch', lvarType: 'Bool' }]
    },
    eng_ignition: {
      html: sspButton('g-power', 'IGNITION', 'SSP_TBM_PED_IGNITION_TOGGLE', 'ignitionBtn', 'ignitionInd'),
      polls: [{ kind: 'toggle', btnId: 'ignitionBtn', indId: 'ignitionInd', lvar: 'BKSQ_IgnitionSwitch', lvarType: 'Number' }]
    },
    eng_condLever: { html: sspButton('g-power', 'COND LEVER', 'SSP_TBM_PED_COND_LEVER_CYCLE') },
    eng_emerPwrUp: { html: sspButton('g-power', 'EMER PWR +', 'SSP_TBM_PED_EMER_PWR_INC') },
    eng_emerPwrDn: { html: sspButton('g-power', 'EMER PWR &minus;', 'SSP_TBM_PED_EMER_PWR_DEC') },
    trim_parkBrake: {
      html: sspButton('g-instr', 'PARK BRAKE', 'SSP_TBM_PED_PARK_BRAKE_TOGGLE', 'parkBrakeBtn', 'parkBrakeInd'),
      polls: [{ kind: 'toggleA', btnId: 'parkBrakeBtn', indId: 'parkBrakeInd', expr: 'BRAKE PARKING POSITION, Bool' }]
    },
    elec_emerGear: {
      html: sspButton('g-power', 'EMER GEAR', 'SSP_TBM_PED_EMER_GEAR_DOOR_TOGGLE', 'emerGearBtn', 'emerGearInd'),
      polls: [{ kind: 'toggle', btnId: 'emerGearBtn', indId: 'emerGearInd', lvar: 'var_EmergencyGearDoor', lvarType: 'Bool' }]
    },

    /* ---- Weather Radar extended (avionics page) ---- */
    avncs_wxrAlert: { html: sspButton('g-wxr', 'WXR ALERT', 'SSP_TBM_AVN_WXR_ALERT') },
    avncs_wxrProfile: { html: sspButton('g-wxr', 'WXR PROF', 'SSP_TBM_AVN_WXR_PROFILE') },
    avncs_wxrMap: { html: sspButton('g-wxr', 'WXR MAP', 'SSP_TBM_AVN_WXR_MAP') },
    avncs_wxrHold: { html: sspButton('g-wxr', 'WXR HOLD', 'SSP_TBM_AVN_WXR_HOLD') },
    avncs_wxrTrackL: { html: sspButton('g-wxr', 'WXR TRK &larr;', 'SSP_TBM_AVN_WXR_TRACK_L') },
    avncs_wxrTrackR: { html: sspButton('g-wxr', 'WXR TRK &rarr;', 'SSP_TBM_AVN_WXR_TRACK_R') },
    avncs_wxrModePush: { html: sspButton('g-wxr', 'WXR MODE PSH', 'SSP_TBM_AVN_WXR_MODE_PUSH') },
    avncs_wxrTiltUp: { html: sspButton('g-wxr', 'WXR TILT +', 'SSP_TBM_AVN_WXR_TILT_INC') },
    avncs_wxrTiltDn: { html: sspButton('g-wxr', 'WXR TILT &minus;', 'SSP_TBM_AVN_WXR_TILT_DEC') },
    avncs_wxrBriUp: { html: sspButton('g-wxr', 'WXR BRI +', 'SSP_TBM_AVN_WXR_BRI_INC') },
    avncs_wxrBriDn: { html: sspButton('g-wxr', 'WXR BRI &minus;', 'SSP_TBM_AVN_WXR_BRI_DEC') },
    avncs_wxrGainUp: { html: sspButton('g-wxr', 'WXR GAIN +', 'SSP_TBM_AVN_WXR_GAIN_INC') },
    avncs_wxrGainDn: { html: sspButton('g-wxr', 'WXR GAIN &minus;', 'SSP_TBM_AVN_WXR_GAIN_DEC') },

    /* ---- Oxygen detail (overhead page) ---- */
    oxy_copilotMask: {
      html: sspButton('g-oxy', 'COPLT MASK', 'SSP_TBM_OXY_COPILOT_MASK_TOGGLE', 'cpltMaskBtn', 'cpltMaskInd'),
      polls: [{ kind: 'toggle', btnId: 'cpltMaskBtn', indId: 'cpltMaskInd', lvar: 'var_coPilotOxygen', lvarType: 'Bool' }]
    },
    oxy_pilotO2: {
      html: sspButton('g-oxy', 'PILOT O2', 'SSP_TBM_OXY_PILOT_TOGGLE', 'pilotO2Btn', 'pilotO2Ind'),
      polls: [{ kind: 'toggle', btnId: 'pilotO2Btn', indId: 'pilotO2Ind', lvar: 'var_pilotOxygen', lvarType: 'Bool' }]
    },
    oxy_isolate: {
      html: sspButton('g-oxy', 'OXY ISO', 'SSP_TBM_OXY_ISOLATION_TOGGLE', 'oxyIsoBtn', 'oxyIsoInd'),
      polls: [{ kind: 'toggle', btnId: 'oxyIsoBtn', indId: 'oxyIsoInd', lvar: 'var_oxygenIsolationValve', lvarType: 'Bool' }]
    },

    /* ---- Doors / visors (overhead or future misc page) ---- */
    misc_pilotDoor: { html: sspButton('g-instr', 'PLT DOOR', 'SSP_TBM_DOOR_PILOT_CYCLE') },
    misc_aftDoor: { html: sspButton('g-instr', 'AFT DOOR', 'SSP_TBM_DOOR_AFT_CYCLE') },
    misc_pilotLadder: {
      html: sspButton('g-instr', 'PLT LADDER', 'SSP_TBM_DOOR_PILOT_LADDER_TOGGLE', 'pltLadderBtn', 'pltLadderInd'),
      polls: [{ kind: 'toggle', btnId: 'pltLadderBtn', indId: 'pltLadderInd', lvar: 'var_PilotLadder', lvarType: 'Bool' }]
    },
    misc_aftLadder: {
      html: sspButton('g-instr', 'AFT LADDER', 'SSP_TBM_DOOR_AFT_LADDER_TOGGLE', 'aftLadderBtn', 'aftLadderInd'),
      polls: [{ kind: 'toggle', btnId: 'aftLadderBtn', indId: 'aftLadderInd', lvar: 'var_AftLadder', lvarType: 'Bool' }]
    },
    misc_visorLUp: { html: sspButton('g-instr', 'VISOR L +', 'SSP_TBM_DOOR_VISOR_L_INC') },
    misc_visorLDn: { html: sspButton('g-instr', 'VISOR L &minus;', 'SSP_TBM_DOOR_VISOR_L_DEC') },
    misc_visorRUp: { html: sspButton('g-instr', 'VISOR R +', 'SSP_TBM_DOOR_VISOR_R_INC') },
    misc_visorRDn: { html: sspButton('g-instr', 'VISOR R &minus;', 'SSP_TBM_DOOR_VISOR_R_DEC') },

    /* ---- Avionics extras (avionics page) ---- */
    avncs_eadiBriUp: { html: sspButton('g-instr', 'EADI BRI +', 'SSP_TBM_AVN_EADI_BRI_INC') },
    avncs_eadiBriDn: { html: sspButton('g-instr', 'EADI BRI &minus;', 'SSP_TBM_AVN_EADI_BRI_DEC') },
    avncs_ehsiBriUp: { html: sspButton('g-instr', 'EHSI BRI +', 'SSP_TBM_AVN_EHSI_BRI_INC') },
    avncs_ehsiBriDn: { html: sspButton('g-instr', 'EHSI BRI &minus;', 'SSP_TBM_AVN_EHSI_BRI_DEC') },
    avncs_radio1Mode: { html: sspButton('g-instr', 'RADIO 1 MODE', 'SSP_TBM_AVN_RADIO1_MODE_CYCLE') },
    avncs_radio2Mode: { html: sspButton('g-instr', 'RADIO 2 MODE', 'SSP_TBM_AVN_RADIO2_MODE_CYCLE') },
    avncs_pilotCws: { html: sspButton('g-instr', 'PILOT CWS', 'SSP_TBM_AVN_PILOT_CWS') },
    avncs_gearHornMute: { html: sspButton('g-horn', 'GEAR HORN MUTE', 'SSP_TBM_AVN_GEAR_HORN_MUTE') },
    avncs_altAlertAck: { html: sspButton('g-instr', 'ALT ALERT ACK', 'SSP_TBM_AVN_ALT_ALERT_ACK') },
    avncs_etmMode: { html: sspButton('g-instr', 'ETM MODE', 'SSP_TBM_AVN_ETM_MODE_CYCLE') }
  };

  window.TBMPanel = window.SSP_PANEL_FACTORY(window.TBM_BUTTONS, { gridClass: 'grid' });
})();
