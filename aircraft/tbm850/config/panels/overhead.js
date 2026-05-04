window.SSP_PANELS.overhead = TBMPanel({
  pollIntervalMs: 50,
  gridClass: 'grid',
  layout: [
    'avncs_gyro', 'avncs_rmi', 'avncs_adi2', 'avncs_hsi2', 'elec_genRstMain', 'elec_genRstStby', 'elec_source', 'elec_generator',
    'lts_test', 'lts_deiceLtTest', 'lts_gearChkDown', 'lts_gearLtTest', 'lts_ittTest', 'lts_ecsLtTest', 'lts_annLt1', 'lts_annLt2',
    'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'oxy_pilotMask',
    'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'oxy_pax',
    'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'oxy_master',
    'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'misc_hornTest'
  ],
  extraPolls: [
    { kind: 'custom', id: 'tbmLts' }
  ]
});
