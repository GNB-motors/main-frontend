/**
 * Zod validation for the Place Intelligence API (/api/place-intelligence).
 * Permissive by design (see schemas/primitives.js): known fields typed, nulls
 * accepted, unknown fields pass through.
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';

const engineSchema = z
  .object({
    siteType: str,
    confidence: num,
    evidenceLevel: str,
    visits: num,
    distinctVehicles: num,
    reasons: z.array(z.string()).nullish(),
  })
  .passthrough();

const riskSchema = z
  .object({ theftIncidents: num, unauthRefuelIncidents: num, lastIncidentAt: str })
  .passthrough();

export const orgSiteSchema = z
  .object({
    _id: str,
    key: str,
    name: str,
    siteType: str,
    status: str,
    centroidLat: num,
    centroidLng: num,
    radiusM: num,
    visitCount: num,
    distinctVehicleCount: num,
    medianDwellMin: num,
    origins: z.array(z.string()).nullish(),
    engine: engineSchema.nullish(),
    risk: riskSchema.nullish(),
  })
  .passthrough();

export const siteListSchema = z
  .object({ records: z.array(orgSiteSchema), total: num, page: num, limit: num })
  .passthrough();

export const reviewQueueSchema = z
  .object({
    items: z.array(
      z
        .object({
          site: orgSiteSchema,
          priority: num,
          reason: str,
          isAudit: z.boolean().nullish(),
          suggestedType: str,
        })
        .passthrough(),
    ),
    total: num,
  })
  .passthrough();

const stopSchema = z
  .object({
    _id: str,
    registrationNumber: str,
    startAt: str,
    endAt: str,
    dwellMinutes: num,
    lat: num,
    lng: num,
    orgSiteId: ref,
  })
  .passthrough();

export const breakListSchema = z.object({ records: z.array(stopSchema), total: num }).passthrough();

const statSchema = z.object({ p50: num, p90: num, n: num }).passthrough();

const legSchema = z
  .object({
    _id: str,
    from: str,
    to: str,
    traversals: num,
    stats: z
      .object({
        km: statSchema.nullish(),
        minutes: statSchema.nullish(),
        fuelPerKm: statSchema.nullish(),
      })
      .passthrough()
      .nullish(),
    fuelCostP50: num,
    costBasis: str,
  })
  .passthrough();

export const legListSchema = z.object({ records: z.array(legSchema), total: num }).passthrough();

export const legDetailSchema = legSchema
  .extend({
    traversals: z.array(
      z
        .object({
          tourId: ref,
          registrationNumber: str,
          departedAt: str,
          minutes: num,
          km: num,
          why: z.array(z.string()).nullish(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

export const shadowReportListSchema = z.array(
  z
    .object({
      _id: str,
      day: str,
      gates: z.record(z.any()).nullish(),
      runErrors: z.array(z.string()).nullish(),
    })
    .passthrough(),
);
