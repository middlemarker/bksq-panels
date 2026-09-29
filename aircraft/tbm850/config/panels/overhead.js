window.SSP_PANELS.overhead = TBMPanel({
  pollIntervalMs: 50,
  gridClass: 'grid',
  layout: [
    'avncs_gyro', 'avncs_rmi', 'avncs_adi2', 'avncs_hsi2', 'elec_genRstMain', 'elec_genRstStby', 'empty', 'empty',
    'lts_test', 'empty', 'empty', 'empty', 'elec_source', 'elec_generator', 'empty', 'empty',
    'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'oxy_pilotMask',
    'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'oxy_pax',
    'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'oxy_master',
    'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'misc_hornTest'
  ],
  extraPolls: [
    { kind: 'custom', id: 'tbmLts' }
  ]
});
