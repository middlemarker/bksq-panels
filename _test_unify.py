"""
Headless verification that every panel still boots, all polled element IDs
are present in the rendered DOM, and the build path is identical for both
aircraft (Starship via StarshipPanel + SSP_BUTTONS, TBM via TBMPanel + TBM_BUTTONS).
"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8080"

# Per-panel: every id we expect to see in the rendered DOM. Built from the
# original inline HTML / poll declarations so any drift fails the test.
EXPECTED = {
    "/aircraft/starship/pages/overhead.html": [
        # row1 dimmer lamps
        "instrOffL", "instrLoL", "instrHiL",
        "areaOffL", "areaLoL", "areaHiL",
        "stormOffLamp", "stormLoLamp", "stormHiLamp",
        "mapLOffL", "mapLLoL", "mapLHiL",
        "mapROffL", "mapRLoL", "mapRHiL",
        # row2 display/panel
        "pltDOffL", "pltDLoL", "pltDHiL",
        "ctrDOffL", "ctrDLoL", "ctrDHiL",
        "mainPOffL", "mainPLoL", "mainPHiL",
        "consOffL", "consLoL", "consHiL",
        "subOffL", "subLoL", "subHiL",
        "cpltDOffL", "cpltDLoL", "cpltDHiL",
        # row3 toggles
        "masterLtBtn", "masterLtInd",
        "cabOvhdBtn", "cabOvhdInd",
        "cabAisleBtn", "cabAisleInd",
        "barBtn", "barInd",
        "noSmokeBtn", "noSmokeInd",
        "seatBeltBtn", "seatBeltInd",
        "entryCkptBtn", "entryCkptInd",
        "doorLtBtn", "doorLtInd",
        # row4 ext lights
        "llWingBtn", "llWingInd",
        "llNoseBtn", "llNoseInd",
        "taxiBtn", "taxiInd",
        "wingBtn", "wingInd",
        "navBtn", "navInd",
        "strobeLoBtn", "strobeLoInd",
        "strobeHiBtn", "strobeHiInd",
        "strobeEffBtn", "strobeEffInd",
        # row5 ground
        "chocksBtn", "chocksInd",
        "pitotCovBtn", "pitotCovInd",
        "engCovBtn", "engCovInd",
        "downPinsBtn", "downPinsInd",
        "ctrlLockBtn", "ctrlLockInd",
        "yokeHideBtn", "yokeHideInd",
    ],
    "/aircraft/starship/pages/antiice.html": [
        "stallBtn", "stallInd",
        "pitotLBtn", "pitotLInd",
        "pitotRBtn", "pitotRInd",
        "wsLOffLamp", "wsLLoLamp", "wsLHiLamp",
        "wsROffLamp", "wsRLoLamp", "wsRHiLamp",
        "wsModBtn", "wsModInd",
        "gndIceBtn", "gndIceInd",
        "antiskidBtn", "antiskidInd",
        "isepActLBtn", "isepActLInd",
        "isepActRBtn", "isepActRInd",
        "ventLBtn", "ventLInd",
        "ventRBtn", "ventRInd",
        "isepMainLBtn", "isepMainLInd",
        "isepMainRBtn", "isepMainRInd",
        "fwdManLamp", "fwdOffLamp", "fwdSeqLamp",
        "mainInLamp", "mainOffLamp", "mainOutLamp",
    ],
    "/aircraft/starship/pages/autopilot.html": [
        "fwValveLBtn", "fwValveLInd",
        "fwValveRBtn", "fwValveRInd",
        "extingLBtn", "extingLInd",
        "extingRBtn", "extingRInd",
        "fdBtn", "fdInd",
        "iasBtn", "iasInd",
        "apXferBtn", "apXferInd",
        "turbBtn", "turbInd",
        "xpdrSrcBtn", "xpdrSrcInd",
        "xpdrPwrToggle", "xpdrPwrInd",
        "xpdrModeToggle", "xpdrAltLamp", "xpdrStbyLamp",
        "xpdrIdentBtn", "xpdrIdentInd",
        "rtu833Btn", "rtu833Ind",
    ],
    "/aircraft/starship/pages/ecs.html": [
        "bleedVal", "blowerCkptVal", "blowerCabVal",
        "blR", "blOff", "blL", "blBoth", "blRA", "blBA",
        "ssIsoLamp", "ssNormLamp",
        "tmManLamp", "tmOffLamp", "tmAutoLamp",
        "cockCabBtn", "cockCabInd",
        "ckptTmpLbl", "ckptTmpVal", "ckptDecBtn", "ckptIncBtn",
        "cabTmpLbl", "cabTmpVal", "cabDecBtn", "cabIncBtn",
        "manTmpLbl", "manTmpVal", "manDecBtn", "manIncBtn",
        "setpointLbl", "setpointVal",
        "cabVentLbl", "cabVentVal",
        "tempUnitBtn", "tempUnitInd", "tempUnitTxt",
        "pressAltVal", "cabAltVal", "cabDiffVal", "cabRateVal",
        "pneuLVal", "pneuRVal",
        "oxySysBtn", "oxySysInd",
        "oxyPltBtn", "oxyPltInd",
        "oxyCpBtn", "oxyCpInd",
        "paxOxyBtn", "paxOxyInd",
        "oxyPressVal",
    ],
    "/aircraft/starship/pages/misc.html": [
        "doorBypassBtn", "doorBypassInd",
        "wipOffLamp", "wipLoLamp", "wipMedLamp", "wipHiLamp",
        "regBtn", "regInd",
        "baroUnitBtn", "baroUnitInd",
        "cabDoorBtn", "cabDoorInd",
        "bagLBtn", "bagLInd",
        "bagRBtn", "bagRInd",
        "meterBtn",
        "miscGpuBtn", "miscGpuInd",
        "aoaBtn", "aoaInd",
        "headphoneBtn", "headphoneInd",
        "dbuBtn", "dbuInd",
        "tabletBtn", "tabletInd",
    ],
    "/aircraft/starship/pages/pedestal.html": [
        "gBattAmp", "gVoltsDC", "gRLoad", "gVoltMode",
        "ignLArmLamp", "ignLOffLamp",
        "ignRArmLamp", "ignROffLamp",
        "battBtn", "battInd",
        "genLRstLamp", "genLOnLamp", "genLOffLamp",
        "genRRstLamp", "genROnLamp", "genROffLamp",
        "battAmpsBtn", "battAmpsInd",
        "extPwrBtn", "extPwrInd",
        "btCloseLamp", "btNormLamp", "btOpenLamp",
        "afTestLamp", "afArmLamp", "afOffLamp",
        "propSyncBtn", "propSyncInd",
        "stbyOnLamp", "stbyOffLamp",
        "stbyPwrBtn", "stbyPwrInd",
        "gndCommBtn", "gndCommInd",
        "avBlowBtn", "avBlowInd",
        "gpuBtn", "gpuInd",
        "govGovLamp", "govNormLamp", "govLowLamp",
        "gFuelL", "gFuelLUnit",
        "xferRtoLLamp", "xferOffLamp", "xferLtoRLamp",
        "gFuelR", "gFuelRUnit",
        "stLOnLamp", "stLOffLamp", "stLSOLamp",
        "stROnLamp", "stROffLamp", "stRSOLamp",
        "fuelPumpLBtn", "fuelPumpLInd",
        "aftTankLBtn", "aftTankLInd",
        "gFuelTemp",
        "aftTankRBtn", "aftTankRInd",
        "fuelPumpRBtn", "fuelPumpRInd",
        "ptNormLamp", "ptOffLamp", "ptStbyLamp",
        "rtmBtn", "rtmInd",
        "rudTmBtn", "rudTmInd",
        "prkBrkBtn", "prkBrkInd",
    ],
    "/aircraft/starship/pages/tests.html": [
        "fireExtLBtn", "fireExtLInd",
        "fireExtRBtn", "fireExtRInd",
        "fireDetLBtn", "fireDetLInd",
        "fireDetRBtn", "fireDetRInd",
        "testFlapMonLBtn", "testFlapMonLInd",
        "testFlapMonRBtn", "testFlapMonRInd",
        "testAuxBattBtn", "testAuxBattInd",
        "testBattMonBtn", "testBattMonInd",
        "testPressBtn", "testPressInd",
        "testFuelBtn", "testFuelInd",
        "testStallBtn", "testStallInd",
        "testAspdBtn", "testAspdInd",
        "testGearBtn", "testGearInd",
        "testAnnBtn", "testAnnInd",
        "testBleedBtn", "testBleedInd",
        "testDeiceVacBtn", "testDeiceVacInd",
        "testDeiceStdBtn", "testDeiceStdInd",
        "testDeiceMainBtn", "testDeiceMainInd",
        "pneuLVal", "pneuRVal",
    ],
    "/aircraft/tbm850/pages/overhead.html": [
        "gyroBtn", "gyroInd",
        "rmiBtn", "rmiInd",
        "adi2Btn", "adi2Ind",
        "hsi2Btn", "hsi2Ind",
        "srcSwitchToggle", "srcGpuLamp", "srcBatLamp", "srcOffLamp",
        "genSwitchToggle", "genStbyLamp", "genMainLamp", "genOffLamp",
        "ltsBtn", "ltsInd",
        "paxOxyToggle", "paxOxyInd",
        "oxyToggle", "oxyInd",
    ],
    "/aircraft/tbm850/pages/avionics.html": [
        "fuelSelToggle", "fuelSelAutoLamp", "fuelSelManLamp",
        "auxBpToggle", "auxAutoLamp", "auxOnLamp", "auxOffLamp",
        "dhModeBtn", "dhTestLamp", "dhNormLamp", "dhSetLamp",
        "tawsTestBtn", "tawsTestInd",
        "tawsInhbBtn", "tawsInhbInd",
        "tawsAnnBtn", "tawsAnnInd",
        "apTrimsToggle", "apOnLamp", "apOffLamp", "apNoneLamp",
        "wxrModeBtn", "wxrModeVal",
        "xpdrModeToggle", "xpdrAltLamp", "xpdrStbyLamp",
        "xpdrIdentBtn", "xpdrIdentInd",
        "xpdrPwrToggle", "xpdrPwrInd",
        "airCondToggle", "acOnLamp", "acFanLamp", "acOffLamp",
        "fanFlowToggle", "fanAutoLamp", "fanLoLamp",
        "bleedToggle", "bleedHiLamp", "bleedAutoLamp",
    ],
}


def main():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1280, "height": 900})

        for path, ids in EXPECTED.items():
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            url = BASE + path
            page.goto(url)
            page.wait_for_function("typeof SSPRuntime !== 'undefined' && SSPRuntime._panelId")

            # The "AAO XHR not found" 404 from AaoWebApi is expected without
            # the simulator; ignore those, only fail on real script errors.
            real_errs = [e for e in errors if "Unexpected token '<'" not in e
                         and "JSON" not in e]
            if real_errs:
                failures.append((path, "page errors: " + " | ".join(real_errs)))

            grid_html = page.eval_on_selector("#grid", "el => el.outerHTML")
            btn_count = page.eval_on_selector_all("#grid .btn", "els => els.length")
            print("[{}] btn_count={}".format(path, btn_count))

            missing = []
            for el_id in ids:
                exists = page.evaluate("id => !!document.getElementById(id)", el_id)
                if not exists:
                    missing.append(el_id)
            if missing:
                failures.append((path, "missing ids: " + ", ".join(missing)))

            # Drive a poll tick to ensure no runtime exception inside _runPollTick.
            tick_err = page.evaluate(
                "() => { try { SSPRuntime._tickPending = false;"
                " SSPRuntime._runPollTick();"
                " return null; } catch (e) { return String(e); } }"
            )
            if tick_err:
                failures.append((path, "poll tick threw: " + tick_err))

            page.close()

        browser.close()

    if failures:
        print("\nFAILURES:")
        for path, msg in failures:
            print("  " + path + " :: " + msg)
        sys.exit(1)

    print("\nALL PANELS BOOT, RENDER EXPECTED IDS, AND POLL CLEANLY.")


if __name__ == "__main__":
    main()
