/**
 * Starship button dictionary — grouped by system (XML-style sections):
 *   lts_   lighting / overhead dimmers & external lights
 *   gnd_   ground safety
 *   ice_   anti-ice / deice
 *   avncs_ avionics deck (AP, fire, xpdr, chrono, CAS, …)
 *   ecs_   environmental / bleed / press / oxygen on ECS page
 *   misc_  miscellaneous panel
 *   elec_  pedestal electrical (power, gens, GPU)
 *   eng_   engines (ignition, starters)
 *   prop_  propeller (autofeather, sync, governor)
 *   fuel_  fuel
 *   pedst_ pedestal avionics services (stby gyro, comm, blowers)
 *   trim_  trim & parking brake
 *   test_  test panel hold switches
 *
 * DOM element ids and SSP labels are unchanged; only layout tokens group by system.
 */
(function () {
  var H = window.SSPPanelHelpers;
  var placeholder = H.placeholder;
  var dual = H.dual;
  var gauge = H.gauge;

  function sspBtn(cls, label, sspLabel, id, ind) {
    return H.sendButton(cls, label, sspLabel, { id: id, ind: ind });
  }

  function actBtn(cls, label, js, id, ind) {
    return H.button(cls, label, js, id, ind);
  }

  function lampsPoll(lampIds, lvar, lvarType, map) {
    return { kind: 'lamps', lampIds: lampIds, lvar: lvar, lvarType: lvarType || 'Number', map: map };
  }

  function togglePoll(btnId, indId, lvar, lvarType, on) {
    return { kind: 'toggle', btnId: btnId, indId: indId, lvar: lvar, lvarType: lvarType || 'Bool', on: on === undefined ? 1 : on };
  }

  function toggleAPoll(btnId, indId, expr) {
    return { kind: 'toggleA', btnId: btnId, indId: indId, expr: expr };
  }

  /* Three-lamp dimmer / mode dual (overhead lighting). */
  function ltsLamp3(cls, hdr, ssp, lampIds, labels, lvar, mapName) {
    return {
      html: dual(cls, hdr, "sendP('" + ssp + "')", null, [
        [labels[0], lampIds[0]],
        [labels[1], lampIds[1]],
        [labels[2], lampIds[2]]
      ]),
      polls: [lampsPoll(lampIds, lvar, 'Number', mapName)]
    };
  }

  /* ---------------- definitions ---------------- */
  var BTNS = {
    empty: { html: placeholder('\u2014') },
    emptyMdash: { html: placeholder('\u2014') },

    /* OVERHEAD - row 1: light dimmers */
    lts_instrIndir: ltsLamp3('g-lts-int', 'INSTR INDIR', 'SSP_OH_DIMMER_INSTR_INDIR_CYCLE', ['instrOffL', 'instrLoL', 'instrHiL'], ['OFF', 'LOW', 'BRT'], 'var_InstrumentIndirectLightingKnob', 'ohDimmer'),
    lts_ckptArea: ltsLamp3('g-lts-int', 'CKPT AREA', 'SSP_OH_DIMMER_CKPT_AREA_CYCLE', ['areaOffL', 'areaLoL', 'areaHiL'], ['OFF', 'LOW', 'BRT'], 'var_CockpitAreaLightingKnob', 'ohDimmer'),
    lts_stormFlood: ltsLamp3('g-lts-int', 'STORM FLOOD', 'SSP_OH_LIGHTS_STORM_CYCLE', ['stormOffLamp', 'stormLoLamp', 'stormHiLamp'], ['OFF', 'LOW', 'HI'], 'var_CockpitStormLightsKnob', 'ohStorm'),
    lts_mapPlt: ltsLamp3('g-lts-int', 'MAP PILOT', 'SSP_OH_DIMMER_MAP_L_CYCLE', ['mapLOffL', 'mapLLoL', 'mapLHiL'], ['OFF', 'LOW', 'BRT'], 'var_MapLightKnob_L', 'ohDimmer'),
    lts_mapCplt: ltsLamp3('g-lts-int', 'MAP COPLT', 'SSP_OH_DIMMER_MAP_R_CYCLE', ['mapROffL', 'mapRLoL', 'mapRHiL'], ['OFF', 'LOW', 'BRT'], 'var_MapLightKnob_R', 'ohDimmer'),

    /* OVERHEAD - row 2: display + panel dimmers */
    lts_pltDisp: ltsLamp3('g-lts-disp', 'PLT DISP', 'SSP_OH_DIMMER_DISP_PILOT_CYCLE', ['pltDOffL', 'pltDLoL', 'pltDHiL'], ['DIM', 'MID', 'BRT'], 'var_PilotDisplaysKnob', 'ohDimmer'),
    lts_ctrDisp: ltsLamp3('g-lts-disp', 'CTR DISP', 'SSP_OH_DIMMER_DISP_CENTER_CYCLE', ['ctrDOffL', 'ctrDLoL', 'ctrDHiL'], ['DIM', 'MID', 'BRT'], 'var_CenterDisplaysKnob', 'ohDimmer'),
    lts_mainPanel: ltsLamp3('g-lts-panel', 'MAIN PANEL', 'SSP_OH_DIMMER_PANEL_MAIN_CYCLE', ['mainPOffL', 'mainPLoL', 'mainPHiL'], ['OFF', 'LOW', 'BRT'], 'var_MainPanelBacklightingKnob', 'ohDimmer'),
    lts_console: ltsLamp3('g-lts-panel', 'CONSOLE', 'SSP_OH_DIMMER_PANEL_CONSOLE_CYCLE', ['consOffL', 'consLoL', 'consHiL'], ['OFF', 'LOW', 'BRT'], 'var_ConsolePanelBacklightingKnob', 'ohDimmer'),
    lts_subpanel: ltsLamp3('g-lts-panel', 'SUBPANEL', 'SSP_OH_DIMMER_SUBPANEL_CYCLE', ['subOffL', 'subLoL', 'subHiL'], ['OFF', 'LOW', 'BRT'], 'var_SubpanelDisplayKnobs', 'ohDimmer'),
    lts_cpltDisp: ltsLamp3('g-lts-disp', 'CPLT DISP', 'SSP_OH_DIMMER_DISP_COPILOT_CYCLE', ['cpltDOffL', 'cpltDLoL', 'cpltDHiL'], ['DIM', 'MID', 'BRT'], 'var_CopilotDisplaysKnob', 'ohDimmer'),

    /* OVERHEAD - row 3: cabin & sign lights */
    lts_master: { html: sspBtn('g-lts-sign', 'LIGHTS MASTER', 'SSP_OH_LIGHTS_MASTER_TOGGLE', 'masterLtBtn', 'masterLtInd'), polls: [togglePoll('masterLtBtn', 'masterLtInd', 'var_MasterPanelLights')] },
    lts_cabOvhd: { html: sspBtn('g-lts-sign', 'CAB OHEAD', 'SSP_OH_LIGHTS_CAB_OVHD_TOGGLE', 'cabOvhdBtn', 'cabOvhdInd'), polls: [togglePoll('cabOvhdBtn', 'cabOvhdInd', 'var_CabinOverheadLighting')] },
    lts_cabAisle: { html: sspBtn('g-lts-sign', 'CAB AISLE', 'SSP_OH_LIGHTS_CAB_AISLE_TOGGLE', 'cabAisleBtn', 'cabAisleInd'), polls: [togglePoll('cabAisleBtn', 'cabAisleInd', 'var_CabinAisleLighting')] },
    lts_bar: { html: sspBtn('g-lts-sign', 'BAR', 'SSP_OH_LIGHTS_BAR_TOGGLE', 'barBtn', 'barInd'), polls: [togglePoll('barBtn', 'barInd', 'var_CabinBarLighting')] },
    lts_noSmoke: { html: sspBtn('g-lts-sign', 'NO SMOKE', 'SSP_OH_LIGHTS_NO_SMOKE_TOGGLE', 'noSmokeBtn', 'noSmokeInd'), polls: [togglePoll('noSmokeBtn', 'noSmokeInd', 'var_NoSmokingLights')] },
    lts_seatBelt: { html: sspBtn('g-lts-sign', 'SEAT BELTS', 'SSP_OH_LIGHTS_SEAT_BELTS_TOGGLE', 'seatBeltBtn', 'seatBeltInd'), polls: [togglePoll('seatBeltBtn', 'seatBeltInd', 'var_SeatBeltLights')] },
    lts_entryCkpt: { html: sspBtn('g-lts-entry', 'ENTRY CKPT', 'SSP_OH_LIGHTS_ENTRY_CKPT_TOGGLE', 'entryCkptBtn', 'entryCkptInd'), polls: [togglePoll('entryCkptBtn', 'entryCkptInd', 'var_CabinCockpitLighting')] },
    lts_door: { html: sspBtn('g-lts-entry', 'DOOR LT', 'SSP_OH_LIGHTS_DOOR_TOGGLE', 'doorLtBtn', 'doorLtInd'), polls: [togglePoll('doorLtBtn', 'doorLtInd', 'var_CabinDoorLight')] },

    /* OVERHEAD - row 4: external lights */
    lts_ldgWing: { html: sspBtn('g-lts-ext', 'LDG WING', 'SSP_OH_EXT_LDG_WING_TOGGLE', 'llWingBtn', 'llWingInd'), polls: [togglePoll('llWingBtn', 'llWingInd', 'LIGHTING_LANDING_1')] },
    lts_ldgNose: { html: sspBtn('g-lts-ext', 'LDG NOSE', 'SSP_OH_EXT_LDG_NOSE_TOGGLE', 'llNoseBtn', 'llNoseInd'), polls: [togglePoll('llNoseBtn', 'llNoseInd', 'LIGHTING_LANDING_3')] },
    lts_taxi: { html: sspBtn('g-lts-ext', 'TAXI', 'SSP_OH_EXT_TAXI_TOGGLE', 'taxiBtn', 'taxiInd'), polls: [toggleAPoll('taxiBtn', 'taxiInd', 'LIGHT TAXI, Bool')] },
    lts_wing: { html: sspBtn('g-lts-ext', 'WING', 'SSP_OH_EXT_WING_TOGGLE', 'wingBtn', 'wingInd'), polls: [togglePoll('wingBtn', 'wingInd', 'LIGHTING_WING_1')] },
    lts_nav: { html: sspBtn('g-lts-ext', 'NAV', 'SSP_OH_EXT_NAV_TOGGLE', 'navBtn', 'navInd'), polls: [toggleAPoll('navBtn', 'navInd', 'LIGHT NAV, Bool')] },
    lts_strobeLo: { html: sspBtn('g-lts-ext', 'STROBE LOW', 'SSP_OH_EXT_STROBE_LOW_TOGGLE', 'strobeLoBtn', 'strobeLoInd'), polls: [togglePoll('strobeLoBtn', 'strobeLoInd', 'var_StrobeLight_Low')] },
    lts_antiColl: { html: sspBtn('g-lts-ext', 'ANTI-COLL', 'SSP_OH_EXT_ANTI_COLL_TOGGLE', 'strobeHiBtn', 'strobeHiInd'), polls: [togglePoll('strobeHiBtn', 'strobeHiInd', 'var_StrobeLight_High')] },
    lts_strobeFx: { html: sspBtn('g-lts-ext', 'STROBE FX', 'SSP_OH_EXT_STROBE_EFFECT_TOGGLE', 'strobeEffBtn', 'strobeEffInd'), polls: [togglePoll('strobeEffBtn', 'strobeEffInd', 'BKSQ_NewStrobeEffect')] },

    /* OVERHEAD - row 5: ground safety */
    gnd_chocks: { html: sspBtn('g-ground', 'CHOCKS', 'SSP_OH_GND_CHOCKS_TOGGLE', 'chocksBtn', 'chocksInd'), polls: [togglePoll('chocksBtn', 'chocksInd', 'bksq_WheelChocks')] },
    gnd_pitotCovr: { html: sspBtn('g-ground', 'PITOT COVR', 'SSP_OH_GND_PITOT_COVERS_TOGGLE', 'pitotCovBtn', 'pitotCovInd'), polls: [togglePoll('pitotCovBtn', 'pitotCovInd', 'bksq_PitotCovers')] },
    gnd_engCovr: { html: sspBtn('g-ground', 'ENG COVR', 'SSP_OH_GND_ENGINE_COVERS_TOGGLE', 'engCovBtn', 'engCovInd'), polls: [togglePoll('engCovBtn', 'engCovInd', 'bksq_EngineCovers')] },
    gnd_gearPins: { html: sspBtn('g-ground', 'GEAR PINS', 'SSP_OH_GND_GEAR_PINS_TOGGLE', 'downPinsBtn', 'downPinsInd'), polls: [togglePoll('downPinsBtn', 'downPinsInd', 'bksq_DownlockPins')] },
    gnd_ctrlLock: { html: sspBtn('g-ground', 'CTRL LOCK', 'SSP_OH_GND_CTRL_LOCK_TOGGLE', 'ctrlLockBtn', 'ctrlLockInd'), polls: [togglePoll('ctrlLockBtn', 'ctrlLockInd', 'bksq_controlLocks')] },
    gnd_hideYoke: {
      html: sspBtn('g-ground', 'HIDE YOKE', 'SSP_OH_GND_HIDE_YOKE_TOGGLE', 'yokeHideBtn', 'yokeHideInd'),
      polls: [{
        kind: 'toggleOr', combine: 'or', btnId: 'yokeHideBtn', indId: 'yokeHideInd',
        checks: [
          { lvar: 'XMLVAR_YokeHidden1', lvarType: 'Bool', on: 1 },
          { lvar: 'XMLVAR_YokeHidden2', lvarType: 'Bool', on: 1 }
        ]
      }]
    },

    /* ---------------- ANTI-ICE ---------------- */
    ice_stallWarn: { html: sspBtn('g-aice grp-protect p-stall', 'STALL WARN', 'SSP_ICE_STALL_WARN_TOGGLE', 'stallBtn', 'stallInd'), polls: [togglePoll('stallBtn', 'stallInd', 'var_StallWarningHeatSwitch', 'Number')] },
    ice_pitotL: { html: sspBtn('g-aice grp-protect p-pitotl', 'PITOT/STAT PILOT', 'SSP_ICE_PITOT_L_TOGGLE', 'pitotLBtn', 'pitotLInd'), polls: [togglePoll('pitotLBtn', 'pitotLInd', 'var_PitotHeatSwitch_L')] },
    ice_pitotR: { html: sspBtn('g-aice grp-protect p-pitotr', 'PITOT/STAT COPLT', 'SSP_ICE_PITOT_R_TOGGLE', 'pitotRBtn', 'pitotRInd'), polls: [togglePoll('pitotRBtn', 'pitotRInd', 'var_PitotHeatSwitch_R')] },
    ice_wsL: {
      html: dual('g-aice grp-wshield p-wsl', 'WINDSHIELD PILOT', "sendP('SSP_ICE_WS_L_TOGGLE')", null, [
        ['OFF', 'wsLOffLamp'], ['LOW', 'wsLLoLamp'], ['HIGH', 'wsLHiLamp']
      ]),
      polls: [lampsPoll(['wsLOffLamp', 'wsLLoLamp', 'wsLHiLamp'], 'var_WindshieldAntiIceSwitch_L', 'Number', 'iceWsL')]
    },
    ice_wsR: {
      html: dual('g-aice grp-wshield p-wsr', 'WINDSHIELD COPLT', "sendP('SSP_ICE_WS_R_TOGGLE')", null, [
        ['OFF', 'wsROffLamp'], ['LOW', 'wsRLoLamp'], ['HIGH', 'wsRHiLamp']
      ]),
      polls: [lampsPoll(['wsROffLamp', 'wsRLoLamp', 'wsRHiLamp'], 'var_WindshieldAntiIceSwitch_R', 'Number', 'iceWsR')]
    },
    ice_wsMod: { html: sspBtn('g-aice grp-wshield p-wsmod', 'PILOT VSHLD CTRL STBY', 'SSP_ICE_WS_HEAT_MODE_TOGGLE', 'wsModBtn', 'wsModInd'), polls: [togglePoll('wsModBtn', 'wsModInd', 'var_WindshieldHeatMode')] },
    ice_gndIceDet: { html: sspBtn('g-aice grp-test p-gndice', 'GND ICE DETR TEST', 'SSP_ICE_GROUND_ICE_TEST_TOGGLE', 'gndIceBtn', 'gndIceInd'), polls: [togglePoll('gndIceBtn', 'gndIceInd', 'var_GroundIceDetectorTest')] },
    ice_antiskid: { html: sspBtn('g-aice grp-sys p-antiskid', 'ANTI-SKID', 'SSP_ICE_ANTI_SKID_TOGGLE', 'antiskidBtn', 'antiskidInd'), polls: [togglePoll('antiskidBtn', 'antiskidInd', 'var_AntiSkidSwitch')] },
    ice_inertSepActL: { html: sspBtn('g-deice grp-engine p-iactl', 'ENG ACT STBY<br>L', 'SSP_ICE_INERT_SEP_ACT_L_TOGGLE', 'isepActLBtn', 'isepActLInd'), polls: [togglePoll('isepActLBtn', 'isepActLInd', 'var_InertialSeparatorActuatorSwitch_L')] },
    ice_inertSepActR: { html: sspBtn('g-deice grp-engine p-iactr', 'ENG ACT STBY<br>R', 'SSP_ICE_INERT_SEP_ACT_R_TOGGLE', 'isepActRBtn', 'isepActRInd'), polls: [togglePoll('isepActRBtn', 'isepActRInd', 'var_InertialSeparatorActuatorSwitch_R')] },
    ice_ventL: { html: sspBtn('g-deice grp-vent p-ventl', 'VENT/CABLE<br>L', 'SSP_ICE_VENT_HEAT_L_TOGGLE', 'ventLBtn', 'ventLInd'), polls: [togglePoll('ventLBtn', 'ventLInd', 'var_FuelVentSwitchHeat_L', 'Number')] },
    ice_ventR: { html: sspBtn('g-deice grp-vent p-ventr', 'VENT/CABLE<br>R', 'SSP_ICE_VENT_HEAT_R_TOGGLE', 'ventRBtn', 'ventRInd'), polls: [togglePoll('ventRBtn', 'ventRInd', 'var_FuelVentSwitchHeat_R', 'Number')] },
    ice_inertSepMainL: { html: sspBtn('g-deice grp-engine p-imainl', 'MAIN<br>L', 'SSP_ICE_INERT_SEP_MAIN_L_TOGGLE', 'isepMainLBtn', 'isepMainLInd'), polls: [togglePoll('isepMainLBtn', 'isepMainLInd', 'var_InertialSeparatorSwitch_L')] },
    ice_inertSepMainR: { html: sspBtn('g-deice grp-engine p-imainr', 'MAIN<br>R', 'SSP_ICE_INERT_SEP_MAIN_R_TOGGLE', 'isepMainRBtn', 'isepMainRInd'), polls: [togglePoll('isepMainRBtn', 'isepMainRInd', 'var_InertialSeparatorSwitch_R')] },
    ice_fwdWingDeice: {
      html: dual('g-deice grp-wing p-fwd', 'FWD WG MAN', 'cycleFwdDeice()', null, [
        ['MAN', 'fwdManLamp'], ['AUTO', 'fwdOffLamp'], ['SEQ', 'fwdSeqLamp']
      ]),
      polls: [lampsPoll(['fwdManLamp', 'fwdOffLamp', 'fwdSeqLamp'], 'var_ForwardWingDeiceSwitch', 'Number', 'iceFwdWing')]
    },
    ice_mainWingDeice: {
      html: dual('g-deice grp-wing p-main', 'MAIN WG INBD', 'cycleMainDeice()', null, [
        ['MAN', 'mainInLamp'], ['AUTO', 'mainOffLamp'], ['OUTBD', 'mainOutLamp']
      ]),
      polls: [lampsPoll(['mainInLamp', 'mainOffLamp', 'mainOutLamp'], 'var_MainWingDeiceSwitch', 'Number', 'iceMainWing')]
    },

    /* ---------------- AUTOPILOT / FIRE / XPDR / CAS ---------------- */
    avncs_fireWallL: { html: sspBtn('g-fire', 'FW VALVE<br>L', 'SSP_AVNCS_FIRE_WALL_VALVE_L_TOGGLE', 'fwValveLBtn', 'fwValveLInd'), polls: [togglePoll('fwValveLBtn', 'fwValveLInd', 'var_FirewallValvePushed_L')] },
    avncs_fireWallR: { html: sspBtn('g-fire', 'FW VALVE<br>R', 'SSP_AVNCS_FIRE_WALL_VALVE_R_TOGGLE', 'fwValveRBtn', 'fwValveRInd'), polls: [togglePoll('fwValveRBtn', 'fwValveRInd', 'var_FirewallValvePushed_R')] },
    avncs_extingL: { html: sspBtn('g-fire', 'EXTING<br>L', 'SSP_AVNCS_FIRE_EXTING_L_TOGGLE', 'extingLBtn', 'extingLInd'), polls: [togglePoll('extingLBtn', 'extingLInd', 'var_ExtinguisherPushed_L')] },
    avncs_extingR: { html: sspBtn('g-fire', 'EXTING<br>R', 'SSP_AVNCS_FIRE_EXTING_R_TOGGLE', 'extingRBtn', 'extingRInd'), polls: [togglePoll('extingRBtn', 'extingRInd', 'var_ExtinguisherPushed_R')] },
    avncs_fd: { html: sspBtn('g-ap', 'FD', 'SSP_AVNCS_AP_FD_TOGGLE', 'fdBtn', 'fdInd'), polls: [toggleAPoll('fdBtn', 'fdInd', 'AUTOPILOT FLIGHT DIRECTOR ACTIVE, Bool')] },
    avncs_halfBank: { html: sspBtn('g-ap', 'HALF BANK', 'SSP_AVNCS_AP_HALF_BANK_TOGGLE') },
    avncs_desc: { html: sspBtn('g-ap', 'DESC', 'SSP_AVNCS_AP_DESCEND_TOGGLE') },
    avncs_ias: { html: sspBtn('g-flt', 'IAS', 'SSP_AVNCS_AP_IAS_TOGGLE', 'iasBtn', 'iasInd'), polls: [toggleAPoll('iasBtn', 'iasInd', 'AUTOPILOT AIRSPEED HOLD, Bool')] },
    avncs_iasProf: { html: sspBtn('g-flt', 'IAS PROF', 'SSP_AVNCS_AP_IAS_PROF_TOGGLE') },
    avncs_xfer: { html: sspBtn('g-ap-knob', 'AP XFER', 'SSP_AVNCS_AP_TRANSFER_TOGGLE', 'apXferBtn', 'apXferInd'), polls: [togglePoll('apXferBtn', 'apXferInd', 'var_AutopilotSource')] },
    avncs_turb: { html: sspBtn('g-ap-knob', 'TURB', 'SSP_AVNCS_AP_TURB_TOGGLE', 'turbBtn', 'turbInd'), polls: [togglePoll('turbBtn', 'turbInd', 'var_AutopilotTurbulenceMode')] },
    avncs_cws: { html: sspBtn('g-ap-knob', 'CWS', 'SSP_AVNCS_AP_CWS_PRESS') },
    avncs_ga: { html: sspBtn('g-ap-knob', 'GA', 'SSP_AVNCS_AP_GO_AROUND') },
    avncs_oatMode: { html: sspBtn('g-ap-knob', 'OAT MODE', 'SSP_AVNCS_AP_OAT_MODE') },
    avncs_bankDec: { html: sspBtn('g-ap-knob', 'BANK &minus;', 'SSP_AVNCS_AP_BANK_ANGLE_DEC') },
    avncs_bankInc: { html: sspBtn('g-ap-knob', 'BANK +', 'SSP_AVNCS_AP_BANK_ANGLE_INC') },

    avncs_xpdrSrc: { html: sspBtn('g-xpdr', 'XPDR SRC', 'SSP_AVNCS_XPDR_SELECT_TOGGLE', 'xpdrSrcBtn', 'xpdrSrcInd'), polls: [togglePoll('xpdrSrcBtn', 'xpdrSrcInd', 'var_TransponderSelectSwitch')] },
    avncs_xpdrPwr: { html: actBtn('g-xpdr', 'XPDR PWR', 'toggleXpdrPwr()', 'xpdrPwrToggle', 'xpdrPwrInd') },
    avncs_xpdrMode: { html: dual('g-xpdr', 'XPDR MODE', 'toggleXpdrMode()', 'xpdrModeToggle', [['ALT', 'xpdrAltLamp'], ['STDBY', 'xpdrStbyLamp']]) },
    avncs_xpdrIdent: { html: actBtn('g-xpdr', 'XPDR IDENT', 'xpdrIdent()', 'xpdrIdentBtn', 'xpdrIdentInd') },

    avncs_chrStSp: { html: sspBtn('g-chrono', 'CHR ST/SP', 'SSP_AVNCS_CHRONO_START_STOP') },
    avncs_chrZero: { html: sspBtn('g-chrono', 'CHR ZERO', 'SSP_AVNCS_CHRONO_ZERO') },
    avncs_chrSelL: { html: sspBtn('g-chrono', 'CHR SEL<br>L', 'SSP_AVNCS_CHRONO_SEL_LEFT') },
    avncs_chrSelR: { html: sspBtn('g-chrono', 'CHR SEL<br>R', 'SSP_AVNCS_CHRONO_SEL_RIGHT') },
    avncs_mkrSound: { html: sspBtn('g-radio', 'MKR SOUND', 'SSP_AVNCS_MARKER_SOUND_TOGGLE') },
    avncs_dmeDec: { html: sspBtn('g-radio', 'DME MODE &minus;', 'SSP_AVNCS_DME_MODE_DEC') },
    avncs_dmeInc: { html: sspBtn('g-radio', 'DME MODE +', 'SSP_AVNCS_DME_MODE_INC') },

    avncs_eicasOil: { html: sspBtn('g-eicas', 'EICAS<br>OIL', 'SSP_AVNCS_EICAS_OIL_PRESS') },
    avncs_casUp: { html: sspBtn('g-eicas', 'CAS<br>UP', 'SSP_AVNCS_CAS_UP_PRESS') },
    avncs_casDn: { html: sspBtn('g-eicas', 'CAS<br>DN', 'SSP_AVNCS_CAS_DN_PRESS') },
    avncs_rtu833: { html: sspBtn('g-radio', 'RADIO<br>8.3 MODE', 'SSP_AVNCS_RTU_833_BOTH_TOGGLE', 'rtu833Btn', 'rtu833Ind'), polls: [{ kind: 'custom', id: 'rtu833Both' }] },

    /* ---------------- ECS ---------------- */
    ecs_bleedGauge: { html: gauge({ label: 'BLEED', valId: 'bleedVal' }) },
    ecs_blwrGauge: {
      html: '<div class="btn gauge"><span class="g-label">BLWR</span><div class="g-row"><span class="g-sub">CKPT</span><span class="g-val" id="blowerCkptVal">\u2014</span><span class="g-sub">CAB</span><span class="g-val" id="blowerCabVal">\u2014</span></div></div>'
    },
    ecs_bleedDec: { html: actBtn('g-bleed', 'BLEED &minus;', 'bleedDec()') },
    ecs_bleedInc: { html: actBtn('g-bleed', 'BLEED +', 'bleedInc()') },
    ecs_bleed: {
      html: dual('g-bleed', 'BLEED', 'cycleBleed()', null, [
        ['R', 'blR'], ['OFF', 'blOff'], ['L', 'blL'], ['BOTH', 'blBoth'],
        ['R AUTO', 'blRA'], ['B AUTO', 'blBA']
      ])
    },
    ecs_staticSrc: {
      html: dual('g-bleed', 'STATIC SOURCE', "sendP('SSP_ECS_STATIC_SOURCE_TOGGLE')", null, [
        ['ISOLATED', 'ssIsoLamp'], ['NORM', 'ssNormLamp']
      ])
    },
    ecs_tempMode: {
      html: dual('g-temp', 'TEMP MODE', 'cycleTempMode()', null, [
        ['MAN', 'tmManLamp'], ['OFF', 'tmOffLamp'], ['AUTO', 'tmAutoLamp']
      ])
    },
    ecs_cockCab: { html: actBtn('g-temp', 'CKPT / CAB', 'toggleCockCabMode()', 'cockCabBtn', 'cockCabInd') },
    ecs_ckptTmpGauge: { html: '<div class="btn gauge"><span class="g-label" id="ckptTmpLbl">CKPT SET &deg;F</span><span class="g-val" id="ckptTmpVal">\u2014</span></div>' },
    ecs_ckptDec: { html: actBtn('g-temp', 'CKPT &minus;', 'ckptTempDec()', 'ckptDecBtn') },
    ecs_ckptInc: { html: actBtn('g-temp', 'CKPT +', 'ckptTempInc()', 'ckptIncBtn') },
    ecs_cabTmpGauge: { html: '<div class="btn gauge"><span class="g-label" id="cabTmpLbl">CAB TMP &deg;F</span><span class="g-val" id="cabTmpVal">\u2014</span></div>' },
    ecs_cabDec: { html: actBtn('g-temp', 'CAB &minus;', 'cabTempDec()', 'cabDecBtn') },
    ecs_cabInc: { html: actBtn('g-temp', 'CAB +', 'cabTempInc()', 'cabIncBtn') },
    ecs_blwrDec: { html: actBtn('g-bleed', 'BLWR &minus;', 'blowerDec()') },
    ecs_blwrInc: { html: actBtn('g-bleed', 'BLWR +', 'blowerInc()') },
    ecs_manTmpGauge: { html: '<div class="btn gauge"><span class="g-label" id="manTmpLbl">MAN SET &deg;F</span><span class="g-val" id="manTmpVal">\u2014</span></div>' },
    ecs_manDec: { html: actBtn('g-temp', 'MAN &minus;', 'combTempDec()', 'manDecBtn') },
    ecs_manInc: { html: actBtn('g-temp', 'MAN +', 'combTempInc()', 'manIncBtn') },
    ecs_setpointGauge: { html: '<div class="btn gauge"><span class="g-label" id="setpointLbl">SETPOINT &deg;F</span><span class="g-val" id="setpointVal">\u2014</span></div>' },
    ecs_cabVentGauge: { html: '<div class="btn gauge"><span class="g-label" id="cabVentLbl">CAB VENT &deg;F</span><span class="g-val" id="cabVentVal">\u2014</span></div>' },
    ecs_tempUnit: { html: '<button type="button" class="btn g-temp" id="tempUnitBtn" data-fixed-label="1" onclick="sendP(\'SSP_ECS_TEMP_UNIT_TOGGLE\')"><span class="indicator" id="tempUnitInd"></span>TEMP UNIT<br><span id="tempUnitTxt">F</span></button>' },

    ecs_cabAltDec: { html: actBtn('g-press', 'CAB ALT &minus;', 'cabinAltDec()') },
    ecs_cabAltInc: { html: actBtn('g-press', 'CAB ALT +', 'cabinAltInc()') },
    ecs_cabAltDecFast: { html: actBtn('g-press', 'ALT &minus;&minus;', 'cabinAltDecFast()') },
    ecs_cabAltIncFast: { html: actBtn('g-press', 'ALT ++', 'cabinAltIncFast()') },
    ecs_rateDec: { html: actBtn('g-press', 'RATE &minus;', 'cabinRateDec()') },
    ecs_rateInc: { html: actBtn('g-press', 'RATE +', 'cabinRateInc()') },
    ecs_dumpDec: { html: sspBtn('g-press', 'DUMP &minus;', 'SSP_ECS_PRESS_DUMP_DEC') },
    ecs_dumpInc: { html: sspBtn('g-press', 'DUMP +', 'SSP_ECS_PRESS_DUMP_INC') },

    ecs_pressGoalGauge: { html: gauge({ label: 'PRESS GOAL', valId: 'pressAltVal', unit: 'FT' }) },
    ecs_cabAltGauge: { html: gauge({ label: 'CAB ALT', valId: 'cabAltVal', unit: 'FT' }) },
    ecs_cabinGauge: {
      html: '<div class="btn gauge"><span class="g-label">CABIN</span><div class="g-row"><span class="g-sub">DIFF</span><span class="g-val" id="cabDiffVal">\u2014</span></div><div class="g-row"><span class="g-sub">RATE</span><span class="g-val" id="cabRateVal">\u2014</span></div></div>'
    },
    ecs_pltAirDec: { html: sspBtn('g-air', 'PLT AIR &minus;', 'SSP_ECS_AIR_PILOT_DEC') },
    ecs_pltAirInc: { html: sspBtn('g-air', 'PLT AIR +', 'SSP_ECS_AIR_PILOT_INC') },
    ecs_cpltAirDec: { html: sspBtn('g-air', 'CPLT AIR &minus;', 'SSP_ECS_AIR_COPILOT_DEC') },
    ecs_cpltAirInc: { html: sspBtn('g-air', 'CPLT AIR +', 'SSP_ECS_AIR_COPILOT_INC') },
    ecs_pneuPsiGauge: {
      html: '<div class="btn gauge"><span class="g-label">PNEU PSI</span><div class="g-row"><span class="g-sub">L</span><span class="g-val" id="pneuLVal">\u2014</span><span class="g-sub">R</span><span class="g-val" id="pneuRVal">\u2014</span></div></div>'
    },

    ecs_defrostDec: { html: sspBtn('g-air', 'DEFROST &minus;', 'SSP_ECS_AIR_DEFROST_DEC') },
    ecs_defrostInc: { html: sspBtn('g-air', 'DEFROST +', 'SSP_ECS_AIR_DEFROST_INC') },
    ecs_oxySys: { html: sspBtn('g-oxy', 'OXY SYS', 'SSP_ECS_OXY_SYS_TOGGLE', 'oxySysBtn', 'oxySysInd') },
    ecs_oxyPlt: { html: sspBtn('g-oxy', 'PLT OXY', 'SSP_ECS_OXY_PILOT_TOGGLE', 'oxyPltBtn', 'oxyPltInd') },
    ecs_oxyCplt: { html: sspBtn('g-oxy', 'CPLT OXY', 'SSP_ECS_OXY_COPILOT_TOGGLE', 'oxyCpBtn', 'oxyCpInd') },
    ecs_oxyPax: { html: sspBtn('g-oxy', 'PAX OXY', 'SSP_ECS_OXY_PAX_TOGGLE', 'paxOxyBtn', 'paxOxyInd') },
    ecs_oxyPsiGauge: { html: gauge({ label: 'OXY PSI', valId: 'oxyPressVal' }) },

    /* ---------------- MISC ---------------- */
    misc_silenceGear: { html: sspBtn('g-warn', 'SILENCE<br>GEAR WARN', 'SSP_MISC_GEAR_HORN_SILENCE') },
    misc_downlockRelease: { html: sspBtn('g-warn', 'DOWNLOCK<br>RELEASE', 'SSP_MISC_GEAR_DOWNLOCK_RELEASE') },
    misc_doorBypass: { html: sspBtn('g-warn', 'DOOR<br>PRESS BYP', 'SSP_MISC_DOOR_BYPASS_TOGGLE', 'doorBypassBtn', 'doorBypassInd'), polls: [togglePoll('doorBypassBtn', 'doorBypassInd', 'var_doorPressureBypass')] },
    misc_wiper: {
      html: dual('g-warn', 'WIPER', "sendP('SSP_MISC_WIPER_CYCLE')", null, [
        ['OFF', 'wipOffLamp'], ['LO', 'wipLoLamp'], ['MED', 'wipMedLamp'], ['HI', 'wipHiLamp']
      ]),
      polls: [lampsPoll(['wipOffLamp', 'wipLoLamp', 'wipMedLamp', 'wipHiLamp'], 'var_WiperKnob', 'Number', 'wiper4')]
    },
    misc_regStyle: { html: sspBtn('g-warn', 'TAIL NO.<br>2024 STYLE', 'SSP_MISC_REGISTRATION_TOGGLE', 'regBtn', 'regInd'), polls: [togglePoll('regBtn', 'regInd', 'bksq_ForceShow2024Registration')] },
    misc_baroUnit: { html: sspBtn('g-warn', 'BARO UNITS<br>inHg / hPa', 'SSP_MISC_BARO_UNIT_TOGGLE', 'baroUnitBtn', 'baroUnitInd'), polls: [togglePoll('baroUnitBtn', 'baroUnitInd', 'var_ReversionaryBaroUnitSwitch_L')] },
    misc_cabDoor: { html: sspBtn('g-fuel', 'MAIN CABIN<br>DOOR', 'SSP_MISC_CABIN_DOOR_TOGGLE', 'cabDoorBtn', 'cabDoorInd'), polls: [togglePoll('cabDoorBtn', 'cabDoorInd', 'bksq_CabinDoor')] },
    misc_bagDoorL: { html: sspBtn('g-fuel', 'BAGGAGE<br>DOOR L', 'SSP_MISC_BAGGAGE_L_TOGGLE', 'bagLBtn', 'bagLInd'), polls: [togglePoll('bagLBtn', 'bagLInd', 'var_BaggageDoorHandle_L', 'Number', 'gt0')] },
    misc_bagDoorR: { html: sspBtn('g-fuel', 'BAGGAGE<br>DOOR R', 'SSP_MISC_BAGGAGE_R_TOGGLE', 'bagRBtn', 'bagRInd'), polls: [togglePoll('bagRBtn', 'bagRInd', 'var_BaggageDoorHandle_R', 'Number', 'gt0')] },
    misc_pedMeter: { html: sspBtn('g-fuel', 'PEDESTAL<br>METER +', 'SSP_MISC_MULTIMETER_CYCLE', 'meterBtn') },
    misc_gpu: { html: sspBtn('g-elec', 'GROUND<br>GPU PWR', 'SSP_PED_ELEC_GPU_TOGGLE', 'miscGpuBtn', 'miscGpuInd'), polls: [togglePoll('miscGpuBtn', 'miscGpuInd', 'BKSQ_EXTERNALPOWERON')] },
    misc_aoa: { html: sspBtn('g-radio', 'AOA<br>SOURCE', 'SSP_MISC_AOA_SOURCE_TOGGLE', 'aoaBtn', 'aoaInd'), polls: [togglePoll('aoaBtn', 'aoaInd', 'var_aoaSource')] },
    misc_headphone: { html: sspBtn('g-radio', 'HEADSET<br>SIM', 'SSP_MISC_HEADPHONE_TOGGLE', 'headphoneBtn', 'headphoneInd'), polls: [togglePoll('headphoneBtn', 'headphoneInd', 'BKSQ_HEADPHONESIMULATIONTARGET', 'Number', 'gt0')] },
    misc_dbu: { html: sspBtn('g-radio', 'DATA BOX<br>LOAD', 'SSP_MISC_DBU_EJECT_TOGGLE', 'dbuBtn', 'dbuInd'), polls: [togglePoll('dbuBtn', 'dbuInd', 'var_DbuLoaded', 'Number')] },
    misc_efb: { html: sspBtn('g-misc', 'EFB<br>SHOW / HIDE', 'SSP_MISC_TABLET_TOGGLE', 'tabletBtn', 'tabletInd'), polls: [togglePoll('tabletBtn', 'tabletInd', 'bksq_TabletVisible')] },
    misc_efbTiltUp: { html: sspBtn('g-misc', 'EFB TILT<br>&uarr; UP', 'SSP_MISC_TABLET_UP') },
    misc_efbSavePos: { html: sspBtn('g-misc', 'EFB DEFAULT<br>POSITION', 'SSP_MISC_TABLET_SAVE') },
    misc_efbTiltLeft: { html: sspBtn('g-misc', 'EFB TILT<br>&larr; LEFT', 'SSP_MISC_TABLET_LEFT') },
    misc_efbTiltDown: { html: sspBtn('g-misc', 'EFB TILT<br>&darr; DOWN', 'SSP_MISC_TABLET_DOWN') },
    misc_efbTiltRight: { html: sspBtn('g-misc', 'EFB TILT<br>RIGHT &rarr;', 'SSP_MISC_TABLET_RIGHT') },

    /* ---------------- PEDESTAL ---------------- */
    elec_battAmpGauge: { html: '<div class="btn gauge wide-2"><span class="g-label">BATT AMP / L LOAD-%</span><span class="g-val" id="gBattAmp">\u2014</span></div>' },
    elec_voltsDcGauge: { html: '<div class="btn gauge wide-2"><span class="g-label">VOLTS-DC</span><span class="g-val" id="gVoltsDC">\u2014</span></div>' },
    elec_rLoadGauge: { html: gauge({ label: 'R LOAD-%', valId: 'gRLoad' }) },
    elec_voltModeGauge: { html: '<div class="btn gauge volt-mode-box"><span class="g-label">VOLT SEL</span><span class="g-val vs-mode-val" id="gVoltMode">BATT AMP</span></div>' },
    elec_voltDec: { html: actBtn('g-elec', 'VOLT &minus;', 'voltSelDec()') },
    elec_voltInc: { html: actBtn('g-elec', 'VOLT +', 'voltSelInc()') },

    eng_autoIgnL: {
      html: dual('g-eng', 'AUTO IGN L', "sendP('SSP_PED_ENG_AUTO_IGN_L_TOGGLE')", null, [
        ['ARM', 'ignLArmLamp'], ['OFF', 'ignLOffLamp']
      ])
    },
    eng_autoIgnR: {
      html: dual('g-eng', 'AUTO IGN R', "sendP('SSP_PED_ENG_AUTO_IGN_R_TOGGLE')", null, [
        ['ARM', 'ignRArmLamp'], ['OFF', 'ignROffLamp']
      ])
    },
    elec_batt: { html: sspBtn('g-elec', 'BATT', 'SSP_PED_ELEC_BATT_TOGGLE', 'battBtn', 'battInd') },
    elec_genL: {
      html: dual('g-elec', 'L GEN', 'cycleGenL()', null, [
        ['RESET', 'genLRstLamp'], ['ON', 'genLOnLamp'], ['OFF', 'genLOffLamp']
      ])
    },
    elec_genR: {
      html: dual('g-elec', 'R GEN', 'cycleGenR()', null, [
        ['RESET', 'genRRstLamp'], ['ON', 'genROnLamp'], ['OFF', 'genROffLamp']
      ])
    },
    elec_battAmps: { html: sspBtn('g-elec', 'BATT AMP', 'SSP_PED_ELEC_BATT_AMPS_MODE_TOGGLE', 'battAmpsBtn', 'battAmpsInd') },
    elec_extPwr: { html: sspBtn('g-elec', 'EXT PWR', 'SSP_PED_ELEC_EXT_PWR_TOGGLE', 'extPwrBtn', 'extPwrInd') },
    elec_busTie: {
      html: dual('g-elec', 'GEN TIES', 'cycleBusTie()', null, [
        ['CLOSED', 'btCloseLamp'], ['NORM', 'btNormLamp'], ['OPEN', 'btOpenLamp']
      ])
    },
    prop_autoFeather: {
      html: dual('g-prop', 'AUTOFEATHER', 'cycleAutoFeather()', null, [
        ['TEST', 'afTestLamp'], ['ARM', 'afArmLamp'], ['OFF', 'afOffLamp']
      ])
    },
    prop_sync: { html: sspBtn('g-prop', 'PROP SYNC', 'SSP_PED_ELEC_PROP_SYNC_TOGGLE', 'propSyncBtn', 'propSyncInd') },
    pedst_stbyGyro: {
      html: dual('g-pedst', 'STBY GYRO', "sendP('SSP_PED_ELEC_STBY_GYRO_TOGGLE')", null, [
        ['ON', 'stbyOnLamp'], ['OFF', 'stbyOffLamp']
      ])
    },
    pedst_stbyIndPwr: { html: actBtn('g-pedst', 'STBY IND PWR', 'pulseStdbyPwr()', 'stbyPwrBtn', 'stbyPwrInd') },
    pedst_gndComm: { html: sspBtn('g-pedst', 'GND COMM', 'SSP_PED_ELEC_GND_COMM_TOGGLE', 'gndCommBtn', 'gndCommInd') },
    pedst_altnBlow: { html: sspBtn('g-pedst', 'AVIO ALTN BLOW', 'SSP_PED_ELEC_AVIO_ALT_BLOW_TOGGLE', 'avBlowBtn', 'avBlowInd') },
    elec_gpuPed: { html: sspBtn('g-elec', 'GPU', 'SSP_PED_ELEC_GPU_TOGGLE', 'gpuBtn', 'gpuInd') },

    prop_overspdGov: {
      html: dual('g-prop', 'PROP OVERSPD', 'cyclePropGov()', null, [
        ['GOV', 'govGovLamp'], ['NORM', 'govNormLamp'], ['LOW', 'govLowLamp']
      ])
    },
    fuel_qtyL: { html: gauge({ label: 'QTY L', valId: 'gFuelL', unit: 'LBS', unitId: 'gFuelLUnit' }) },
    fuel_xfer: {
      html: dual('g-fuel', 'TRANSFER', 'cycleFuelXfer()', null, [
        ['R&rarr;L', 'xferRtoLLamp'], ['OFF', 'xferOffLamp'], ['L&rarr;R', 'xferLtoRLamp']
      ])
    },
    fuel_qtyR: { html: gauge({ label: 'QTY R', valId: 'gFuelR', unit: 'LBS', unitId: 'gFuelRUnit' }) },

    eng_starterL: {
      html: dual('g-eng', 'L START', 'cycleStarterL()', null, [
        ['ON', 'stLOnLamp'], ['OFF', 'stLOffLamp'], ['STARTER<br>ONLY', 'stLSOLamp']
      ])
    },
    eng_starterR: {
      html: dual('g-eng', 'R START', 'cycleStarterR()', null, [
        ['ON', 'stROnLamp'], ['OFF', 'stROffLamp'], ['STARTER<br>ONLY', 'stRSOLamp']
      ])
    },
    fuel_stbyPumpL: { html: sspBtn('g-fuel', 'STBY PMP<br>L', 'SSP_PED_FUEL_STBY_PUMP_L_TOGGLE', 'fuelPumpLBtn', 'fuelPumpLInd') },
    fuel_aftQtyL: { html: actBtn('g-fuel', 'AFT QTY<br>L', "aftQtyPush('L')", 'aftTankLBtn', 'aftTankLInd') },
    fuel_temp: { html: gauge({ label: 'TEMP &deg;C', valId: 'gFuelTemp' }) },
    fuel_aftQtyR: { html: actBtn('g-fuel', 'AFT QTY<br>R', "aftQtyPush('R')", 'aftTankRBtn', 'aftTankRInd') },
    fuel_stbyPumpR: { html: sspBtn('g-fuel', 'STBY PMP<br>R', 'SSP_PED_FUEL_STBY_PUMP_R_TOGGLE', 'fuelPumpRBtn', 'fuelPumpRInd') },

    trim_pitch: {
      html: dual('g-trim', 'PITCH TRIM', 'cyclePitchTrim()', null, [
        ['NORM', 'ptNormLamp'], ['OFF', 'ptOffLamp'], ['STBY', 'ptStbyLamp']
      ])
    },
    trim_roll: { html: sspBtn('g-trim', 'ROLL TRIM', 'SSP_PED_TRIM_ROLL_MODE_TOGGLE', 'rtmBtn', 'rtmInd') },
    trim_rudder: { html: sspBtn('g-trim', 'RUD TRIM', 'SSP_PED_TRIM_RUDDER_MODE_TOGGLE', 'rudTmBtn', 'rudTmInd') },
    trim_prkBrk: { html: actBtn('g-warn', 'PRK BRK', 'togglePrkBrk()', 'prkBrkBtn', 'prkBrkInd') },

    /* ---------------- TEST (annunciator / ice / elec test holds) ---------------- */
    test_fireExtL: {
      html: H.holdButton('g-test-fire', 'FIRE EXT<br>L', 'SSP_TEST_FIRE_EXT_L_HOLD', { id: 'fireExtLBtn', ind: 'fireExtLInd' }),
      polls: [{ kind: 'testLatched', btnId: 'fireExtLBtn', indId: 'fireExtLInd', lvar: 'var_FireExtinguisherTest_L_IsDown', lvarType: 'Bool' }]
    },
    test_fireExtR: {
      html: H.holdButton('g-test-fire', 'FIRE EXT<br>R', 'SSP_TEST_FIRE_EXT_R_HOLD', { id: 'fireExtRBtn', ind: 'fireExtRInd' }),
      polls: [{ kind: 'testLatched', btnId: 'fireExtRBtn', indId: 'fireExtRInd', lvar: 'var_FireExtinguisherTest_R_IsDown', lvarType: 'Bool' }]
    },
    test_fireDetL: {
      html: H.holdButton('g-test-fire', 'FIRE DET<br>L', 'SSP_TEST_FIRE_DET_L_HOLD', { id: 'fireDetLBtn', ind: 'fireDetLInd' }),
      polls: [{ kind: 'testLatched', btnId: 'fireDetLBtn', indId: 'fireDetLInd', lvar: 'var_FireDetectorTest_L_IsDown', lvarType: 'Bool' }]
    },
    test_fireDetR: {
      html: H.holdButton('g-test-fire', 'FIRE DET<br>R', 'SSP_TEST_FIRE_DET_R_HOLD', { id: 'fireDetRBtn', ind: 'fireDetRInd' }),
      polls: [{ kind: 'testLatched', btnId: 'fireDetRBtn', indId: 'fireDetRInd', lvar: 'var_FireDetectorTest_R_IsDown', lvarType: 'Bool' }]
    },
    test_flapMonL: {
      html: H.holdButton('g-test-gear', 'FLAP MON', 'SSP_TEST_FLAP_MON_L_HOLD', { id: 'testFlapMonLBtn', ind: 'testFlapMonLInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testFlapMonLBtn', indId: 'testFlapMonLInd', lvar: 'var_FlapTest_L_IsDown', lvarType: 'Bool' }]
    },
    test_flapMonR: {
      html: H.holdButton('g-test-gear', 'FWD WG MON', 'SSP_TEST_FLAP_MON_R_HOLD', { id: 'testFlapMonRBtn', ind: 'testFlapMonRInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testFlapMonRBtn', indId: 'testFlapMonRInd', lvar: 'var_FlapTest_R_IsDown', lvarType: 'Bool' }]
    },
    test_auxBatt: {
      html: H.holdButton('g-test-elec', 'AUX BATT', 'SSP_TEST_AUX_BATT_HOLD', { id: 'testAuxBattBtn', ind: 'testAuxBattInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testAuxBattBtn', indId: 'testAuxBattInd', lvar: 'var_AuxBatteryTest_IsDown', lvarType: 'Bool' }]
    },
    test_battMon: {
      html: H.holdButton('g-test-elec', 'BATT MONITOR', 'SSP_TEST_BATT_MON_HOLD', { id: 'testBattMonBtn', ind: 'testBattMonInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testBattMonBtn', indId: 'testBattMonInd', lvar: 'var_BatteryMonitorTest_IsDown', lvarType: 'Bool' }]
    },
    test_press: {
      html: H.holdButton('g-test-warn', 'PRESS', 'SSP_TEST_PRESS_HOLD', { id: 'testPressBtn', ind: 'testPressInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testPressBtn', indId: 'testPressInd', lvar: 'var_PressurizationTest_IsDown', lvarType: 'Bool' }]
    },
    test_fuelLo: {
      html: H.holdButton('g-test-warn', 'FUEL LO WARN', 'SSP_TEST_LOW_FUEL_HOLD', { id: 'testFuelBtn', ind: 'testFuelInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testFuelBtn', indId: 'testFuelInd', lvar: 'var_FuelWarningTest_IsDown', lvarType: 'Bool' }]
    },
    test_stallWarn: {
      html: H.holdButton('g-test-warn', 'STALL WARN', 'SSP_TEST_STALL_WARN_HOLD', { id: 'testStallBtn', ind: 'testStallInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testStallBtn', indId: 'testStallInd', lvar: 'var_StallWarningTest_IsDown', lvarType: 'Bool' }]
    },
    test_vmoMmo: {
      html: H.holdButton('g-test-warn', 'VMO/MMO', 'SSP_TEST_AIRSPEED_WARN_HOLD', { id: 'testAspdBtn', ind: 'testAspdInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testAspdBtn', indId: 'testAspdInd', lvar: 'var_AirspeedWarningTest_IsDown', lvarType: 'Bool' }]
    },
    test_ldgGr: {
      html: H.holdButton('g-test-warn', 'LDG GR', 'SSP_TEST_GEAR_WARN_HOLD', { id: 'testGearBtn', ind: 'testGearInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testGearBtn', indId: 'testGearInd', lvar: 'var_GearWarningTest_IsDown', lvarType: 'Bool' }]
    },
    test_annun: {
      html: H.holdButton('g-test-warn', 'ANNUN', 'SSP_TEST_ANNUNCIATOR_HOLD', { id: 'testAnnBtn', ind: 'testAnnInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testAnnBtn', indId: 'testAnnInd', lvar: 'var_AnnunciatorTest_IsDown', lvarType: 'Bool' }]
    },
    test_bleedAir: {
      html: H.holdButton('g-test-warn', 'BLEED AIR', 'SSP_TEST_BLEED_AIR_HOLD', { id: 'testBleedBtn', ind: 'testBleedInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testBleedBtn', indId: 'testBleedInd', lvar: 'var_BleedAirTest_IsDown', lvarType: 'Bool' }]
    },
    test_deiceVac: {
      html: H.holdButton('g-test-deice', 'VAC', 'SSP_TEST_DEICE_VAC_HOLD', { id: 'testDeiceVacBtn', ind: 'testDeiceVacInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testDeiceVacBtn', indId: 'testDeiceVacInd', lvar: 'var_DeiceVacuumTest_IsDown', lvarType: 'Bool' }]
    },
    test_deiceStby: {
      html: H.holdButton('g-test-deice', 'SURF DEICE STBY', 'SSP_TEST_DEICE_STBY_HOLD', { id: 'testDeiceStdBtn', ind: 'testDeiceStdInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testDeiceStdBtn', indId: 'testDeiceStdInd', lvar: 'var_DeiceStandbyTest_IsDown', lvarType: 'Bool' }]
    },
    test_deiceMain: {
      html: H.holdButton('g-test-deice', 'MAIN', 'SSP_TEST_DEICE_MAIN_HOLD', { id: 'testDeiceMainBtn', ind: 'testDeiceMainInd' }),
      polls: [{ kind: 'testLatched', btnId: 'testDeiceMainBtn', indId: 'testDeiceMainInd', lvar: 'var_DeiceMainTest_IsDown', lvarType: 'Bool' }]
    },
    test_pneuPsi: {
      html: H.gauge({
        cls: 'btn gauge wide-3',
        label: 'PNEU PSI',
        rows: [{ subLeft: 'L', valId: 'pneuLVal', subRight: 'R', valId2: 'pneuRVal' }]
      }),
      polls: [
        { kind: 'avarText', id: 'pneuLVal', expr: 'PNEUMATIC PRESSURE:1, psi', decimals: 1 },
        { kind: 'avarText', id: 'pneuRVal', expr: 'PNEUMATIC PRESSURE:2, psi', decimals: 1 }
      ]
    }
  };

  window.SSP_BUTTONS = BTNS;
  window.StarshipPanel = window.SSP_PANEL_FACTORY(BTNS, { gridClass: 'grid' });
})();
