window.SSP_PANELS = window.SSP_PANELS || {};
window.SSP_PANELS.mfd = {
  id: 'mfd',
  gridClass: 'mfd-shell',
  skipFitGrid: true,
  renderMode: 'innerHtml',
  innerHtml:
    '<div class="mfd-top">' +
    '<div class="mfd-col">' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKL_1_PRESS\')">L1</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKL_2_PRESS\')">L2</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKL_3_PRESS\')">L3</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKL_4_PRESS\')">L4</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKL_5_PRESS\')">L5</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKL_6_PRESS\')">L6</button>' +
    '</div>' +
    '<div class="mfd-center">' +
    '<button class="btn g-mfd wide" onclick="sendP(\'SSP_MFD_PAGE_ADVANCE_PRESS\')">PAGE ADVANCE</button>' +
    '<button class="btn g-mfd-joy" onclick="sendP(\'SSP_MFD_JOY_UP_FAST_PRESS\')">&#x25B2;&#x25B2; UP FAST</button>' +
    '<button class="btn g-mfd-joy" onclick="sendP(\'SSP_MFD_JOY_UP_PRESS\')">&#x25B2; UP</button>' +
    '<button class="btn g-mfd-joy" onclick="sendP(\'SSP_MFD_JOY_RIGHT_FAST_PRESS\')">RT FAST &#x25B6;&#x25B6;</button>' +
    '<button class="btn g-mfd-joy" onclick="sendP(\'SSP_MFD_JOY_LEFT_PRESS\')">&#x25C0; LEFT</button>' +
    '<button class="btn g-mfd-joy" onclick="sendP(\'SSP_MFD_JOY_CENTER_PRESS\')">CENTER</button>' +
    '<button class="btn g-mfd-joy" onclick="sendP(\'SSP_MFD_JOY_RIGHT_PRESS\')">RIGHT &#x25B6;</button>' +
    '<button class="btn g-mfd-joy" onclick="sendP(\'SSP_MFD_JOY_LEFT_FAST_PRESS\')">&#x25C0;&#x25C0; LT FAST</button>' +
    '<button class="btn g-mfd-joy" onclick="sendP(\'SSP_MFD_JOY_DOWN_PRESS\')">&#x25BC; DOWN</button>' +
    '<button class="btn g-mfd-joy" onclick="sendP(\'SSP_MFD_JOY_DOWN_FAST_PRESS\')">&#x25BC;&#x25BC; DN FAST</button>' +
    '<button class="btn g-mfd wide" onclick="sendP(\'SSP_MFD_LINE_ADVANCE_PRESS\')">LINE ADVANCE</button>' +
    '</div>' +
    '<div class="mfd-col">' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKR_1_PRESS\')">R1</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKR_2_PRESS\')">R2</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKR_3_PRESS\')">R3</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKR_4_PRESS\')">R4</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKR_5_PRESS\')">R5</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKR_6_PRESS\')">R6</button>' +
    '</div>' +
    '</div>' +
    '<div class="mfd-bottom">' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKB_1_PRESS\')">B1</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKB_2_PRESS\')">B2</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKB_3_PRESS\')">B3</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKB_4_PRESS\')">B4</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKB_5_PRESS\')">B5</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKB_6_PRESS\')">B6</button>' +
    '<button class="btn g-mfd" onclick="sendP(\'SSP_MFD_LSKB_7_PRESS\')">B7</button>' +
    '</div>',
  polls: []
};
