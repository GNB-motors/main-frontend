/**
 * Zod for the Movement Approvals API (/api/movement-approvals). Permissive.
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';

export const approvalSchema = z
  .object({
    _id: str,
    vehicleId: ref,
    driverId: ref,
    placeSpec: z
      .object({ kind: str, id: ref, type: str }) // kind: SITE|REGION|TYPE|ANY_WORKSHOP|ANY
      .passthrough()
      .nullish(),
    purpose: str,
    window: z.object({ from: str, to: str }).passthrough().nullish(),
    recurrence: z
      .object({
        weekdays: z.array(num).nullish(),
        fromHour: num,
        toHour: num,
        validFrom: str,
        validTo: str,
      })
      .passthrough()
      .nullish(),
    caps: z.object({ maxExtraKm: num, maxDwellMin: num }).passthrough().nullish(),
    kind: str, // PRE | STANDING | LATE
    status: str, // ACTIVE | REVOKED
    purposeLabel: str,
    note: str,
    createdBy: ref,
    approvedBy: ref,
    excursionId: ref,
    revokedBy: ref,
    revokedAt: str,
    createdAt: str,
  })
  .passthrough();

export const approvalListSchema = z
  .object({ items: z.array(approvalSchema), total: num, page: num, limit: num })
  .passthrough();
