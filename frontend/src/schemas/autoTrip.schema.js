/**
 * Auto Trips API schemas. Permissive by design (see primitives.js): known fields
 * typed, everything else passed through, nulls accepted — a schema drift must never
 * turn a healthy response into a failed request.
 */
import { z } from 'zod';
import { str, num } from './primitives.js';
import { tripSapSchema } from './sap.schema';

const point = z
  .object({
    orgSiteId: str,
    name: str,
    lat: num,
    lng: num,
    arrivedAt: str,
    departedAt: str,
    dwellMin: num,
  })
  .passthrough();

const drop = point
  .extend({
    source: str, // LABELLED_PLACE | HUMAN | INFERRED_TURNAROUND | UNKNOWN
    confidence: num,
  })
  .passthrough();

export const autoTripSchema = z
  .object({
    _id: str,
    registrationNumber: str,
    status: str, // OPEN | COMPLETE | NEEDS_REVIEW | CONFIRMED | DISMISSED
    flags: z.array(str).nullish(),
    pickup: point.nullish(),
    drop: drop.nullish(),
    extraDrops: z.array(drop).nullish(),
    sap: tripSapSchema.nullish(),
    km: z
      .object({ approach: num, laden: num, return: num, fuelDetour: num })
      .passthrough()
      .nullish(),
    durations: z
      .object({ approachMin: num, plantMin: num, transitMin: num, dropMin: num })
      .passthrough()
      .nullish(),
    fuelLadenL: num,
    stopsSummary: z
      .object({ fuel: num, rest: num, overnight: num, unexplained: num })
      .passthrough()
      .nullish(),
    erpTripId: str,
    frozenAt: str,
    completedAt: str,
    createdAt: str,
  })
  .passthrough();

const tabCounts = z
  .object({
    COMPLETE: num,
    NEEDS_REVIEW: num,
    OPEN: num,
    CONFIRMED: num,
    DISMISSED: num,
  })
  .passthrough();

export const autoTripListSchema = z
  .object({
    items: z.array(autoTripSchema),
    total: num,
    page: num,
    limit: num,
    tabCounts: tabCounts.nullish(),
  })
  .passthrough();

const tripStop = z
  .object({
    _id: str,
    startAt: str,
    endAt: str,
    dwellMinutes: num,
    lat: num,
    lng: num,
    orgSiteId: str,
    purpose: z.object({ top: str }).passthrough().nullish(),
    humanReason: z.object({ purpose: str }).passthrough().nullish(),
    place: z.object({ name: str, siteType: str, status: str }).passthrough().nullish(),
  })
  .passthrough();

export const autoTripDetailSchema = autoTripSchema
  .extend({
    stops: z.array(tripStop).nullish(), // the plant visit
    routeStops: z.array(tripStop).nullish(), // every stop after leaving the plant
  })
  .passthrough();

const trackPoint = z
  .object({
    eventDateTime: str,
    latitude: num,
    longitude: num,
    speed: num,
    ignition: z.boolean().nullish(),
    break: z.boolean().nullish(),
  })
  .passthrough();

export const autoTripTrackSchema = z
  .object({
    tripId: str,
    registrationNumber: str,
    from: str,
    to: str,
    open: z.boolean().nullish(),
    source: str, // LIVE | INSIGHTS
    totalCount: num,
    sampled: z.boolean().nullish(),
    points: z.array(trackPoint).nullish(),
  })
  .passthrough();

export const autoTripOilAverageSchema = z
  .object({
    rows: z.array(
      z
        .object({
          autoTripId: str,
          date: str,
          vehicleNumber: str,
          driverName: str,
          from: str,
          to: str,
          odometerStart: num,
          odometerEnd: num,
          distanceKm: num,
          // Contract renames refuelLitres→refuelL, fuelUsedLitres→fuelUsedL (V-69);
          // both kept so the page reads either shape during the migration.
          refuelL: num,
          refuelLitres: num,
          fuelUsedL: num,
          fuelUsedLitres: num,
          mileageKmPerL: num,
          fuelCost: num,
          fuelStation: str,
          status: str,
          dropSource: str,
          // Role / cost columns (v2) — null until the backend ships them.
          kmApproach: num,
          kmLaden: num,
          kmReturn: num,
          ladenFuelL: num,
          ladenFuelInr: num,
          ladenWearInr: num,
          ladenTotalInr: num,
          emptySharePct: num,
          totalCostInr: num,
        })
        .passthrough(),
    ),
    total: num,
    truncated: z.boolean().nullish(),
  })
  .passthrough();

export const autoTripCoverageSchema = z
  .object({
    trucksMissing: num,
    missing: z
      .array(z.object({ registrationNumber: str, vehicleId: str, reason: str }).passthrough())
      .nullish(),
    candidatePlaces: z
      .array(
        z
          .object({
            orgSiteId: str,
            name: str,
            siteType: str,
            status: str,
            trucks: num,
            stops: num,
          })
          .passthrough(),
      )
      .nullish(),
  })
  .passthrough();

export default autoTripListSchema;

const tollPass = z
  .object({
    at: str,
    leg: str, // LADEN (the replay window) | RETURN (last drop → the truck's next plant)
    evidence: str, // ROAD | INFERRED_ROAD | STOP | GPS
    inferred: z.boolean().nullish(),
    lat: num,
    lng: num,
    placeId: str,
    name: str,
    fareInr: num,
    fareBasis: str, // SINGLE | RETURN (24 h return) | ENTRY / SEGMENT (closed expressway)
    fareSource: str, // PUBLISHED (NHAI / state tariff) | TOLLGURU (quote)
    unknownReason: str,
  })
  .passthrough();

/** GET /auto-trips/:id/tolls — toll plazas the truck drove through. `total` is null for drivers. */
export const autoTripTollsSchema = z
  .object({
    tripId: str,
    status: str, // OK | FALLBACK (stops and GPS; road not matched) | STALE | NO_WINDOW | FAILED
    from: str, // the laden start
    to: str, // the return end, else the laden end
    ladenFrom: str,
    ladenTo: str,
    returnTo: str, // null while the trip is still on the road
    // The tariff group the truck pays in and what it was read from (null group = not priced).
    vehicleGroup: z
      .object({ group: str, source: str, basis: str }) // source: AXLE_CLASS | MODEL_GVW
      .passthrough()
      .nullish(),
    passes: z.array(tollPass).nullish(),
    ledger: z
      .object({ totalInr: num, charges: num, unknownCount: num, complete: z.boolean().nullish() })
      .passthrough()
      .nullish(),
    total: z
      .object({
        inr: num,
        priced: num,
        unknown: num,
        complete: z.boolean().nullish(),
        byLeg: z
          .record(z.string(), z.object({ inr: num, priced: num, unknown: num }).passthrough())
          .nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();
