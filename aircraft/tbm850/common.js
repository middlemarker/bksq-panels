window.TBM = {
  AUX_BP_OFF: 0,
  BLEED_OFF: 0,
  FUEL_SEL_AUTO: 1,
  FUEL_SEL_MAN: 0,
  WXR_MODE_TEXT: ['OFF', 'STBY', 'TST', 'ON', 'NAV', 'LOG'],
  XPDR_STATE_NAMES: ['OFF', 'STDBY', 'TEST', 'ON', 'ALT', 'GND'],
  ltsHoldUntil: 0,
  uiState: { dhMode: 1 },
  _identVal: 0,
  _lastIdentPoll: 0,
  _acDir: 1,
  _dhDir: 1,
  _wxrDir: 1,
  _apDir: 1,

  lightsTest: function () {
    sendTbmP('SSP_TBM_OH_LIGHTS_TEST');
    TBM.ltsHoldUntil = Date.now() + 2000;
    setToggleVisual('ltsBtn', 'ltsInd', true, 'LTS TST', 'LTS TST');
  },

  setFuelSelVisual: function (val) {
    var a = document.getElementById('fuelSelAutoLamp');
    var m = document.getElementById('fuelSelManLamp');
    if (!a || !m) return;
    a.classList.toggle('on', val == TBM.FUEL_SEL_AUTO);
    m.classList.toggle('on', val == TBM.FUEL_SEL_MAN);
  },
  toggleFuelSel: function () {
    try {
      sendTbmP('SSP_TBM_AVN_FUEL_SEL_AUTO');
      setTimeout(function () {
        var cur = getLVar('var_AutoFuelSelectorSwitch', 'Bool');
        TBM.setFuelSelVisual(cur);
      }, 120);
    } catch (e) {}
  },

  setAuxBpVisual: function (val) {
    var autoL = document.getElementById('auxAutoLamp');
    var onL = document.getElementById('auxOnLamp');
    var offL = document.getElementById('auxOffLamp');
    if (!autoL || !onL || !offL) return;
    autoL.classList.toggle('on', val == 2);
    onL.classList.toggle('on', val == 1);
    offL.classList.toggle('on', val == TBM.AUX_BP_OFF);
  },
  toggleAuxBp: function () {
    try {
      var cur = getLVar('BKSQ_fuelPumpSwitch', 'Number');
      if (cur == TBM.AUX_BP_OFF) return;
      var next = cur == 2 ? 1 : 2;
      setLVar('BKSQ_fuelPumpSwitch', 'Number', next);
      TBM.setAuxBpVisual(next);
    } catch (e) {}
  },

  setSourceSwitchVisual: function (val) {
    var batEl = document.getElementById('srcBatLamp');
    var gpuEl = document.getElementById('srcGpuLamp');
    var offEl = document.getElementById('srcOffLamp');
    if (!batEl || !gpuEl || !offEl) return;
    batEl.classList.toggle('on', val == 1);
    gpuEl.classList.toggle('on', val == 2);
    offEl.classList.toggle('on', !(val == 1 || val == 2));
  },
  toggleSourceSwitch: function () {
    try {
      sendTbmP('SSP_TBM_OH_SOURCE_TOGGLE');
      setTimeout(function () {
        var cur = getLVar('BKSQ_SourceSwitch', 'Number');
        TBM.setSourceSwitchVisual(cur);
      }, 80);
    } catch (e) {}
  },

  setGenSwitchVisual: function (val) {
    var offLamp = document.getElementById('genOffLamp');
    var mainLamp = document.getElementById('genMainLamp');
    var stbyLamp = document.getElementById('genStbyLamp');
    if (!mainLamp || !stbyLamp) return;
    if (offLamp) offLamp.classList.toggle('on', val == 0);
    mainLamp.classList.toggle('on', val == 1);
    stbyLamp.classList.toggle('on', val == 2);
  },
  toggleGenSwitch: function () {
    try {
      var cur = getLVar('BKSQ_GeneratorSwitch', 'Number');
      if (cur === undefined) cur = 0;
      if (cur === 1) {
        setLVar('BKSQ_GeneratorSwitch', 'Number', 2);
        TBM.setGenSwitchVisual(2);
      } else if (cur === 2) {
        setLVar('BKSQ_GeneratorSwitch', 'Number', 1);
        TBM.setGenSwitchVisual(1);
      }
    } catch (e) {}
  },

  setFanFlowVisual: function (val) {
    var autoL = document.getElementById('fanAutoLamp');
    var loL = document.getElementById('fanLoLamp');
    if (!autoL || !loL) return;
    autoL.classList.toggle('on', val == 1);
    loL.classList.toggle('on', val == 0);
  },
  toggleFanFlow: function () {
    try {
      sendTbmP('SSP_TBM_ENV_FAN_FLOW_TOGGLE');
      setTimeout(function () {
        var cur = getLVar('var_FanSwitch', 'Number');
        TBM.setFanFlowVisual(cur);
      }, 80);
    } catch (e) {}
  },

  setAirCondVisual: function (val) {
    var onL = document.getElementById('acOnLamp');
    var fanL = document.getElementById('acFanLamp');
    var offL = document.getElementById('acOffLamp');
    if (!onL || !fanL) return;
    onL.classList.toggle('on', val == 2);
    fanL.classList.toggle('on', val == 1);
    if (offL) offL.classList.toggle('on', val == 0);
  },
  toggleAirCond: function () {
    try {
      var cur = getLVar('var_airconState', 'Number');
      if (cur === undefined) cur = 0;
      var MIN = 0,
        MAX = 2;
      if (cur <= MIN) TBM._acDir = 1;
      else if (cur >= MAX) TBM._acDir = -1;
      var next = cur + TBM._acDir;
      if (next < MIN) next = MIN;
      if (next > MAX) next = MAX;
      setLVar('var_airconState', 'Number', next);
      TBM.setAirCondVisual(next);
    } catch (e) {}
  },

  setBleedVisual: function (val) {
    var hiL = document.getElementById('bleedHiLamp');
    var autoL = document.getElementById('bleedAutoLamp');
    if (!hiL || !autoL) return;
    var active = val != TBM.BLEED_OFF;
    hiL.classList.toggle('on', active && val == 2);
    autoL.classList.toggle('on', active && val == 1);
  },
  toggleBleed: function () {
    try {
      var cur = getLVar('var_bleedState', 'Number');
      if (cur == TBM.BLEED_OFF) return;
      var next = cur == 2 ? 1 : 2;
      setLVar('var_bleedState', 'Number', next);
      TBM.setBleedVisual(next);
    } catch (e) {}
  },

  setDhModeVisual: function (modeIndex) {
    var lamps = [document.getElementById('dhTestLamp'), document.getElementById('dhNormLamp'), document.getElementById('dhSetLamp')];
    for (var i = 0; i < lamps.length; i++) {
      var l = lamps[i];
      if (!l) continue;
      if (i === modeIndex) l.classList.add('on');
      else l.classList.remove('on');
    }
  },
  cycleDhMode: function () {
    try {
      var MIN = 0,
        MAX = 2;
      if (TBM.uiState.dhMode <= MIN) TBM._dhDir = 1;
      else if (TBM.uiState.dhMode >= MAX) TBM._dhDir = -1;
      TBM.uiState.dhMode += TBM._dhDir;
      if (TBM.uiState.dhMode < MIN) TBM.uiState.dhMode = MIN;
      if (TBM.uiState.dhMode > MAX) TBM.uiState.dhMode = MAX;
      TBM.setDhModeVisual(TBM.uiState.dhMode);
      if (TBM.uiState.dhMode === 0) sendTbmP('SSP_TBM_AVN_DH_MODE_TEST');
      else if (TBM.uiState.dhMode === 1) sendTbmP('SSP_TBM_AVN_DH_MODE_NORM');
      else sendTbmP('SSP_TBM_AVN_DH_MODE_DH_SET');
    } catch (e) {}
  },

  setWxrModeVisual: function (val) {
    var el = document.getElementById('wxrModeVal');
    if (!el) return;
    var idx = Math.max(0, Math.min(5, val | 0));
    el.textContent = TBM.WXR_MODE_TEXT[idx] || String(idx);
  },
  cycleWxrMode: function () {
    try {
      var cur = getLVar('var_radarMode', 'Number');
      if (cur === undefined) cur = 0;
      cur = cur | 0;
      var MIN = 0,
        MAX = 3;
      if (cur <= MIN) TBM._wxrDir = 1;
      else if (cur >= MAX) TBM._wxrDir = -1;
      var next = cur + TBM._wxrDir;
      if (next < MIN) next = MIN;
      if (next > MAX) next = MAX;
      setLVar('var_radarMode', 'Number', next);
      TBM.setWxrModeVisual(next);
    } catch (e) {}
  },

  setApTrimsVisual: function (val) {
    var onL = document.getElementById('apOnLamp');
    var apOffL = document.getElementById('apOffLamp');
    var offL = document.getElementById('apNoneLamp');
    if (!onL || !apOffL || !offL) return;
    onL.classList.toggle('on', val == 2);
    apOffL.classList.toggle('on', val == 1);
    offL.classList.toggle('on', val == 0);
  },
  cycleApTrims: function () {
    try {
      var cur = getLVar('BKSQ_AutopilotMasterSwitch', 'Number');
      if (cur === undefined) cur = 0;
      var MIN = 0,
        MAX = 2;
      if (cur <= MIN) TBM._apDir = 1;
      else if (cur >= MAX) TBM._apDir = -1;
      var next = cur + TBM._apDir;
      if (next < MIN) next = MIN;
      if (next > MAX) next = MAX;
      setLVar('BKSQ_AutopilotMasterSwitch', 'Number', next);
      TBM.setApTrimsVisual(next);
    } catch (e) {}
  },

  getXpdrState: function () {
    try {
      return webApi.GetSimVar('(A:TRANSPONDER STATE:1, Enum)');
    } catch (e) {
      return 0;
    }
  },
  getXpdrIdent: function () {
    try {
      return webApi.GetSimVar('(A:TRANSPONDER IDENT:1, Bool)');
    } catch (e) {
      return 0;
    }
  },
  setXpdrModeVisual: function (st) {
    var altL = document.getElementById('xpdrAltLamp');
    var stbyL = document.getElementById('xpdrStbyLamp');
    if (altL) altL.classList.toggle('on', st === 4);
    if (stbyL) stbyL.classList.toggle('on', st === 1);
    var sv = document.getElementById('xpdrStateVal');
    if (sv) {
      var nm = TBM.XPDR_STATE_NAMES[st];
      sv.textContent = nm !== undefined ? nm : String(st);
    }
    var i;
    for (i = 0; i <= 5; i++) {
      var dot = document.getElementById('xpdrSt' + i);
      if (dot) dot.classList.toggle('on', st === i);
    }
  },
  updateXpdrVisuals: function () {
    var st = TBM.getXpdrState();
    var on = st !== 0;
    setToggleVisual('xpdrPwrToggle', 'xpdrPwrInd', on, 'XPDR ON', 'XPDR OFF');
    TBM.setXpdrModeVisual(st);
    var now = Date.now();
    if (now - TBM._lastIdentPoll > 300) {
      TBM._identVal = TBM.getXpdrIdent();
      TBM._lastIdentPoll = now;
    }
    setToggleVisual('xpdrIdentBtn', 'xpdrIdentInd', TBM._identVal == 1, 'IDENT', 'IDENT');
  },
  toggleXpdrPwr: function () {
    try {
      var st = TBM.getXpdrState();
      if (st === 0) sendTbmP('SSP_TBM_AVN_XPDR_STDBY');
      else sendTbmP('SSP_TBM_AVN_XPDR_OFF');
      setTimeout(TBM.updateXpdrVisuals, 120);
    } catch (e) {}
  },
  toggleXpdrMode: function () {
    try {
      var st = TBM.getXpdrState();
      if (st === 0) return;
      if (st === 4) sendTbmP('SSP_TBM_AVN_XPDR_STDBY');
      else sendTbmP('SSP_TBM_AVN_XPDR_ALT');
      setTimeout(TBM.updateXpdrVisuals, 120);
    } catch (e) {}
  },
  xpdrIdent: function () {
    try {
      sendTbmP('SSP_TBM_AVN_XPDR_IDENT');
      setTimeout(function () {
        TBM._lastIdentPoll = 0;
        TBM.updateXpdrVisuals();
      }, 120);
    } catch (e) {}
  }
};
