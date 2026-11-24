# Frontend audit: what a paying fleet owner sees (issue list for frontend devs)

## Context

The owner's complaint is that the backend holds rich data, but the frontend shows it badly, contradicts itself,
or breaks. Our users are truck owners and managers, many with little reading. A screen has to answer
"what's wrong, which truck, what do I do" in plain words and plain charts. This file is the work list.

**How this was found**
- **Live app:** app.gnbedge.in, org **BD ROADLINES** (126 trucks), 24 Nov 2026, ~03:40–05:00 IST, in Edge via
  Claude in Chrome. View-only: nothing was saved, approved, deleted or submitted.
- **Source:** `F:\gnb\frontend\main-frontend\frontend\src` (5 commits behind origin/main). Code paths below are
  relative to `src/` and come from that read; re-check line numbers on origin/main before editing.

**Tags**
- **SEEN:** reproduced on screen in the live app.
- **CODE:** found in the source only, not yet seen on screen.

**Severity**
- **P0:** broken, white page, security, or wrong numbers shown as fact.
- **P1:** contradiction, dead end, empty feature, or a missing prediction.
- **P2:** hard to read, jargon, or clutter.

**How to read an issue**
- **Steps:** what to click (URL first).
- **Now:** what happens today.
- **Want:** what should happen.
- **Code:** where it lives, if traced.
- **Fix:** the suggested change.

---

## 0. Cross-cutting rules (apply on every page; most issues below break one of these)

1. **One fact = one number everywhere.** If two pages show "idling now", they must call the same endpoint and
   show the same value. If they really measure different things, give them different names and a one-line "why".
2. **Unknown is not zero.** Missing data shows "—" plus a short reason (`components/ui/Num.jsx` exists), never 0,
   ₹0, an empty tank bar, or "Everything looks healthy". A failed API call shows an error state, not 0s.
3. **Places have names.** Never show raw coordinates (`23.0419, 87.7844`) as a location. Show the nearest
   confirmed place, town or road; coordinates can go in a tooltip.
4. **No white pages.** Every link must point to a real route; add a catch-all "Page not found" route with a way back.
5. **Charts:** a bar chart for per-truck comparisons, a line for change over time, a donut for share of a total,
   and a big number tile for a single KPI. Every axis gets a unit (km, L, ₹, /100). No dot-per-day strips and
   no unlabeled sparklines. Use recharts (already in the bundle).
6. **Plain words.** No internal terms on screen: CAN, OCR, SAP, DNA, duty group, Σ, baseline, derivation,
   confidence %, "period read", "subjects", API. One shared word list (see Wave 5).
7. **Dates:** `24 Nov, 4:12 am` style, in IST. Never raw ISO such as `2026-03-31T18:30:00.000Z`. A page's date
   picker controls every number on that page; if a section uses another period, it says so in words.
8. **Lists:** never silently cut. If a list stops at N, say "showing N of M" and offer "show all".
9. **Destructive buttons** (delete, approve, revoke) are not one click on a table row next to "view".

---

## 1. Issues by page

### 1.1 Daily Digest (`/digest`)

