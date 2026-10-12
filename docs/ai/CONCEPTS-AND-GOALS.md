# Concepts and goals

## Glossary

| Term | Meaning |
|------|---------|
| **AAO** | AxisAndOhs — bridges MSFS and external devices/web |
| **L-var** | `(L:name, Type)` sim/local variable via AAO |
| **A-var** | `(A:expression)` aircraft/sim variable |
| **H-event / K-event** | MSFS event triggered via `(>K:group-label)` |
| **IE:** | Input event form in RPN, e.g. `(>IE:NAVCOM_TRANSPONDER_FUNC)` |
| **SSP label** | String like `SSP_TBM_OH_GYRO_TOGGLE` in XML script name |
| **Event group** | Prefix in K-event path (`bksq-tbm-panel`) |
| **Token** | Key in `config/buttons.js` placed in panel `layout[]` |
| **Poll rule** | Declarative binding from sim var → DOM |
| **Lamp map** | Function in `SSPRuntime.lampMaps` for multi-segment indicators |
| **Shipped layout** | The `layout[]` in `config/panels/<page>.js` |
| **Saved layout / override** | A user's layout for one page in `localStorage`, applied over the shipped layout at boot |
| **Edit mode** | On-device layout editor (EDIT in the nav): Move and Delete modes, picker, undo, JSON import/export |
| **Picker** | Edit-mode popover next to a tapped cell for choosing a button |
| **Token prefix / system** | Part of a token before `_` (`avncs`, `lts`…); groups buttons in the picker and drives suggestions |
| **Home page / auto-home** | Page the panel returns to after the configured idle time |
| **Nav tools** | ⌂ and EDIT buttons on the right of every bottom bar, hub included |

## Project goals

1. Usable cockpit companion on **old iPads** (A7, 768px portrait).
2. Maintainable **data-driven** panels per aircraft.
3. Optional **edit mode** for personal layouts without forking the repo, portable via JSON.
4. Clear **audit trail** for layout mistakes (unknown tokens, dead polls).
5. **Consistent chrome**: the bottom bar looks and behaves the same on every page and on the settings screen.
6. **Documentation kept current** with every change (see `AGENTS.md`).

## Non-goals

- Replacing in-cockpit glass or full EFB navigation suite.
- Supporting browsers below iOS 12 / ES5.
- Auto-fixing layout comments or reordering production grids without human review.

## Performance budget

| Area | Target |
|------|--------|
| AAO GET | One in-flight request; URL rebuilt only when var set changes |
| Poll interval | User 50–2000 ms; adaptive widen on slow RTT |
| DOM | Cache `getElementById` per poll rule; skip tick if `dataRevision` unchanged |
| Slow gauges | `everyMs` ≥ 250–500 on fuel/temp/pressure readouts |
| Overrides | Lazy-register fallback A-vars only when primary missing |
| Compositing | No full-page `filter`; scoped `will-change` only during scale |
| Hidden tab | Skip poll work when `document.hidden` |
| Edit mode | Zero cost until EDIT is tapped (lazy script); picker tiles built once, filtered by `display` |
| Auto-home | One 1 s interval, only while a home page other than the current page is set |

## Quality gates

- ES5 lint clean.
- Manifest 0 missing labels per aircraft.
- Layout audit regenerated when panels/buttons change.
- Docs updated in the same change as the code (map in `docs/DEVELOPER-GUIDE.md` → Keeping docs current).
