/**
 * Zod validation for GET /api/livetracking/positions records (documented in
 * main-backend liveTracking.routes.js). Permissive: unknown fields pass
 * through and every optional field also accepts null.
 */
import { z } from 'zod';
import { str, num } from './primitives.js';

const bool = z.boolean().nullish();

export const livePositionSchema = z
  .object({
    registrationNumber: z.string(),
    vin: str,
    state: str,
    eventDateTime: str,
    latitude: num,
    longitude: num,
    speed: num,
    courseDegrees: num,
    ignition: bool,
    odometer: num,
    primaryFuelLevel: num,
    fuelLevelUnit: str,
    defLevel: num,
    defLevelUnit: str,
    status: str,
    isStale: bool,
    pulledAt: str,
  })
  .passthrough();

export const livePositionListSchema = z.array(livePositionSchema);
