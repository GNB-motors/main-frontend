/**
 * Trip plan API schemas. Permissive by design (see primitives.js): known fields
 * typed, everything else passed through, nulls accepted.
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';
import { autoTripSchema } from './autoTrip.schema.js';

const planEnd = z.object({ orgSiteId: str, name: str, lat: num, lng: num }).passthrough();

export const tripPlanSchema = z
  .object({
    _id: str,
    vehicleId: ref,
    registrationNumber: str,
    driverId: ref,
    pickup: planEnd.nullish(),
    drop: planEnd.nullish(),
    plannedStartAt: str,
    plannedEndAt: str,
    note: str,
    status: str, // PLANNED | IN_PROGRESS | COMPLETED | CANCELLED
    flags: z.array(str).nullish(),
    late: z.boolean().nullish(),
    autoTripId: str,
    matchedBy: str, // AUTO | MANUAL
    autoMatch: z.boolean().nullish(),
    actual: z
      .object({ startedAt: str, endedAt: str, pickupName: str, dropName: str, km: num })
      .passthrough()
      .nullish(),
  })
  .passthrough();

export const tripPlanListSchema = z
  .object({
    items: z.array(tripPlanSchema),
    total: num,
    page: num,
    limit: num,
    late: num,
    tabCounts: z.record(num).nullish(),
  })
  .passthrough();

export const unplannedTripsSchema = z
  .object({ items: z.array(autoTripSchema), total: num, page: num, limit: num })
  .passthrough();
