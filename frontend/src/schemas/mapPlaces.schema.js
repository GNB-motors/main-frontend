/**
 * GET /api/fleet-view/map/places  (contract §6.1)
 * GET /api/fleet-view/campuses  (contract §6.2)
 * GET /api/fleet-view/nearby-help  (contract §6.3)
 */
import { z } from 'zod';
import { PlaceSchema, heldOr } from './redesignPrimitives.js';

/** A place on the map, with the extras the place panel needs. */
export const MapPlaceSchema = PlaceSchema.extend({
  layer: z.string(),
  phone: z.string().nullable(),
  openingHours: z.string().nullable(),
  brand: z.string().nullable(),
  visits: z.number().nullable(),
  usualDwellMin: z.number().nullable(),
}).passthrough();

export const MapPlacesPayloadSchema = z
  .object({
    items: z.array(MapPlaceSchema).default([]),
    truncated: z.boolean(),
  })
  .passthrough();

export const MapPlacesResponseSchema = heldOr(MapPlacesPayloadSchema);

/** A plant campus: one name, one circle, many member places. */
export const CampusSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    center: z.tuple([z.number(), z.number()]),
    radiusM: z.number(),
    memberSites: z.array(PlaceSchema).default([]),
    trucksInsideNow: z.number(),
  })
  .passthrough();

export const CampusesPayloadSchema = z
  .object({
    items: z.array(CampusSchema).default([]),
  })
  .passthrough();

export const CampusesResponseSchema = heldOr(CampusesPayloadSchema);

/** A place that can help a driver in trouble. */
export const NearbyHelpItemSchema = PlaceSchema.extend({
  layer: z.enum(['hospitals', 'police', 'workshops', 'dealers', 'tyres', 'pumps', 'dhabas']),
  phone: z.string().nullable(),
  distanceKm: z.number(),
  brand: z.string().nullable(),
}).passthrough();

export const NearbyHelpPayloadSchema = z
  .object({
    items: z.array(NearbyHelpItemSchema).default([]),
  })
  .passthrough();

export const NearbyHelpResponseSchema = heldOr(NearbyHelpPayloadSchema);
