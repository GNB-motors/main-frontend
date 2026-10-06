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
    leaning: str,
    purposeAlpha: z.record(z.number()).nullish(),
    evidence: z.array(z.object({ purpose: str, group: str, stops: num }).passthrough()).nullish(),
    unexplainedStops: num,
    stats: z
      .object({
        visits: num,
        trucks: num,
        medianDwellMin: num,
        p90DwellMin: num,
        firstSeenAt: str,
        lastSeenAt: str,
      })
      .passthrough()
      .nullish(),
    computedAt: str,
  })
  .passthrough();

const addressSchema = z.object({ formatted: str, locality: str, state: str }).passthrough();

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
    address: addressSchema.nullish(),
  })
  .passthrough();

export const siteDetailSchema = z
  .object({ site: orgSiteSchema, labels: z.array(z.any()).nullish(), report: z.any() })
  .passthrough();

export const summarySchema = z
  .object({
    toReview: num,
    places: z.object({ confirmed: num, proposed: num, rejected: num }).passthrough().nullish(),
    riskPlaces: num,
    unproductive: z.object({ stops: num, hours: num, trucks: num }).passthrough().nullish(),
    darkZones: num,
    lastRunAt: str,
  })
  .passthrough();

export const globalPlaceListSchema = z.array(
  z
    .object({
      _id: str,
      placeType: str,
      name: str,
      centroidLat: num,
      centroidLng: num,
      radiusM: num,
      polygon: z.array(z.array(z.number())).nullish(),
    })
    .passthrough(),
);

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

export const regionListSchema = z
  .object({
    items: z.array(
      z
        .object({
          _id: str,
          kind: str,
          status: str,
          name: str,
          memberIds: z.array(str).nullish(),
          memberCount: num,
          centroidLat: num,
          centroidLng: num,
          diameterM: num,
          radiusM: num,
          roleSet: z.array(str).nullish(),
          coVisitScore: num,
        })
        .passthrough(),
    ),
    total: num,
    page: num,
    limit: num,
  })
  .passthrough();

export const homeListSchema = z
  .object({
    items: z.array(
      z
        .object({
          _id: str,
          driverId: ref,
          placeKey: str,
          orgSiteId: str,
          lat: num,
          lng: num,
          nights: num,
          totalNights: num,
          share: num,
          q10: num,
          distinctWeeks: num,
          windowDays: num,
          status: str,
        })
        .passthrough(),
    ),
    total: num,
    page: num,
    limit: num,
  })
  .passthrough();
