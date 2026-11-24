# Frontend bug tracker — 24 Nov 2026

Source: [Full owner audit](frontend-owner-audit-2026-11-24.md).

111 page issues: 17 P0, 59 P1, 35 P2. The X-1–X-17 table in the source records related cross-page checks, not additional page issues.

## Status definitions

- Open: not yet verified against the current source.
- In progress: current investigation or implementation.
- Partially fixed: a tested subproblem is fixed; the issue still has outstanding work.
- Fixed locally: implementation and targeted automated checks pass; deployment verification pending.
- Needs backend / live check: source or production evidence is still required.

## Working notes

- Branch: `work/main-2026-11-24`.
- Existing uncommitted Drivers and LiveTracking edits predate this task and must be preserved.
- The original audit is evidence and suggested scope. Its historical agent/review/publishing process is not an authorization to contact support, mutate production data, or publish changes.
- Work starts with P0 safety and navigation; each row records actual validation.

## Progress

33 fixed locally, 5 partially fixed, 10 in progress, 63 open. All 111 original IDs remain in the table. No changes have been deployed.

## Issues

| ID | Severity | Issue | Status | Evidence / validation |
|---|---|---|---|---|
| DG-1 | P0 | Idling chip opens a page with no idling (owner's example) | Fixed locally | OwnerReportPanel.test.jsx: idling chip retains truck, instances view and selected day. |
| DG-2 | P1 | Extra-diesel chips and "possible fuel loss" chips go to the truck page, which shows neither | Fixed locally | OwnerReportPanel + AttentionCard tests: extra diesel and fuel-loss chips retain truck/day and select the correct Intelligence view. |
| DG-3 | P1 | Date arrows jump while the page refreshes | Fixed locally | Fixed widths for the Digest date control and both refresh controls; local visual check pending. |
| DG-4 | P1 | Live numbers mixed with past-day numbers | Fixed locally | OwnerReportPanel + briefingModel tests: past-day work stays in the day strip; live moving/dark counts sit in a separate Right now region and use current fleet counts when available. |
| DG-5 | P1 | ₹0 in big red on a day with no data | Fixed locally | briefingModel + OwnerReportPanel + DigestStory tests: absent/incomplete zero-valued calculations stay unknown; measured zero stays zero and uses neutral colour. |
| DG-6 | P1 | The day's own boxes disagree | Open | — |
| DG-7 | P2 | "Who drove well" / "Who needs a word" are always empty | Fixed locally | OwnerReportPanel + DigestStory tests: hide driver-score cards with no rows, while keeping genuine driver scores visible. The empty technical explanation and its raw date are no longer rendered. |
| DG-8 | P2 | "The day in numbers" is text grids | Open | — |
| VH-1 | P2 | Opening `/vehicles` directly first landed on `/digest` | Open | — |
| VH-2 | P2 | Sidebar flyout stays open over the page after you pick an item | Fixed locally | Sidebar tests: selecting a destination closes its submenu and route changes reset it; expanded desktop navigation reserves content/navbar space instead of covering the page. |
| VH-3 | P1 | The list doesn't answer the owner's questions | Open | — |
| VH-4 | P2 | Paging and filters | Open | — |
| VH-5 | P1 | Red delete bin on every row, next to view and edit | In progress | Implementation and regression checks underway. |
| VH-6 | P2 | Add Vehicle only offers two makes | In progress | Implementation and regression checks underway. |
| VH-7 | P2 | Vehicle Documents grid has no way to upload | In progress | Implementation and regression checks underway. |
| SV-1 | P0 | The three tabs contradict each other | Fixed locally | serviceForecasts + AlertsTab + UpcomingServiceTab tests: one active-fleet forecast selector drives service alerts and upcoming rows; TELEMETRY_START is not labelled as a recorded service. Forecast load failures have retry states. |
| SV-2 | P1 | "Tracked vehicles 133" for a 126-truck fleet | Fixed locally | serviceForecasts + UpcomingServiceTab tests: count only the current vehicle-list membership, exclude deactivated/removed trucks, deduplicate registrations, and keep missing forecasts Not assessed. |
| SV-3 | P2 | 133 stacked cards, each with a meaningless "IND" badge | Fixed locally | Upcoming Service is a table sorted by urgency and km remaining, with a top-overdue horizontal bar chart labelled in km. All matching active rows remain accessible; decorative IND badges removed. |
| TP-1 | P0 | Fuel tab → "Open fuel ledger" → completely white page, sidebar gone | Fixed locally | vehicleCards + navigation tests: fuel links open Mileage with the truck filter; stale route alias and authenticated NotFound fallback added. |
| TP-2 | P0 | "Assigned driver → Change →" → completely white page | Fixed locally | DriversPanel + navigation tests: all truck assignment links target Khata Ledger → Assignments; stale route alias supported. |
| TP-3 | P1 | Contradicting status pills | Open | — |
| TP-4 | P1 | Location shown as raw coordinates | Open | — |
| TP-5 | P1 | The lower "30-day" map isn't a real map (owner's "weird places") | Open | — |
| TP-6 | P2 | Top half of the page is a cartoon truck | Open | — |
| TP-7 | P2 | "Last 30 days" bars have no km axis; values only on hover | In progress | Implementation and regression checks underway. |
| TP-8 | P1 | Tab badges "Fuel 0", "Documents 0" though fuel data exists | Open | — |
| TP-9 | P1 | Fuel tab empty while the data exists | Open | — |
| TP-10 | P2 | Service tab is a derivation table | Open | — |
| TP-11 | P1 | Trips tab: every trip "<plant> → No drop", 18 of 20 "Needs review"; "No open cycle" while the truck is moving | Open | — |
| TP-12 | P1 | Drivers tab | Open | — |
| TP-13 | P2 | Telemetry tab | Open | — |
| TP-14 | P2 | Tyres & Axles: all "Not recorded" | Fixed locally | vehicleCards tests: one empty tyre state, real tyre-set save and refresh, restricted write roles, input retained on save failure, read retry, and existing set display preserved. |
| TP-15 | P1 | Truck page never shows idling, fuel loss, overspeed or stuck-at-plant, yet most "open truck" links land here | Open | — |
| WF-1 | P0 | Add Employee auto-fills the OWNER's login into the new employee | Fixed locally | BasicInformationForm test: empty employee credentials and explicit autocomplete settings. Same settings applied to add/edit modals. Saved-password behaviour in Edge still needs a manual check. |
| WF-2 | P0 | "View details" (eye icon) opens an EDIT form at `/drivers/add`; there is no employee profile | In progress | Implementation and regression checks underway. |
| WF-3 | P1 | Add Employee form | Open | — |
| WF-4 | P1 | Header "Employees 10" is the page size, not the total (there are 13 pages) | Fixed locally | DriversPage test: a ten-row page reports the API total of 126. Assignment-filter totals use the full matching list. Backend contract verified in user.service.js. |
| WF-5 | P1 | Access control: "Driver · 0 holders", while every Employees row says "Driver" | Open | — |
| WF-6 | P2 | Assigned Employees: test users and broken icons | Open | — |
| WF-7 | P2 | Clicking the Workforce icon only shows a label; the sub-menu doesn't expand from the icon rail | Fixed locally | Sidebar tests: clicking the employee group from the collapsed rail opens both navigation and submenu, including when the group was open before collapse. |
| TR-1 | P0 | Failed load shown as real zeros | Partially fixed | Count conversion and KPI defaults fixed; AutoTripsPage/tripCounts/TripKpiStrip tests cover failed reads. Account first-load failure/menu handling still needs verification; existing provider already preserves the last successful profile on refetch failure. |
| TR-2 | P1 | After retry, parts still fail | Open | — |
| TR-3 | P1 | No destination prediction anywhere in Trips (owner's point) | Open | — |
| TR-4 | P1 | Live trip page (`/auto-trips/6b04bbdc…`) | Partially fixed | Replay now uses the shared readable road style. Prediction truncation, cost breakdown, durations, toll copy and timeline remain open. |
| TR-5 | P1 | Delivered list (`?status=COMPLETE`) | Open | — |
| TR-6 | P1 | Delivered trip page (WB11G1462, 167 km) | Partially fixed | Replay now uses the shared readable road style. Map legend, pickup-as-drop question and implausible unload duration remain open. |
| TR-7 | P0 | History view shows raw timestamps | Fixed locally | TripHistoryTab test: 2026-03-31T18:30Z displays as 1 Apr in IST. Selected periods are also formatted. |
| TR-8 | P2 | Navigation inside Trips | Open | — |
| TR-9 | P2 | Review places (Trips → Review places) | Open | — |
| AP-1 | P1 | WhatsApp tab tiles | In progress | Implementation and regression checks underway. |
| AP-2 | P1 | Bad rows shown without warning | In progress | Implementation and regression checks underway. |
| AP-3 | P1 | One-click approve tick on every row, next to view (rule 9) | In progress | Implementation and regression checks underway. |
| AP-4 | P1 | Truck suggestion hidden in the bill drawer | In progress | Implementation and regression checks underway. |
| AP-5 | P2 | Jargon in the drawer | In progress | Implementation and regression checks underway. |
| AL-1 | P1 | Almost all 291 alerts are "Critical", and every fuel alert admits it doesn't know | Open | — |
| AL-2 | P1 | Alert detail has nothing to check against | Open | — |
| AL-3 | P2 | Banner and filter problems | Open | — |
| IN-1 | P0 | Same label, two numbers, on one page | Fixed locally | IntelligencePage integration test: overview, section badge, briefing and chips agree for multiple findings on the same truck; one loaded list and one affected-subject selector also apply the truck/kind filters. |
| IN-2 | P0 | Issues "No data" repeats the same truck once per day | Fixed locally | IssuesTab test: daily snapshots of the same truck/kind collapse to the newest row before filters and counts; different issue kinds remain separate. |
| IN-3 | P1 | "Account stopped sending data — 2 accounts" lists a truck number (BR44GB1162) as an account | Open | — |
| IN-4 | P2 | Issues dot grid is unreadable | Fixed locally | IssueGroup test: readable distinct evidence-day count over fourteen days, with last date; no dot-cell strip. |
| IN-5 | P1 | Trucks report cards | Open | — |
| IN-6 | P1 | Report card drawer | Open | — |
| IN-7 | P0 | Drivers tab: 121 drivers, all "Insufficient data" | Open | — |
| IN-8 | P1 | Idling: numbers repeated, and they disagree | Open | — |
| IN-9 | P1 | Overspeed: 76 vs 0 on one screen | Open | — |
| IN-10 | P2 | Cruise & gears | Open | — |
| IN-11 | P1 | Detours: "14 detours" above "Route deviation: 52 detours, 50 open"; cost priced for 3 of 50 | Open | — |
| IN-12 | P0 | Fuel checks contradicts Alert Inbox | Open | — |
| IN-13 | P1 | Mileage & DEF is empty ("No km/L figures for this period yet"), while Performance → Vehicles shows km/L for 50 trucks | Open | — |
| IN-14 | P2 | Loaded & empty runs: the chart is good, the counts aren't | Open | — |
| IN-15 | P1 | Places: no place prediction (owner's point) | Open | — |
| IN-16 | P1 | Performance → Vehicles silently cuts the list | Open | — |
| IN-17 | P1 | Performance → Drivers ignores the date picker and is empty | Fixed locally | IntelligencePage + DriversTab tests: selected dates reach the driver table and DNA drawer, including after a range change. Empty measurements stay unknown; upstream driver-score availability remains tracked in IN-7. |
| IN-18 | P2 | Leaderboards | Open | — |
| IN-19 | P1 | Slow load: once took > 50 s to settle (`?tab=vehicles`) | Open | — |
| IN-20 | P2 | "Drivers" tab appears twice; "Trucks" and "Vehicles" are both per-truck views | Fixed locally | intelligenceTabs + IntelligencePage tests: Truck scores / Driver scores and Truck measurements / Driver measurements have unique names; tab IDs and existing links remain valid. |
| IN-21 | P2 | Driver idling link ignores the driver | Fixed locally | IdlingTab + idlingDriverFilter tests: recorded-driver precedence, complete assignment paging, exact truck match, whole-event assignment coverage, handovers and unavailable/retry states. Map, lists and totals use the filtered rows. |
| FU-1 | P0 | Diesel & Mileage → Mileage: every sub-view is empty | Open | — |
| FU-2 | P2 | Bill check tab is empty | Open | — |
| FU-3 | P1 | Fuel Integrity loads slowly and the summary is incomplete | Open | — |
| FU-4 | P0 | Threat Matrix shows implausible losses as CRITICAL theft | Fixed locally | fiData + fuelMeasurementPresentation tests: losses above 30% of fills, or losses without positive dispensed fuel, show Data check needed. Unknown checks are not counted as clean vehicles. |
| FU-5 | P1 | Loss shown with two signs | Fixed locally | fuelMeasurementPresentation test: the pipeline and headline card both show loss as a positive volume. Truck card and inspector use the same volume convention. |
| FU-6 | P2 | Tab names are alarming, not plain | Fixed locally | FuelIntegrityTables uses Fuel events, Trucks and Pumps. Pump-ledger integration test updated and passing. |
| FU-7 | P1 | Incident feed rows have no location | Open | — |
| FU-8 | P2 | Pump watchlist says nothing | Open | — |
| FU-9 | P2 | Analytics chart is misleading | Fixed locally | FuelActivityPanel uses daily bars with units; fiData + fuelMeasurementPresentation tests cover distinct loss/DEF/bill event counts and real chart values. Affected-truck bars explicitly describe the loaded-feed scope. |
| FU-10 | P1 | Refuel advisory (`/refuel-advisory`, no menu entry) | Open | — |
| FU-11 | P0 | DEF ledger shows 0 for a month of driving | Open | — |
| FU-12 | P1 | DEF normal band differs between pages | Fixed locally | MileageDefTab + fuelMeasurementPresentation tests: shared DEF comparison helper uses the truck/model band from the response in both views; missing or invalid bands remain unavailable. Removed the conflicting hardcoded 4–7% claim. |
| FU-13 | P1 | Unknown shown as zero | Fixed locally | fuelMeasurementPresentation tests: missing fuel, engine use, tank delta, daily rate, costs and flag counts stay unknown; measured zero remains zero. Missing vehicle checks no longer imply a healthy vehicle. |
| TK-1 | P0 | Selecting a truck shows a blank beige map | Fixed locally | mapStyles + LiveMapCanvas tests: visible orange highways, arterial roads and road labels in both themes; Track mode keeps roads. AutoTripReplay reuses the shared light style. Live map-key/rendering check pending. |
| TK-2 | P1 | Track mode for a moving truck | Open | — |
| TK-3 | P1 | "Where next" has no prediction behind it | Open | — |
| TK-4 | P1 | Moving truck labelled as a truck stop | Open | — |
| TK-5 | P1 | Places & routes panel | Open | — |
| TK-6 | P2 | Satellite shows no town or road names | Fixed locally | useLiveMap test: satellite mode uses hybrid for town/road labels on load and mode changes. |
| TK-7 | P2 | Slow load and card clutter | Open | — |
| RH-1 | P1 | Numbers disagree with Intelligence and Trips | Open | — |
| RH-2 | P1 | Maps | Open | — |
| RH-3 | P2 | Profitability was still loading skeletons after 9 s | Open | — |
| OT-1 | P0 | Khata ledger contradicts Fuel Integrity | Open | — |
| OT-2 | P1 | Tolls page (`/tolls`) is switched off | Open | — |
| OT-3 | P1 | Reports → Vehicle report | Open | — |
| OT-4 | P1 | Place Hub base map stayed blank grey with clusters floating on it | Open | — |
| OT-5 | P2 | App Usage: 97 of 195 screens are opened fewer than 2 times, or never | Open | — |
| AW-1 | P1 | Sidebar is icons only; names appear on hover | Fixed locally | Sidebar tests: desktop labels remain expanded until toggled, hover does not change state, and mobile selection closes the drawer. Navbar toggle is visible on desktop. |
| AW-2 | P2 | Menu names don't match page titles | Fixed locally | sideNavItems + sideNavUtils tests: destination labels align with Live tracking, Trips, Employees, Access control, Diesel & Mileage and Place Hub; route, feature and role gates preserved. |
| AW-3 | P1 | Three overlapping alert pages, and the app admits it | Open | — |
| AW-4 | P1 | Orphan routes with no menu link | Partially fixed | Performance/overspeed/hotspots redirects preserve truck/driver/date/state/hash, Mileage links keep the Mileage tab, and legacy /trip/:id opens the real journey detail. Orphan-menu entries still open. |
| AW-5 | P2 | Four different map looks with no shared base | Partially fixed | Track and AutoTripReplay share the road style; remaining map surfaces and the truck-page grid still require reconciliation. |

## First implementation batch

Implemented locally on 24 Nov 2026. Production verification is pending for every issue.

- Regression tests cover navigation, selected truck/day, credential autocomplete, failed counts, IST date rollover, employee totals, duplicate snapshots, evidence-day summaries, map styles and satellite labels.
- Full lint: passed with 0 errors and 17 existing warnings.
- `npm run build`: passed. Includes lint, all 4,685 tests in 570 files, production Vite build and `scripts/check-bundle.mjs`.
- Bundle limits unchanged: entry 359,169 / 600,000 bytes; largest chunk 734,293 / 800,000 bytes; total JavaScript 7,935,295 / 8,200,000 bytes.
- `git diff --check`: passed. Audit copy matches the supplied file exactly, and the tracker contains all 111 unique issue IDs.
- Browser checks with a saved Edge login and live Google Maps, plus production endpoint comparisons, remain pending. Automated checks establish local behaviour only.
- No production data changes, support messages, commits, pushes, PRs or deployments were performed.

Next priority: WF-2 (employee profile), IN-7 (driver score availability), then the remaining P0 issues. Verify current endpoint contracts before unifying cross-page numbers. Backend/live-data dependencies stay open until there is evidence; hiding a number does not establish the correct value.

## Batch of ten — service and fuel presentation

Requested workflow: implement ten issues, run the complete checks, then record the result before starting another batch.

Issues: SV-1, SV-2, SV-3, FU-4, FU-5, FU-6, FU-9, FU-12, FU-13, DG-7.

- Service tabs and the alert badge read the same active-fleet forecast selector. TELEMETRY_START dates are no longer presented as recorded services. The upcoming list is a sorted table with a top-overdue bar chart in km.
- Implausible fuel losses are labelled Data check needed, while missing measures stay unknown. Loss amounts use the same positive-volume convention in the headline and pipeline.
- Fuel tabs use plain labels. Daily activity uses bars, and affected-truck bars count distinct flagged events from the loaded feed; that scope is stated on screen.
- DEF comparison labels use the truck/model band supplied by the API. No universal 4–7% range is invented for a truck whose band is absent; manufacturer/model overrides remain authoritative.
- Empty driver-score cards are hidden while genuine scores remain visible.
- Focused checks: 185 tests pass in 24 files.
- Complete batch gate: `npm run build` passed, including lint (0 errors, 17 existing warnings), all 4,700 tests in 572 files, production build and unchanged bundle limits.
- Bundle results: entry 359,479 / 600,000 bytes; largest chunk 734,293 / 800,000 bytes; total JavaScript 7,925,311 / 8,200,000 bytes.
- All ten issues in this batch are fixed locally. Browser/production verification is pending; nothing has been deployed.

## Batch of ten — issue counts, filters and navigation

Issues: IN-1, IN-17, IN-20, IN-21, DG-4, VH-2, WF-7, AW-1, AW-2, TP-14.

- Intelligence uses one loaded issue list for the overview, section badge and Issues tab. Needs you and Watch count distinct trucks/accounts after selecting the newest truck/kind snapshots and applying the same truck/kind filters. All remains a count of findings.
- Driver measurements and the DNA drawer request the selected dates. Empty measurements remain unknown; this change does not create missing driver readings. Driver scorecards and measurements have distinct names, preserving existing tab URLs.
- Driver idling filters the map, lists and totals by recorded event driver, with assignment fallback only when the recorded interval covers the whole idle. The assignment read follows every page. Unattributed events are excluded, and assignment failures show unavailable totals and a retry. The existing 500-event history limit remains disclosed; IN-8 remains open.
- Past-day Digest tiles contain the selected day's work and fuel figures. Live moving/dark tiles sit in a separate Right now strip.
- Desktop navigation shows labels by default, reserves its width beside content, and has a visible toggle. Group icons expand their submenu even after a previous collapse. Selection closes the submenu; mobile selection closes the drawer. Collapsed children cannot receive keyboard focus.
- Destination names match Live tracking, Trips, Employees, Access control, Diesel & Mileage and Place Hub. Fuel remains a category containing its three destinations.
- An empty tyre tab shows one Add tyre details state. Owners/managers can record the fitted set through the existing tyre-set endpoint; other roles see who can add it. Failed reads have Retry, failed writes retain input, and a successful write prevents duplicate submission while refreshing the set. Existing recorded sets remain visible without attributing set totals to individual wheels.
- Complete gate: `npm run build` passed on the final source, including lint (0 errors, 17 existing warnings), all 4,723 tests in 575 files, the production Vite build and `scripts/check-bundle.mjs`.
- Bundle limits unchanged: entry 359,479 / 600,000 bytes; largest chunk 734,293 / 800,000 bytes; total JavaScript 7,930,909 / 8,200,000 bytes across 590 files.
- `git diff --check` passed. All 111 unique issue IDs remain, and the audit copy is unchanged from the supplied file.
- All ten issues are fixed locally. Browser/live-data verification remains pending. No production writes, commits, pushes or deployments were performed.
