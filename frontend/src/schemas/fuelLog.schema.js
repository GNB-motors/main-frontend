import { z } from 'zod';

export const lastFuelLogSchema = z
  .object({
    odometerReading: z.number().nullish(),
    refuelTime: z.string(),
    fillingType: z.string(),
  })
  .passthrough()
  .nullable();
const doc = z.object({ _id: z.string() }).passthrough();
export const fuelDocumentResponseSchema = z.union([doc, z.object({ data: doc }).passthrough()]);
export const createdFuelLogSchema = z
  .object({
    id: z.string().optional(),
    fuelLog: z.object({}).passthrough().optional(),
  })
  .passthrough();
