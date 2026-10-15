/**
 * Zod schema for GET /api/fleetedge/accounts/link-health. Permissive like the
 * other response schemas (see primitives.js): known fields typed, nulls
 * accepted, unknown fields passed through.
 */
import { z } from 'zod';
import { str, num } from './primitives.js';

const linkState = z.enum(['NEEDS_RELINK', 'EXPIRING', 'RECOVERING', 'HEALTHY']);

const account = z
  .object({
    accountId: z.string(),
    fleetId: str,
    friendlyName: str,
    state: linkState,
    reason: str,
    urgent: z.boolean().nullish(),
    deadline: str,
    daysLeft: num,
    renewable: z.boolean().nullish(),
    dataPausedSince: str,
    lastErrorMessage: str,
    linkedBy: z
      .array(
        z
          .object({ userId: str, name: str, linkedAt: str, isMe: z.boolean().nullish() })
          .passthrough(),
      )
      .default([]),
    vehicleCount: num,
    vehicles: z
      .array(z.object({ id: str, registrationNumber: str, branchId: str }).passthrough())
      .default([]),
  })
  .passthrough();

export const fleetLinkHealthSchema = z
  .object({
    generatedAt: str,
    severity: z.enum(['none', 'warning', 'critical']),
    summary: z
      .object({
        needsRelink: num,
        expiring: num,
        expiringUrgent: num,
        recovering: num,
        healthy: num,
        affectedVehicles: num,
      })
      .passthrough(),
    accounts: z.array(account),
  })
  .passthrough();
