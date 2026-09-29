window.SSP_PANELS = window.SSP_PANELS || {};
window.SSP_PANELS.misc = StarshipPanel({
  id: 'misc',
  layout: [
    /* ROW 1: warnings + wiper + units */
    'misc_silenceGear', 'misc_downlockRelease', 'empty', 'misc_doorBypass', 'misc_wiper', 'misc_regStyle', 'misc_baroUnit', 'empty',
    /* ROW 2: doors + meter */
    'empty', 'empty', 'empty', 'misc_cabDoor', 'misc_bagDoorL', 'misc_bagDoorR', 'misc_pedMeter', 'empty',
    /* ROW 3: GPU + AOA + headphone + DBU */
    'empty', 'empty', 'empty', 'misc_gpu', 'misc_aoa', 'misc_headphone', 'misc_dbu', 'empty',
    /* ROW 4: tablet + tilt UP */
    'empty', 'misc_efb', 'empty', 'empty', 'misc_efbTiltUp', 'empty', 'misc_efbSavePos', 'empty',
    /* ROW 5: tilt LEFT/DOWN/RIGHT */
    'empty', 'empty', 'empty', 'misc_efbTiltLeft', 'misc_efbTiltDown', 'misc_efbTiltRight', 'empty', 'empty'
  ]
});
