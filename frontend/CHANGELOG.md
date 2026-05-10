# Changelog — GNB Fleet Management Frontend

---

## [2026-05-09] — branch: Devayan

### Multi-FleetEdge-Account UI

#### New page: `src/pages/Settings/FleetEdgeAccountsPage.jsx` — route `/settings/fleetedge-accounts`

- Table of all FleetEdge accounts for the org: source badge, external account ID, friendly name, status badge (`ACTIVE` / `DISABLED` / `AUTH_FAILED`), vehicle count, last-seen timestamp.
- **Inline rename modal** — MANAGER+ can edit the friendly name without leaving the page.
- **Add PULL Account modal** — OWNER+ can add a new PULL account with clientId / clientSecret / baseUrl; credentials are validated live against FleetEdge before the row is saved.
- **Enable / Disable toggle** — OWNER+ soft-disables accounts that have linked vehicles.
- **Discover panel** — OWNER+ triggers a FleetEdge vehicle-list call and sees candidate registrations not yet tagged in this org.
- **Drift tab** — shows all `FLEETEDGE_ACCOUNT_MISMATCH` audit entries with vehicle, from-account, arriving-account, and timestamp.

#### New service: `src/pages/Profile/FleetEdgeAccountService.jsx`

API client covering all account endpoints:

| Function | Endpoint |
|---|---|
| `listAccounts` | `GET /api/fleetedge/accounts` |
| `createAccount` | `POST /api/fleetedge/accounts` |
| `updateAccount` | `PATCH /api/fleetedge/accounts/:id` |
| `deleteAccount` | `DELETE /api/fleetedge/accounts/:id` |
| `discoverVehicles` | `POST /api/fleetedge/accounts/:id/discover` |
| `assignVehicles` | `POST /api/fleetedge/accounts/:id/assign` |
| `getDrift` | `GET /api/fleetedge/accounts/drift` |
| `reassignVehicleAccount` | `PATCH /api/vehicles/:id/fleet-edge-account` |

#### Modified: `src/pages/Profile/VehiclesPage.jsx`

- New **FleetEdge Account** column: shows `friendlyName` as a blue badge; italic grey "untagged" when `fleetEdgeAccountId` is null; amber dot on badge when source account is `DISABLED`.
- New **account filter dropdown** — appears when the org has at least one account. Options: All / Untagged / per-account name. Resets to page 1 on change.
- Fetches account list alongside vehicles (fire-and-forget, non-blocking) to build the badge label map.

#### Modified: `src/pages/Profile/AddVehiclePage.jsx`

- New **FleetEdge Account** dropdown on the Add Vehicle form (hidden when org has zero active accounts; hidden on edit).
- Auto-selects the only active account when the org has exactly one.
- On save, calls `PATCH /api/vehicles/:id/fleet-edge-account` to tag the new vehicle immediately.

#### Routing: `src/App.jsx`

- Added `<Route path="/settings/fleetedge-accounts" element={<FleetEdgeAccountsPage />} />` inside the `DashboardLayout` group.

---

## [2026-05-03] — branch: Devayan

### Fuel Comparison — Odometer Cross-Check UI

**`src/pages/FuelComparison/FuelComparisonPage.jsx`**

#### New: Pending Review tab

A third tab **Pending Review** (amber badge) appears alongside *All Comparisons* and *Flagged*. It shows tasks that the backend held because:
- OCR confidence on the odometer document was below 70%, or
- The delta between the OCR odometer and FleetEdge's GPS odometer exceeded 500 km (likely OCR misread), or
- The OCR service itself marked the document as `MANUAL_REVIEW`.

Managers must review each task before it's released for automated comparison.

#### New: Odometer column

All three tabs now show an **Odometer** column:

| Chip | Meaning |
|---|---|
| 🔴 Odo Mismatch | Delta 11–500 km — driver likely tampered. Task completed but flagged. |
| 🟡 Needs Review | Delta >500 km or low OCR confidence — held for manager review. |
| 🟢 OK | Delta ≤10 km — clean. |
| — | No OCR odometer reading available. |

Hover over any chip to see the full reason string.

#### New: Review modal (`ReviewModal` component)

Opens when a manager clicks **Review** on a Pending Review row.

Shows:
- The odometer document photo (direct S3 URL)
- OCR confidence % and processing status
- The reason the task was held
- Editable **From Date** and **To Date** fields (in IST, pre-filled from task)
- Editable **Corrected Odometer Reading** field (pre-filled with what OCR extracted; FleetEdge value shown as helper text)

**Approve & Release** updates the task and releases it back to `PENDING` for the backend cron to process.

**`src/pages/Reports/ReportsService.jsx`**

Two new API methods:

| Method | Endpoint | Description |
|---|---|---|
| `getPendingReviewTasks(params)` | `GET /api/extension/fuel-comparison/pending-review` | Paginated PENDING_REVIEW tasks with doc photo |
| `approveReviewTask(taskId, updates)` | `PUT /api/extension/fuel-comparison/:taskId/review` | Approve with optional date/odo corrections |

**`src/pages/FuelComparison/FuelComparison.css`**

Added styles for:
- `.fc-tab.review` / `.fc-tab.active.review` — amber tab colour
- `.fc-badge-review` — amber badge
- Row highlight for odometer-mismatch rows

---

## How to roll back

```bash
git revert 4921f21   # or git reset --hard <sha before this commit>
```
