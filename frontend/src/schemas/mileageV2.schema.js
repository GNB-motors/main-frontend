/**
 * GET /api/fleet-view/mileage  (contract §8.1)
 */
import { z } from 'zod';
import { WhySchema, heldOr } from './redesignPrimitives.js';

/** One truck's mileage, or one fill-to-fill cycle. */
export const MileageItemSchema = z
  .object({
    registrationNumber: z.string(),
    driverName: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string().nullable(),
    km: z.number().nullable(),
    dieselL: z.number().nullable(),
    kmPerL: z.number().nullable(),
    usualKmPerL: z.number().nullable(),
    defL: z.number().nullable(),
    defPctOfDiesel: z.number().nullable(),
    defBand: z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .passthrough()
      .nullable(),
    verdict: z.enum(['ADDS_UP', 'UNEXPLAINED', 'LOW_KMPL', 'MISSING_BILL', 'NOT_ENOUGH_DATA']),
    verdictWhy: WhySchema,
    source: z.enum(['RECONCILED_REGISTER', 'PHOTO_BILL', 'SENSOR_ONLY']),
  })
  .passthrough();

export const MileagePayloadSchema = z
  .object({
    items: z.array(MileageItemSchema).default([]),
    totals: z
      .object({
        km: z.number().nullable(),
        dieselL: z.number().nullable(),
        defL: z.number().nullable(),
        kmPerL: z.number().nullable(),
      })
      .passthrough(),
  })
  .passthrough();

export const MileageResponseSchema = heldOr(MileagePayloadSchema);

/**
 * GET /api/fuel-integrity/windows (contract §8.2)
 * The verdict is what the window means; `siphonSuspected` stays for old
 * readers and is now true only for UNEXPLAINED_WHILE_PARKED.
 */
export const FuelIntegrityWindowSchema = z
  .object({
    id: z.string(),
    registrationNumber: z.string(),
    startAt: z.string(),
    endAt: z.string().nullable(),
    startFuelL: z.number().nullable(),
    endFuelL: z.number().nullable(),
    fuelUsedL: z.number().nullable(),
    km: z.number().nullable(),
    verdict: z.enum([
      'EXPLAINED_BY_DRIVING',
      'UNEXPLAINED_WHILE_PARKED',
      'NOT_ENOUGH_DATA',
      'FILL_MISMATCH',
    ]),
    verdictWhy: WhySchema,
    parkedDropL: z.number().nullable(),
    drivingUseL: z.number().nullable(),
    expectedDrivingUseL: z.number().nullable(),
    siphonSuspected: z.boolean().nullable(),
  })
  .passthrough();

export const FuelIntegrityPayloadSchema = z
  .object({
    items: z.array(FuelIntegrityWindowSchema).default([]),
    totals: z
      .object({
        parkedDropL: z.number().nullable(),
        windows: z.number(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const FuelIntegrityResponseSchema = heldOr(FuelIntegrityPayloadSchema);
