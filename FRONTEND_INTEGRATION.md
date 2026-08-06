# GNB Frontend — Integration & Polish Guide

For the frontend developer polishing the GNB owner app. This documents the **API contracts**, which **pages already exist**, what's **left to build/polish**, and the **design intent** so the UI reads consistently.

**Backend Swagger is the source of truth for exact field lists** — run the backend and open `/api-docs`. This README summarizes the contracts + the *why*.

---

## 0. What this product is (so the UI has a point of view)

Fleet owners pay Tata FleetEdge but **distrust its numbers**. GNB is the **independent, transparent auditor**: it turns raw telemetry into **money/risk decisions in ₹**. Two rules that should shape every screen:

1. **Speak in ₹ and actions, not raw telemetry.** FleetEdge shows litres and dots; every GNB screen answers *"what did this cost me / what do I do."*
2. **Alerts mean "please review," never an accusation.** Every money figure is an **estimate** — the backend returns a `disclaimer` string on money endpoints; surface it. Don't render estimates as verdicts.
3. **In-app only.** No WhatsApp/SMS/email in this app — that's a separate team.

---

## 1. API conventions (apply to every endpoint)

- **Base URL:** `VITE_API_BASE_URL` (prod `https://api.app.gnbedge.in/v1/`; localhost for dev). Use the existing `apiClient` (`utils/axiosConfig`).
- **Auth:** Bearer JWT (already wired in `apiClient`). Every endpoint below requires it.
- **Roles:** all owner-facing endpoints are `OWNER` + `MANAGER` only. A `DRIVER` / unauth token gets 401/403 — handle gracefully.
- **Tenancy:** automatic — the backend scopes everything to the caller's org from the JWT. **Never send an orgId.**
- **Success envelope:** `{ "status": "success", "data": { ... } }`. Always read `response.data.data`.
- **Error envelope:** `{ "status": "error", "message": "..." }` with HTTP 400 (bad params) / 401 (unauth) / 404 (not found). The existing services already `catch` and rethrow `error.response?.data`.
- **Dates:** send/receive ISO 8601. Display in **IST (Asia/Kolkata)** — the live-tracking page already does this; reuse that formatter everywhere.
- **Money:** integers/floats in **₹ (INR)**. Format with Indian grouping (e.g. `₹4,200`). Fields end in `Inr`.
- **Feature flags:** several pipelines are **off until the calibration week**, so some endpoints may return **empty arrays / zeros** on dev today. Design empty states deliberately ("No fuel-loss events yet") — empty ≠ error.

---

## 2. Endpoint contracts, by feature

### 2.1 Live Tracking — `/api/livetracking` ✅ page exists
> Cheap DB reads over our own collections. The **page must never trigger a FleetEdge pull** — the backend cron does that. ⚠️ Needs the `feat/live-tracking` backend branch deployed before it returns data.

- **`GET /positions?state=ACTIVE|PARKED|OFFLINE`** → `data.records[]`:
  `{ registrationNumber, vin, state, eventDateTime, latitude, longitude, speed, courseDegrees, ignition, primaryFuelLevel, status, isStale, pulledAt }`
- **`GET /positions/:reg/trail?from&to&limit`** → `data`:
  `{ registrationNumber, from, to, points: [{ eventDateTime, latitude, longitude, speed, courseDegrees, ignition, state }] }` (oldest-first polyline)

**UI:** markers colored by `state` (ACTIVE/PARKED/OFFLINE) + a dimmed/striped treatment when `isStale`. Poll `/positions` every ~45s while mounted (already done). `ignition` may be `null` (payload-dependent) — don't assume boolean.

### 2.2 Fuel Integrity — `/api/fuel-integrity` ✅ page exists
- **`GET /fills?vehicle&from&to&page&limit`** → `data.{ window, records[], total, page, limit, totalPages }`, each record:
  `{ registrationNumber, litres, at, lat, lng, odometer, source(SNAPSHOT|INSIGHT_STATUS), confirmationStatus(ESTIMATED|CONFIRMED|REJECTED), matchedFuelLogId, claimedLitres, billVarianceL, billFlag }`
- **`GET /windows?vehicle&from&to`** → mass-balance windows (siphon suspects + DEF ratio) — see Swagger for fields (`unaccountedLossL`, `siphonSuspected`, `siphonConfidence`, DEF ratio).
- **`GET /summary?from&to`** → `data.{ window, fuelPriceInrPerL, totals{ fillsLitres, siphonSuspectedLossL, siphonSuspectedLossInr, billFlagCount, defFlagCount }, vehicles[], disclaimer }`

