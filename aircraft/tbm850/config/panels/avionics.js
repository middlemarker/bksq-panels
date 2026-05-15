window.SSP_PANELS.avionics = TBMPanel({
  pollIntervalMs: 50,
  gridClass: 'grid',
  layout: [
    'avncs_dhDec', 'avncs_dhInc', 'avncs_efisComposite','avncs_dhMode', 'empty', 'avncs_annBright',  'lts_annLt1', 'lts_annLt2',
    'avncs_efisPtrR', 'avncs_efisPtrL','empty', 'empty', 'empty',  'fuel_shift', 'fuel_sel', 'fuel_auxBp',  
    'empty', 'empty', 'empty', 'empty','empty', 'ecs_airCond', 'ecs_fanFlow', 'ecs_bleed', 
	'avncs_tawsTest', 'avncs_tawsInhb', 'avncs_tawsAnn', 'empty', 'avncs_apTrims', 'avncs_wxrMode', 'avncs_wxrRngDec', 'avncs_wxrRngInc', 
    'lts_panelDec', 'lts_panelInc', 'avncs_xpdrPwr', 'avncs_xpdrMode', 'avncs_xpdrIdent','empty', 'ecs_cabinTempDec', 'ecs_cabinTempInc',
	  'lts_deiceLtTest', 'lts_gearChkDown', 'lts_gearLtTest', 'lts_ittTest', 'lts_ecsLtTest', 'empty', 'empty','empty'
	
	
  ]
});
