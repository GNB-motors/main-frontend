/**
 * Zod validation for the Daily Digest's morning brief
 * (GET /api/owner-value/morning-brief).
 * Permissive by design (see schemas/primitives.js): known fields are typed,
 * every optional field also accepts null, and unknown fields pass through so a
 * new backend section never turns a healthy response into a failed request.
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';

const briefVehicleSchema = z
  .object({
    vehicleId: ref,
    registrationNumber: str,
    rupees: num,
    durationMin: num,
    excessL: num,
  })
  .passthrough();

const briefSectionSchema = z
  .object({
    key: str,
    label: str,
    // 'ok' | 'empty' — kept as a plain string so a new status value never
    // throws on an otherwise-healthy brief.
    status: str,
    rupees: num,
    suggestedAction: str,
    vehicles: z.array(briefVehicleSchema).nullish(),
  })
  .passthrough();

export const morningBriefSchema = z
  .object({
    date: str,
    totalRupees: num,
    sections: z.array(briefSectionSchema).nullish(),
    disclaimer: str,
  })
  .passthrough();
