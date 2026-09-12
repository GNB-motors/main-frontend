# Sidebar RBAC — how visibility is decided

Source of truth: `src/utils/sideNavUtils.js` (`SIDE_NAV_ITEMS`, `getVisibleNavItems`).

## The two independent gates

```js
// src/contexts/FeatureFlagsContext.jsx
const isEnabled = (key) => flags?.[key] === true; // ORG feature flag
const hasPermission = (key) => permissions?.[key] === true; // ROLE permission
const canAccess = (key) => !key || (isEnabled(key) && hasPermission(key));
```

A sidebar item is visible only if **both** are true:

- **Role layer (`hasPermission`)** — per-role permission map, backend `role.service.js` (`resolvePermissions`).
- **Org entitlement layer (`isEnabled`)** — `organization.featureFlags[key]`, set only by SUPER_ADMIN per org. Defaults to `{}` (nothing on) for a new org.

## OWNER is only exempt from one of the two

**OWNER sees a sidebar item only if the org has bought/been-granted that module's feature flag. OWNER is exempt from the role-based restriction, not the org-entitlement restriction.**

- Backend `resolvePermissions` gives OWNER `true` for every permission key — this bypasses the **role** layer only, so Owner can't lock themselves out of their own RBAC settings.
- OWNER does **not** bypass `isEnabled` — module visibility for OWNER is entirely driven by which `organization.featureFlags` Super Admin has turned on for that org.
- SUPER_ADMIN is the only role that bypasses both layers — and it doesn't even use this sidebar; it's routed to a separate, hardcoded `SuperAdminSidebar.jsx` with zero gating.

## Sidebar item legend

| Item                                                                                             | flag `key`          | Module gate | Owner default | Manager default          | Field Agent/Driver default |
| ------------------------------------------------------------------------------------------------ | ------------------- | ----------- | ------------- | ------------------------ | -------------------------- |
| Overview (`/command-center`)                                                                     | `overview`          | both        | ✅ if flag on | ✅                       | ❌                         |
| Daily Digest                                                                                     | `fleetIntelligence` | both        | ✅ if flag on | ✅                       | ❌                         |
| Vehicles (group)                                                                                 | `vehicles`          | —           | ✅ if flag on | ✅                       | ✅                         |
| Workforce (Employee/User Mgmt)                                                                   | `drivers`           | —           | ✅            | ❌ (excluded by default) | ❌                         |
| ERP Home                                                                                         | `erpOperations`     | erp         | ✅            | ✅                       | ❌                         |
| CRM (Customers)                                                                                  | `erpMasters`        | erp         | ✅            | ✅                       | ❌                         |
| CRM (Call Tasks/Schedules)                                                                       | `erpCallPlanning`   | erp         | ✅            | ✅                       | ❌                         |
| Trip Pipeline                                                                                    | `erpOperations`     | erp         | ✅            | ✅                       | ❌                         |
| Inbound e-Way Bills                                                                              | `erpCnUpdation`     | erp         | ✅            | ✅                       | ❌                         |
| Billing & Receivables                                                                            | `erpBilling`        | erp         | ✅            | ✅                       | ❌                         |
| Payables / Ledger                                                                                | `erpAccounts`       | erp         | ✅            | ✅                       | ❌                         |
| Approval Center                                                                                  | `erpApprovals`      | erp         | ✅            | ✅                       | ❌                         |
| Master Setting (rate/vendor/material/settings)                                                   | `erpMasters`        | erp         | ✅            | ✅                       | ❌                         |
| Advance Masters                                                                                  | `erpAdvances`       | erp         | ✅            | ✅                       | ❌                         |
| Fleet Operations (`/overview`)                                                                   | `overview`          | fleet       | ✅            | ✅                       | ✅                         |
| Track (live tracking)                                                                            | _(none)_            | fleet       | ✅            | ✅                       | ✅                         |
| WhatsApp Approvals                                                                               | _(none)_            | fleet       | ✅            | ✅                       | ✅                         |
| Mileage Tracking / AdBlue                                                                        | `vehicleActivity`   | fleet       | ✅            | ✅                       | ✅                         |
| Fuel Comparison                                                                                  | `fuelComparison`    | fleet       | ✅ if flag on | ✅                       | ❌                         |
| Fuel Integrity / Spend / DEF Ledger / Field Fuel Entries                                         | `fuelIntegrity`     | fleet       | ✅ if flag on | ✅                       | ❌                         |
| Fleet Intelligence group (Compliance, Alerts, Route Intel, Overspeed, Theft, Owner Alerts, etc.) | `fleetIntelligence` | fleet       | ✅ if flag on | ✅                       | ❌                         |
| Locations                                                                                        | `locations`         | fleet       | ✅ if flag on | ✅                       | ❌                         |
| Geofence (Anomalies, Zones & Alerts)                                                             | `geofence`          | fleet       | ✅ if flag on | ✅                       | ❌                         |
| Khata Ledger                                                                                     | `khataLedger`       | —           | ✅ if flag on | ✅                       | ❌                         |
| Reports                                                                                          | `reports`           | —           | ✅ if flag on | ✅                       | ❌                         |
| **Profile**                                                                                      | `null`              | —           | ✅ always     | ✅ always                | ✅ always                  |