**UI:** lead with `siphonSuspectedLossInr` (the money). Show `confirmationStatus` as a badge — ESTIMATED (amber, "pending FleetEdge confirmation") / CONFIRMED (green) / never render REJECTED as "cleared." Surface `disclaimer`.

### 2.3 Route Deviation — `/api/route-deviation` ✅ page exists
- **`GET /`** → paginated deviation events, **OPEN first**. Each event: `{ registrationNumber, tripId, detectedAt, maxOffKm, offCorridorPoints, extraKmEstimate, estimatedExtraCostInr, status }`.
- **`PUT /:id/review`** → mark an event reviewed.
- **`GET /corridors`** → the org's learned baseline routes (draw as a "known routes" layer):
  `data.corridors[]` = `{ originKey, destinationKey, origin:{lat,lng}, destination:{lat,lng}, points:[{lat,lng}], corridorBufferKm, sampleTripCount, updatedAt }`.
- **`GET /:id/map`** → everything needed to draw one deviation on a map:
  `data.{ event, trip:{from,to}, corridor:{ points:[{lat,lng}], corridorBufferKm, origin:{lat,lng}, destination:{lat,lng} } | null, actualPath:[{ lat, lng, at, offCorridor }], deviationSegments:[{ points:[{lat,lng}], extraKm }] }`.
  ⚠️ These two endpoints ship on the backend branch **`feat/route-deviation-map`** — confirm it's deployed before wiring the overlay.

**UI:** lead with `estimatedExtraCostInr`. **Map overlay recipe** (per event, from `GET /:id/map`): draw `corridor.points` as the baseline route (optionally a buffered band of `corridorBufferKm`), plot `actualPath` as the traveled polyline, and **highlight `deviationSegments` in red** — each segment carries its own `extraKm`. `corridor` may be `null` (no learned baseline yet) → fall back to the actual-path line only. Use `GET /corridors` for a fleet-wide "normal routes" map that isn't tied to a single event.

### 2.4 Owner Alerts (unified feed) — `/api/owner-alerts` ✅ page exists
- **`GET /?vehicle&type&acknowledged&from&to&page&limit`** → `data.{ window, records[], total, unacknowledgedCount, page, limit, totalPages }`, each record:
  `{ id, type, vehicleNumber, message, inrEstimate, at, acknowledged }`.
  `type` is one of: `REFUEL_ESTIMATED, FUEL_SIPHON_SUSPECTED, ADBLUE_BALANCE_FLAG, IDLING_BURN_HIGH, EV_LOW_SOC, FLEETEDGE_SUBSCRIPTION_EXPIRING/EXPIRED, FLEETEDGE_ALERT_*, FLEETEDGE_REAUTH_REQUIRED` (+ `HOTSPOT_STOP`, `THEFT_CORROBORATED`, `REFUEL_LITRES_MISMATCH`, `TYRE_REPLACEMENT_DUE`, `FLEETEDGE_SUBSCRIPTION_*`).
- **`PUT /:id/ack`** → acknowledge (records "seen," not a verdict).

**UI:** this feed is where **every backend feature reaches the owner** — even features without their own page. Show `unacknowledgedCount` as a nav badge. `inrEstimate` is `null` when the message has no ₹ — hide the money chip then. Icon/color per `type`.

### 2.5 Owner Value (the ₹ dashboard) — `/api/owner-value` ⚠️ only the digest is surfaced (Overview)
All return a `disclaimer`; all money is estimated.
- **`GET /money?from&to`** → `data.{ window, money{ theftLossInr, billFraudSuspectInr, idlingWasteInr, detourWasteInr, defCostInr, fuelCostInr }, totalWasteInr, topVehicles[]{ registrationNumber, wasteInr }, disclaimer }`
- **`GET /health-score`** → `data.{ window, score(0–100), grade(A|B|C|D), components{ theft, utilization, compliance, mileage }{ weight, penalty, detail }, disclaimer }`
- **`GET /utilization?from&to`** → per-vehicle + fleet loaded/empty km, `emptyKmWasteInr`
- **`GET /downtime-risk`** → `vehicles[]{ registrationNumber, risk(DUE_SOON|OVERDUE), daysUntilDue, projectedServiceDueDate, exposureInr }, totalExposureInr, formula`
- **`GET /compliance-risk?days=30`** → `documents[]{ registrationNumber, docType, expiryDate, daysLeft, status(EXPIRED|EXPIRING), exposureInr }, totalExposureInr`
- **`GET /trip-pnl?tripId=`** → `data.{ trip, distanceKm, revenueInr, revenueNote, costs[]{ type, amountInr, assumed, source, note }, totalCostInr, profitInr, marginPct, disclaimer }` (revenue may be `null` with a note when freight data is absent)

