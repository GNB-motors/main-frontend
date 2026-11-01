import { z } from 'zod';
import { num, str } from './primitives.js';

export const trackTelemetrySchema = z
  .object({
    registrationNumber: str,
    primaryFuelLevel: num,
    fuelLevelUnit: str,
    defLevel: num,
    defLevelUnit: str,
    canOdo: num,
    pulledAt: str,
    isStale: z.boolean().nullish(),
  })
  .passthrough()
  .nullish();
