# Place Intelligence — automatic markers, a shared marker trie, provable error bounds

*2026-09-27 · planning only · nothing built or committed. Incorporates the user's 6-page handwritten notes and their answers.*

## Context

**Goal.** Automatically find where trucks wait and mark those places, so drivers, owners and managers see:
- fuel pumps, loading and unloading sites;
- **plants with gates**;
- parking and yards;
- warehouses;
- workshops, tolls and checkposts;
- **dark zones** where data goes missing;
- unproductive breaks.

**Requirements:**
- **Provable accuracy.** Each marker must carry an error rate we can defend with maths.
- **Build once, reuse forever.** A marker, road or route learned once goes into a shared **trie**. When another vehicle or driver takes the same route, it is reused instead of calling paid map APIs again.
- **Fast manager edits.** Warehouses and markers are computed in the background. When a manager accepts or moves a marker, the reports refresh **in seconds**.
- **No LLMs anywhere.** Scoring (Kaaran, Driver DNA and Vehicle DNA) is strict algorithms and maths. Satellite *vision* classification is allowed as a weak signal.

**Why now.** Most of the plumbing already exists but is disconnected, and several pieces are broken (§9). The structural problems:
- The 30-minute stop cut drops ~94% of pump visits.
- The fuel rule uses the *median* fuel rise across visits, so a pump where most trucks stop for tea never qualifies.
- A 500 m cluster radius merges a pump with the dhaba beside it.
- The unknown-stop detector computes distance as NaN.

## Decisions (user, 2026-09-27)

| Topic | Decision |
|---|---|
| Scope | **All marker types in one wave.** Each class switches on only when its precision lower bound clears target; until then it is shown as PROPOSED. |
| Ground truth | ERP trips (from/to), manager answers, driver tags plus fuel bills, e-way bill / ULIP. All four are available. |
| Unproductive break | Unexplained, not statutory rest, not a jam or queue, **and** over an owner-set ₹-or-minutes threshold. |
| Sharing | **Type + location are global; org links are private.** <br>Global: pumps, tolls, checkposts, dhabas and rest stops, public parking, workshops, plant and loading/unloading site geometry and type, dark zones. <br>Private: warehouses, own yards, driver habits, customer names, visit counts and volumes. |
| Trie | A **shared cache and search index**: a spatial trie for places and a route trie for trips (§5). Its purpose is to stop repeat API calls and make lookups fast. |
| AI | **No LLMs.** Internal maths only (Bayes, HMM, EM, clustering, scan statistics). Satellite vision classification is optional and a weak vote. |
| Warehouse | **Detected in the background.** The manager accepts it, and it shows instantly. Moving the marker recomputes the reports in seconds. It is an org-private record, shown on a new Warehouses page. |
| Gates | **Both.** <br>Physical plant gates are the main meaning: large private complexes such as Tata ~10 km, SAIL?, Aditya ~2–3 km. <br>Also the dark zones: API gating and network dead zones. Collect as much data as possible and backfill the gaps. |

---

## 1. The answer in brief: how sure can we be?

1. **Collect evidence per stop; put labels on places.** One visit is weak evidence. Many independent visits (distinct vehicle-days) accumulate into a Beta/Dirichlet posterior. With 80% accuracy per visit, 10 visits give 98% (§10 Sim E).
2. **Count witnesses by physical instrument, not by API.** Our tank-rise detector and Tata's refuel alert read the same sensor. Counting them twice inflates a true 69% confidence to a fake 98%.
3. **Physics gives free ground truth.** Load changes only at stops, and payload costs 0.4–0.95 L/100 km per tonne. A per-vehicle HMM over fuel-per-km decodes loading (empty to loaded) and unloading (loaded to empty).
4. **100% can be neither reached nor proved.** Proving 95% precision needs 59 straight correct labels, and 99% needs 299. So each class ships only when its Clopper-Pearson 95% lower bound clears target; everything else goes to a human.

