/**
 * Zod validation for the Refuel Advisory response (feature #16). Permissive by
 * design (see schemas/primitives.js).
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';

const advisorySchema = z
  .object({
    _id: str,
    vehicleId: ref,
    registrationNumber: str,
    currentFuelL: num,
    tankCapacityL: num,
    pctFull: num,
    avgEfficiencyKmpl: num,
    estimatedRangeKm: num,
    status: str,
    litresToFull: num,
    estimatedFillCostInr: num,
    lastReadingAt: str,
  })
  .passthrough();

export const refuelAdvisoryResponseSchema = z
  .object({
    success: z.boolean().optional(),
    advisories: z.array(advisorySchema).nullish(),
    summary: z
      .object({ count: num, OK: num, REFUEL_SOON: num, CRITICAL: num })
      .passthrough()
      .nullish(),
  })
  .passthrough();
