# REDESIGN_WALKTHROUGH

The 3 Nov 2026 redesign, screen by screen: what you click, and what it shows.

Every screen below is in the branch `feat/redesign-frontend-2026-11-03` (plus the
merged `feat/redesign-F4`, `feat/redesign-F7`, `feat/redesign-F8` and
`feat/redesign-F5` packages). Run `npm run dev` in `frontend/` and walk the list.

**Screenshots were not captured.** This machine has no browser driver installed
and installing one was out of scope for a code change. The walkthrough is
written as exact click paths so it can be followed literally; the reviewer can
add pictures on a machine that has a browser.

---

## 1. Track — `/live-tracking`

**Click:** Sidebar → **Track**.

**Shows.** The map fills the page. There is no top bar any more: it is gone.
Floating on the map:

- **Top left** — the search box. Type a plate, a model or a place; the fleet
  list and the places list both narrow. `/` focuses it from anywhere.
- **Top right** — **Traffic**. Off by default. Click it and Google's live
  traffic draws on the roads. Click again and it goes. The toggle remembers.
- **Bottom left** — the **legend**, which *is* the filter:
  - **Trucks** — Moving, Idling, Stopped, Offline, each with a coloured dot
    and the **full fleet count**. The count never changes when you filter,
    because a legend that lies about fleet size is worse than no legend.
  - **Make** — one row per make you own, plus an **Unclassified** row if any
    truck has no make recorded.
  - **Places** — Our places, Pumps, Dhabas, Hospitals, Police, Workshops &
    tyres, Dealers, Truck parking, Tolls & weighbridges. Each has its own
    colour, and the colour is the same one the legend dot uses.
  - **Footer** — "Updated 12 s ago" and a refresh button.
  - Click a row to switch that group off. Double-click it to show **only**
    that group. When something is off, an **All** button appears.
  - Collapse the legend and it becomes a pill: "● 20 moving · Filters".
- **Right rail** — **Fleet** and **Places** tabs. The Fleet tab lists the
  trucks; the Places tab lists the confirmed places with how many trucks are
  inside each one.

**Zoom in past 11 and** the Pumps layer starts loading. Below 11 the row says
"Zoom in to see".

---

## 2. The vehicle panel

**Click:** any truck in the rail, or a marker on the map.

**Shows**, in this order — the order of the owner's questions:

1. **Header** — plate, make and model, the VIN with a copy button, a status
   pill ("Moving · Loaded run"), how old the last report is, and a GPS and
   engine chip. A model that is only digits ("5555") is hidden, because it is
   a fleet number, not a model.
2. **Four tiles** — Fuel, DEF, Odometer, Speed.
   - A **live** value is normal ink.
   - A **stale** value is grey and dated: "last known 9 Sep, 9:10 am".
   - A value never received says **"Not received"**. Never `0 L`.
   - DEF litres say **"Litres after the first DEF top-up"** when they are a
     learned number rather than a reading off the truck.
3. **Track** (orange) and **Share**. Track opens Track mode; there is no
   separate Replay button any more.
4. **Now** — what the truck is doing, how long it has been doing it, how that
   compares with this truck's usual stay ("Usually 3 h 5 min here"), where it
   is, and the trip. The material reads **"Likely Cement or clinker"** when it
   comes from the plant type. If there is no tonnage, the line is left out
   rather than shown as `0 t`.
5. **Where next** — collapsed, the header already says the top guess:
   **"Likely → DANKUNI SIDING · ETA 12:40 am"**. Open it and you get the
   reason in the backend's own words ("Usually goes here after JK BUXAR (18
   of 24 times)"), the road, the usual break and the overspeed risk. A raw
   probability is never shown.
6. **How it's driving (7 days)** — the good chips first, then the problems.
   Each chip explains itself and links to the exact moments.
7. **Issues** — what is wrong with this truck and what to do about it.
8. **Driver** — who is driving. An inferred driver is badged **Inferred** and
   carries a hover note saying the same driver was recorded at both ends of
   the period.
9. **Help nearby** — only shown when there is something: a hospital, a
   workshop, a pump, with the distance and a call button.
10. **Vehicle details** — VIN, year, last and next service.

---

## 3. Track mode — `/live-tracking?v=WB11L8862&from=…&to=…`

**Click:** the orange **Track** button in the vehicle panel. Or open any
`/live-tracking?v=…` link from the Digest, an issue or a detour.

**Shows.**

- The **URL** carries the truck, the range and the playhead. Every link in
  the product can open this.