**DG-1 · P0 · SEEN + CODE · Idling chip opens a page with no idling (owner's example)**
- **Steps:** `/digest?date=2026-11-23` → card "Extra fuel costs to review" → row "Idling" → click truck `WB11S6162`.
- **Now:** opens `/vehicles/WB11S6162` with no tab and no date; none of the truck page's 8 tabs show idling.
- **Want:** opens `/intelligence?tab=idling&vehicle=WB11S6162&from=2026-11-23&to=2026-11-23&idleSubview=instances`.
- **Code:** `pages/DailyDigest/OwnerReportPanel.jsx:273` renders `<TruckChips trucks={row.trucks} />` without
  `kind={row.key} day={day}`. The correct link is already built at `:153-155`.
- **Fix:** pass both props. Add a test: an idling chip's href contains `tab=idling`.

**DG-2 · P1 · CODE · Extra-diesel chips and "possible fuel loss" chips go to the truck page, which shows neither**
- **Code:** same line `:273` (extra diesel); `components/AttentionCard.jsx:112` (fuel loss → `/vehicles/:reg?tab=fuel`).
- **Fix:**
  - Extra diesel → `/intelligence?tab=mileage&vehicle=…`.
  - Fuel loss → `/intelligence?tab=fuel&fuelView=drain&vehicle=…&from=day&to=day`.

**DG-3 · P1 · SEEN · Date arrows jump while the page refreshes**
- **Steps:** load `/digest`, then click "<" immediately.
- **Now:** the button is "Refreshing…" (wider), then turns into "Refresh" (narrower); the arrows shift and the click misses.
- **Fix:** give the date control and the Refresh button a fixed width.

**DG-4 · P1 · SEEN · Live numbers mixed with past-day numbers**
- **Steps:** pick 23 Nov.
- **Now:** "Moving now 11 · Live · not for 23 Nov" and "Dark now 53 · not for 23 Nov" sit in the same row as 23 Nov figures.
- **Fix:** when a past day is chosen, show that day's numbers, or move live tiles to a separate "Right now" strip.

**DG-5 · P1 · SEEN · ₹0 in big red on a day with no data**
- **Now:** "Extra fuel cost ₹0" in large red at 3 am, and on 23 Nov with "2 items could not be calculated".
- **Fix:** show "—" with "not counted yet" (rule 2); don't use red for 0.

**DG-6 · P1 · SEEN · The day's own boxes disagree**
- **Now:** for 23 Nov, "Needs attention" says "No long idling on this day", while the card next to it lists WB11S6162 under Idling.
  "Trips started 0 · ↓100% vs 7-day average" on a full Monday.
- **Fix:** both boxes read one idling source with one threshold (see X-9). The trips figure is a data issue, so show "not counted yet"
  rather than −100%.

**DG-7 · P2 · SEEN · "Who drove well" / "Who needs a word" are always empty**
- **Now:** "No driver score has been learned for the 120 days up to 2026-11-24" (raw ISO date).
- **Fix:** hide the cards until scores exist, or show the best available metric. Format the date (rule 7).

**DG-8 · P2 · SEEN · "The day in numbers" is text grids**
- **Now:** grids like "Usual on Tuesdays 74", "Engine on, idle verified 4", "Speed unknown 0", "Partly measured…".
- **Fix:** 3-bar "today vs 7-day average vs same weekday"; plain labels; drop the 0 rows.

> **Remaining:** every other Digest link still to be clicked through; see §3.

### 1.2 Vehicles → All Vehicles (`/vehicles`)

**VH-1 · P2 · SEEN · Opening `/vehicles` directly first landed on `/digest`**
- **Now:** a second try worked. Probably an auth or redirect race on a fresh load.
- **Code:** not traced.

**VH-2 · P2 · SEEN · Sidebar flyout stays open over the page after you pick an item**
- **Code:** `components/Sidebar.jsx`.
- **Fix:** close it on navigation.

**VH-3 · P1 · SEEN · The list doesn't answer the owner's questions**
- **Now:** columns are reg, maker, model, category, chassis, account, docs, avg mileage. Avg mileage is "—" on every
  row; model and category are "—" on most Ashok Leyland rows.
- **Want:** status (moving/stopped/offline), where (place name), fuel %, driver, last seen.
- **Fix:** move chassis and account behind "Details".

**VH-4 · P2 · SEEN · Paging and filters**
- **Now:** 10 rows × 13 pages, with no page-size choice. Filters are only "Fleet view" and "Manufacturer".
- **Fix:** 50 rows per page; filter by status, docs missing and account.

**VH-5 · P1 · SEEN · Red delete bin on every row, next to view and edit**
- **Fix:** move delete into the edit screen or a "⋯" menu, with a confirm (rule 9). The same applies to Employees (WF-6).

**VH-6 · P2 · SEEN · Add Vehicle only offers two makes**
- **Steps:** Add Vehicle.
- **Now:** a 2-option radio (Tata / Ashok Leyland).
- **Fix:** a dropdown with other makes (Eicher, BharatBenz, Mahindra, Volvo…) plus "Other".

**VH-7 · P2 · SEEN · Vehicle Documents grid has no way to upload**
- **Now:** 126 × 7 "Missing" pills, and no upload action from the grid.
- **Fix:** a click on a "Missing" cell opens upload for that truck and document.

### 1.3 Vehicles → Service Intelligence (`/vehicles/service-intelligence`)

**SV-1 · P0 · SEEN · The three tabs contradict each other**
- **Now:**
  - Upcoming Service: 12 overdue.
  - Fleet Alerts: "Service due 0 · No alerts right now. Everything looks healthy."
  - Service History: 0 services ever, yet every truck shows "Last service 15 Sept 2026" (identical, so a default value).
- **Fix:**
  - Fleet Alerts reads the same overdue list.
  - Don't print a last-service date that wasn't recorded; show "Last service: not recorded".

**SV-2 · P1 · SEEN · "Tracked vehicles 133" for a 126-truck fleet**
- **Fix:** count only active trucks, matching the Vehicles page.

**SV-3 · P2 · SEEN · 133 stacked cards, each with a meaningless "IND" badge**
- **Fix:** a table sorted by "km overdue", plus a bar chart of the top overdue trucks.

### 1.4 Truck page (`/vehicles/:reg`; tested on WB11G0762 and WB11S6162)

**TP-1 · P0 · SEEN + CODE · Fuel tab → "Open fuel ledger" → completely white page, sidebar gone**
- **Code:** `pages/Vehicle360/panels/FuelPanel.jsx:192,201` link to `/fuel-ledger`; that route doesn't exist and `App.jsx` has no catch-all.
- **Fix:** point it to `/mileage?vehicle=<reg>`, and add a NotFound route (rule 4).

**TP-2 · P0 · SEEN + CODE · "Assigned driver → Change →" → completely white page**
- **Code:** `/vehicle-assignments` is linked from:
  - `panels/overview/DriverCard.jsx:20,33`
  - `panels/overview/ReferenceOverviewCards.jsx:191,230`
  - `panels/DriversPanel.jsx:13,151,243`
- **Fix:** link to the real assignment screen, or open an inline "change driver" dialog. Right now there's no way to reassign a driver.

**TP-3 · P1 · SEEN · Contradicting status pills**
- **Now:** "AVAILABLE" next to "Moving · ignition on".
- **Fix:** one status pill.

**TP-4 · P1 · SEEN · Location shown as raw coordinates**
- **Now:** "23.0419, 87.7844", twice (rule 3).

**TP-5 · P1 · SEEN · The lower "30-day" map isn't a real map (owner's "weird places")**
- **Steps:** Dashboard tab → right card "Last known position".
- **Now:** a plain grid with a few city dots (Varanasi, Patna, Gaya…).
  The trail is a tangle squeezed into one corner. Numbered stop circles overlap each other and the "Kolkata" label.
  Stops have no names, and the view doesn't fit the trail.
- **Want:** a real base map (the same as Track), fitted to the trail, with stops as named pins (place name, or "Unnamed stop near <town>").
- **Code:** dashboard map card in `panels/overview/` (component not traced).

**TP-6 · P2 · SEEN · Top half of the page is a cartoon truck**
- **Now:** "Illustration · axle count not recorded" plus a small map.
- **Fix:** replace it with today's key facts: km today, idle today, fuel used, where it is, driver.

**TP-7 · P2 · SEEN + CODE · "Last 30 days" bars have no km axis; values only on hover**
- **Code:** `panels/overview/ReferenceOverviewCards.jsx:69-116`.
- **Fix:** a recharts bar chart with a km axis and dates (rule 5).

**TP-8 · P1 · SEEN · Tab badges "Fuel 0", "Documents 0" though fuel data exists**

