/**
 * Zod schemas for the superadmin FleetEdge data-flow health API.
 * Permissive by design (see schemas/primitives.js): known fields typed,
 * everything else passes through, nulls accepted — a schema drift must not
 * look like an outage.
 */
import { z } from 'zod';
import { str, num } from './primitives.js';

const feedFreshness = z.object({ lastEventAt: str, ageSeconds: num }).passthrough();

const vehicleRow = z
  .object({
    vin: str,
    registrationNumber: str,
    vehicleModel: str,
    connection: z.object({ status: str, expiresAt: str, remainingSeconds: num }).passthrough(),
    backend: z
      .object({
        status: str,
        overallLastEventAt: str,
        ageSeconds: num,
        feeds: z
          .object({
            status: feedFreshness.optional(),
            fuel: feedFreshness.optional(),
            usage: feedFreshness.optional(),
            can: feedFreshness.optional(),
            position: feedFreshness.optional(),
          })
          .passthrough()
          .optional(),
        vinLastSeenAt: str,
      })
      .passthrough(),
    sink: z.object({ reachable: z.boolean().nullish(), lastSeenAt: str }).passthrough().nullish(),
    forwarderGap: z.boolean().nullish(),
    subscriptionExpired: z.boolean().nullish(),
  })
  .passthrough();

export const fleetEdgeHealthSchema = z
  .object({
    org: z.object({ _id: str, companyName: str }).passthrough(),
    generatedAt: str,
    sinkReachable: z.boolean().nullish(),
    summary: z.object({}).passthrough(),
    accounts: z.array(z.object({}).passthrough()),
    vehicles: z.array(vehicleRow),
  })
  .passthrough();

export const orgListSchema = z.array(z.object({ _id: str, companyName: str }).passthrough());
