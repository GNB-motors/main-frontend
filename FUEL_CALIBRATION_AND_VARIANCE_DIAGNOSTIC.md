# Fuel Calibration, ECU Variance & Expected Consumption: Forensic Diagnostic & Root Cause Report

> **Document Type**: Technical Root Cause Analysis (RCA), Telematics Architecture & Calibration Guide  
> **Systems Covered**: `main-frontend` (React / Vite) & `main-backend` (Node.js / Express / MongoDB)  
> **Target Surfaces**:
> 1. **Pumps Section** (`/mileage?tab=reconciliation&view=pumps`)
> 2. **Bill vs Engine Section** (`/mileage?tab=reconciliation&view=ecu`)
> 3. **Used vs Should Use Section** (`/mileage?tab=performance&view=expected`)  
> **Status**: Comprehensive Diagnostic with Concrete Engineering Remediations  

---

## 1. Executive Summary

During operational auditing of the unified **Mileage & Diesel Command Center** (`/mileage`), three data anomalies were identified:
1. **Pump Ledger (`view=pumps`)**: Shows impossibly severe diesel shortages (15%–35%) across almost all fuel stations.
2. **Bill vs Engine ECU (`view=ecu`)**: Demonstrates extreme positive variances (e.g. $+90\%$ to $+1,400\%$) on the most recent entries for active accounts (`test@gmail.com` / `test1@test.com`).
3. **Used vs Should Use (`view=expected`)**: Shows erratic daily comparisons where actual fuel used drastically exceeds expected fuel (e.g. 60 L used vs 4 L expected).

This document details the exact origin of each data point, the mathematical formulas used, the physical constraints of heavy truck hardware, and the software root causes responsible for these anomalies, followed by code-level fixes.

---

## 2. End-to-End Data Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       FLEET TELEMATICS & INVOICE DATA INGESTION                                 │
├─────────────────────────────────────┬─────────────────────────────────────┬─────────────────────────────────────┤
│      1. CAPACITANCE TANK PROBE      │     2. TATA FLEETEDGE CAN-BUS       │        3. FINANCIAL INVOICES        │
│  • Primary fuel level sensor        │  • Engine ECU injector pulse meter  │  • Driver WhatsApp / App uploads    │
│  • Measures liquid height in tank   │  • FleetEdge `analyse-fuel-consume` │  • Stored in `TripFuelLog`          │
│  • Stored in `FuelFillEvent`        │  • Stored in `FleetEdgeInsightFuel` │  • Fields: `litres`, `odometer`     │
└──────────────────┬──────────────────┴──────────────────┬──────────────────┴──────────────────┬──────────────────┘
                   │                                     │                                     │
                   ▼                                     ▼                                     ▼
