/**
 * Zod validation for the Optimal-Speed Advisory response (feature #15).
 * Permissive by design (see schemas/primitives.js): known fields typed, nulls
 * accepted, unknown fields pass through.
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';

const bandSchema = z
  .object({
    minKmh: num,
    maxKmh: num,
    efficiencyKmpl: num,
    distanceKm: num,
    windows: num,
  })
  .passthrough();

const profileSchema = z
  .object({
    _id: str,
    vehicleId: ref,
    registrationNumber: str,
    optimalMinKmh: num,
    optimalMaxKmh: num,
    optimalEfficiencyKmpl: num,
    avgSpeedKmh: num,
    avgEfficiencyKmpl: num,
    pctDistanceInOptimalBand: num,
    potentialSavingsL: num,
    potentialSavingsInr: num,
    bands: z.array(bandSchema).nullish(),
    sampleWindows: num,
  })
  .passthrough();

export const optimalSpeedResponseSchema = z
  .object({
    success: z.boolean().optional(),
    profiles: z.array(profileSchema).nullish(),
    summary: z.object({ count: num, totalPotentialSavingsInr: num }).passthrough().nullish(),
  })
  .passthrough();
