# Frontend Handoff — ERP Hub-and-Spoke UX Overhaul & Drawers Kit

**Repo:** `main-frontend/frontend` (React 19 / Vite / React Router v7 / Tailwind v4 / Recharts / React-Toastify)  
**Date:** 2026-08-09  
**Scope:** Complete frontend UX overhaul transforming the ERP module from fragmented 27-route page switches to a **Hub-and-Spoke Command Center** with contextual slide-over drawers, real-time metrics, and deep-linkable URLs.

---

## 1. Executive Summary

### The Friction (Before)
- **High-Friction Page Redirects:** Simple operations (raising an advance, creating a CN, closing a trip, uploading a POD, entering unloading) forced full-page navigations to separate form pages.
- **No Central Command Dashboard:** Navigating to `/erp` was unmapped, and operations required hunting through an 8-item sidebar menu.
- **Duplicated Stage Logic:** Forms were implemented twice — once as modals on individual stage pages and once on `TripDetailPage`.
- **Buried Approvals:** Approvals was hidden deep under Masters instead of being a daily action queue.

### The Solution (After)
- **Hub-and-Spoke Information Architecture:** Navigation is organized around **1 Command Center Home** (`/erp`), **4 Work Area Hubs** (Pipeline, Billing, Payables, Accounts), and **1 Trip 360° View** (`/erp/trips/:tripId`).
- **In-Place Slide-over Drawers:** Every mutating action opens a slide-over drawer in-place without page switches. Drawers are deep-linkable via URL search parameters (`?drawer=pod&trip=123`).
- **Full-Lifecycle Stepper:** An 8-stage visual pipeline tracker (DO ➔ Placement ➔ Advance/CN ➔ Close ➔ POD ➔ Unloading ➔ Sale Bill ➔ Payment Received).
- **Top-Level Approvals:** Promoted to top-level sidebar link with a **live pending count badge** (polled every 30s).
- **Backward Compatibility:** Legacy stage URLs redirect seamlessly to their respective work area hub tabs.

---

## 2. Shared UI Kit Primitives (`src/components/Erp/`)

### 2.1 `ErpDrawer.jsx`
- Reusable slide-over drawer wrapper leveraging React `createPortal`.
- **Keyboard & Overlay Guards:** ESC key listener, backdrop click dismissal, and `body` scroll locks.
- **Slots:** Header (title, subtitle, close button), scrollable body container, and custom footer action buttons.

### 2.2 `ErpTable.jsx`
- Universal table component replacing hand-rolled markup across 25+ files.
- **Features:** Toolbar slot (search input + filter dropdowns), loading shimmer skeleton (`TableShimmer`), empty state with icon & CTA slots, and integrated pagination using `ui/pagination.jsx`.

### 2.3 `PageHeader.jsx`
- Standardized page header component providing breadcrumbs (`/erp ➔ Pipeline ➔ TRIP/...`), title, subtitle, and primary header action buttons.

### 2.4 `StatusBadge.jsx`
- Centralized badge mapping all operational & financial states to color-coded UI tones (`success`, `warning`, `info`, `danger`, `neutral`, `purple`).

### 2.5 `src/styles/erp.css` Consolidation
- Cleaned up legacy styling rules and consolidated button/header styles.
- Added keyframe animations (`slideInRight`, `slideOutRight`, `fadeIn`, `fadeOut`) and badge classes (`.purple`, `.info`).

---

## 3. Action Drawer Components (`src/components/Erp/Drawers/`)

All operational forms have been refactored into single-responsibility drawer components wrapped with `ErpDrawer`:

| Component | Capabilities | API Integration |
| :--- | :--- | :--- |
| **`AdvanceDrawer.jsx`** | Multi-leg budget calculation, diesel/servicing/border breakdown, advance request & payout recording | `AdvanceService.preview`, `requestAdvance`, `pay` |
| **`ConsignmentDrawer.jsx`** | CN number, date, loaded quantity, seal numbers, bilty scan upload & document ID linking | `ConsignmentService.uploadBilty`, `saveCn` |
| **`TripCloseDrawer.jsx`** | Unload date, location, remarks, report-empty tracking | `TripCloseService.closeTrip` |
| **`PodDrawer.jsx`** | Physical/soft POD receipt date, copy type, courier info, challan scan upload | `PodService.upload`, `record` |
| **`UnloadingDrawer.jsx`** | Unloaded qty, shortage/detention input, manual rate override, settlement calculation preview | `UnloadingApi.calculate`, `save` |
| **`SaleBillDrawer.jsx`** | Multi-trip / single-trip sale bill generation prefilled from party and unloading data | `SaleBillApi.create` |
| **`ReceiptDrawer.jsx`** | Customer payment receipt recording & bill allocation | `ReceiptService.create` |