**TP-9 · P1 · SEEN · Fuel tab empty while the data exists**
- **Now:** "No recent refuels", "Range: No estimate", "Burned today: No current reading", "Fuel economy: Not measured".
  The Telemetry tab on the same truck shows a fuel reading every day for 30 days.
- **Fix:** show a fuel-level line chart (30 days) from the telemetry series, detected refuels from sensor jumps, and km/L
  from the same source Performance → Vehicles uses (see X-11).

**TP-10 · P2 · SEEN · Service tab is a derivation table**
- **Now:** "How 991 km remaining was worked out" (Recorded / Calculated / Reported / Scheduled / Predicted), a paragraph
  about "telemetry start baseline", and an empty "Nearest service centres" box.
- **Fix:** one line, "Service due in 991 km (about 30 Nov)", plus a progress bar. Move the derivation behind "How is this worked out?"
  and hide the empty box.

**TP-11 · P1 · SEEN · Trips tab: every trip "<plant> → No drop", 18 of 20 "Needs review"; "No open cycle" while the truck is moving**
- **Now:** no predicted destination; the timeline is another dotted-pill strip.

**TP-12 · P1 · SEEN · Drivers tab**
- **Now:** "Driving score: Not available", all safety counts 0, a long technical paragraph.
- **Code (dots):** `panels/DriversPanel.jsx:171-205`.

**TP-13 · P2 · SEEN · Telemetry tab**
- **Now:** 7 channels × 30 green cells (a dot grid) and latest values only, labelled "CAN", "FLEETEDGE CAN", "Status feed".
- **Fix:** "Last data 4 min ago ✓" per channel, plus line charts for fuel level and speed (24 h / 7 d).

**TP-14 · P2 · SEEN · Tyres & Axles: all "Not recorded"**
- **Now:** has a "Change layout" control that "does not update the vehicle", and text about "the tyre API".
- **Fix:** hide the tab until there's data, or show one "Add tyre details" empty state.

**TP-15 · P1 · CODE · Truck page never shows idling, fuel loss, overspeed or stuck-at-plant, yet most "open truck" links land here**
- **Code:** `panels/overview/TodayCard.jsx` (has idling) is never imported; `Trend.jsx` and `ActivityCard.jsx` are unused too.
- **Fix:** a "Today / This week" strip on the Dashboard tab (idle h + ₹, fuel loss L, overspeed count, stops), using the
  endpoints Intelligence already calls. Each item links to its Intelligence tab, filtered to this truck.

### 1.5 Workforce → Employees, Access control (`/drivers`, `/access-control`)

**WF-1 · P0 · SEEN · Add Employee auto-fills the OWNER's login into the new employee**
- **Steps:** `/drivers` → Add Employee.
- **Now:** Edge fills Email = the owner's login email and Password = the owner's saved password.
  Saving creates a driver with the owner's credentials.
- **Fix:** `autoComplete="off"` on the email field and `autoComplete="new-password"` on password, or don't ask
  drivers for a password at all (WF-3).

