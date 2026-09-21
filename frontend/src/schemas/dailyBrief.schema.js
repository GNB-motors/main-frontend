/**
 * Zod validation for the Daily/Morning Brief response (feature #17).
 * Permissive by design (see schemas/primitives.js): known fields are typed,
 * every optional field also accepts null, and unknown fields pass through so a
 * new backend section never turns a healthy response into a failed request.
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';

const briefEventSchema = z
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
    // 'ok' | 'empty' | 'not_available_yet' — kept as a plain string so a new
    // status value never throws on an otherwise-healthy brief.
    status: str,
    rupees: num,
    suggestedAction: str,
    reason: str,
    events: z.array(briefEventSchema).nullish(),
  })
  .passthrough();

export const dailyBriefSchema = z
  .object({
    date: str,
    totalRupees: num,
    sections: z.array(briefSectionSchema).nullish(),
  })
  .passthrough();
