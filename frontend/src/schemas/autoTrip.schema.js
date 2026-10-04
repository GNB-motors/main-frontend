/**
 * Auto Trips API schemas. Permissive by design (see primitives.js): known fields
 * typed, everything else passed through, nulls accepted — a schema drift must never
 * turn a healthy response into a failed request.
 */
import { z } from 'zod';
import { str, num } from './primitives.js';

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
    km: z.object({ approach: num, laden: num, fuelDetour: num }).passthrough().nullish(),
    durations: z
      .object({ approachMin: num, plantMin: num, transitMin: num, dropMin: num })
      .passthrough()
      .nullish(),
    fuelLadenL: num,
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

export const autoTripDetailSchema = autoTripSchema
  .extend({
    stops: z
      .array(
        z
          .object({
            _id: str,
            startAt: str,
            endAt: str,
            dwellMinutes: num,
            lat: num,
            lng: num,
            orgSiteId: str,
            purpose: z.object({ top: str }).passthrough().nullish(),
          })
          .passthrough(),
      )
      .nullish(),
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
          refuelLitres: num,
          mileageKmPerL: num,
          fuelCost: num,
          fuelStation: str,
          status: str,
          dropSource: str,
        })
        .passthrough(),
    ),
    total: num,
  })
  .passthrough();

export const autoTripCoverageSchema = z
  .object({
    trucksMissing: num,
    missing: z
      .array(z.object({ registrationNumber: str, vehicleId: str, reason: str }).passthrough())
      .nullish(),
  })
  .passthrough();

export default autoTripListSchema;
