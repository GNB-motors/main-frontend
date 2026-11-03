/**
 * GET /api/fleet-view/trips/history  (contract §7.1)
 * GET /api/fleet-view/places/questions  (contract §7.2)
 */
import { z } from 'zod';
import { LinkSchema, PlaceSchema, WhySchema, heldOr } from './redesignPrimitives.js';

/** One visit to a place, or one register trip. */
export const HistoryItemSchema = z
  .object({
    kind: z.enum(['VISIT', 'REGISTER_TRIP']),
    registrationNumber: z.string(),
    place: PlaceSchema.nullable(),
    arrivedAt: z.string().nullable(),
    departedAt: z.string().nullable(),
    dwellMin: z.number().nullable(),
    purpose: z.enum(['LOADING', 'UNLOADING', 'FUEL', 'REST', 'OVERNIGHT', 'OTHER']).nullable(),
    register: z
      .object({
        date: z.string(),
        from: z.string().nullable(),
        to: z.array(z.string()).default([]),
        driver: z.string().nullable(),
        litres: z.number().nullable(),
      })
      .passthrough()
      .nullable(),
    trip: LinkSchema.nullable(),
    replay: LinkSchema.nullable(),
  })
  .passthrough();

export const TripsHistoryPayloadSchema = z
  .object({
    items: z.array(HistoryItemSchema).default([]),
    total: z.number(),
    countsByPlace: z
      .array(
        z
          .object({
            place: PlaceSchema,
            visits: z.number(),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

export const TripsHistoryResponseSchema = heldOr(TripsHistoryPayloadSchema);

/** A place we cannot name yet, and the trips that wait on the answer. */
export const PlaceQuestionSchema = z
  .object({
    id: z.string(),
    point: z
      .object({
        lat: z.number(),
        lng: z.number(),
        radiusM: z.number(),
      })
      .passthrough(),
    tripsAffected: z.number(),
    trucks: z.number(),
    suggestion: z
      .object({
        name: z.string(),
        category: z.string(),
        source: z.enum(['OSM', 'GOOGLE', 'ADDRESS', 'REGISTER']),
        confidence: z.number(),
      })
      .passthrough()
      .nullable(),
    alternatives: z
      .array(
        z
          .object({
            name: z.string(),
            category: z.string(),
            source: z.string(),
          })
          .passthrough(),
      )
      .default([]),
    sampleTrips: z.array(LinkSchema).default([]),
    why: WhySchema,
  })
  .passthrough();

export const PlaceQuestionsPayloadSchema = z
  .object({
    items: z.array(PlaceQuestionSchema).default([]),
    total: z.number(),
  })
  .passthrough();

export const PlaceQuestionsResponseSchema = heldOr(PlaceQuestionsPayloadSchema);

/** The answer we send back, and what it fixed. */
export const PlaceQuestionAnswerSchema = z
  .object({
    tripsUpdated: z.number(),
    placeId: z.string().nullable(),
  })
  .passthrough();
