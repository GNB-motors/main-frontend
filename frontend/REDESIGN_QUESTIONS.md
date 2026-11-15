# REDESIGN_QUESTIONS

Everything the redesign had to decide on its own, and every word it could not
find in the plan. Nothing here changed the product's behaviour in a way the
owner might not want; each one is either a wording choice or a thing that
needs a backend answer.

The plan (`FRONTEND_MINIMAX.md`) is the contract. Where it was silent, the
safest reading was taken and noted here. Nothing was decided silently.

---

## 1. Wording I chose because the plan did not say

### 1.1 The "Fuel Management" group has a hover hint
Appendix D lists the sidebar items that get hover help. It lists **Mileage**,
**Fuel Integrity** and **DEF Ledger**, but not the **Fuel Management** group
that holds them. The group is a top-level Fleet item, and the rule in F0.6a is
that every top-level Fleet item has a hint, so it got one:

> Fuel, DEF and mileage for every truck.

Change it if you would rather it read differently.

### 1.2 The verdict sentences in Fuel Integrity
The plan fixed the four verdicts but not their exact sentences. These are what
the page says:

| Verdict | What the page says |
|---|---|
| `EXPLAINED_BY_DRIVING` | Explained by the driving |
| `UNEXPLAINED_WHILE_PARKED` | Went down while parked |
| `FILL_MISMATCH` | Fill doesn't match the bill |
| `NOT_ENOUGH_DATA` | Not enough data yet |

Each one is a fact and none of them accuse anyone. The old word "siphon" does
not appear anywhere in the fuel pages.

### 1.3 "Likely cement or clinker"
Material has no source on prod — no weigh slips, no e-way bills, no ERP
consignment rows are populated. The panel therefore says **"Likely Cement or
clinker"**, worked out from the plant the truck loaded at, and says so in the
tooltip. It never says "0 t".

### 1.4 "Not received" versus "—"
The plan says an unknown is an em dash or a sentence. The rule applied here:

- A **number that does not exist** — the tonnage, the km/L — is **"—"**.
- A **reading that was never received** — fuel, DEF, odometer — says
  **"Not received"**, because "—" on a fuel tile reads like a formatting
  slip.
- A **reading that is old** says **"last known 9 Sep, 9:10 am"**.

### 1.5 "Location not known"
`PlaceName` never prints "Unknown site". When the API sends no place at all,
the panel says **"Location not known"**.

---

## 2. Things that need a backend answer

### 2.1 `/now` and `/where-next` are not deployed yet
The vehicle panel reads `/api/fleet-view/vehicles/:reg/now`. Until that
endpoint exists the panel falls back to the release's position row, mapped
into the same view model, so every section shows its own honest empty state:
no activity, no place, no trip, no chips, no issues. It is a graceful
fallback, not a stub — the header, the tiles and the details card are real
today.

`/where-next` is the same: the section says "We could not work out where this
truck is going right now."

### 2.2 The map places endpoint
`/api/fleet-view/map/places` is not deployed. The Places layers in the legend
therefore come back as **"Coming soon"** with a hover note, and the other
layers (dhabas, hospitals, police, workshops, dealers, parking, tolls) do
not draw. **Our places** — the confirmed plants, sidings and customers — keep
working, because they come from Place Hub's own data.

### 2.3 `/api/fleet-view/campuses`
The "inside this plant" list on the Track place panel needs the campuses
endpoint. Until it exists, opening a plant shows no member places. The
"Usual road not drawn" caption on the detour screen needs the usual-road
geometry the same way.

### 2.4 The trip log's stops need a reason
The trip log lists every stop and every event, and the stops carry their
reason (loading, unloading, fuel, rest, overnight, queue, workshop,
unexplained). That reason is worked out from the landmarks around the stop.
If the backend cannot work out a reason, it says **UNEXPLAINED** and the
panel says "Stopped on the road with no named place within 500 m" — never a
guess.

### 2.5 The 2-second poll for a bill photo
F11 says the suggestion is polled every 2 seconds for up to 30 seconds. The
frontend does exactly that, and stops early when the answer arrives. It does
**not** retry a failed upload, because a silent retry would hide a network
problem behind a spinner.

### 2.6 The capture upload
The bill photo is posted to the existing `/api/app/v2/captures` endpoint as
multipart, with `file` and `kind`, and the suggestion is read from
`/api/fleet-view/bills/:captureId/suggestion`. If the capture endpoint wants
a different field name, only `buildBillFormData` in
`frontend/src/pages/Mileage/billPhotoModel.js` needs changing.

---

## 3. Things the plan left alone, that you may want to look at

### 3.1 The marketing site still says "theft"
`frontend/src/pages/landing-page-v2/` has copy about "fuel theft detection",
"pilferage alerts" and "theft models". It is the public marketing site, not
the product, and the plan did not cover it, so it was left as it was. Say the
word and it gets the same honest wording.

### 3.2 The ERP's "In transit"
`components/Erp/Trip/tripFinance.js` and the ERP trip screens use "In transit"
as a **consignment lifecycle state** (dispatched → in transit → delivered).
That is the ERP module's own vocabulary, not the fleet's truck state, and it
is a different product area. The vehicle panel never says it.

### 3.3 Owner Alerts still calls a fuel event "Fuel loss suspected"
`pages/OwnerAlerts/ownerAlertsModel.js` maps `FUEL_SIPHON_SUSPECTED` to the
title "Fuel loss suspected". The type label the owner actually reads is
"Fuel loss — please review", which is fine. The page was outside the plan's
scope, so it was not rewritten.

### 3.4 The Place Hub's fuel-risk wording
The Place Hub's risk pill and its risk sentence said "theft". They now say
**"fuel-loss report"** and **"Fuel loss or unauthorised refuelling reported
here"**. The underlying field is still called `theftIncidents` because that
is the API's name; only the words on screen changed.

---

## 4. Open questions for the owner

1. **Fuel Management's hover hint** — is "Fuel, DEF and mileage for every
   truck." the right line, or do you want something else?
2. **Where next** — the plan says the detail is fetched only when the section
   is opened, but it also says the *collapsed* header shows the top
   destination and its ETA. Those two cannot both be true. The frontend
   fetches the prediction when the panel opens, so the header can show the
   top guess; the expanded view shows the reasons. Is that right, or should
   the endpoint be split into a cheap "top guess" call and a full one?
3. **Plant-to-plant** — is a plant-to-plant run always "normal", or normal
   only when it is between two of *your* plants? Right now every
   plant-to-plant run is excluded from the empty share.
4. **The Intel tab "Fuel checks"** — the contract's instance kind is
   `fuel_unexplained`. Should the tab be called "Fuel checks" (as the plan
   says) or "Fuel that went down"?
5. **The trip log's CSV** — it is built in the browser from the same points
   the map shows, with the stops and the events as their own rows. Is a
   server-side export wanted instead?
6. **Screenshots** — this machine had no browser driver, so the walkthrough
   is written as click paths rather than pictures. Do you want the
   screenshots taken on a machine that has one?
