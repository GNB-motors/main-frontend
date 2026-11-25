/**
 * Zod validation for GET /api/hotspots/:id/incidents — the fuel alerts behind
 * one hotspot. Permissive by design (see schemas/primitives.js).
 */
import { z } from 'zod';
import { num, str } from './primitives.js';

const incidentSchema = z
  .object({
    id: z.string(),
    registrationNumber: str,
    kind: z.enum(['THEFT', 'UNAUTHORISED_REFUEL']),
    at: str,
    fuelBeforeL: num,
    fuelAfterL: num,
    fuelChangeL: num,
    pumpName: str,
    place: str,
    lat: num,
    lng: num,
    distanceM: num,
  })
  .passthrough();

export const hotspotIncidentsSchema = z
  .object({
    hotspotId: z.string(),
    shared: z.boolean(),
    windowDays: num,
    incidentCount: num,
    otherFleets: num,
    truncated: z.boolean().nullish(),
    items: z.array(incidentSchema),
  })
  .passthrough();