Visible only if `isEnabled(flag key)` (org has it on) **and** `hasPermission(flag key)` (role has it — always true for Owner). "erp"/"fleet"/"both" module gates additionally require the org to have at least one key from that module group enabled (`hasErpAccess`/`hasFleetAccess` in `src/utils/moduleAccess.js`).

## Gotcha: ERP-specific roles

`KAM`, `OPS_EXECUTIVE`, `ACCOUNTS`, `APPROVER` aren't in the `baseRole` enum used by the default-role fallback in `resolvePermissions`. If such a user has no custom Role/assignment attached, they get `{}` permissions and see only Profile. Doesn't affect OWNER — flagging it since it's an easy trap when creating ERP staff accounts.

## Super Admin "Permissions" catalog — the `Action` field is vestigial

The Super Admin > Permissions screen (`New permission` modal — Key / Group / **Action** / Label / Description / Feature flag) has an `Action` dropdown (`VIEW`, `CREATE`, `EDIT`, `DELETE`, `MANAGE`, or none). **This field is never read by any authorization check.** It is stored and displayed, nothing else.

**Where it lives:**

- Frontend page/modal: `src/pages/Superadmin/components/RbacPermissionsPage.jsx` — `ACTIONS` options at line 11, form at lines 233-365, table renders `p.action` read-only at line 207.
- Backend model: `app/modules/rbac/permission.model.js` — `action` is an enum field (`VIEW|CREATE|EDIT|DELETE|MANAGE|null`), stored alongside `key`, `group`, `label`, `description`, `featureFlag`.

**Why it looks functional but isn't:** for system-seeded permissions, `permissionCatalog.js` mints two rows per module — `{module}.view` (action `VIEW`) and `{module}.edit` (action `EDIT`) — set together at seed time, so `key` suffix and `action` happen to agree by convention. But nothing enforces that link, and for a custom permission (like the one being created in the screenshot) the Super Admin can pick any `action` independent of the `key` string — e.g. key `crm.edit` with action `VIEW` — and nothing validates or cares.

**Traced end-to-end, `action` is never read for a decision:**

- `app/middlewares/checkPermission.js` — `permissions[key] !== true` → forbidden. No `action` parameter exists in this check at all.
- `RoleService.resolvePermissions`, `rbac.service.js`'s `keysToMap()`, `accessControl.service.js`'s `keysToMap()`/`grantedKeys()` — all collapse every permission to a flat `{ key: boolean }` map, discarding `action`.
- Frontend `canAccess(key)` (`FeatureFlagsContext.jsx`) — keyed only by `key`.
- Frontend role-editor (`src/pages/AccessControl/PermissionTreeView.jsx`) — renders each catalog entry as an independent toggle keyed by `p.key`; `p.action` is never destructured or referenced.

**The actual view/edit split** in this system comes entirely from there being **two separate keys** per module (`module.view`, `module.edit`), each its own independent boolean gate — not from the `Action` field. This matches the user's instinct: _"if you have access, you can view or edit"_ is already how it works — the granularity is per-key, not per-action.

**Conclusion:** `Action` is safe to remove — it's cosmetic metadata with no functional effect. Removing it would mean dropping: the dropdown/column in `RbacPermissionsPage.jsx`, the `action` field from `permission.model.js` + `rbac.validation.js`, and the `action:` assignments in `permissionCatalog.js` / `rbac.service.js` seed logic. No authorization behavior changes as a result.