**UI:** `GET /money` + `GET /health-score` drive the **daily digest / Overview** (partially built). The other four deserve their own drill-down cards/screens (see §4).

### 2.6 Supporting (backend ready, no dedicated page yet)
- **Hotspots** — `GET /api/hotspots` (list, org + shared), `POST /api/hotspots` (add manual), `PUT /api/hotspots/:id` (edit). Each: `{ name, centerLat, centerLng, radiusM, incidentCount, lastIncidentAt, source(AUTO_LEARNED|MANUAL), active }`. → a **theft-map overlay**.
- **Tyres** — `/api/tyres` (`TyreSet` CRUD: km-per-tyre, owner-entered cost → cost-per-km + replacement prediction). → a **per-vehicle tyre panel**.
- **Insights Compare** — `GET /api/insights/compare/fuel?vehicle&from&to` (old fuelComparison vs new fuelIntegrity, side by side + agreement summary). → a **trust/"show the working"** view.

---

## 3. Pages that already exist (verified) — polish these first

| Page | Route | Service file | Endpoints |
|---|---|---|---|
| Live Tracking (map) | live-tracking | `pages/LiveTracking/LiveTrackingService.jsx` | `/livetracking/*` |
| Fuel Integrity | `/fuel-integrity` | `pages/FuelIntegrity/FuelIntegrityService.jsx` | `/fuel-integrity/*` |
| Route Deviation | `/route-deviation` | `pages/RouteDeviation/RouteDeviationService.jsx` | `/route-deviation/*` |
| Owner Alerts | `/owner-alerts` | `pages/OwnerAlerts/OwnerAlertsService.jsx` | `/owner-alerts/*` |
| Owner Value Digest | on `/overview` | `pages/Overview/OwnerValueDigest.jsx` | `/owner-value/money`, `/health-score` |
| Fuel Comparison (legacy) | `/fuel-comparison` | `pages/Reports/ReportsService.jsx` | legacy pipeline |

Routing is in `src/App.jsx`; nav in `src/components/Sidebar.jsx`. Built on `@react-google-maps/api` (already a dependency).

---

## 4. What to build / polish (priority order)

1. **Fuel Integrity page — make it the hero.** Lead with siphon-loss in ₹, ESTIMATED/CONFIRMED badges, per-vehicle summary strip from `/summary`, drill into `/fills` + `/windows`. This is the flagship an owner judges us on.
2. **Owner Value dashboard** — turn `/owner-value/*` into real cards: Health Score gauge (A–D), the money breakdown, downtime-risk and compliance-risk lists (both already return `exposureInr`), utilization empty-km. Only the digest exists today.
3. **Daily digest** — the one-line hero per item (*"₹4,200 unexplained fuel loss on WB25R9540 · service overdue · 2 docs expiring"*) from `/money` + `/downtime-risk` + `/compliance-risk`.
4. **Hotspot theft-map** overlay from `/api/hotspots`.
5. **Tyre panel** from `/api/tyres`.
6. **Route-deviation map overlay** — use `GET /api/route-deviation/:id/map` (corridor + actual path + red deviation segments) and `GET /api/route-deviation/corridors` (fleet "normal routes" layer). Ships on backend branch `feat/route-deviation-map` — keep the list view until it's deployed, then add the overlay.
7. **Insights-compare "show the working"** view from `/api/insights/compare/fuel`.
8. Consistent **empty states, loading skeletons, ₹ formatting, IST dates, and the `disclaimer` line** across all of the above.

---

## 5. Gotchas
- **Live Tracking returns nothing until the `feat/live-tracking` backend branch is deployed** (its endpoint lives there). Coordinate the deploy.
- **Flags off on dev** → several feeds are empty until calibration. Build for the empty case.
- **`ignition` can be `null`** (FleetEdge payload varies) — don't render a hard on/off from it alone; fall back to `state`/`speed`.
- **Never send `orgId`**; never trigger a FleetEdge pull from a page (live-tracking reads DB only).
- **Money = estimates.** Always show the `disclaimer`; badge estimates as estimates.
- Confirm exact/optional fields against **Swagger `/api-docs`** before wiring a new call — it's authoritative and versioned with the backend.
