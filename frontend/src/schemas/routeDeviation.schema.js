/**
 * Zod for the route-deviation API (/api/route-deviation). Permissive: known
 * fields typed, nulls accepted, unknown fields pass through.
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';

const point = z.object({ lat: num, lng: num, at: str }).passthrough().nullish();

const tripLink = z
  .object({
    autoTripId: ref,
    erpTripId: ref,
    leg: str, // LADEN | APPROACH
    pickupName: str,
    dropName: str,
    extraDropCount: num,
    tripStatus: str,
    tripStartAt: str,
    tripEndAt: str,
    tripOpen: z.boolean().nullish(),
    costPerKmInr: num,
    linkedAt: str,
  })
  .passthrough()
  .nullish();

export const deviationEventSchema = z
  .object({
    _id: str,
    registrationNumber: str,
    corridorId: ref,
    corridorLabel: str,
    detectedAt: str,
    startedAt: str,
    endedAt: str,
    durationMin: num,
    maxOffKm: num,
    offCorridorPoints: num,
    extraKmEstimate: num,
    estimatedExtraCostInr: num,
    costBasis: str, // TRIP | CONFIG
    status: str, // OPEN | REVIEWED
    trip: tripLink,
    reviewedAt: str,
    reviewReason: str,
    reviewNote: str,
  })
  .passthrough();

export const deviationListSchema = z
  .object({
    records: z.array(deviationEventSchema),
    summary: z
      .object({
        total: num,
        open: num,
        openCostInr: num,
        extraKm: num,
        trips: num,
        byLeg: z.object({ LADEN: num, APPROACH: num, NONE: num }).passthrough().nullish(),
      })
      .passthrough()
      .nullish(),
    total: num,
    openCount: num,
    page: num,
    limit: num,
    totalPages: num,
  })
  .passthrough();

const place = z
  .object({ name: str, lat: num, lng: num, arrivedAt: str, departedAt: str })
  .passthrough()
  .nullish();

export const deviationDetailSchema = z
  .object({
    event: deviationEventSchema,
    detour: z
      .object({
        exitPoint: point,
        rejoinPoint: point,
        maxOffPoint: point,
        path: z.array(point).nullish(),
      })
      .passthrough(),
    corridor: z
      .object({
        label: str,
        bufferKm: num,
        sampleCount: num,
        band: z.array(z.object({ lat: num, lng: num, n: num }).passthrough()).nullish(),
        line: z.array(z.object({ lat: num, lng: num }).passthrough()).nullish(),
      })
      .passthrough()
      .nullish(),
    trip: z
      .object({
        _id: str,
        status: str,
        erpTripId: ref,
        pickup: place,
        drops: z.array(place).nullish(),
      })
      .passthrough()
      .nullish(),
    track: z
      .object({
        from: str,
        to: str,
        points: z
          .array(
            z
              .object({
                eventDateTime: str,
                latitude: num,
                longitude: num,
                break: z.boolean().nullish(),
              })
              .passthrough(),
          )
          .nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();
