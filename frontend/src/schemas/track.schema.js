/**
 * GET /api/fleet-view/vehicles/:reg/track  (contract §5)
 */
import { z } from 'zod';
import { PlaceSchema, heldOr } from './redesignPrimitives.js';

/** One GPS point on the path. */
export const TrackPointSchema = z
  .object({
    t: z.string(),
    lat: z.number(),
    lng: z.number(),
    speedKmh: z.number().nullable(),
    ign: z.boolean().nullable(),
  })
  .passthrough();

/** A stretch of the path, coloured by what the truck was doing. */
export const TrackSegmentSchema = z
  .object({
    fromT: z.string(),
    toT: z.string(),
    kind: z.enum(['LADEN', 'EMPTY', 'REPOSITION', 'UNKNOWN', 'GAP']),
    km: z.number().nullable(),
  })
  .passthrough();

/** A stop, with the reason worked out from the landmarks around it. */
export const TrackStopSchema = z
  .object({
    startAt: z.string(),
    endAt: z.string(),
    durationMin: z.number(),
    place: PlaceSchema.nullable(),
    reason: z.enum([
      'LOADING',
      'UNLOADING',
      'FUEL',
      'REST',
      'OVERNIGHT',
      'QUEUE',
      'WORKSHOP',
      'UNEXPLAINED',
    ]),
    reasonWhy: z.string(),
  })
  .passthrough();

/** Something that happened on the road. */
export const TrackEventSchema = z
  .object({
    at: z.string(),
    endAt: z.string().nullable(),
    kind: z.enum(['OVERSPEED', 'DETOUR', 'HARSH', 'FUEL_FILL', 'FUEL_DROP', 'GPS_GAP']),
    text: z.string(),
    lat: z.number(),
    lng: z.number(),
  })
  .passthrough();

/** A named place near the path. */
export const TrackLandmarkSchema = PlaceSchema.extend({
  distanceFromPathM: z.number(),
}).passthrough();

export const TrackPayloadSchema = z
  .object({
    from: z.string(),
    to: z.string(),
    points: z.array(TrackPointSchema).default([]),
    downsampled: z.boolean(),
    rawCount: z.number(),
    segments: z.array(TrackSegmentSchema).default([]),
    stops: z.array(TrackStopSchema).default([]),
    events: z.array(TrackEventSchema).default([]),
    landmarks: z.array(TrackLandmarkSchema).default([]),
    summary: z
      .object({
        km: z.number(),
        driveMin: z.number(),
        stopMin: z.number(),
        avgKmh: z.number().nullable(),
        maxKmh: z.number().nullable(),
      })
      .passthrough(),
  })
  .passthrough();

export const TrackResponseSchema = heldOr(TrackPayloadSchema);
