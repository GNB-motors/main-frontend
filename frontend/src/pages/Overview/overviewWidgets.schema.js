/**
 * Zod validation for the Overview MetricTile widget feeds.
 * Permissive by design: known fields are typed, unknown fields pass through.
 * Loaded via schemas/validate.js (dynamic import) so zod stays out of the
 * eager chunk. Shapes verified against the backend modules 2026-09-06:
 *
 *  - GET /api/livetracking/positions   → { status, data: { records: [...] } }
 *    (liveTracking.controller.js — rows carry `state` ACTIVE/PARKED/OFFLINE)
 *  - GET /api/erp/approvals/summary    → sendSuccess({ total, byType })
 *    (erpApproval.service.js pendingSummary — the real field is `total`;
 *    the Sidebar's `pendingCount` read is stale and always undefined)
 *  - GET /api/app/v1/bills             → { status, data: { results, total, ... } }
 *    (expense.service.js listBills)
 *  - GET /api/idling-reports/summary   → { status, data: [...] }
 *    (fleetGuardian/idlingReport.service.js summarizeByVehicle — `_id` is the
 *    registration number)
 *  - GET /api/fuel-spend/summary       → { status, data: { totals, ... } }
 *    (fuelSpend.service.js getSummary)
 */
import { z } from 'zod';

export const livePositionSchema = z
  .object({
    registrationNumber: z.string().nullish(),
    vin: z.string().nullish(),
    state: z.string().nullish(),
    isStale: z.boolean().nullish(),
    eventDateTime: z.string().nullish(),
  })
  .passthrough();

export const livePositionsResponseSchema = z
  .object({
    status: z.string().optional(),
    data: z.object({ records: z.array(livePositionSchema) }).passthrough(),
  })
  .passthrough();

export const erpApprovalsSummarySchema = z
  .object({
    success: z.boolean().optional(),
    data: z
      .object({
        total: z.number().nullish(),
        byType: z.array(z.unknown()).optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const appBillsListSchema = z
  .object({
    status: z.string().optional(),
    data: z
      .object({
        results: z.array(z.unknown()).optional(),
        total: z.number().nullish(),
      })
      .passthrough(),
  })
  .passthrough();

export const idlingSummaryRowSchema = z
  .object({
    _id: z.string().nullish(),
    totalIdleHours: z.number().nullish(),
    totalWasteInr: z.number().nullish(),
    reportCount: z.number().nullish(),
    lastWindowTo: z.string().nullish(),
  })
  .passthrough();

export const idlingSummaryResponseSchema = z
  .object({
    status: z.string().optional(),
    data: z.array(idlingSummaryRowSchema),
  })
  .passthrough();

export const fuelSpendSummarySchema = z
  .object({
    status: z.string().optional(),
    data: z
      .object({
        totals: z
          .object({
            litres: z.number().nullish(),
            amountInr: z.number().nullish(),
            logCount: z.number().nullish(),
            avgRateInrPerL: z.number().nullish(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();