- The **map** draws the drive: laden runs solid blue, empty runs dashed
  grey, plant-to-plant runs dotted, gaps thin and half transparent with a
  caption "No signal 1 h 10 min". **Overspeed is an orange circle** — never a
  red line. **A detour is a red diamond.**
- **Exit and rejoin** are white circles with a red edge, labelled "Left the
  usual road · 20:25" and "Back on it · 20:53".
- **Stops** are pins coloured by their reason (loading, unloading, fuel,
  rest, overnight, queue, workshop, unexplained).
- **Landmarks** are small grey pins; the name appears at zoom 13.
- The **timeline** at the bottom: play and pause, four speeds (1×, 2×, 4×,
  8× — 1× means one real minute plays in one second), a scrubber coloured by
  the run type, the events as ticks above it and the stops as blocks below.
- The **Range** button: four presets (Last 24 h, Today, Yesterday, Last 7
  days) and a custom range with an IST date and time for each end.
- The **rail** shows the **trip log**: every stop and every event in the
  order they happened, with an Export CSV button.
- **Keyboard:** Space plays and pauses, the arrow keys jump between events,
  Esc leaves Track mode.

---

## 4. Intelligence — `/intelligence`

**Click:** Sidebar → **Intelligence**.

**Shows.** The summary tiles at the top, then eleven tabs — Issues, Trucks,
Drivers, Loaded & empty runs, Idling, Cruise & gears, Overspeed, Mileage &
DEF, Fuel checks, Detours, Places. Hover any tab to read what it is for.

- **Trucks** and **Drivers** show the good ones next to the slipping ones.
  Every card has the reason and a link to the exact moments.
- **Loaded & empty runs** separates plant-to-plant runs from empty runs,
  because a plant is a warehouse and a truck between two plants is working,
  not wasting diesel.
- **Issues** are grouped, with the evidence and an action. A disconnected
  account's action is a **Reconnect** button that goes to
  `/settings/fleetedge-accounts`.

---

## 5. Daily Digest — `/digest`

**Click:** Sidebar → **Daily Digest**.

**Shows.** The day's story, in order, as cards: what ran, what was empty,
who drove well, what needs you, and a reconnect prompt if an account went
quiet. Every number carries its reason. Good drivers are named with their
km/L against the fleet average.

---

## 6. Trips — `/auto-trips`

**Click:** Sidebar → **Trip**.

**Shows.** The tabs are **Trips**, **History** and **Questions**.

- Plant-to-plant runs are labelled **normal**, not "needs a check".
- **History** lists every visit to a place, with the trips and the register
  rows side by side.
- **Questions** asks "is this point one place or two?" — each card says how
  many trips are waiting on the answer and offers the candidate names.

---

## 7. Mileage and Fuel — `/mileage`, `/fuel-integrity`

**Click:** Sidebar → **Fuel Management** → **Mileage**.

**Shows.** One page with km/L **and** DEF per truck, plus every fill-to-fill
cycle reconciled against the oil report.

- **Add bill photo** opens the camera. Photograph the slip; the product says
  which truck it matched and why, with **Confirm** and **Change**, or lists
  the candidates with their reasons. **Enter by hand instead** still opens
  the old form.
- **Fuel Integrity** now says: *explained by driving*, *went down while
  parked*, *fill doesn't match bill*, *not enough data*. It never says
  "siphon", and it never accuses anyone.

---

## 8. Route Hub — the detour detail

**Click:** Sidebar → **Route Hub** → a deviation.

**Shows.**

- The header says **"On a loaded run · FARAKKA AMBUJA PLANT → DANKUNI SIDING"**.
- The map draws the usual road under the road as driven, and the off-road
  part on top of it in red. When there is no usual road, the map says why
  instead of drawing an empty layer.
- **See on map** opens Track mode on that truck and range.
- The cost is **"—"** when it is unknown. Never ₹0.
- **Stops while off the usual road** — where and for how long. Facts only.
  No reason, no judgement.

---

## 9. Places — `/place-hub`

**Click:** Sidebar → **Place Hub** is gone; open `/place-hub` directly, or
click a place on the Track map.

**Shows.**

- The map now has **Google's own place labels** on — hospitals, schools,
  government offices, worship — with the clutter still off.
- The **Same place?** tab says it in one sentence: *"These look like the same
  place: DANKUNI SAIDING and Dankuni Siding, 20 m apart"*, with the merge
  and undo buttons.
- On the Track page, opening a plant lists **what is inside it** — the gate,
  the siding, the parking, the weighbridge — so "at JK BUXAR" can be pinned
  to the weighbridge and not to a circle 600 m wide.