**WF-2 · P0 · SEEN · "View details" (eye icon) opens an EDIT form at `/drivers/add`; there is no employee profile**
- **Now:** no performance, no trends, no trips, no score, no history (owner's complaint, confirmed).
- **Want:** `/drivers/:id` profile showing:
  - assigned truck(s) over time
  - km per week (bar)
  - trips
  - idling and overspeed per week (bar/line)
  - documents
  - an "Edit" button that opens the form
- **Code:** not traced.

**WF-3 · P1 · SEEN · Add Employee form**
- **Now:**
  - The title "Employee Details" is the same as edit.
  - It says "Select at least one role (Enterprise or Branch)", but only an Enterprise Role field exists: no Branch role, no "Driver" role.
  - Password is mandatory for drivers.
- **Fix:** title "Add employee"; a Role field (Driver / Manager / Field agent); password only for roles that log in to the web app.

**WF-4 · P1 · SEEN · Header "Employees 10" is the page size, not the total (there are 13 pages)**
- **Fix:** show the real total.

**WF-5 · P1 · SEEN · Access control: "Driver · 0 holders", while every Employees row says "Driver"**
- **Now:** Branch Access defaults to a branch named "chennai" (lowercase) for a Bengal/Bihar fleet.

**WF-6 · P2 · SEEN · Assigned Employees: test users and broken icons**
- **Now:** lists Manager accounts named "test test" and "Employee" (test users in a live customer org; support should
  remove them). A spinner is stuck above every "Manager" label. A red "Revoke" sits on every row.

**WF-7 · P2 · SEEN · Clicking the Workforce icon only shows a label; the sub-menu doesn't expand from the icon rail**

### 1.6 Trip (`/auto-trips`, `/auto-trips/:id`)

**TR-1 · P0 · SEEN · Failed load shown as real zeros**
- **Steps:** open `/auto-trips` (it happened on first open).
- **Now:**
  - "Could not load this list · Try again".
  - The sidebar showed "Couldn't load your account / Retry" and lost most menu items; the org name vanished from the top bar.
  - Tiles showed "Delivered 0" and "Needs your answer 0 · nothing waiting".
- **Want:** tiles show "—" and an error, not 0 (rule 2). The account-load failure needs its own retry, not a gutted menu.

**TR-2 · P1 · SEEN · After retry, parts still fail**
- **Now:** "Typical loaded run: Could not load delivered trips"; banner "Places could not be loaded".

**TR-3 · P1 · SEEN · No destination prediction anywhere in Trips (owner's point)**
- **Now:** every live row reads "<plant> → on the way", "Drop not known", loaded km "—". 2,998 of 3,850 trips (78%) "Needs your answer".
- **Want:** show the predicted drop ("→ probably Nimpura, 78%") and let the owner confirm with one click.

**TR-4 · P1 · SEEN · Live trip page (`/auto-trips/6b04bbdc…`)**
- **Map:** no roads and no names (only a purple line on a pale background).
- **Prediction:** "Heading to Unnamed place · ~146…" is cut off.
- **Cost:** "₹321 = fuel ₹0 + estimated maintenance ₹321".
- **Odd figure:** "Time to loading point 84 h 36 min".
- **Tolls:** "partial · some road sections inferred across GPS gaps · not final", "Amount unknown".
- **SAP:** needs a whole explainer box ("What does SAP mean here?").
- **Timeline:** mostly empty.
- **Code (map):** `pages/AutoTrips/AutoTripReplay.jsx:42-55` has its own map theme with highways `#f1f5f9`.

**TR-5 · P1 · SEEN · Delivered list (`?status=COMPLETE`)**
- **Now:** most drops "→ unnamed drop place"; many "delivered" runs are 0, 5, 7 or 8 km with a 15 h trip time; the SAP column is cut off ("No SAP for this ro…").
- **Fix (frontend):** flag implausible rows ("short run, please check") instead of listing them as delivered.

**TR-6 · P1 · SEEN · Delivered trip page (WB11G1462, 167 km)**
- **Map:** pale roads, no highway colour, no legend for the red pin, the hollow orange circles or the dashed segment.
- **Wrong question:** the timeline asks "Dalmia Salbani — was this the drop?", which is the loading plant.
- **Implausible figure:** "Unloading 34 h 3 min".
- **Reason line in system language:** "Open for 2.8 d while the longest trip on record is 1.3 d…".

**TR-7 · P0 · SEEN · History view shows raw timestamps**
- **Steps:** Trips → More → History.
- **Now:** dates read "2026-03-31T18:30:00.000Z". That is UTC, so the shown date is one day early in IST.
- **Fix:** format in IST (rule 7).

**TR-8 · P2 · SEEN · Navigation inside Trips**
- History and Review places are only reachable via "More".
- "Trip approvals" leaves Trips for `/approvals?type=trips`, and it means "pre-authorise a detour", not "approve trips"; it needed two clicks.
- The status dropdown didn't open on click.
- "13 trucks without trips" lists five places all named "Unconfirmed place".

**TR-9 · P2 · SEEN · Review places (Trips → Review places)**
- **Now:** the map is ~140 px tall at street zoom (OSM, the only map with orange highways). All 200 rows say "Unnamed stop / Needs a name".
- **Fix:** a taller map fitted to the stop and its trips; name each row "Stop near <town>, 6.5 h avg, 17 trips".
- **Code:** `pages/AutoTrips/PlaceReviewMap.jsx`.

### 1.7 Approvals (`/approvals`)

**AP-1 · P1 · SEEN · WhatsApp tab tiles**
- **Now:** "Pending ₹11,82,274.7" and "Total fuel billed ₹11,82,274.7" (the same number twice). "Total volume: Not measured for this tab",
  although every row has litres. The oldest pending is from 9 Nov.
- **Fix:** total litres; oldest-waiting age.

**AP-2 · P1 · SEEN · Bad rows shown without warning**
- **Now:**
  - "31.92 km/L (km from the message)" (impossible for a truck).
  - Rows with no truck ("—", "Market truck").
  - WB11S5962 shows "AI 20% · Needs Review" and status "Ready" on the same row.
- **Fix:** flag implausible km/L; a low-confidence row can't be "Ready".

**AP-3 · P1 · SEEN · One-click approve tick on every row, next to view (rule 9)**

**AP-4 · P1 · SEEN · Truck suggestion hidden in the bill drawer**
- **Now:** the suggestion sits inside a collapsed "Predictions · 1 truck suggestion", while the form says "We are not sure which truck this is".
- **Fix:** pre-fill or show the suggestion upfront.

**AP-5 · P2 · SEEN · Jargon in the drawer**
- **Now:** "AI Extraction 90% High Confidence", "Dash Photo OCR", "KEY FIELD" tag on every field.

### 1.8 Alert Inbox (`/alert-inbox`)

**AL-1 · P1 · SEEN · Almost all 291 alerts are "Critical", and every fuel alert admits it doesn't know**
- **Now:** "Sensor creep and a slow loss cannot be told apart yet". No litres in the row.
- **Fix:** put the litres and ₹ in the row; severity by size (2.8 L/day is not critical).

**AL-2 · P1 · SEEN · Alert detail has nothing to check against**
- **Now:** "falls ~2.81 L a day while parked". No fuel chart, no map, no link to the truck or fuel pages.
  The only action is "Mark as reviewed", which "does not resolve the issue".
- **Want:**
  - a fuel-level line for the parked window
  - a mini map of where it was parked
  - links: Open truck (Fuel tab), Open in Fuel checks

**AL-3 · P2 · SEEN · Banner and filter problems**
- **Now:**
  - Red banner "account disconnected. 0 trucks have no live data since 21 h ago" (an alarm about 0 trucks).
  - The page needs a 3-step how-to box and a "which page should I use?" box.
  - The Incidents tab's filters are stretched full-width and stacked.
- **Code (drawer):** `OwnerAlerts/AlertDetailsDrawer.jsx:130` "View vehicle" has no tab (also CODE B4).

### 1.9 Intelligence (`/intelligence`)

**IN-1 · P0 · SEEN · Same label, two numbers, on one page**
- **Now:** top tile "Needs you 175" vs Issues briefing "Needs you 27"; "To watch 966" vs "Watch 70".
- **Fix:** one definition (X-1).

**IN-2 · P0 · SEEN · Issues "No data" repeats the same truck once per day**
- **Now:** WB11M2162 appears 4 times (30/29/28/27 days), WB11N2762 3 or more times, while the page says "Each truck appears once per issue".
- **Fix:** group by truck in the frontend (keep the newest row).

**IN-3 · P1 · SEEN · "Account stopped sending data — 2 accounts" lists a truck number (BR44GB1162) as an account**

**IN-4 · P2 · SEEN + CODE · Issues dot grid is unreadable**
- **Now:** 14 grey/red cells per row, labelled only "11 Nov … 24 Nov".
- **Code:** `pages/Intelligence/IssueGroup.jsx:158-191` (`ActivityCells`).
- **Fix:** "Seen on 6 of last 14 days · last 23 Nov".

**IN-5 · P1 · SEEN · Trucks report cards**
- **Now:**
  - 127 trucks for a 126-truck fleet.
  - A 60 px unlabelled trend line, red on some 96-score trucks with no reason given.
  - Every "key finding" is "cruises steadily N% of the time".
  - Period "15–22 Nov" while the picker says "18–24 Nov".
- **Code (sparkline):** `ReportCardsBriefing.jsx:73-114`.
- **Fix:** a donut of grades, a sorted bar of scores, and "↑ 6 points this week" in words.

**IN-6 · P1 · SEEN · Report card drawer**
- **Now:** score 96 rests on one fact; two different raw-format periods ("2026-11-17 → 2026-11-24", "2026-11-15 → 2026-11-22").
- "See all its idling" filters correctly, but the map zooms to all of South Asia and the page doesn't say which truck is filtered.

**IN-7 · P0 · SEEN · Drivers tab: 121 drivers, all "Insufficient data"**
- **Now:** "Performance scores are not available yet". Key finding text: "An unrecorded distance driven across 1 assignment(s)".
- **Fix:** show what *is* known (km per driver as a bar, trips, idle h) instead of 121 "insufficient" rows.

**IN-8 · P1 · SEEN · Idling: numbers repeated, and they disagree**
- **Now:** top box "8 events · 3.3 h · ₹1,026"; the box below on the same screen "9 events · 4 h 19 min", cost "—".
  The left panel repeats 0 / ₹1k / 3.3 h again. The map starts zoomed out to all of India.
- **Fix:** one summary; a bar of idle hours per truck and a line per day.

**IN-9 · P1 · SEEN · Overspeed: 76 vs 0 on one screen**
- **Now:** "76 stretches, 54 h" above "Overspeed audit: 0 events, 0 of 126 trucks".
  The audit must be run by hand ("Run audit", default 60 km/h). Its map is centred on Afghanistan/Central Asia. A truck's model is "5555".
- **Fix:** show the audit result automatically; centre the map on the fleet.

**IN-10 · P2 · SEEN · Cruise & gears**
- **Now:** a large blank white area; "Partial list: CAN rows cut at 5,000"; a table of raw engine RPM readings; duration/fuel/cost "—".
- **Fix:** % of driving time in the cruise band per truck (bar).

**IN-11 · P1 · SEEN · Detours: "14 detours" above "Route deviation: 52 detours, 50 open"; cost priced for 3 of 50**

**IN-12 · P0 · SEEN · Fuel checks contradicts Alert Inbox**
- **Now:** "0 parked fuel-drop events", while Alert Inbox has dozens of critical "Fuel level moved while parked".
  Hotspots are named by raw coordinates ("Siphoning hotspot (22.251, 87.393)").

**IN-13 · P1 · SEEN · Mileage & DEF is empty ("No km/L figures for this period yet"), while Performance → Vehicles shows km/L for 50 trucks**

**IN-14 · P2 · SEEN · Loaded & empty runs: the chart is good, the counts aren't**
- **Keep:** the per-truck bar chart is good (`RunsTruckBar.jsx`).
- **Now:** "Showing 20 of 97 trucks… 89 trucks have unknown km" (97 + 89 > 126), with no way to see more than 20.
  One truck shows "100% empty · 929 km". The 63% empty-running figure is buried in small text.
- **Fix:** make 63% the headline (donut); add "show all".

**IN-15 · P1 · SEEN · Places: no place prediction (owner's point)**
- **Now:** every row is "Unnamed point <lat, lng>"; "Our guess: No suggestion" on every row; the Confirm button is greyed.

**IN-16 · P1 · SEEN · Performance → Vehicles silently cuts the list**
- **Now:** "This list stops at 50 trucks… a bigger fleet is cut off here" (76 trucks hidden). "Engine alerts 0" vs Issues "Engine lamps 125".
  Numbers are set in a typewriter (monospace) font.

**IN-17 · P1 · SEEN · Performance → Drivers ignores the date picker and is empty**
- **Now:** "No driver numbers for 26 Oct → 24 Nov" with the picker on 18–24 Nov. Every metric is empty.
- **Code:** `IntelligencePage.jsx:163-182,266`.

**IN-18 · P2 · SEEN · Leaderboards**
- **Now:** ~18 s to load; "7 of 85 drivers earned a rank", "unranked rows 304"; the formula "Σ fuelKm ÷ Σ litres" is printed on screen; period "last 110 days".
- **Code:** `LeaderboardsTab.jsx`, `leaderboardsModel.js:165-172`.

**IN-19 · P1 · SEEN · Slow load: once took > 50 s to settle (`?tab=vehicles`)**

**IN-20 · P2 · CODE · "Drivers" tab appears twice; "Trucks" and "Vehicles" are both per-truck views**
- **Code:** `intelligenceTabs.js:38-40` and `:101-104`.

**IN-21 · P2 · CODE · Driver idling link ignores the driver**
- **Now:** "See all their idling" (driver) shows the whole fleet; the map ignores `driver`.
- **Code:** `IdlingTab.jsx:30,122-141`.

### 1.10 Fuel Management

**FU-1 · P0 · SEEN · Diesel & Mileage → Mileage: every sub-view is empty**
- **Now:**
  - By truck: "No trucks in these dates. A truck shows up once it has driven in the range" (they drove thousands of km).
  - Fleet: km/L "—", plus a jargon table (Headline / Cross-check / Duty cut / Evidence gate).
  - Fill to fill: "No cycles".
  - By model: "No completed records", last cycle 19 Aug (96 days ago).
  - Used vs should use: blank until a truck is picked.
- **Fix:** use the same km/L source as Performance → Vehicles (X-11). Make the empty state say why ("needs 2 full-tank
  fills; you have 0 bills") and what to do.

**FU-2 · P2 · SEEN · Bill check tab is empty**
- **Now:** every fill row says "Bill missing / Unknown pump / Save pump" ("Fills with a bill 0 of 1,386").

**FU-3 · P1 · SEEN · Fuel Integrity loads slowly and the summary is incomplete**
- **Now:** > 45 s to settle once. The banner "Showing 100 of 110 fills · Load more" means the summary leaves fills out by default.
- **Fix:** load the whole window for the summary.

**FU-4 · P0 · SEEN · Threat Matrix shows implausible losses as CRITICAL theft**
- **Now:** "Dispensed 137 L · loss −118.4 L (₹11,623)" (86% lost) and "0 L dispensed · −122.8 L loss".
- **Fix (frontend):** a loss larger than ~30% of dispensed, or with 0 dispensed, shows as "data check needed", not CRITICAL.

**FU-5 · P1 · SEEN · Loss shown with two signs**
- **Now:** "−316.1 L" in the pipeline and "316.1 L" in the tile next to it.
- **Code:** `MassBalancePipeline.jsx`, `IntegrityBentoStrip.jsx`.

**FU-6 · P2 · SEEN · Tab names are alarming, not plain**
- **Now:** "Incident & Security Feed 713", "Vehicle Threat Matrix", "Pump Honesty Watchlist".
- **Fix:** rename to "Fuel events", "Trucks", "Pumps".

**FU-7 · P1 · SEEN · Incident feed rows have no location**
- **Now:** "Fuel loss to review −122.8 L (₹11,667) 33 min ago", Location "—". Filters are stacked full-width.

**FU-8 · P2 · SEEN · Pump watchlist says nothing**
- **Now:** every pump "Loss unknown · NOT YET AUDITED · Shortage not assessed". The same pumps are listed again in a side panel on the same page.
  Messy names like "(CASH OIL)GABRU".

**FU-9 · P2 · SEEN + CODE · Analytics chart is misleading**
- **Now:** a smoothed spline joins daily totals, so it looks continuous. The "Most affected vehicles" bars are all the same length (1).
- **Code:** `FuelActivityPanel.jsx`.
- **Fix:** daily bars.

**FU-10 · P1 · SEEN · Refuel advisory (`/refuel-advisory`, no menu entry)**
- **Now:** range "—" for any truck more than half full; fill ₹ shown on some rows only.

**FU-11 · P0 · SEEN · DEF ledger shows 0 for a month of driving**
- **Now:** "DEF burned 0 L" for most trucks; every row "Not assessed" / "DEF not reported", while the truck page shows a live DEF level.
  A big blue "+ Log" button on every row.

**FU-12 · P1 · CODE · DEF normal band differs between pages**
- **Now:** 3–6% (`Intelligence/MileageDefTab.jsx:17`) vs 4.0–7.0% (`FuelIntegrity/eventsFeed/InspectorMeter.jsx:19,32`).
- **Fix:** one constant.

**FU-13 · P1 · CODE · Unknown shown as zero**
- **Now:** "0 L", "~0 L/day", "≈ ₹0", "None flagged" when not measured.
- **Code:** `IntegrityBentoStrip.jsx:29,37,110-119`, `MassBalancePipeline.jsx:40-43`.

### 1.11 Track (`/live-tracking`)

**TK-1 · P0 · SEEN + CODE · Selecting a truck shows a blank beige map**
- **Now:** no roads and no names at the default zoom (seen on WB11G0762 and the Track mode replay). Zoomed out, highways are grey.
  There are no orange highways anywhere.
- **Code:**
  - `pages/LiveTracking/mapStyles.js:49,55-60` paints all roads white and highways `#edf2f7` (dark mode `:112-113`).
  - Track mode adds "all roads off" in `LiveMapCanvas.jsx:217-245` (`:224`).
- **Fix:** see Wave 3. Highways orange-red with an edge, main roads light orange, local roads white; Track mode keeps highways and road names.

**TK-2 · P1 · SEEN · Track mode for a moving truck**
- **Now:** "Moving 31 km/h" but the 24 h log is "0 km, 0 min driving, 2 records", both "Place not identified" with "Name this place".

**TK-3 · P1 · SEEN · "Where next" has no prediction behind it**
- **Now:** "Where next · not sure yet · Learning this truck's routes" for a truck with 30 days of trips. "Open" only toggles to "Close" and shows nothing.
- **Want:** a top-1 or top-3 predicted stop with %, or hide the card.

**TK-4 · P1 · SEEN · Moving truck labelled as a truck stop**
- **Now:** "Now · Moving at 14 km/h" with location "Truck stop · 9 trucks stop here".

**TK-5 · P1 · SEEN · Places & routes panel**
- **Now:**
  - Every place layer is **off by default**.
  - "Trucks idling now 0" contradicts the "Idling 2" chip seconds earlier.
  - Counts change within seconds: Workshops 25 → 15, Toll plazas 52 → 62, Places to confirm 538 → 609.
  - With layers on, places are dark numbered circles with no names, read through a 9-icon legend. "JSW SALBANI" appears twice (Warehouse + Loading point).
- **Code:** `TrackPlacesLayer.jsx:17` forces area labels off.

**TK-6 · P2 · SEEN + CODE · Satellite shows no town or road names**
- **Code:** `useLiveMap.js:151` uses `satellite`; Place Hub uses `hybrid`.
- **Fix:** use `hybrid`.

**TK-7 · P2 · SEEN · Slow load and card clutter**
- **Now:** > 45 s to settle once; a blank grey map for several seconds; VIN on every fleet card; "ON" and "Fix" chips unexplained.

### 1.12 Route Hub (`/route-hub`), partly audited

**RH-1 · P1 · SEEN · Numbers disagree with Intelligence and Trips**
- **Now:** overview "Sustained overspeed 0", "0 of 126 flagged" (Intelligence: 76); "Detected trips 1,691" (Trips: 3,850).

**RH-2 · P1 · SEEN · Maps**
- **Now:** a third map style (Esri grey; dark mode via CSS invert), zoomed out to all of India, with no route lines visible on the overview.
  The Route replay map is blank grey, the vehicle dropdown shows the model as "5555", and it shows 0 km.
- **Code:** `pages/RouteHub/routeHubMap.js:9,26-32`.

**RH-3 · P2 · SEEN · Profitability was still loading skeletons after 9 s**
- Route deviation tab: same list as Intelligence Detours.

### 1.13 Other pages (first screen only so far)

**OT-1 · P0 · SEEN · Khata ledger contradicts Fuel Integrity**
- **Now:** "Fuel ₹0", "Tolls ₹3,37,320 = 100% of spend". Fuel Integrity shows 17,394 L used in a week.

**OT-2 · P1 · SEEN · Tolls page (`/tolls`) is switched off**
- **Now:** "Tolls is not switched on for your organisation", while Khata shows toll spend.

**OT-3 · P1 · SEEN · Reports → Vehicle report**
- **Now:** "Latest fuel bill 19 Aug (97 days ago)"; its own dd-mm-yyyy date picker; mileage mostly "—".

**OT-4 · P1 · SEEN · Place Hub base map stayed blank grey with clusters floating on it**
- **Now:** many filter chips ("Low evidence 1,303", "Not a place 175").

**OT-5 · P2 · SEEN · App Usage: 97 of 195 screens are opened fewer than 2 times, or never**
- This proves users can't find things.
- Note: its orange daily bar chart is clean and readable. Copy that style.

### 1.14 App-wide

**AW-1 · P1 · SEEN · Sidebar is icons only; names appear on hover**
- **Fix:** show labels by default (collapsible).
- **Code:** `utils/sideNavItems.js`, `components/Sidebar.jsx`.

**AW-2 · P2 · SEEN · Menu names don't match page titles**

| Menu says | Page title says |
|---|---|
| Track | Live tracking |
| Trip | Trips |
| Workforce | Employees |
| Fuel Management | Diesel & Mileage |
| Places & Routes | Place Hub |

**AW-3 · P1 · SEEN · Three overlapping alert pages, and the app admits it**
- **Now:** Intelligence and Alert Inbox both carry "Alert inbox, Owner alerts and Intelligence: which should I use?".
- **Fix:** one Alerts page; Intelligence keeps analysis only.

**AW-4 · P1 · CODE · Orphan routes with no menu link**
- **Routes:** `/driving-dna`, `/optimal-speed`, `/challans`.
- **Redirects that drop the query:** `/performance?tab=…`, `/overspeed`, `/hotspots`.
- **Wrong rewrite:** `fleetDestination.js:104-107` rewrites `/mileage?tab=mileage` to Diesel fills.
- **Ignored id:** `/trip/:tripId` ignores the id.

**AW-5 · P2 · SEEN · Four different map looks with no shared base**
- **Styles:** Google styled (light), Google unstyled, Esri grey, OSM, and the fake grid on the truck page. 14 maps in code.
- **Fix:** one base-map config (Wave 3).

---

## 2. One number per fact (X list): which pages disagree

For each row, find which endpoint is right (backend check), then make every listed page read that one source.

| # | Fact | Values seen (page) |
|---|---|---|
| X-1 | Needs you / to watch | 175 vs 27; 966 vs 70 (both Intelligence) |
| X-2 | Idling now | Live 3 → 2; Intelligence 0; Track places panel 0 |
| X-3 | Dark / offline trucks | Digest 54; Live 55 → 53; Intelligence 25 silent (101 of 126 reporting) |
| X-4 | Overspeed (7 d) | Intelligence 76; Overspeed audit 0; Route hub 0 |
| X-5 | Trips | Trips 3,850; Route hub 1,691 |
| X-6 | Drivers | Employees "10" (page size); Perf Drivers 50; Leaderboards 85; Intelligence Drivers 121; Access control 0 holders |
| X-7 | Trucks | 126 (Vehicles, Live); 127 (report cards); 133 (Service) |
| X-8 | Fuel spend / tolls | Khata fuel ₹0, tolls 100%; Fuel Integrity 17,394 L; Reports ₹4,93,097; Tolls page "off" |
| X-9 | Idling threshold | Digest flags 3 min; Intelligence ≥ 20 min |
| X-10 | Idle events (same screen) | 8 / 3.3 h vs 9 / 4 h 19 min |
| X-11 | km/L | Perf Vehicles 50 trucks, median 3.02; Mileage page none; Mileage & DEF none; truck Fuel tab "Not measured" |
| X-12 | Engine alerts | Perf Vehicles 0; Issues "Engine lamps 125" |
| X-13 | Parked fuel drops | Fuel checks 0; Alert Inbox dozens critical; Fuel Integrity feed 713 events |
| X-14 | Places to confirm | 528, 531, 538, 609 |
| X-15 | Detours | 14 vs 52 (same Intelligence screen) |
| X-16 | Service due | Upcoming 12 overdue; Fleet Alerts 0 |
| X-17 | DEF | DEF ledger burned 0 L; truck page live DEF level; normal band 3–6% vs 4–7% |

---

## 3. Not audited yet (next session continues here)

1. **Daily Digest, every link:**
   - Review (alerts), Critical truck issues, Account connectivity, Places waiting, Fuel to explain
   - Live map, dark-truck chips, "+44 more", Re-link this account
   - each "Open" in "The day in numbers", Loaded vs empty "Open", Fuel last 7 days "Open"
   - See the drivers, Why flagged, ⓘ tips, the "possible fuel loss" chip on a day that has one
2. **Route Hub:** Overspeed audit and Intelligence tabs, Profitability once it loads, open a deviation, replay with a truck picked.
3. **Place Hub:** tabs Idling, Fuel risk, Stops, Same place?, Routes, Facilities, Regions, Driver homes; open a place; map layers.
4. **Khata ledger:** tabs Drivers, Vehicles, Assignments, Transactions, Reports.
5. **Reports:** the other 12 (Driver, Mileage, Model comparison, Diesel, AdBlue, Oil & Average, Fuel cycles, Full tank,
   Non-business, Running cost, Trip register match, Custom).
6. **Account:** App Usage (full page), Data imports, Settings, Profile.
7. **Top bar:** notifications bell (15), red link icon, support (headset), org switcher.
8. **Truck page leftovers:** View specs, Show 10 fields, Log fuel dialog (open only), Documents tab and a document cell, Edit vehicle form.
9. **Track leftovers:** replay playback, 3D follow, Traffic, Routes tab. Skip Share: creating a share link changes data.
10. **Fuel Integrity leftovers:** Telemetry drilldown, Load more fills, inspector panel. Skip "Reconcile all": it writes data.
11. **Pages with no menu link:** `/driving-dna`, `/optimal-speed`, `/challans`, `/owner-alerts`, `/fleet-alerts`, `/locations`,
    `/fleet-coverage`, `/ialert/vehicles`, `/trip-management`, `/vehicles/service-bills`, `/vehicles/dashboard`.
12. **ERP:** not in this org's menu, so it can't be checked from this account.

---

## 4. Fix plan (frontend), in order

**Process (owner rules):**
- **Step 0:** run this plan through the MiniMax `review` (4+ steps rule) and show the owner the verdict.
- **Per wave:** one gh issue, one branch, one PR. Run lint + vitest + `scripts/check-bundle.mjs` locally before push.
- **Who does what:** MiniMax builds from a one-page brief; Claude reviews the diff and re-checks the exact steps above in Edge on localhost
  pointed at the prod API, with before/after screenshots in the PR.

**Wave 1: P0 safety and white pages (small, ship first)**
- **Security:**
  - WF-1: autofill of the owner's password.
  - WF-6: ask support to remove the test users.
- **White pages and dead links:**
  - TP-1, TP-2, and the NotFound route.
  - DG-1 and DG-2: chip links.
  - TR-1: failed load shown as zeros, and the account-load failure.
  - TR-7: raw ISO dates.
  - AW-4: redirects keep the query; `/trip/:id` opens the trip.
  - CODE B4–B9: links pass a tab, driver and date.
- **Tests:** one failing test per link, then the fix.

**Wave 2: one number per fact (§2 X-1 … X-17)**
- **Per KPI:** a backend check of which endpoint is right, then one shared selector or hook used by every page that shows it.
- **Pure frontend:** IN-2 (dedupe), FU-5 (sign), FU-12 (DEF band), X-9 (threshold constant), WF-4 (real totals), SV-1 (service tabs).

**Wave 3: maps (TK-1, TK-6, TP-5, TR-4, TR-6, TR-9, RH-2, OT-4, AW-5)**
- **Base style:** one shared road palette in `mapStyles.js`, used by every Google map, including `AutoTripReplay.jsx` and the unstyled maps.
- **Track mode:** keeps highways and road names.
- **Satellite:** `hybrid`.
- **Truck page:** the fake grid map becomes a real map fitted to the trail, with named stops.
- **Review places:** a taller, fitted map.
- **Place Hub:** fix the blank base map.
- **Zoom:** maps fit the fleet or truck, not Asia.
- **Legends:** add legends on trip maps.
- **Verify:** check raster and vector maps in Edge.

**Wave 4: predictions and place names (TR-3, TK-3, IN-15, TP-11, TR-6, AP-4)**
- **Predictions:** show the backend's predicted drop or next stop (top-1/top-3 with %) wherever "Drop not known", "not sure yet" or "No suggestion" appears; one-click confirm.
- **Names, not coordinates:** names everywhere coordinates are shown now (rule 3).
- **Needs a backend answer:** does a prediction endpoint already return data for this org? If it returns empty, that's a backend issue to raise.

**Wave 5: plain charts, empty states, words (rules 2, 5, 6, 8)**
- **Shared chart kit:** `src/components/charts/` with Bar, Line, Donut, one theme and units, built on recharts.
- **Replace dot strips and sparklines:** IN-4, IN-5, TP-7, TP-12, TP-13, FU-9.
- **Summaries:** idling/overspeed/cruise per-truck bars plus per-day lines (IN-8 … IN-10); Runs headline (IN-14); FU-4 plausibility flag.
- **Empty states:** say why and what to do (TP-9, TP-14, FU-1, IN-7, IN-13, DG-7); no silent list cuts (IN-14, IN-16, FU-3).
- **One word list:** in `src/utils/copy/`, replacing every term in rule 6; renames FU-6, AW-2; sidebar labels AW-1.
- **Risky buttons:** delete/approve off table rows (VH-5, AP-3, WF-6).

**Wave 6: truck page and employee page as hubs (TP-15, WF-2, VH-3)**
- **Truck page:** a "Today / This week" strip (idle, fuel loss, overspeed, stops, trips) linking into Intelligence, filtered to the truck;
  the hero becomes facts, not a cartoon.
- **Employee page:** `/drivers/:id` profile with km/trips/idling/overspeed per week (charts), assigned trucks, documents, and an Edit button.
- **Vehicles list:** status, place, fuel %, driver and last-seen columns.

**Separate backend issues (not frontend):** trip drops not detected (78% need answers), the moving truck with 0 km today,
FleetEdge feed failing since 22 Sept, implausible delivered runs and losses, DEF burned 0 L, and the empty driver scores and mileage cycles.

## 5. Verification

- **Each issue:** repeat its Steps on the live site after deploy (or localhost against the prod API) and confirm "Want".
  Attach a before/after screenshot to the PR.
- **Cross-page check:** a script reads every KPI endpoint in §2 once and prints each fact's value per page; all must match,
  or carry their stated reason.
- **Gates:** `npm run lint` 0 errors, vitest green (with the new link tests), bundle budget not raised, production build.
