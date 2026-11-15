# REDESIGN_REPORT

The 3 Nov 2026 frontend redesign, F0 to F11, built against
`F:\gnb\redesign-2026-11-03\FRONTEND_MINIMAX.md` and `API_CONTRACTS.md`.

**Branch:** `feat/redesign-frontend-2026-11-03`, based on
`origin/release/3-nov-26` (commit `6bfabe6f`).
**Merged in:** `feat/redesign-F4`, `feat/redesign-F7`, `feat/redesign-F8`,
`feat/redesign-F5`.
**Nothing was pushed, merged to `main`, or deployed.** The reviewer pushes
the branches and opens the PRs.

---

## 1. What was built

### F0 — Foundations
The floor everything else stands on.

- `frontend/src/styles/redesign/tokens.css` — the only colours new code may
  use. A light and a dark value for each token.
- `frontend/src/components/redesign/` — twelve shared components, one per
  file, each with a render test per state: `InfoTip`, `FreshnessBadge`,
  `ToneBadge`, `WhyPopover`, `InsightChip`, `StatTile`, `HeldCard`,
  `NotYetAvailable`, `ErrorCard`, `PlaceName`, `DeepLink`, `SectionCard`,
  plus `NavHint` for the sidebar's hover help.
- `frontend/src/components/ui/tooltip.jsx` — a shadcn-style wrapper over
  `@base-ui/react/tooltip`, the base library the app already uses. **No new
  dependency.**
- `frontend/src/utils/redesign/` — `format.js`, `links.js` and `tone.js`.
  Pure and tested. A number is never formatted by hand and a URL is never
  built in a component.
- `frontend/src/schemas/` — one zod schema per contract endpoint, each
  accepting the `held` wrapper, plus a fixture per schema that parses.
- `frontend/src/services/fleetViewService.js` — every fleet-view endpoint,
  parsed with its schema, every request abortable.
- `frontend/src/utils/sideNavItems.js` — Intelligence enters the Fleet
  section, Place Hub leaves the sidebar, and every item carries a hover hint.
- Map styles — Google's own place labels are back on, and `clickableIcons`
  is off so a Google label cannot open Google's info window over our panels.

### F1 — The Track page
- `TrackLegend.jsx` — the floating panel that **is** the filter: status, make
  and place layers, each row a switch with `aria-pressed`, a double click
  showing only that group, an "All" button that appears only when something is
  off. The counts are the whole fleet's, so a filter never changes the
  number the owner sees.
- `trackLegendModel.js` — the rules, pure and tested.
- `MapSearchBox.jsx` — the search moves onto the map; it is the same search
  state as before, so `/` still works, and it now drives the fleet list and
  the places list.
- `TrafficToggle.jsx` + `TrafficLayer.jsx` — Google's live traffic, off by
  default, remembered. Display only.
- `useMapPlaces.js` — the extra place layers, asked for the visible map box
  once the map settles, never for a layer that is off, never below zoom 11.
- `PlaceDetailPanel.jsx` — the place panel now answers which place it is,
  how busy, what a driver can do about it, who is there now and when it was
  last visited.

### F2 — The vehicle panel
- `VehiclePanelHeader.jsx` — plate, make, model, VIN (copyable), status, leg
  of the journey, GPS and engine state.
- `VehicleReadingTiles.jsx` — fuel, DEF, odometer, speed. A stale reading is
  grey and dated; a reading never received says "Not received"; never a zero.
- `VehicleNowCard.jsx` — the activity, how long, how that compares with this
  truck's usual stay, where it is, and the trip. The material reads "Likely
  Cement or clinker" when it comes from the plant type.
- `WhereNextSection.jsx` — the top guess in the collapsed header, the reasons
  and the road when opened. The reason is printed exactly as the backend
  sends it; a raw probability is never shown.
- `vehiclePanelModel.js` — the rules and the fallback onto the release's
  position row, so every section has one shape and one honest empty state.

### F3 — Track mode
- `trackUrlModel.js` — the state lives in the URL, so every link in the
  product can open one truck's history on a given range.
- `trackLayersModel.js` — the drawing rules, exact and tested. Laden runs
  solid blue, empty runs dashed grey, gaps thin and half transparent with a
  caption. **An overspeed is an orange circle and never a red line; a detour
  is a red diamond.**
- `trackPlayback.js` — 1× means one real minute plays in one second, the
  event jumps, and the CSV of the drive.
- `TrackTimeline.jsx`, `TrackLog.jsx`, `TrackRangePicker.jsx`,
  `TrackMapLayers.jsx`, `useTrackMode.js` — the timeline, the trip log, the
  range picker and the map drawing.
- The old Replay bar and the trail date filter leave the page. Route Hub's
  replay tab now redirects to the Track page, so saved links still work.

### F4 — Intelligence *(built and merged from `feat/redesign-F4`)*
Eleven URL-driven tabs, good next to bad, every claim carrying the API's own
reason plus a link to the moments behind it. Plant-to-plant runs are their
own leg and are never counted as empty.

### F5/F6 — The Digest and the Alert inbox *(built and merged from
`feat/redesign-F5`)*

### F7 — Fuel *(built and merged from `feat/redesign-F7`)*
One Mileage page with km/L and DEF, every fill-to-fill cycle reconciled
against the oil report, and Fuel Integrity with the honest wording:
explained by driving, went down while parked, fill doesn't match bill, not
enough data.

### F8 — Trips *(built and merged from `feat/redesign-F8`)*
Plant-to-plant rows as normal, the History tab, the Questions tab, and the
trip detail's "why did it stop".

