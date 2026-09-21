/**
 * Zod validation for the Driving DNA (mini) response (feature #3). Permissive by
 * design (see schemas/primitives.js).
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';

const profileSchema = z
  .object({
    _id: str,
    vehicleId: ref,
    registrationNumber: str,
    idleExcessMinutes: num,
    idleRupees: num,
    movingSamples: num,
    overspeedSamples: num,
    speedingRate: num,
    canSamples: num,
    overRevSamples: num,
    overRevRate: num,
    idleScore: num,
    speedingScore: num,
    overRevScore: num,
    drivingScore: num,
    grade: str,
    sampleCount: num,
  })
  .passthrough();

export const drivingDnaResponseSchema = z
  .object({
    success: z.boolean().optional(),
    profiles: z.array(profileSchema).nullish(),
    summary: z.object({ count: num, avgScore: num }).passthrough().nullish(),
  })
  .passthrough();