| Marker | Best achievable (simulated with measured noise; **Phase 0 must confirm on real data**) |
|---|---|
| Fuel fill (per stop) | 93% of 10–30 L fills and 99% of ≥50 L fills caught; ~0 false positives at 60 s cadence with a per-vehicle threshold. Today's 5 L rule gives 48% precision. |
| Fuel pump (place) | Posterior 0.999 after 2 fills in 3 visits |
| Loading / unloading | ~91% precision and recall on full loads from fuel alone. Partial loads or hills drop to 47–75%, so ERP, e-way bill and place voting are required. |
| Plant / complex | Geometry is solid once gates are learned from boundary crossings; the type comes from load transitions plus ERP |
| Parking / yard | High: overnight ignition-off (IST), low org diversity |
| Warehouse | Behaviour plus a manager accept. Detection alone is not trusted. |
| Dark zone | A cross-sectional test separates network dead zones, API gating and device faults (§4) |
| Unproductive break | Residual class. Precision starts low and rises as places get labelled; the top 50 answers explain 65–78% of stops. |
| Sites less than ~120 m apart | GPS cannot separate them. They become one place with several purposes; per-visit fuel rise tells the pump from the dhaba. |

---

## 2. The maths

**Three objects.**
- **Stop:** an event, a vehicle stationary over an interval.
- **Place:** a persistent entity with a geometry (circle, or polygon plus gates).
- **Purpose:** why a stop happened.

A place carries a distribution over purposes. For example, a pump+dhaba complex might be 70% fuel and 30% rest.

### 2.1 Evidence groups: independence is by instrument

| Group | Instrument | Members |
|---|---|---|
| G1 Geometry | GNSS | stop existence, dwell, centroid, on-carriageway distance, queue creep, boundary crossings |
| G2 Tank | fuel sensor | our fill detector **plus** the Tata refuel alert, counted as **one** vote |
| G3 Engine | CAN/TCU | fuel-per-km load state, engine-load utilisation, idle vs off |
| G4 Vendor algorithms | same sensors as above | Tata stoppages/idlings. Used only to cross-check our algorithm; never counted as a witness. |
| G5 Business / human | paper, people | ERP anchors, bills, maintenance, weighbridge slips, e-way bill, FASTag, customer-drawn FleetEdge geofences, driver tag, manager answer |
| G6 World knowledge | maps / registries | POI, OMC pump lists, NHAI tolls, CWC/FCI warehouses, land use, building footprints, optional satellite-vision vote. All correlated with each other, so one vote per family. |

**Combining.** Sum log-likelihood ratios across groups; take the maximum within a group.

**CONFIRMED** requires a sensor group (G1–G3) **plus** G5 or G6 agreeing, and no group contradicting with |log LR| > 2. Otherwise the existing ladder applies: LIKELY → CONFLICT (show both) → UNCORROBORATED → INSUFFICIENT_DATA (never interpolate).

### 2.2 Stop and place posteriors

```
log P(c|stop) = log π_c(place, previous run, leave-one-out) + Σ_g log L_g(x_g|c) − Z
α_c(place)    = α0_c + Σ_stops w_s·P(c|s)
w_s           = 1 / #stops by same vehicle on same IST day      (one truck's habit ≠ many votes)
label c       only if the 5% quantile of Beta(α_c, Σα−α_c) > τ_c
```