### F9/F10/F11 — Detours, places, the photo bill
- **F9** — the detour detail draws the usual road under the road as driven
  and the off-road part on top of it, in the redesign's colours. The exit and
  rejoin are white circles with a red edge. When there is no usual road the
  map says why instead of drawing an empty layer. The stops while off the
  usual road are **facts**: where and for how long, with no reason and no
  judgement. The cost is "—" when unknown, never ₹0.
- **F10** — the "Same place?" tab says it in one sentence: *"These look like
  the same place: DANKUNI SAIDING and Dankuni Siding, 20 m apart"*. The
  Track place panel lists the parts of a plant, so "at JK BUXAR" can be
  pinned to the weighbridge and not to a circle 600 m wide.
- **F11** — "Add bill photo" replaces "Add diesel bill". The photo is
  uploaded once and the suggestion polled every two seconds for thirty. A
  sure answer says which truck and why, with Confirm and Change; an unsure
  one lists the candidates with their reasons. The by-hand form stays
  reachable: **a route is never deleted.**

---

## 2. The gate

| Check | Result |
|---|---|
| `npm run lint` | **0 errors**, 6 warnings — all six pre-existing, in files this redesign did not touch. |
| `npx vitest run` | **see §3.** |
| `npm run build` (`vite build`) | passes. |
| `node scripts/check-bundle.mjs` | passes, inside the existing budget. The budget was **not** raised. |
| Files under 400 lines | every new file. |
| `div onClick` | none. Every interactive element is a `<button>` or an `<a>`. |
| zod on every response | yes — `fleetViewService` parses every response, and every schema accepts the `held` wrapper. |
| Forbidden words | no "siphon", "pilferage" or "theft" in any redesign screen's copy. See `REDESIGN_QUESTIONS.md` §3 for the marketing site and the ERP, which are outside this scope. |
| Invented numbers | none. Every number is the API's, formatted by `utils/redesign/format.js`. |

### The bundle

The base branch was already at **7,799,138 B** against a **7,900,000 B**
budget — about 100 KB of room. An early version of the landmark pin used
`react-dom/server` to render the lucide glyphs into an SVG data URI, which
pushed the bundle to 8,071,434 B — over budget. The glyphs are now hand-written
SVG paths, `react-dom/server` is gone, and the branch sits at **7,881,437 B**,
inside the budget it started with. **The budget number was not changed.**

---

## 3. Test results

The whole suite runs from `frontend/`:

```
npm run lint      # 0 errors
npx vitest run    # the numbers below
npm run build
```

**Three tests fail, and they failed before this redesign.** They are:

- `src/components/SearchableDropdown/SearchableSelect.test.jsx` — two tests,
  both 5-second timeouts.
- `src/pages/RouteHub/views/replay/ReplayToolbar.test.jsx` — one test, "no
  accessible element with the role button and name WB11S1962 · 2820".

This was proved, not assumed: the untouched base branch
(`origin/release/3-nov-26`, commit `6bfabe6f`) was checked out into a
separate worktree and the same two files were run there, with the same three
failures and the same messages. They are timeouts on a loaded machine, not
regressions. They were left alone.

**76 new test files** were added, covering every new component (at least one
render test per state) and every new pure module (unit tests).

---

## 4. What was not done, and why

1. **Screenshots.** This machine has no browser driver installed and
   installing one was out of scope for a code change. The walkthrough is
   written as exact click paths instead — see `REDESIGN_WALKTHROUGH.md`.

2. **The new endpoints are not on prod yet.** `/now`, `/where-next`,
   `/map/places`, `/campuses` and the track endpoint are all part of the
   backend plan. Every one of them has a real fallback or a real empty
   state; nothing pretends to have data it does not have.

3. **The material and the tonnage.** There is no source for either on prod —
   weigh slips, consignments, ERP trips, e-way bills and photo uploads are
   all empty for every org. The panel therefore says "Likely Cement or
   clinker" and leaves the tonnage line out. It does not show `0 t`.

4. **The "help nearby" section in the driver app.** It belongs to the
   driver-navigation plan, which can reuse the same data feed. It was not
   built here.

5. **The Place Hub Routes map.** That screen was never looked at, so it was
   not redesigned. The plan says the same.

6. **The marketing site's "theft" copy.** It is the public site, not the
   product, and it was not in scope. It is flagged in
   `REDESIGN_QUESTIONS.md` §3.1.

7. **The old Trail and Replay machinery inside `useLiveMap`.** The owner's
   controls for both are gone from the page and Track mode replaces them, but
   the hook still returns the trail and replay data, because ripping it out
   would have touched the map's rendering far beyond this redesign's scope.

---

## 5. The questions

Everything that had to be decided without the plan saying so is in
`REDESIGN_QUESTIONS.md`. The short version:

- **Wording chosen** — the Fuel Management hover hint; the four Fuel Integrity
  verdict sentences; "Likely …" for the material; when a missing number is
  "—" and when it is "Not received"; "Location not known" instead of
  "Unknown site".
- **Needing a backend** — the five endpoints above; the reason a stop
  happened; the capture upload's field names.
- **Left alone on purpose** — the marketing site, the ERP's consignment
  "In transit", Owner Alerts' internal type name, and the Place Hub's
  `theftIncidents` field (its words changed, its API name did not).
- **Open for the owner** — six questions, including one where the plan
  contradicts itself: it says the "Where next" detail is fetched only when
  opened, and also that the *collapsed* header shows the top destination.
  Both cannot be true; the frontend fetches on open so the header can show
  the top guess, and the question asks whether the endpoint should be split.