---

## 4. Trip 360° Action Hub (`src/pages/ErpTrips/TripDetailPage.jsx`)

- **Full-Lifecycle Pipeline Stepper:** Visual progression across all 8 stages.
- **Deep-Link URL Param Support:** State synced with `useSearchParams()` (`?drawer=advance|cn|close|pod|unloading|salebill|receipt`), allowing direct links to specific drawers.
- **CN Updation Fallback:** Displays `Loaded Qty` and `CN Status: CN Updated` even when `consignment` document is missing or for legacy seeded data.
- **Header Chips:** Credit limit chips, status badges, and party details displayed in `PageHeader`.

---

## 5. ERP Command-Center Dashboard (`src/pages/ErpHome/ErpHomePage.jsx`)

Mounted at `/erp`:
1. **KPI Row:** Active Trips count, Pending Approvals (clickable), Receivables Outstanding (+Overdue), Payables Due.
2. **Operational Pipeline Funnel:** Bar chart visualization using `recharts` (DOs open ➔ Placements today ➔ Pending CN ➔ Pending Close ➔ Pending POD ➔ Pending Unload ➔ Pending Bill). Clicking a bar navigates directly to the target tab.
3. **POD Ageing Watch:** Operational risk buckets (`<7d`, `7-14d`, `>14d overdue`).
4. **Action Queues with In-Place Drawers:** Tabbed pending work lists where clicking any row's action button launches its shared drawer directly on the dashboard!

---

## 6. Work Area Hub Pages (`src/pages/`)

### 6.1 `ErpPipelinePage.jsx` (`/erp/pipeline`)
- **Tabs:** Delivery Orders (`DeliveryOrdersPage`) | Placement Board (`PlacementBoardPage`) | Active Trips (`TripDashboardPage`).

### 6.2 `ErpBillingPage.jsx` (`/erp/billing`)
- **Tabs:** Sale Bills (`SaleBillsPage`) | Party Outstanding (`OutstandingPage`) | Receipts (`ReceiptsPage`).

### 6.3 `ErpPayablesPage.jsx` (`/erp/payables`)
- **Tabs:** Vendor Payments (`VendorPaymentsPage`) | Supplier Payments (`SupplierPaymentsPage`) | Purchase Bills (`UnloadingPage`).

### 6.4 `ErpAccountsPage.jsx` (`/erp/accounts`)
- **Tabs:** General Ledger (`LedgerPage`) | Finance & Vouchers (`FinancePage`).

---

## 7. Navigation & Routing Restructure

### 7.1 `sideNavUtils.js` & `Sidebar.jsx`
New Information Architecture:
- **`ERP Home`** (`/erp`, icon: `LayoutDashboard`, `key: null` — always visible)
- **`Approvals`** (`/erp/approvals`, icon: `FileCheck`, badge: live `approvalsCount` polled every 30s)
- **`Planning`** (`/erp/call-tasks`, `/erp/call-schedules`)
- **`Pipeline`** (`/erp/pipeline`)
- **`Billing & Receivables`** (`/erp/billing`)
- **`Payables`** (`/erp/payables`)
- **`Accounts & Ledger`** (`/erp/accounts`)
- **`Masters & Settings`** (`/erp/parties`, `/erp/rates`, `/erp/vendors`, `/erp/material-compatibility`, `/erp/advance-masters`, `/erp/settings`)

### 7.2 Backward-Compatible Redirects (`App.jsx`)
Legacy routes redirect automatically to the new hub tabs:
- `/erp/delivery-orders` ➔ `/erp/pipeline?tab=dos`
- `/erp/placement-board` ➔ `/erp/pipeline?tab=placement`
- `/erp/trips` ➔ `/erp/pipeline?tab=trips`
- `/erp/advances`, `/erp/consignments`, `/erp/trip-close`, `/erp/pods`, `/erp/unloading` ➔ `/erp/pipeline?tab=trips`
- `/erp/sale-bills`, `/erp/outstanding`, `/erp/receipts` ➔ `/erp/billing`
- `/erp/vendor-payments`, `/erp/supplier-payments` ➔ `/erp/payables`
- `/erp/ledger`, `/erp/finance` ➔ `/erp/accounts`

---

## 8. Verification & Build Summary

- **Frontend Production Build:** **100% CLEAN** (`vite build` completed in 5.58s with zero errors).
- **Backend Service Verification:** 
  - `stress-test-erp.js`: **100% PASSED** (20ms/pipeline flow).
  - `edge-cases-idempotency-erp.js`: **100% PASSED** (All 8 guard groups verified).
- **Database Seeder (`seed-complete-erp.js`):** Updated to populate matching `Consignment` records for seeded dispatched trips.
