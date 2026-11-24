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
- The working tree was clean before the vehicle, employee and approval batch. Commit `af2b8734` includes the ten fixes previously marked In progress.
- The original audit is evidence and suggested scope. Its historical agent/review/publishing process is not an authorization to contact support, mutate production data, or publish changes.
- Work starts with P0 safety and navigation; each row records actual validation.

## Progress

87 fixed locally, 24 partially fixed, 0 open. All 111 original IDs remain in the table. No changes have been deployed.

## Issues

| ID | Severity | Issue | Status | Evidence / validation |
|---|---|---|---|---|
| DG-1 | P0 | Idling chip opens a page with no idling (owner's example) | Fixed locally | OwnerReportPanel.test.jsx: idling chip retains truck, instances view and selected day. |
| DG-2 | P1 | Extra-diesel chips and "possible fuel loss" chips go to the truck page, which shows neither | Fixed locally | OwnerReportPanel + AttentionCard tests: extra diesel and fuel-loss chips retain truck/day and select the correct Intelligence view. |
| DG-3 | P1 | Date arrows jump while the page refreshes | Fixed locally | Fixed widths for the Digest date control and both refresh controls; local visual check pending. |
| DG-4 | P1 | Live numbers mixed with past-day numbers | Fixed locally | OwnerReportPanel + briefingModel tests: past-day work stays in the day strip; live moving/dark counts sit in a separate Right now region and use current fleet counts when available. |
| DG-5 | P1 | ₹0 in big red on a day with no data | Fixed locally | briefingModel + OwnerReportPanel + DigestStory tests: absent/incomplete zero-valued calculations stay unknown; measured zero stays zero and uses neutral colour. |
| DG-6 | P1 | The day's own boxes disagree | Partially fixed | Digest no longer prints a fall percentage for a zero trip count with unclear coverage. Attention explains the difference between its duration-filtered alerts and shorter idles included in the fuel estimate. A shared backend threshold and the original day still need confirmation. |
| DG-7 | P2 | "Who drove well" / "Who needs a word" are always empty | Fixed locally | OwnerReportPanel + DigestStory tests: hide driver-score cards with no rows, while keeping genuine driver scores visible. The empty technical explanation and its raw date are no longer rendered. |
| DG-8 | P2 | "The day in numbers" is text grids | Fixed locally | Digest Trend now compares the selected day, previous seven days and matching weekdays in separate trip and loaded-distance bar charts. Missing values stay out of the bars and partial coverage is named. |
| VH-1 | P2 | Opening `/vehicles` directly first landed on `/digest` | Fixed locally | The auth guard retains the intended app path, query and hash. Onboarded users return to it after login, with defaults for direct login and existing role-specific routing. Tests cover vehicle deep links and invalid destinations. |
| VH-2 | P2 | Sidebar flyout stays open over the page after you pick an item | Fixed locally | Sidebar tests: selecting a destination closes its submenu and route changes reset it; expanded desktop navigation reserves content/navbar space instead of covering the page. |
| VH-3 | P1 | The list doesn't answer the owner's questions | Fixed locally | Vehicles joins the scoped Live Tracking read by registration. Rows show motion, named last location, verified fuel percentage, assigned driver and last-seen time when available. Chassis and account information sit under Details. |
| VH-4 | P2 | Paging and filters | Fixed locally | Vehicles defaults to 50 rows with a page-size control. Administrative status, missing required documents and account are applied on the server before counting and paging. Export uses the same filters. |
| VH-5 | P1 | Red delete bin on every row, next to view and edit | Fixed locally | vehicleRowActions: deletion moved to an overflow action with confirmation. |
| VH-6 | P2 | Add Vehicle only offers two makes | Fixed locally | VehicleBasicInformationForm and AddVehiclePage: expanded make picker, with Other. |
| VH-7 | P2 | Vehicle Documents grid has no way to upload | Fixed locally | VehicleDashboardPage and VehicleDocumentUploadDialog: missing cells open the selected truck/document upload. |
| SV-1 | P0 | The three tabs contradict each other | Fixed locally | serviceForecasts + AlertsTab + UpcomingServiceTab tests: one active-fleet forecast selector drives service alerts and upcoming rows; TELEMETRY_START is not labelled as a recorded service. Forecast load failures have retry states. |
| SV-2 | P1 | "Tracked vehicles 133" for a 126-truck fleet | Fixed locally | serviceForecasts + UpcomingServiceTab tests: count only the current vehicle-list membership, exclude deactivated/removed trucks, deduplicate registrations, and keep missing forecasts Not assessed. |
| SV-3 | P2 | 133 stacked cards, each with a meaningless "IND" badge | Fixed locally | Upcoming Service is a table sorted by urgency and km remaining, with a top-overdue horizontal bar chart labelled in km. All matching active rows remain accessible; decorative IND badges removed. |
| TP-1 | P0 | Fuel tab → "Open fuel ledger" → completely white page, sidebar gone | Fixed locally | vehicleCards + navigation tests: fuel links open Mileage with the truck filter; stale route alias and authenticated NotFound fallback added. |
| TP-2 | P0 | "Assigned driver → Change →" → completely white page | Fixed locally | DriversPanel + navigation tests: all truck assignment links target Khata Ledger → Assignments; stale route alias supported. |
| TP-3 | P1 | Contradicting status pills | Fixed locally | VehicleHeaderCard shows one live motion status, with administrative availability under View specs. vehicleCards covers moving and available on the same truck. |
| TP-4 | P1 | Location shown as raw coordinates | Fixed locally | VehiclePositionLabel uses a recorded address, area or the existing place resolver. Coordinate-only labels fall back to Location not named; map access remains available. |
| TP-5 | P1 | The lower "30-day" map isn't a real map (owner's "weird places") | Fixed locally | ReferenceOverviewMap reuses the Track road style, fits the recorded route and stops, breaks the path at GPS gaps and names stop pins where the response has names or localities. Map fitting and labels are covered by a component test. |
| TP-6 | P2 | Top half of the page is a cartoon truck | Fixed locally | Truck header shows today’s distance, idle time, diesel used, current location and assigned driver. Backend overview uses same-day counter samples and daily ledger fallback; absent readings remain unknown. |
| TP-7 | P2 | "Last 30 days" bars have no km axis; values only on hover | Fixed locally | DistanceCard: 30-day distance chart shows a km axis and dates. |
| TP-8 | P1 | Tab badges "Fuel 0", "Documents 0" though fuel data exists | Fixed locally | Vehicle360Page: Fuel and Documents tabs no longer show counts from incomplete profile embeds. |
| TP-9 | P1 | Fuel tab empty while the data exists | Fixed locally | Fuel tab charts the last valid tank reading each day for 30 days, shows recent sensor-detected fills separately from logged receipts and uses the truck-measurement km/L cell when available. Today’s burn uses the overview measurement. |
| TP-10 | P2 | Service tab is a derivation table | Fixed locally | ServicePanel leads with due distance, projected date and progress. The calculation is in a disclosure; telemetry baselines are labelled and empty service-centre panels are omitted. |
| TP-11 | P1 | Trips tab: every trip "<plant> → No drop", 18 of 20 "Needs review"; "No open cycle" while the truck is moving | Partially fixed | Truck Trips distinguishes live movement from an unrecorded base cycle. A named prediction can appear for the current trip, unresolved historical drops remain marked, and review opens the exact trip. Historical drop detection still needs upstream evidence. |
| TP-12 | P1 | Drivers tab | Fixed locally | Driver tab replaces alert dots with named timestamped events, hides unavailable score placeholders, and reports a single true zero total. Non-zero categories are visible and truck alerts are not attributed to a driver. |
| TP-13 | P2 | Telemetry tab | Fixed locally | TelemetryPanel uses channel timestamps and 24-hour or seven-day diesel and speed charts. Measured zero survives, failed reads have retry, and recorded GPS gaps break speed traces. |
| TP-14 | P2 | Tyres & Axles: all "Not recorded" | Fixed locally | vehicleCards tests: one empty tyre state, real tyre-set save and refresh, restricted write roles, input retained on save failure, read retry, and existing set display preserved. |
| TP-15 | P1 | Truck page never shows idling, fuel loss, overspeed or stuck-at-plant, yet most "open truck" links land here | Fixed locally | Truck dashboard adds Today and Last 7 days with the truck-scoped idling, unexplained-fuel and overspeed reads plus recorded plant queues. Links preserve truck and dates. Unavailable or truncated totals are marked unknown. |
| WF-1 | P0 | Add Employee auto-fills the OWNER's login into the new employee | Fixed locally | BasicInformationForm test: empty employee credentials and explicit autocomplete settings. Same settings applied to add/edit modals. Saved-password behaviour in Edge still needs a manual check. |
| WF-2 | P0 | "View details" (eye icon) opens an EDIT form at `/drivers/add`; there is no employee profile | Fixed locally | DriverProfilePage, DriverProfileService and navigation tests: the eye opens the read-only employee route, with assignment history, activity, documents and Edit. Live coverage still needs checking. |
| WF-3 | P1 | Add Employee form | Fixed locally | The scoped role selector drives the explicit employee role. Driver creation works without a supplied password, and web roles still require an eight-character password. Drivers receive an unshared random credential at creation. Access-control integration tests exercise the driver and manager validation paths. |
| WF-4 | P1 | Header "Employees 10" is the page size, not the total (there are 13 pages) | Fixed locally | DriversPage test: a ten-row page reports the API total of 126. Assignment-filter totals use the full matching list. Backend contract verified in user.service.js. |
| WF-5 | P1 | Access control: "Driver · 0 holders", while every Employees row says "Driver" | Fixed locally | Role holder counts include legacy employee roles, explicit primary roles and active scoped assignments. Each person counts once per role. Branch Access asks for a branch unless the page already has a location selection. |
| WF-6 | P2 | Assigned Employees: test users and broken icons | Partially fixed | Assigned Employees drops decorative role and scope icons and puts Revoke access behind the row menu and confirmation. Existing production accounts require an authorised account review. |
| WF-7 | P2 | Clicking the Workforce icon only shows a label; the sub-menu doesn't expand from the icon rail | Fixed locally | Sidebar tests: clicking the employee group from the collapsed rail opens both navigation and submenu, including when the group was open before collapse. |
| TR-1 | P0 | Failed load shown as real zeros | Fixed locally | Failed trip counts stay unknown. On a first account read failure the sidebar can retain the last menu for the same account and branch. Branding uses the saved company name where available. Feature pages show their own account retry until live access can be checked. |
| TR-2 | P1 | After retry, parts still fail | Fixed locally | AutoTripsPage retries failed supporting reads alongside the list; the loaded-run tile and place banner also offer independent retry. Integration test covers recovery of all three reads. |
| TR-3 | P1 | No destination prediction anywhere in Trips (owner's point) | Partially fixed | Active rows can request the existing destination prediction and show the named estimate and confidence. Held predictions stay hidden. Automatic suggestions across the full list and a confirmed-drop action require a trip-scoped prediction contract. |
| TR-4 | P1 | Live trip page (`/auto-trips/6b04bbdc…`) | Partially fixed | The replay uses named roads. Named destination estimates wrap, unlabelled guesses stay hidden, unknown fuel is excluded from the running-cost subtotal, and elapsed time and interrupted toll coverage are labelled. The original trip data and SAP explanation still need a live review. |
| TR-5 | P1 | Delivered list (`?status=COMPLETE`) | Fixed locally | Completed rows with a measured zero distance, or less than 10 km over at least six hours, show Short run · check. Underlying trip statuses and delivery counts stay intact. SAP verdicts wrap. |
| TR-6 | P1 | Delivered trip page (WB11G1462, 167 km) | Fixed locally | The replay includes a map key. Pickup stops cannot appear as candidate drops in the timeline, parked time has its own label, and stale-open reasons are cleared from the display for delivered records. The original vehicle case remains a deployment check. |
| TR-7 | P0 | History view shows raw timestamps | Fixed locally | TripHistoryTab test: 2026-03-31T18:30Z displays as 1 Apr in IST. Selected periods are also formatted. |
| TR-8 | P2 | Navigation inside Trips | Fixed locally | History, Review places and Detour approvals have direct controls. More lists all statuses even with measured zero counts, and unidentified pickup candidates use their recorded locality where available. |
| TR-9 | P2 | Review places (Trips → Review places) | Partially fixed | Review Places fits the location and an actual GPS path from the selected sample trip, splitting the path at recorded gaps. The queue still depends on recorded locality and dwell evidence for each cluster. |
| AP-1 | P1 | WhatsApp tab tiles | Fixed locally | ReceiptKpiGrid: WhatsApp summary shows measured litres and oldest pending age. |
| AP-2 | P1 | Bad rows shown without warning | Fixed locally | receiptReview and ReceiptApproval tests: readiness reflects confidence, truck match and plausibility warnings. |
| AP-3 | P1 | One-click approve tick on every row, next to view (rule 9) | Fixed locally | ReceiptApprovalActions and useBulkApproval: confirm approval in the drawer or bulk review. |
| AP-4 | P1 | Truck suggestion hidden in the bill drawer | Fixed locally | DrawerDetailsPane: the truck suggestion is visible beside the truck selection. |
| AP-5 | P2 | Jargon in the drawer | Fixed locally | KeyFactsCard and DrawerDetailsPane: clearer labels and fewer repeated field tags. |
| AL-1 | P1 | Almost all 291 alerts are "Critical", and every fuel alert admits it doesn't know | Partially fixed | Unconfirmed fuel findings and slow parked drift use review priority; corroborated or provider drain/theft reports remain urgent. Rows show the stated rate or litres and any reported amount. An amount-based policy needs structured calibrated event values. |
| AL-2 | P1 | Alert detail has nothing to check against | Partially fixed | Fuel alert details link directly to the truck Fuel tab, Fuel checks and the reported tracking window. A tank-level chart uses the source dates and recorded samples when available. Exact parked locations and parked-only sensor intervals are not supplied for every report. |
| AL-3 | P2 | Banner and filter problems | Fixed locally | Account and incident filters retain the previous fixes. Owner Alerts now routes to fuel, idling, overspeed, detour, DEF or tracking evidence for the reported subject and day. Intelligence accepts the linked IST period. |
| IN-1 | P0 | Same label, two numbers, on one page | Fixed locally | IntelligencePage integration test: overview, section badge, briefing and chips agree for multiple findings on the same truck; one loaded list and one affected-subject selector also apply the truck/kind filters. |
| IN-2 | P0 | Issues "No data" repeats the same truck once per day | Fixed locally | IssuesTab test: daily snapshots of the same truck/kind collapse to the newest row before filters and counts; different issue kinds remain separate. |
| IN-3 | P1 | "Account stopped sending data — 2 accounts" lists a truck number (BR44GB1162) as an account | Fixed locally | IssueGroup and shared count selector use the account name when an account finding also carries a sample truck registration. |
| IN-4 | P2 | Issues dot grid is unreadable | Fixed locally | IssueGroup test: readable distinct evidence-day count over fourteen days, with last date; no dot-cell strip. |
| IN-5 | P1 | Trucks report cards | Fixed locally | Truck cards deduplicate and use the current registered fleet. Stored scores are reused only for matching explicit dates. Grade distribution, sorted score bars and written score changes replace the sparkline, and the list prioritizes distinct findings. |
| IN-6 | P1 | Report card drawer | Fixed locally | The drawer displays IST assessment dates and says how many recorded measures support the score. Idling and overspeed links preserve that period and the subject. Earlier map fitting fixes remain in place. |
| IN-7 | P0 | Drivers tab: 121 drivers, all "Insufficient data" | Fixed locally | Driver scores show assignment coverage and distance, recorded deliveries, and closed engine-on idling where attributed to the driver. Missing attribution stays unknown. Ranked scores still require score evidence. |
| IN-8 | P1 | Idling: numbers repeated, and they disagree | Fixed locally | The map workspace now has one summary, and the moments log shows its own evidence. The recorded-history read drives idle hours by truck and day, with existing truncation and unavailable-data labels. |
| IN-9 | P1 | Overspeed: 76 vs 0 on one screen | Fixed locally | The audit runs automatically over the selected IST period, resolves plate links to truck IDs and uses report points or current fleet positions for the map viewport. The separate moments log remains available. Missing audit totals have no zero defaults. |
| IN-10 | P2 | Cruise & gears | Fixed locally | Cruise & gears shows a truck-by-truck share of recorded time in the 900–1,700 rpm band, using intervals with an engaged drive gear and dropping gaps over five minutes. Engine readings and driver-scoped evidence are available separately. |
| IN-11 | P1 | Detours: "14 detours" above "Route deviation: 52 detours, 50 open"; cost priced for 3 of 50 | Fixed locally | Detours audit uses the deviation summary as its one headline count source. The audit query receives the selected dates and vehicle, unknown counts stay unknown, and the separate moments log remains available. |
| IN-12 | P0 | Fuel checks contradicts Alert Inbox | Partially fixed | Fuel checks labels the count as mapped events, withholds per-truck totals when buckets contain several trucks, and links to a fuel-only Alert Inbox. Coordinate-only hotspot names are replaced with plain labels. Source feeds still need event-level reconciliation. |
| IN-13 | P1 | Mileage & DEF is empty ("No km/L figures for this period yet"), while Performance → Vehicles shows km/L for 50 trucks | Fixed locally | Mileage & DEF uses the truck measurements report’s paired telemetry counters for km/L over the same dates. It keeps available DEF and full-tank cycle evidence, and the link to Mileage preserves dates and truck. |
| IN-14 | P2 | Loaded & empty runs: the chart is good, the counts aren't | Fixed locally | RunsTab: empty share is highlighted with a donut; Show all exposes the loaded truck rows. The footer distinguishes fully classified distance from unknown distance and states when only the first page of trips was used. |
| IN-15 | P1 | Places: no place prediction (owner's point) | Partially fixed | Review Places uses the selected dates, resolves unnamed stop labels through the existing place resolver and offers manual naming when a suggestion is unavailable. Suggestion coverage still comes from the backend. |
| IN-16 | P1 | Performance → Vehicles silently cuts the list | Fixed locally | Truck measurements has real server paging and an organization-scoped total. Page controls reach trucks after the first 50; Performance health findings is explicitly scoped to the report and page. Numeric cells use the standard font. |
| IN-17 | P1 | Performance → Drivers ignores the date picker and is empty | Fixed locally | IntelligencePage + DriversTab tests: selected dates reach the driver table and DNA drawer, including after a range change. Empty measurements stay unknown; upstream driver-score availability remains tracked in IN-7. |
| IN-18 | P2 | Leaderboards | Partially fixed | The headline counts unique drivers without a rank across the boards. Per-board reasons remain visible. Production request times and eligible evidence coverage still need measurement. |
| IN-19 | P1 | Slow load: once took > 50 s to settle (`?tab=vehicles`) | Partially fixed | Report card history is indexed by truck and day in one pass. Direct links continue to skip separate overview reads. Cold production timing for the exact audited date range is pending. |
| IN-20 | P2 | "Drivers" tab appears twice; "Trucks" and "Vehicles" are both per-truck views | Fixed locally | intelligenceTabs + IntelligencePage tests: Truck scores / Driver scores and Truck measurements / Driver measurements have unique names; tab IDs and existing links remain valid. |
| IN-21 | P2 | Driver idling link ignores the driver | Fixed locally | IdlingTab + idlingDriverFilter tests: recorded-driver precedence, complete assignment paging, exact truck match, whole-event assignment coverage, handovers and unavailable/retry states. Map, lists and totals use the filtered rows. |
| FU-1 | P0 | Diesel & Mileage → Mileage: every sub-view is empty | Partially fixed | By truck and Fleet show measured telemetry km/L, including when no cycles are present. Cycle and model views explain the two-full-fill requirement, and expected fuel explains its baseline requirement. Missing fleet receipts and expected-fuel inputs still need live verification. |
| FU-2 | P2 | Bill check tab is empty | Partially fixed | The empty Bill check points to Diesel fills for unmatched fills and receipt upload, retaining dates and truck search. Matching the audited fleet’s receipts to detected fills still needs production evidence. |
| FU-3 | P1 | Fuel Integrity loads slowly and the summary is incomplete | Fixed locally | Headline totals use the entire selected window and render as soon as their read completes. Event charts and exports state their loaded-feed scope. A deferred-response regression test checks that a pending fill list does not block the summary. Live latency is pending. |
| FU-4 | P0 | Threat Matrix shows implausible losses as CRITICAL theft | Fixed locally | fiData + fuelMeasurementPresentation tests: losses above 30% of fills, or losses without positive dispensed fuel, show Data check needed. Unknown checks are not counted as clean vehicles. |
| FU-5 | P1 | Loss shown with two signs | Fixed locally | fuelMeasurementPresentation test: the pipeline and headline card both show loss as a positive volume. Truck card and inspector use the same volume convention. |
| FU-6 | P2 | Tab names are alarming, not plain | Fixed locally | FuelIntegrityTables uses Fuel events, Trucks and Pumps. Pump-ledger integration test updated and passing. |
| FU-7 | P1 | Incident feed rows have no location | Partially fixed | Fuel events show the recorded pump name or resolve the recorded position. Loss windows without coordinates link to that truck’s route in the evidence period rather than assigning a guessed location. Exact positions still require upstream evidence. |
| FU-8 | P2 | Pump watchlist says nothing | Fixed locally | Known pumps appear once in the Pumps tab. The unaudited rows keep evidence counts and recorded fuel without repeated unmeasured loss fields. Cash Oil prefixes are removed from display names. |
| FU-9 | P2 | Analytics chart is misleading | Fixed locally | FuelActivityPanel uses daily bars with units; fiData + fuelMeasurementPresentation tests cover distinct loss/DEF/bill event counts and real chart values. Affected-truck bars explicitly describe the loaded-feed scope. |
| FU-10 | P1 | Refuel advisory (`/refuel-advisory`, no menu entry) | Fixed locally | Advisory range and fill cost can use verified CAN tank litres, a recorded vehicle tank capacity and the same measured efficiency as Performance. Ambiguous units remain unavailable. Regression tests cover a 70% full truck and an unverified tank reading. |
| FU-11 | P0 | DEF ledger shows 0 for a month of driving | Fixed locally | DEF ledger excludes unreported burn from row totals, dosing and balances, preserves measured zero, and links to the latest tank level. Logging starts from the page action or truck drawer. Upstream sensor coverage requires live verification. |
| FU-12 | P1 | DEF normal band differs between pages | Fixed locally | MileageDefTab + fuelMeasurementPresentation tests: shared DEF comparison helper uses the truck/model band from the response in both views; missing or invalid bands remain unavailable. Removed the conflicting hardcoded 4–7% claim. |
| FU-13 | P1 | Unknown shown as zero | Fixed locally | fuelMeasurementPresentation tests: missing fuel, engine use, tank delta, daily rate, costs and flag counts stay unknown; measured zero remains zero. Missing vehicle checks no longer imply a healthy vehicle. |
| TK-1 | P0 | Selecting a truck shows a blank beige map | Fixed locally | mapStyles + LiveMapCanvas tests: visible orange highways, arterial roads and road labels in both themes; Track mode keeps roads. AutoTripReplay reuses the shared light style. Live map-key/rendering check pending. |
| TK-2 | P1 | Track mode for a moving truck | Fixed locally | Track measures distance and driving time before geometry downsampling, omits detected GPS gaps, and shows unavailable distance when no usable interval exists. Live-history coverage and place naming still depend on recorded fixes. |
| TK-3 | P1 | "Where next" has no prediction behind it | Fixed locally | WhereNextSection hides held or empty results and displays API probabilities for real destinations. Tests cover held predictions, confidence, ETA and map callback state. |
| TK-4 | P1 | Moving truck labelled as a truck stop | Fixed locally | VehicleNowCard suppresses parking classification, dwell context and visit counts while the truck is moving, keeping the active trip visible. |
| TK-5 | P1 | Places & routes panel | Partially fixed | Places & routes uses the fleet chip’s idling total, renders place names at close zoom and suppresses nearby same-name warehouse and loading-point duplicates. Reported workshop, toll and review-count movement still needs a live comparison. |
| TK-6 | P2 | Satellite shows no town or road names | Fixed locally | useLiveMap test: satellite mode uses hybrid for town/road labels on load and mode changes. |
| TK-7 | P2 | Slow load and card clutter | Partially fixed | Fleet cards remove the repeated VIN and explain engine/GPS state. The rail renders and resolves locations for 50 cards at a time with Show more. Initial production map and data-load time still need verification. |
| RH-1 | P1 | Numbers disagree with Intelligence and Trips | Fixed locally | The detected-trip KPI uses the Trips count contract and links to the same 30 calendar days. Overspeed uses the shared audit with the same dates and thresholds carried into the drill-down. Missing audit totals remain unknown. |
| RH-2 | P1 | Maps | Partially fixed | Route Hub uses labelled road tiles and frames available route geometry, event points or fleet fixes. Replay suppresses placeholder model numbers and leaves distance unknown when every interval is a GPS gap. Missing production corridor paths and live tile rendering still need verification. |
| RH-3 | P2 | Profitability was still loading skeletons after 9 s | Fixed locally | Running costs render independently of the cash indicators. A slow or failed cash read leaves the report usable, with its own retry and a shared date window. |
| OT-1 | P0 | Khata ledger contradicts Fuel Integrity | Fixed locally | Khata includes FUEL_EXPENSE aliases in recorded fuel spend and shows a dash when no fuel rows match the filters. The breakdown states its accounting scope; it does not treat fuel burned in litres as spend. |
| OT-2 | P1 | Tolls page (`/tolls`) is switched off | Partially fixed | The disabled Tolls page explains the crossing/plaza feature gate and links to Khata filtered to toll expense entries. The organisation’s feature entitlement still controls access. |
| OT-3 | P1 | Reports → Vehicle report | Partially fixed | Vehicle Report labels full-tank mileage and separately shows telemetry mileage for enterprise report rows with paired measurements. The Mileage by truck link preserves the report dates and manufacturer. Receipt freshness, branch telemetry and date-control consistency still need verification. |
| OT-4 | P1 | Place Hub base map stayed blank grey with clusters floating on it | Partially fixed | Place Hub tracks tile readiness independently of overlays and offers a retry if the road tiles are delayed. The original production tile failure still needs reproduction. |
| OT-5 | P2 | App Usage: 97 of 195 screens are opened fewer than 2 times, or never | Fixed locally | The sidebar has a screen finder that opens matching destinations in their groups. It searches permitted menu entries, and App Usage shows their menu locations. The effect on real usage will need a later rollup. |
| AW-1 | P1 | Sidebar is icons only; names appear on hover | Fixed locally | Sidebar tests: desktop labels remain expanded until toggled, hover does not change state, and mobile selection closes the drawer. Navbar toggle is visible on desktop. |
| AW-2 | P2 | Menu names don't match page titles | Fixed locally | sideNavItems + sideNavUtils tests: destination labels align with Live tracking, Trips, Employees, Access control, Diesel & Mileage and Place Hub; route, feature and role gates preserved. |
| AW-3 | P1 | Three overlapping alert pages, and the app admits it | Partially fixed | Intelligence points to Alert Inbox for alert review and removes the competing guide. Alert Inbox remains the main navigation destination; the individual source feeds are still available as evidence. |
| AW-4 | P1 | Orphan routes with no menu link | Partially fixed | Legacy redirects retain filters, Mileage retains its selected tab, and gated destinations have sidebar entries. Challans still has an intentional Coming Soon overlay and stays out of the menu. |
| AW-5 | P2 | Four different map looks with no shared base | Partially fixed | Leaflet maps now share one labelled road-tile configuration. Live Tracking, Trip replay, Place Hub and Truck overview share the Google road style. Different map providers and the remaining surfaces still need a visual comparison. |

## First implementation batch

Implemented locally on 24 Nov 2026. Production verification is pending for every issue.

- Regression tests cover navigation, selected truck/day, credential autocomplete, failed counts, IST date rollover, employee totals, duplicate snapshots, evidence-day summaries, map styles and satellite labels.
- Full lint: passed with 0 errors and 17 existing warnings.
- `npm run build`: passed. Includes lint, all 4,685 tests in 570 files, production Vite build and `scripts/check-bundle.mjs`.
- Bundle limits unchanged: entry 359,169 / 600,000 bytes; largest chunk 734,293 / 800,000 bytes; total JavaScript 7,935,295 / 8,200,000 bytes.
- `git diff --check`: passed. Audit copy matches the supplied file exactly, and the tracker contains all 111 unique issue IDs.
- Browser checks with a saved Edge login and live Google Maps, plus production endpoint comparisons, remain pending. Automated checks establish local behaviour only.
- No production data changes, support messages, commits, pushes, PRs or deployments were performed.

At the end of this batch, the priorities were WF-2 (employee profile), IN-7 (driver score availability), then the remaining P0 issues. Verify current endpoint contracts before unifying cross-page numbers. Backend/live-data dependencies stay open until there is evidence; hiding a number does not establish the correct value.

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

## Vehicle, employee and approval batch

- Verified the ten fixes in `af2b8734` with `npm run build` (4,743 tests in 583 files, lint with 17 existing warnings, production build and bundle checks).
- Browser and live-data verification remain pending.

## Next batch

- Worked on TP-8, IN-3, WF-3, IN-7, IN-14, IN-18, TR-8, TR-9, AL-3 and AW-4. The sidebar work also addressed the navigation portion of FU-10.
- Each row records the specific work and any outstanding scope.
- Final `npm run build` passed with 4,742 tests in 583 files, lint with 17 existing warnings, the production Vite build and all bundle limits.
- `git diff --check` passed and the tracker still contains all 111 original issue IDs. Live browser verification and deployment remain pending.

## Truck detail, live tracking, Trips and DEF batch

- Issues TP-3, TP-4, TP-5, TP-6, TP-10, TP-13, TK-3, TK-4, TR-2 and FU-11 are fixed locally.
- Frontend `npm run build` passed with 4,745 tests in 584 files, lint with 17 existing warnings, the Vite production build and all bundle limits.
- Backend vehicle-profile sensor, access and screen tests passed (35 tests in three suites). The overview additions use the existing scoped reads.
- Both repositories passed `git diff --check`. Google Maps rendering, sensor coverage and production behavior still need live verification.

## Vehicle lists, fuel evidence and reporting batch

- Fixed locally VH-4, TP-9, TP-12, TR-5, IN-16 and RH-3. Partially fixed IN-6, IN-19, FU-7 and TK-7.
- Backend verification passed with 108 tests across eight suites, including vehicle access, fleet filters, performance pagination and vehicle telemetry.
- Frontend `npm run build` passed with 4,750 tests in 585 files, 17 existing lint warnings, the production Vite build and all bundle checks.
- Both repositories passed `git diff --check`. All 111 tracker IDs remain. Live browser and production verification are pending.

## Digest, fuel evidence and track history batch

- Fixed locally DG-8, TP-15, IN-11, FU-8, TK-2 and OT-1. Partially fixed DG-6, AL-1, AL-2 and IN-12.
- Backend Alert Inbox, database merge and Track suites passed with 49 tests across three suites.
- Frontend `npm run build` passed with 4,752 tests in 585 files, 17 existing lint warnings, the production build and all bundle limits. The additional truck activity regression passed separately.
- Both repositories passed `git diff --check`. No changes were deployed. Production evidence availability and timing remain unverified.

## Vehicle navigation, predictions and Intelligence batch

- Fixed locally VH-1, VH-3, IN-8 and IN-9. Partially fixed TP-11, WF-6, TR-3, IN-15, OT-2 and AW-3.
- This batch uses the existing backend contracts. Production browser verification, prediction coverage and organisation entitlements remain open.
- Frontend `npm run build` passed with 4,762 tests in 587 files, 17 existing lint warnings, the production build and all bundle limits.
- `git diff --check` passed. All 111 audit IDs remain and no changes were deployed.


## Remaining open issues batch

Worked all 13 issues previously marked Open on both repositories’ `work/main-2026-11-24` branches. Six are fixed locally. The other seven have local changes and outstanding checks recorded in their rows. The changes require both frontend and backend updates.

- Frontend build and bundle checks passed with 4,766 tests across 587 files.
- Nine targeted backend suites passed with 105 tests and two skips, including real MongoDB fixtures for role holders, truck mileage and cruise share.
- The broader backend report integration suite has two failures reproduced on the unchanged branch head. The assertions concern diesel cost per kilometre and report access for the driver role.

## Partial issues follow-up

Reviewed all 33 partial rows across both repositories. Nine additional issues are fixed locally. The remaining 24 preserve their outstanding product or live-data checks in the issue table. No production deployment, employee cleanup or entitlement changes were made.

- Frontend lint, all 4,770 tests and the production bundle checks passed. Seven targeted backend suites passed all 68 tests.
