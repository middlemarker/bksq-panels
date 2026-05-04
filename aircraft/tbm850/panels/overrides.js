window.SSP_PANEL_OVERRIDES = {
  polls: {
    tbmLts: function () {
      if (!document.getElementById('ltsBtn')) return;
      var lts = getLVar('var_OverheadLightTestButton', 'Number');
      if (Date.now() < TBM.ltsHoldUntil) {
        setToggleVisual('ltsBtn', 'ltsInd', true, 'LTS TST', 'LTS TST');
      } else {
        setToggleVisual('ltsBtn', 'ltsInd', lts == 1, 'LTS TST', 'LTS TST');
      }
    }
  },
  onPoll: function (pid) {
    if (pid === 'overhead') {
      if (document.getElementById('genSwitchToggle')) {
        var genSw = getLVar('BKSQ_GeneratorSwitch', 'Number');
        if (genSw !== undefined) TBM.setGenSwitchVisual(genSw);
      }
      if (document.getElementById('srcSwitchToggle')) {
        var srcSw = getLVar('BKSQ_SourceSwitch', 'Number');
        if (srcSw !== undefined) TBM.setSourceSwitchVisual(srcSw);
      }
      return;
    }
    if (pid === 'avionics' || pid === 'environment') {
      if (document.getElementById('fuelSelToggle')) {
        var fauto = getLVar('var_AutoFuelSelectorSwitch', 'Bool');
        if (fauto !== undefined) TBM.setFuelSelVisual(fauto);
      }
      if (document.getElementById('auxBpToggle')) {
        TBM.setAuxBpVisual(getLVar('BKSQ_fuelPumpSwitch', 'Number'));
      }
      if (document.getElementById('apTrimsToggle')) {
        var apm = getLVar('BKSQ_AutopilotMasterSwitch', 'Number');
        if (apm !== undefined) TBM.setApTrimsVisual(apm);
      }
      var wxm = getLVar('var_radarMode', 'Number');
      if (wxm !== undefined && document.getElementById('wxrModeVal')) {
        TBM.setWxrModeVisual(wxm);
      }
      if (document.getElementById('dhModeBtn')) {
        TBM.setDhModeVisual(TBM.uiState.dhMode);
      }
      if (document.getElementById('xpdrStateVal') || document.getElementById('xpdrPwrToggle')) {
        TBM.updateXpdrVisuals();
      }
      if (document.getElementById('fanFlowToggle')) {
        var fan = getLVar('var_FanSwitch', 'Number');
        if (fan !== undefined) TBM.setFanFlowVisual(fan);
      }
      if (document.getElementById('airCondToggle')) {
        var ac = getLVar('var_airconState', 'Number');
        if (ac !== undefined) TBM.setAirCondVisual(ac);
      }
      if (document.getElementById('bleedToggle')) {
        var bleed = getLVar('var_bleedState', 'Number');
        if (bleed !== undefined) TBM.setBleedVisual(bleed);
      }
      return;
    }
  }
};
