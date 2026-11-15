/**
 * GET /api/fleet-view/accounts/link-state  (contract §11)
 */
import { z } from 'zod';
import { heldOr } from './redesignPrimitives.js';

/**
 * One vendor account and the trucks behind it.
 * `action.to` is `/settings/fleetedge-accounts` — the existing re-link
 * screen, already linked from FleetLinkSheet and settingsFleetData.
 */
export const AccountLinkStateSchema = z
  .object({
    accountId: z.string(),
    vendor: z.enum(['FLEETEDGE', 'IALERT']),
    accountName: z.string(),
    state: z.enum(['HEALTHY', 'EXPIRING', 'NEEDS_RELINK', 'RECOVERING']),
    lastDataAt: z.string().nullable(),
    trucks: z.number(),
    action: z
      .object({
        label: z.string(),
        to: z.string(),
      })
      .passthrough()
      .nullable(),
  })
  .passthrough();

export const AccountsLinkStatePayloadSchema = z
  .object({
    items: z.array(AccountLinkStateSchema).default([]),
  })
  .passthrough();

export const AccountsLinkStateResponseSchema = heldOr(AccountsLinkStatePayloadSchema);