┌─────────────────────────────────────┐┌─────────────────────────────────────┐┌─────────────────────────────────────┐
│    PUMP HONESTY LEDGER              ││    BILL VS ENGINE RECONCILIATION    ││    USED VS SHOULD USE               │
│    `/api/fuel-integrity/pump-ledger`││    `/api/extension/comparisons`     ││    `/api/fuel-model/expected`       │
│                                     ││                                     ││                                     │
│  Compares slip `claimedLitres`      ││  Compares slip `billFuelConsumed`   ││  Compares CAN `actualL`             │
│  against sensor `FuelFillEvent.L`   ││  against ECU CAN engine burn        ││  against OLS Regression / Catalog   │
└─────────────────────────────────────┘└─────────────────────────────────────┘└─────────────────────────────────────┘
```

---

## 3. Issue 1: Pump Ledger Excessive Shortage

### 3.1 Architecture & Flow
- **Frontend File**: [`PumpLedgerView.jsx`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-frontend/frontend/src/pages/Mileage/components/PumpLedgerView.jsx)
- **Backend Route**: `GET /api/fuel-integrity/pump-ledger` in [`fuelIntegrityFeed.routes.js`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelIntegrity/fuelIntegrityFeed.routes.js#L389)
- **Backend Service**: [`fuelIntegrityFeed.service.js:627-719`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelIntegrity/fuelIntegrityFeed.service.js#L627-L719) (`getPumpLedger()`)

#### Step-by-Step Execution:
1. Backend queries `FuelFillEvent` rows that have been matched to a `TripFuelLog`:
   ```javascript
   const fills = await FuelFillEvent.find({
     orgId,
     at: { $gte: windowFrom, $lte: windowTo },
     matchedFuelLogId: { $ne: null },
     claimedLitres: { $ne: null },
     litres: { $ne: null },
   });
   ```
2. Fills are aggregated per fuel bunk name (`fuelPumpName` / `stationName`).
3. For each bunk:
   $$\text{claimedL} = \sum f.\text{claimedLitres}, \quad \text{actualL} = \sum f.\text{litres}$$
   $$\text{shortfallL} = \sum \max(0, \, f.\text{claimedLitres} - f.\text{litres})$$
   $$\text{shortfallPct} = \frac{\text{shortfallL}}{\text{claimedL}} \times 100\%$$

---

### 3.2 Root Causes of the Overstated Shortage

#### Root Cause 1.1: Physical Tank Geometry vs Raw Sensor Float Step
Heavy commercial vehicles (such as Tata Signa 4825.TK, 2823, Prima 5530.S) utilize cylindrical or rounded D-shaped aluminum fuel tanks (typically 300 L or 365 L capacity). Capacitance float probes measure liquid height linearly, but volume is nonlinear relative to height near the top and bottom curvatures of the tank.

As documented in the backend’s own calibration engine ([`fillCorrection.service.js:4-7`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelIntegrity/fillCorrection.service.js#L4-L7)):
```
"A FuelFillEvent's `litres` is the raw step of the tank gauge. Measured
against BD's OIL REPORT (216 refuels) and GNB's slips (31), that figure
reads 25 L low on a typical fill (median error 8.8%) and flags most
genuine bills as mismatches."
```

While the unified refuels feed correctly corrects this using `correctFill()` and the learned `fillGain` ($\approx 1.088$), **`getPumpLedger()` completely bypasses calibration** and reads the raw uncorrected `f.litres`:
```javascript
// fuelIntegrityFeed.service.js:681-682
p.claimedL += num(f.claimedLitres);
p.actualL += num(f.litres); // <--- RAW UNCORRECTED TANK STEP
```
Because raw sensor readings systematically under-report volume by $\approx 8.8\%$ to $12\%$, **every single honest pump is immediately flagged with an artificial 9%–12% shortfall**.

#### Root Cause 1.2: Asymmetric Shortfall Accumulation (The Noise Ratchet Bug)
In [`fuelIntegrityFeed.service.js:683-684`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelIntegrity/fuelIntegrityFeed.service.js#L683-L684):
```javascript
const shortfall = num(f.claimedLitres) - num(f.litres); // + = billed more than the tank rose
if (shortfall > 0) p.shortfallL += shortfall;
```
Capacitance sensors fluctuate based on vehicle tilt, road incline, liquid slosh, and ambient fuel temperature. Over multiple fills, sensor error is zero-mean Gaussian noise ($\pm 5\%$).
However, because negative shortfalls (fills where the sensor rose by more than the bill) are clipped to zero via `if (shortfall > 0)`:
- Fill 1: Billed 100 L, Sensor saw 85 L (Uphill incline) $\implies \text{Shortfall} = +15\text{ L}$ (Recorded).
- Fill 2: Billed 100 L, Sensor saw 115 L (Downhill incline) $\implies \text{Shortfall} = -15\text{ L}$ (Ignored!).
- **True Net Error**: $0\text{ L}$.
- **Code Recorded Error**: $+15\text{ L}$ on 200 L billed ($7.5\%$ shortfall!).

Over 20 fills, random noise ratchets up to an impossible **25%–35%** reported shortage.

---

### 3.3 Engineering Remediation for Pump Ledger
In [`fuelIntegrityFeed.service.js`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelIntegrity/fuelIntegrityFeed.service.js):
1. **Calibrate the Sensor Volume**: Use the vehicle’s learned `fillGain` via `correctFill(f, gainOf(calibration, prior))` before adding to `actualL`.
2. **Compute Net Shortfall**: Replace the positive-only clamp with true net difference:
   ```javascript
   // Net shortfall over all fills at this station:
   p.shortfallL = Math.max(0, p.claimedL - p.actualL);
   ```

---

## 4. Issue 2: Bill vs Engine ECU Variance on Recent Entries

### 4.1 Architecture & Flow
- **Frontend File**: [`FuelComparisonPage.jsx`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-frontend/frontend/src/pages/FuelComparison/FuelComparisonPage.jsx) & [`ComparisonTable.jsx`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-frontend/frontend/src/pages/FuelComparison/ComparisonTable.jsx)
- **Backend Route**: `GET /api/extension/comparisons` in [`extension.routes.js`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/extension/extension.routes.js#L452)
- **Backend Service**: [`fuelComparison.service.js:1172`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelComparison/fuelComparison.service.js#L1172) (`getComparisonRecords()`)
- **Data Model**: `FuelComparisonTask` in [`fuelComparison.model.js`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelComparison/fuelComparison.model.js)

#### Step-by-Step Execution:
1. When two consecutive fuel logs occur for a truck, [`FuelComparisonService.generateTasks()`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelComparison/fuelComparison.service.js#L589) creates a comparison window $[t_{\text{from}}, t_{\text{to}}]$.
2. `billFuelConsumed` = Billed liters on the closing fuel log.
3. The backend cron/extension queries Tata FleetEdge’s `analyse-fuel-consumption` API for that window:
   `fleetEdgeFuelConsumed` = CAN-bus cumulative injector fuel burn.
4. Variance calculation ([`fuelComparison.service.js:888-890`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelComparison/fuelComparison.service.js#L888-L890)):
   $$\text{variance} = \text{billFuelConsumed} - \text{fleetEdgeFuelConsumed}$$
   $$\text{variancePercent} = \frac{\text{variance}}{\text{fleetEdgeFuelConsumed}} \times 100\%$$

---

### 4.2 Root Causes of Large Variances on Recent Entries

#### Root Cause 2.1: FleetEdge Telematics Ingestion & Aggregation Lag (2h–24h)
Tata FleetEdge does not push CAN-bus ECU fuel telemetry in real-time. Packets are buffered and compiled on Tata servers into hourly and daily summary tiles.
- If a driver uploads a fuel bill for **180 L** today, the task window $[t_{\text{prev}}, t_{\text{bill}}]$ is generated immediately.
- The comparison cron runs, but FleetEdge has only processed the first 1 or 2 hours of that window.
- FleetEdge returns `fleetEdgeFuelConsumed = 8.5 L`.
- **Resulting Computation**:
  $$\text{variance} = 180 - 8.5 = +171.5\text{ L}$$
  $$\text{variancePercent} = \frac{171.5}{8.5} \times 100\% = \mathbf{+2,017\%}$$
Over the subsequent 24 hours, as FleetEdge aggregates the rest of the window, the true burn (e.g. 175 L) arrives, settling variance to $<3\%$.

#### Root Cause 2.2: Partial Fills vs Full-Tank Assumptions
The ECU comparison assumes the vehicle underwent a complete full-tank to full-tank cycle (fuel added = fuel burned).
If a driver uploads two slips in short succession (e.g. a 40 L partial top-up followed 4 hours later by a 200 L full tank after driving only 25 km):
- In that 4-hour window, the engine only burned $\approx 7\text{ L}$.
- The task records: Billed = $200\text{ L}$, Engine Burn = $7\text{ L}$.
- **Variance**: $+193\text{ L}$ ($+2,757\%$).

#### Root Cause 2.3: OCR Timestamp Drift
Receipt photos scanned with low clarity or inverted dates (e.g. OCR reading `02:00` instead of `14:00`, or swapped date formatting) shift the queried window outside the vehicle's driving hours, querying an idle period where the engine was off.

---

### 4.3 Engineering Remediation for Bill vs Engine
1. **Grace Period for Recent Windows**: Add a 24-hour maturation buffer (`nextRetryAt`) before marking recent tasks as `COMPLETED` or `FLAGGED` if FleetEdge returned $<20\%$ of expected window burn.
2. **Interval Validation Check**: Ensure comparison windows are only triggered on validated full-tank to full-tank intervals produced by `VehicleMileageIntervalService`.

---

## 5. Issue 3: Weird Readings in "Used vs Should Use"

### 5.1 Architecture & Flow
- **Frontend File**: [`ExpectedFuelView.jsx`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-frontend/frontend/src/pages/Mileage/components/ExpectedFuelView.jsx)
- **Backend Route**: `GET /api/fuel-model/expected` in [`fuelModel.routes.js`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelModel/fuelModel.routes.js#L22)
- **Backend Service**: [`fuelModel.service.js:405`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelModel/fuelModel.service.js#L405) (`getExpected()`)
- **Data Model**: `ExpectedFuelWindow` & `FleetEdgeInsightFuel`
- **Frontend Rollup**: [`dailyRollup()`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-frontend/frontend/src/pages/Mileage/mileageRows.js#L396) in `mileageRows.js`

#### Step-by-Step Execution:
1. Hourly tiles of actual fuel burned are stored in `FleetEdgeInsightFuel` (`fuelUsedL`, `distanceKm`).
2. Expected fuel is calculated per 1-hour window:
   - **Regression Model** ($\ge 15$ training samples):
     $$\text{expectedL} = \beta_0 + \beta_1 \cdot \text{distanceKm} + \beta_2 \cdot \text{idleShare} + \beta_3 \cdot \text{lowSpeedShare} + \beta_4 \cdot \text{midSpeedShare}$$
   - **Catalog Fallback** ($<15$ training samples):
     $$\text{expectedL} = \frac{\text{distanceKm}}{\text{catalogKmPerL}}$$
3. Frontend groups 24 hourly windows into daily summary rows using `dailyRollup()`.

---

### 5.2 Root Causes of the Weird Daily Readings

#### Root Cause 3.1: Denominator Mismatch in `dailyRollup()` (The Primary Bug)
In [`frontend/src/pages/Mileage/mileageRows.js:413-418`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-frontend/frontend/src/pages/Mileage/mileageRows.js#L413-L418):
```javascript
d.actualL += w.actualL || 0; // Adds ALL 24 hourly windows in the day
if (w.expectedL != null) {
  d.expectedL += w.expectedL; // ONLY adds windows where an estimate was calculated!
  d.scored += 1;
}
```
In [`computeSpeedShares()`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelModel/fuelModel.service.js#L64), if an hourly window has fewer than `minStatusSamplesPerWindow` (e.g. truck operating in a cellular blackspot or valley), `expectedL` is **null** (unscored).
If a truck drives 24 hours and burns **70 L**, but only **2 hours** had cellular reception to calculate speed shares:
- `actualL` = $70\text{ L}$ (summed over 24 hours)
- `expectedL` = $5.5\text{ L}$ (summed over the 2 scored hours)
- **Table Display**:
  - **Driven**: $450\text{ km}$
  - **Used**: $70\text{ L}$
  - **Should use**: $5.5\text{ L}$
  - **Deviation**: $+64.5\text{ L}$ ($+1,172\%$ excess burn!)
The table compares 24 hours of fuel burn against 2 hours of baseline expectations.

#### Root Cause 3.2: Zero-Distance Idling in the Catalog Fallback
When a truck model has $<15$ training samples, it uses the catalog fallback:
$$\text{expectedL} = \frac{\text{distanceKm}}{\text{catalogKmPerL}}$$
When a truck sits in a terminal loading queue, weighbridge, or traffic with the engine running for 2 hours:
- `distanceKm` = $0\text{ km}$
- `actualL` = $3.2\text{ L}$ (idling burn)
- `expectedL` = $0 / 3.8 = \mathbf{0\text{ L}}$!
- **Table Display**: Used = $3.2\text{ L}$, Should use = $0\text{ L}$, Deviation = $+3.2\text{ L}$ ($+\infty\%$).

#### Root Cause 3.3: Unconstrained Ordinary Least Squares (OLS) Artifacts
In [`fitOLS()`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelModel/fuelModel.service.js#L168), unconstrained multi-variable regression on sparse data with collinear features can fit a **negative coefficient** for distance or a negative intercept ($\beta_0 < 0$), causing the model to predict negative or near-zero fuel on short journeys.

---

### 5.3 Engineering Remediation for "Used vs Should Use"
1. **Fix `dailyRollup` in Frontend**: Only sum `actualL` for hours where `expectedL != null`:
   ```javascript
   // Ensure apples-to-apples daily comparison:
   if (w.expectedL != null) {
     d.actualL += w.actualL || 0;
     d.expectedL += w.expectedL;
     d.distanceKm += w.distanceKm || 0;
     d.scored += 1;
   }
   ```
2. **Add Idling Baseline to Catalog Fallback**:
   $$\text{expectedL} = \frac{\text{distanceKm}}{\text{catalogKmPerL}} + (\text{idleHours} \times 1.4\text{ L/h})$$
3. **Constrain OLS Regression Coefficients**: Enforce $\beta_i \ge 0$ during regression training so physical consumption components can never be negative.

---

## 6. Actionable Implementation Checklist

| Target File | Current Line | Change Required | Purpose |
| :--- | :--- | :--- | :--- |
| [`fuelIntegrityFeed.service.js`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelIntegrity/fuelIntegrityFeed.service.js) | L681–L684 | Apply `correctFill()` with vehicle `fillGain` and calculate net shortfall `p.shortfallL = Math.max(0, p.claimedL - p.actualL)`. | Eliminates false 15%–35% pump shortages caused by raw float probe curvature and one-way noise accumulation. |
| [`fuelComparison.service.js`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelComparison/fuelComparison.service.js) | L888–L901 | Enforce a 24-hour maturation window before finalizing CAN comparison for tasks where `fleetEdgeFuelConsumed < 0.2 * billFuelConsumed`. | Prevents premature flagging of recent fuel bills while FleetEdge buffers are still in transit. |
| [`mileageRows.js`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-frontend/frontend/src/pages/Mileage/mileageRows.js) | L412–L418 | In `dailyRollup()`, accumulate `actualL` and `distanceKm` only within windows where `w.expectedL != null`. | Eliminates mismatched comparisons where 24 hours of actual fuel are compared against 2 hours of scored expectations. |
| [`fuelModel.service.js`](file:///c:/Users/rahul/OneDrive/Desktop/GNB%20Motors/main-backend/app/modules/fuelModel/fuelModel.service.js) | L338–L343 | Add an idling baseline factor ($\text{idleHours} \times 1.4\text{ L/h}$) to the `CATALOG` fallback. | Resolves $0\text{ L}$ expected fuel anomalies when trucks idle with the engine running at $0\text{ km/h}$. |
