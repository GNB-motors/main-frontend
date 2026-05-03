# Changelog — GNB Fleet Management Frontend

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