- **Pump test:** a Beta-binomial Bayes factor on k fills in n visits. H1 is a fill rate ~ Beta(6,3); H0 is the detector's false-positive rate f.
- **"Is this a real place?"** Require ≥3 distinct vehicles or ≥5 distinct days. Single-vehicle recurrences become **VEHICLE_HABIT** (the driver's home or favourite dhaba), which is always private. A Kulldorff Poisson scan statistic is the upgrade path.

### 2.3 Fill detection

- Estimate: Δ̂ = median(post) − median(pre) + gap burn.
- Variance: Var ≈ (π/2)σ_v²(1/k_pre + 1/k_post).
- Threshold: T_v = max(10 L, 6σ_v). σ_v comes from the per-vehicle parked noise we already compute (median 1.02 L, worst 19.3 L).

### 2.4 Load state (loading vs unloading)

- **Leg emission:** y_k = log((F_leg − F_idle − m_k·g·Δh/(η·LHV)) / d), with η ≈ 0.40 and LHV = 36 MJ/L.
- **Elevation:** Δh is taken **per place**, once, via the trie cache.
- **Model:** two hidden states, Baum-Welch fitted per vehicle with class-pooled priors, Viterbi decoding.
  - E→L at a stop means LOADING; L→E means UNLOADING.
- **Consistency checks:** ERP `loadedQty` / `unloadedQty` balance; a residue raises a flag.

### 2.5 Space

- Per-visit centroid error: σ_c = √(σ_visit² + σ_fix²/k). Site-centre error: σ_c/√V.
- Chance of assigning a visit to the wrong one of two sites d apart: Φ(−d/2σ_c).
- Cluster radius: eps ≈ 3σ_c (about 75 m at measured jitter), **not** a fixed 500 m.
- **Plants:** a polygon, not a circle. **Gates** are clusters of boundary-crossing points. A visit runs gate-in to gate-out, and the stops inside it (weighbridge, loading bay) are sub-stops.

### 2.6 Proof

**Labels needed for a one-sided 95% Clopper-Pearson lower bound:**

| Target | 0 errors | 1 error | 2 errors | 5 errors |
|---|---|---|---|---|
| 0.90 | 29 | 46 | 61 | 103 |
| 0.95 | 59 | 93 | 124 | 208 |
| 0.99 | 299 | 473 | 628 | 1049 |

- **Random audit.** A 10% stratified random sample of places goes to managers whatever its confidence, so the estimate isn't biased toward hard cases.
- **Calibration.** Reliability diagram and ECE, then isotonic recalibration once there are ≥300 labels.
- **Source accuracy.** Dawid-Skene EM (plain maths, not AI) estimates each source's accuracy from agreement patterns once there are ~200 answers.

---

## 3. Signals (the user's 7 methods plus the new ones)

| Method | Group | Verdict |
|---|---|---|
| Satellite mapping | G6 / human | **The human's view** for placing markers, drawing plant polygons and gates. Vision classification is an optional weak vote per uncertain place; **no LLM**. |
| Address lookup | G6 | Per place, **once**, cached in the trie; never per position |
| Companies nearby | G6 | Low reliability (no GST-by-location API). Use POI names fuzzy-matched to ERP `Party` names. |
| Tipper raise | G3 | **Not in any known Tata API.** Ask Tata about a body-up input, or fit a ~₹1–3k switch; `shape_hash` will surface a new vendor key |
| Sensors | G2/G3 | Tank and ignition are the workhorses |
| Scans / algorithms | — | This plan |
| Same-owner density | G1 | Formalised as **carrier entropy**: low means private facility, high means public pump or dhaba (Gingerich 2016) |

**New methods:**

| Method | Discriminates |
|---|---|
| **Load-state HMM** (fuel per km) | loading vs unloading |
| **ERP anchors** (geocode each distinct from/to string once, time-match `dispatchedAt` / `unloadedAt`) | loading / unloading; warehouse = trip start point |
| **E-way bill** dispatch-from / ship-to pincodes | loading / unloading |
| **FASTag** reads | tolls; gap bridging; trip toll cost |
| **Customer-drawn FleetEdge geofences** (webhook) | free named labels |
| Engine-load utilisation, speed on climbs | loaded vs empty |
| Boundary crossings and gate clustering | plant gates |
| Gate-queue creep before a long dwell | plant / weighbridge queue (legitimate wait) |
| Time-of-day signature | shifts, meal times, overnight |
| Ignition off vs idle vs high-idle | parking vs AC rest vs tipping hypothesis |
| Map-matched distance to road | jam vs off-road stop |
| Statutory rest (MV Act §91: 30 min per 5 h) | legitimate break |
| Registries (NHAI, OMC, RTO, CWC/FCI) and building footprints | toll / pump / checkpost / warehouse |
| **Driver one-tap reason** and bill photo | gold labels |
| Manager answers ordered by ₹ × uncertainty | the learning loop |
| **Gap cross-section** (§4) | dark zone vs API gating vs device fault |

---

## 4. Recipe per marker

| Marker | Must-have | Corroborators | Scope |
|---|---|---|---|
| FUEL_PUMP | G2 fill (adaptive threshold) | bills and FuelLog geo, OMC list, POI, Tata pump name | Global |
| LOADING / UNLOADING | HMM transitions dominate | ERP anchor, e-way bill, slip, queue, customer geofence | Geometry and type global; party names private |
| **PLANT / COMPLEX + GATES** | polygon (manager draws on satellite, **or** OSM private/industrial boundary, **or** alpha-shape of internal stops) plus gates from crossing clusters | load transitions, ERP | Geometry global; which org visits is private |
| PARKING / YARD | overnight IST, ignition off, ≥6 h | same-org repeat, low entropy | Public truck terminal: global. Own yard: private. |
| **WAREHOUSE** | trip-start frequency (ERP) plus load/unload behaviour | footprint, CWC/FCI list | **Private.** Background detection, manager accept. |
| WORKSHOP | maintenance match (exists) | POI | Global |
| TOLL / CHECKPOST | NHAI/RTO registry, on carriageway | FASTag | Global |
| TRAFFIC / QUEUE | on-road and creeping | cross-fleet slowdown | Not a place; never a break |
| **DARK_ZONE** | gap start/end points cluster in the same cells across ≥3 vehicles and ≥2 orgs, **not** simultaneous | gap rate per cell = gaps ÷ traversals (Beta lower bound above fleet base rate) | Global |
| (API gating: not a place) | gaps **simultaneous** across ≥X% of one account's vehicles, anywhere | 403 / gated-chunk log | Account incident; triggers backfill |
| (Device fault: not a place) | one vehicle, many locations, persistent | — | Vehicle health |
| UNPRODUCTIVE BREAK | residual: P(any purpose) < 0.2, not statutory rest, not queue, over the owner's ₹/min threshold | VEHICLE_HABIT, dhaba POI, meal time, idle ₹ | Manager's 3 buttons; the answer labels the place |

**Dark-zone payoff:**
- Expected gaps inside known dark zones are no longer "crying wolf" alarms.
- Corridors splice across them.
- When a vehicle reappears after a dark zone, a **targeted backfill** pulls the gap window (AIS-140 devices store and forward). This covers the P0 dark areas and the dark areas of maps.

---

## 5. The marker trie: build once, reuse forever

**Why.** The same vehicle, another driver, or another org travels the same roads and stops at the same places. Paid lookups should scale with **distinct places** (a bounded number), not with stops or positions (unbounded).

The per-position geocoding cost is already documented: $30.5k/month at 1,000 vehicles.

**Simulated paid lookups** (fleet-wide, Zipf place popularity):

| Fleet | Month 1 served from trie | Month 6 | Month 12 |
|---|---|---|---|
| ~130 vehicles (today) | 58–75% | 79–89% | 86–94% |
| 1,000 vehicles | 81–91% | 95–98% | 98–99% |

### 5.1 Spatial trie (places, roads, enrichment)

- **Key:** a **quadkey**, the base-4 string of the map tile containing a point. Each character refines the cell by 4×.
  - At zoom 19 a cell is about 70 m; at zoom 16 about 570 m.
  - A prefix is a region; the children are its sub-regions.
  - Quadkeys match web-map XYZ tiles, so the map UI renders marker clusters and dark-area heatmaps straight from node aggregates at any zoom.
  - This deliberately introduces cell keys despite the `comparison.js:227` "no geohash" note. That note was about edge effects in corridor cells, which the neighbour lookup below solves. Record it as a decision.
- **Storage:** a Mongo collection `geocells` holding:
  - `qk` (string, unique, indexed) and `z`;
  - `aggregates`: counts by marker type, visits, gap stats per zoom;
  - `places[]` (global place ids);
  - `enrich{}`: reverse geocode, POI list, elevation, speed limit, road class, each with `fetchedAt` and `source`.

  A string index on `qk` makes a prefix query an index range scan, which is a trie in the database. Add an in-memory LRU for hot cells only if the latency measurements demand it.
- **Lookup (`resolvePoint`):**
  1. Compute the quadkey.
  2. Read the cell plus its 8 neighbours at the marker-radius zoom.
  3. Do an exact haversine or point-in-polygon check.
  4. On a miss, call the paid API **once**, insert the result, and let every later query hit.

  This replaces the linear scans in `places.service` and `geoContext`, and fixes stopHotspot's paid call on every stop. The `MapUsage` cap is still enforced.
- **Never delete** (house rule): refreshed enrichment supersedes the old entry, which is kept.

### 5.2 Route trie (trips, costs, leaderboard)

- **Key:** the ordered sequence of place ids, origin → via → destination. Side trips are branches.
  - Example: Kolkata → Orissa shares a prefix with Kolkata → Orissa → Chhattisgarh.
- **Each node (a leg) stores:**
  - the snapped encoded polyline, km, via-states;
  - **toll plazas crossed and FASTag cost**;
  - the speed-limit profile per segment, used for overspeed marking;
  - distributions: time, fuel/km loaded and empty, idle at stops (p50/p90);
  - counts by driver and vehicle.
- **Insert:** when a trip closes (ERP, or an FMS-derived trip as fallback), walk its place sequence. Only **new** edges trigger Directions, road-snap or speed-limit calls. Route-master `googleKm` / `extraKm` read from the trie first.
- **Uses:**
  - **Trip cost** = fuel burnt × diesel price + DEF + toll + FASTag.
  - **Route leaderboard, "why good / why bad"**: each trip is compared against the node's own distribution.
  - **Driver DNA / Vehicle DNA**: like-for-like against the same leg, pure maths.
- **Privacy:** nodes touching an org-private place (warehouse, yard) live in that org's branch. Only public-to-public legs are shared. This mirrors the existing `globalCorridor` 2 km endpoint clipping.

### 5.3 Global layer vs org overlay (IDOR-safe)

- **Global place:** geometry, type, purpose distribution, resolution, class precision bound, source groups present, bucketed distinct-org count, and `supersedes`. **No orgId, party names, per-org counts or volumes.**
- **Org overlay (`OrgSite`, the "new model" from the notes):**
  - placeId, orgId, private type (WAREHOUSE / YARD / VEHICLE_HABIT);
  - name and party link, linked vehicles and office;
  - the org's labels, visit statistics, detention/SLA.
- **Publishing:** CONFIRMED places of a global type only.
  - **k-anonymity guard:** a loading/unloading site publishes only when ≥2 orgs have visited it or a G6 source names it.
  - Private types never publish.
- **IDOR:**
  - The overlay is always filtered by the server-side `req.orgId`; an orgId sent by the client is never accepted.
  - The global layer carries no org fields.
  - Two-org fixture tests cover every place, trie or site endpoint, plus the existing `TenantScopeCoverage` check.

### 5.4 Manager fast path ("minutes of reports in seconds")

- Background jobs precompute `VehicleStop` rows, each carrying its `qk`, and per-site aggregates.
- When a manager **accepts** a site, it is shown straight from those aggregates.
- When a manager **moves or resizes** a marker:
  1. Compute the set of cells covering the new geometry.
  2. Fetch the stops in those cells with prefix range scans.
  3. Recompute the report: visits, dwell p50/p90, detention, idle ₹, vehicles, drivers.
  4. Return it (**target ≤ 2 s p95**).

  The heavier dependent recomputes (load state around those stops, route-trie legs touching the site) run asynchronously and update the report after.

---

## 6. Architecture and files

The eventing-vs-recompute stance still holds: idempotent recompute, not a message bus. Late evidence re-opens a (vehicle, IST day) window.

```
positions(60s) + fuel noise + ERP/FuelLog/Maintenance/e-way/FASTag + vendor webhook
  → [1] stopExtractor → VehicleStop(qk) → [2] per-stop evidence (claim-shaped, G1–G6)
  → [3] legFeatures → [4] loadStateHmm → [5] place assignment via spatial trie
  → [6] placePosterior → [7] per-place enrichment (trie cache, MapUsage-capped)
  → [8] evidenceLadder → [9] review queue (₹×uncertainty + 10% audit) → SiteLabel
  → publish global places → spatial trie; closed trips → route trie
  gap cross-section → DARK_ZONE / gating incident / device fault → targeted backfill
```

**Extend `app/modules/routeIntelligence/`; do not create a parallel module.**

New pieces:
- `stopExtractor.js`: candidate stops ≥3 min; stationary gaps stay one stop.
- `fillEstimator.js`, `legFeatures.js`, `loadStateHmm.js`, `placePosterior.js`, `evidenceLadder.js`, `labelModel.js`, `gapClassifier.js`.
- `complex.js`: plant polygons and gates.
- New models: `vehicleStop`, `siteLabel` (append-only), `orgSite` (overlay), `geocell` (spatial trie), `routeNode` (route trie).
- **All five new collections go into `TIER_C_EXCLUDED` (`sync/lib/config.js`).** Otherwise Tier-A sync clobbers them.

Changes to existing code:
- **SiteCluster:** add `purposeAlpha`, `effectiveVisits`, `orgEntropy`, `sourceGroups`, `resolution`, `geometry` (polygon), `gates[]`, `elevationM`, `visibility` (GLOBAL/ORG). Add the types UNLOADING, PLANT, VEHICLE_HABIT, DARK_ZONE.
  - `classifySite` becomes an adapter over the posterior and the ladder.
- **Config:** a `placeIntelligence` block in `comparison.js`, each constant marked *measured* or *assumed*.
- **Flags:** `ROUTE_INTELLIGENCE_ENABLED` plus per-org `FEATURE_FLAG_KEYS`.
- **Rewire through the trie:** `places.service`, `geoContext`, `stopHotspot` and `mapProvider` callers.
- **Frontend:**
  - `RouteIntelligencePage`: accept / move / reshape / reject / retype, a purpose bar, evidence grouped by G1–G6.
  - A new **Warehouses page** over `OrgSite`.
  - `UnknownTerritoryDrawer` writes to SiteCluster / SiteLabel.
  - Map layers: marker **icon pack** per type, dark-zone heatmap, gates.
- **gnb-ingest:** persist `odometer` and `satellites` in position history (`portal_ops.rs`). This is **owner-gated**, because the sink is live.
- **Never modify** the protected legacy modules: `geofenceZone`, `geofenceAnomaly`, `route`, `fuelComparison`, `mileage`, `maintenance`. Read through them only.

---

## 7. Phases

- **Phase 0: Measure (read-only; replaces every assumption in §10).**
  - Unblock the dev box `/tmp` (needs approval).
  - Real pump dwell: refuel alerts joined with breadcrumbs.
  - Per-vehicle fuel noise.
  - Parked GPS jitter vs satellites.
  - Parked cadence after D9.
  - `fleetedge_push` by type: do `details` and customer geofences arrive?
  - Prod (read-only): ERP from/to coverage and `unloadedAt`; `FuelLog.locationGeo` coverage.
  - The gap census feeding the dark-zone baseline.
- **Phase 1: Foundation.**
  - Fix the 6 verified bugs.
  - IST overnight.
  - `stopExtractor`.
  - Odometer and satellites in history.
- **Phase 2: Trie substrate.**
  - `geocell` spatial trie plus `resolvePoint` rewiring: an immediate API-cost win.
  - `routeNode` skeleton.
  - Global/overlay split and IDOR tests.
- **Phase 3: All marker classes together.**
  - VehicleStop, evidence, posteriors.
  - Pump, load HMM with ERP, e-way bill and FASTag.
  - Plant plus gates.
  - Parking/yard, warehouse (background), toll, traffic.
  - Dark zones with targeted backfill.
  - Unproductive break.
  - DriverApp one-tap reason.
- **Phase 4: Manager fast path and proof.**
  - Accept / move / reject / retype with ≤2 s recompute.
  - Icon pack.
  - Audit sample, Dawid-Skene.
  - Per-class Clopper-Pearson dashboard and calibration. A class goes live only when its bound clears.
  - **The unknown-stop rate must decay.**
- **Phase 5: Route trie payloads.**
  - Trip cost (diesel + DEF + toll + FASTag).
  - Route leaderboard, "why good / why bad".
  - Driver/Vehicle DNA hooks (maths only).
  - Overspeed per road segment.
- **Phase 6: Research.**
  - Satellite-vision weak vote.
  - IMU / tipper hardware.
  - Ask Tata about a body-up input.

**Execution handoff.** On approval:
1. Write this as the spec `f:\gnb\PLACE_INTELLIGENCE_SPEC_2026-09-27.md`. It stays outside git, like the other root planning docs.
2. Produce the step-by-step implementation plan (writing-plans) for Phases 0–2 first.

---

## 8. Verification

1. **Simulator as a permanent test harness.** Port this session's Monte Carlo to seeded JS (`routeIntelligence/__sim__/placeSim.js` plus a jest spec, `SKIP_DB=1`). Scenarios:
   - pump next to a dhaba;
   - partial loads, hills;
   - 60/600 s cadence, bad sensors, frozen GPS;
   - a plant with 2 gates;
   - a synthetic dark zone vs an account-gating blackout.

   The spec asserts per-class precision and recall floors.
2. **Silver labels, with confidence intervals:**
   - Tata alerts vs our detector;
   - maintenance → workshop;
   - FuelLog → pump;
   - ERP / e-way bill → load/unload.
3. **Gold labels:** the random audit. A class ships at a Clopper-Pearson 95% lower bound ≥ target.
4. **Performance:**
   - marker move → report ≤ 2 s p95 on a seeded dataset at 10× current volume;
   - `resolvePoint` p95 on the trie;
   - replaying 30 days: **paid calls ≤ distinct cells touched**.
5. **Security:** two-org IDOR fixtures on every new endpoint; the global layer is asserted free of org fields.
6. **Regression:** replay 30 days on dev (read-only) under two `algoVersion`s. Report disagreements; never average them.
7. **Empty inputs:** a check with empty inputs reports *skipped*, never *ok*.

---

## 9. What exists (verified) and what is broken

**Reuse:**
- `SiteCluster` (10 types, `evidence[]`, 2dsphere).
- `discoverSites` / `classifySite` (`routeIntelligence.service.js:92-286`), corridors, `ArrivalEvent`.
- `groupStops` / `cellKey` (`track.utils.js:30-123`), `hotspotWatch.clusterPoints`.
- The fuelIntegrity fill detector and per-vehicle noise (`fuelIntegrity.service.js:215-316`), `FuelFillEvent`.
- The `ledgerSources` reconciler, `FleetEdgeRefuelAlert`, `FuelLog.locationGeo`.
- The maintenance → WORKSHOP rule.
- `mapProvider` with the `MapUsage` cap, `places.service`, `geoContext`, the OSM seeder.
- Kaaran Unknown Territory, `IdleEvent`, `VehicleMovementSegment`.
- Route master already has `googleKm`, `extraKm`, `viaStates`, `encodedPolyline` (`route.model.js:86-130`).
- The Khata ledger (`/api/khata`).

**Broken (verified in code):**
1. `routeIntelligence.minDwellMinutes: 30` (`comparison.js:207`) drops ~94% of pump visits. The figure assumes a 15-minute median pump dwell; Phase 0 confirms it.
2. `classifySite` uses the **median** rise ≥ 5 L (`routeIntelligence.service.js:125-140`).
3. Hardcoded confidences.
4. `getUTCDate()` is used as the overnight test (`:129-131`).
5. eps is 0.5 km.
6. Kaaran bugs:
   - `unknownTerritory.service.js:71` passes 4 numbers to `haversineMeters(a,b)`, so the distance is NaN and no stop is ever found;
   - `:13` has a wrong import;
   - `:133` compares with `'NONE'` where the value is `'UNMAPPED'`;
   - the controller drops its parameters.
7. `stopHotspot.service.js:25` reads the wrong distance field, so every stop gets a paid geocode.
8. There are no reject/retype endpoints.
9. Position history has no odometer or satellites.
10. The webhook `details` (stoppages / idlings / geofence) are stored but read by nothing.
11. No tipper or PTO signal exists.
12. ERP locations are strings only.

---

## 10. Appendix: simulations run this session (pure-Python Monte Carlo, seeded)

**Parameters.**
- **Measured:** fuel sd 1.02 L median, 19.3 L worst; slosh up to +11.5 L; ZERO_DROPOUT 4/1218; 60/600 s cadence; parked jitter ~115 m; idle ~2 L/h.
- **Assumed:** pump dwell median 15 min; 12% of stops are fuel stops; 0.45 L/100 km per tonne; leg CV 12–20%; Δh sd 150–400 m; Zipf place popularity.

**Sim A: fill detection.** Robust medians with an adaptive threshold at 60 s:

| Rule / cadence | Recall, small fills | Recall, typical fills | False positives | Precision |
|---|---|---|---|---|
| Adaptive, 60 s | 0.93 | 0.99 | 0/6000 | ≈1.00 |
| Single-reading 5 L (≈ today) | 0.96 | 0.995 | 14.8% | 0.48 |
| 5 L, 600 s | — | — | 15.2% | 0.47 |
| Adaptive, 600 s | — | — | — | 0.85 |

Cadence matters: stopped vehicles should be sampled at 60 s.

**Sim D: pump visits kept by the minimum-dwell cut.**

| Cut | Kept |
|---|---|
| 5 min | 99% |
| 10 min | 82% |
| 15 min | 50% |
| 30 min | 6% |
| [30, 45] window | 5.3% |

**Sim B: wrong-site assignment for two sites d apart.** 26% at 30 m, 10% at 60 m, 0.6% at 120 m. Site-centre error: 24 m after 1 visit, 7.5 m after 10.

**Sim C: load state.** The HMM on full loads gets 0.92 of legs right, with loading/unloading P/R ≈ 0.91. Other cases:
- no elevation correction: 0.88;
- CV 20%: 0.84;
- partial loads: 0.75;
- worst case: 0.61.

**Sim E: place vote.** 10 visits give 0.90 at a = 0.7 and 0.98 at a = 0.8.

**Pump posterior:**

| Rule | 2 fills in 3 visits |
|---|---|
| Adaptive | 0.999 |
| 5 L @ 60 s | 0.92 |
| 5 L @ 600 s | 0.26 |

**Sim F: manager loop.** 50 answers explain 65–78% of stops; 200 answers explain 77–87%.

**Trie cost:** see the table in §5.

**Fusion:** double-counting one sensor gives 0.978 where the truth is 0.690.

---

## 11. The user's notes: my reading, and small doubts still open (none block the plan)

**My reading, by page:**
- **p1:** Warehouse = new model and page, lat/long, vehicles linked. BDRL has warehouses in Kolkata and UP. Trips start at a warehouse (Amitansu's manual entry). ERP trip start point → Route Intelligence. FMS fallback when there is no ERP trip. Side trips. Kolkata → Orissa → Chhattisgarh.
- **p2:** Trip cost = diesel + DEF + toll + FASTag. The data warehouse is a stub (logic, index). Review ORM and GPS calls. IDOR. Icon pack.
- **p3:** Route master km, via-states, toll, FASTag, overspeed. Speed per polyline segment. Leaderboard (idling, fuel burn, cruise, overspeed). Σ signals vs p90 → flag → maintenance.
- **p4:** P0 = fuel ingest, sink config, backfill, live locations, gates. Public vs private area → gate. Satellite → marker. Tata ~10 km, Aditya ~2–3 km. Google time vs driver time; data too sparse for deviation.
- **p5:** Reconciliation, sink, backfill, gates, crying wolf, maps. Kaaran and DNA use **no AI, strict maths**. Corridor fix. Map promotion → centralised map → route leaderboard, why good / why bad.
- **p6:** Driver/Vehicle DNA + app + markers → company attribution. Road context (weather, fog, air, accidents) as confounders. Good driver + good vehicle = good company, on a trip corridor.

**Still unread or ambiguous:**
- who BDRL is;
- "[0,0] [5,000] → fine";
- "Density → 1st phase → checked by", "Legend → page 1st→last";
- "vehicle → linked → diff office ??";
- "FMS ‖ Khata Ledger ⇒ ?? ‖ Optimal";
- "What are other workers?";
- "Approve Masters (Delivery ✓) … diameter" and the bottom of p3;
- "(₹5310.3)" and "Why Inf?" on p6.

---

## 12. Side findings (each needs the user's call; not part of this plan)

1. **Dev box `/tmp` (957 MB tmpfs) is 100% full** of `mongo-mem-*` and `jest_rt` directories left by the `gha` test runner. `docker exec` fails, and Mongo and Redis report **unhealthy**.
2. **Mongo 27017 is published on `0.0.0.0`** on the dev box. Check that the security group blocks it.
3. **No real-data measurement this session.** The SSH tunnel to dev Mongo was denied by the permission classifier, so §10 is simulated. Phase 0 replaces it.

## 13. Sources

- [Gingerich, Maoh & Anderson 2016 — carrier entropy classifies truck stop purpose](https://www.sciencedirect.com/science/article/abs/pii/S0968090X16000036)
- [Cluster-driven classification of truck stop locations (J. Geogr. Syst. 2022)](https://link.springer.com/article/10.1007/s10109-022-00380-y)
- [Freight-related stop identification from truck trajectories (2025)](https://www.sciencedirect.com/science/article/abs/pii/S0360835225006916)
- [Truck activity from GPS + satellite imagery (TRR 2025)](https://doi.org/10.1177/03611981241283012)
- [Stay-point → activity via POI + Bayesian model (arXiv 2405.11715)](https://arxiv.org/html/2405.11715v1)
- [Abnormal stop detection from sparse 30–60 s GPS (arXiv 2510.12686)](https://arxiv.org/html/2510.12686)
- [Dawid-Skene / data-programming label model (Snorkel, VLDB)](https://dl.acm.org/doi/10.14778/3157794.3157797)
- [Kulldorff spatial scan statistic](https://search.r-project.org/CRAN/refmans/SpatialEpi/html/kulldorff.html)
- [Truck mass estimation from CAN, RLS (Vahidi et al.)](https://cecas.clemson.edu/~avahidi/wp-content/uploads/2016/11/vsd2004vahidi.pdf)
- [Payload effect on HGV fuel (0.4–0.95 L/100 km/t)](https://lkw-control.com/en/truck-fuel-consumption-per-100-km)
- [Wialon fill-detection parameters](https://help.wialon.com/en/wialon-hosting/user-guide/monitoring-system/reports/data-in-reports/fuel/detecting-fillings)
- [OSM India fuel-station coverage gap (HP import)](https://wiki.openstreetmap.org/wiki/HP_fuel_station_import)
- [AIS-140 VLT cadence / store-and-forward](https://en.wikipedia.org/wiki/Automotive_Industry_Standard_140)
- [MV Act §91 driver hours](https://indiankanoon.org/doc/1101203/)
- [ULIP (FASTag, e-way bill, VAHAN)](https://www.fr8.in/blog/unified-logistics-interface-platform-ulip-india/)
- [E-way bill API portal](https://docs.ewaybillgst.gov.in/apidocs/index.html)
- [GeoVision Labeler — zero-shot satellite classification](https://arxiv.org/html/2505.24340)
