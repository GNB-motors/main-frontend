/**
 * GET /api/fleet-view/vehicles/:reg/now  (contract §2)
 * GET /api/fleet-view/vehicles/:reg/where-next  (contract §3)
 */
import { z } from 'zod';
import {
  AccountStateSchema,
  IdentitySchema,
  InsightChipSchema,
  IssueSchema,
  LinkSchema,
  PlaceSchema,
  ReadingsSchema,
  VehicleViewSchema,
  WhySchema,
  heldOr,
} from './redesignPrimitives.js';

/** The place the truck is at, and how it compares with the usual stay. */
export const VehiclePlaceSchema = z
  .object({
    at: PlaceSchema.nullable(),
    inside: z.boolean().nullable(),
    sinceAt: z.string().nullable(),
    dwellMin: z.number().nullable(),
    usualDwellMin: z.number().nullable(),
    truckVisits: z.number().nullable(),
    fleetVisits: z.number().nullable(),
    why: WhySchema.nullable(),
  })
  .passthrough();

/** What the truck is doing right now. */
export const ActivitySchema = z
  .object({
    kind: z.enum([
      'DRIVING_LOADED',
      'DRIVING_EMPTY',
      'LOADING',
      'UNLOADING',
      'QUEUEING',
      'RESTING',
      'FUELLING',
      'AT_WORKSHOP',
      'PARKED',
      'OFFLINE',
      'UNKNOWN',
    ]),
    label: z.string(),
    sinceAt: z.string().nullable(),
    durationMin: z.number().nullable(),
    vsUsual: z
      .object({
        usualMin: z.number(),
        diffMin: z.number(),
      })
      .passthrough()
      .nullable(),
    why: WhySchema,
  })
  .passthrough();

/** The trip the truck is on. */
export const VehicleTripSchema = z
  .object({
    autoTripId: z.string(),
    leg: z.enum(['APPROACH', 'LADEN', 'RETURN', 'REPOSITION']),
    pickup: PlaceSchema.extend({ departedAt: z.string().nullable() }).passthrough(),
    drop: PlaceSchema.extend({ arrivedAt: z.string().nullable() }).passthrough().nullable(),
    material: z.string().nullable(),
    materialSource: z
      .enum(['PLANT_TYPE', 'EWAY_BILL', 'WEIGH_SLIP', 'ERP', 'REGISTER'])
      .nullable(),
    tonnage: z.number().nullable(),
    tonnageSource: z.enum(['WEIGH_SLIP', 'EWAY_BILL', 'ERP']).nullable(),
    kmSoFar: z.number().nullable(),
    link: LinkSchema,
  })
  .passthrough();

/** The driver on the truck, and how sure we are. */
export const VehicleDriverSchema = z
  .object({
    driverId: z.string().nullable(),
    name: z.string(),
    phone: z.string().nullable(),
    source: z.enum(['MANUAL', 'PAIRING', 'IMPORT', 'INFERRED']),
    since: z.string().nullable(),
  })
  .passthrough();

/** A useful place close to the truck. */
export const NearbyHelpSchema = PlaceSchema.extend({
  layer: z.enum(['hospitals', 'police', 'workshops', 'dealers', 'tyres', 'pumps', 'dhabas']),
  phone: z.string().nullable(),
  distanceKm: z.number(),
  brand: z.string().nullable(),
}).passthrough();

/** The service history we show in the collapsed Vehicle details card. */
export const VehicleServiceSchema = z
  .object({
    lastAt: z.string().nullable(),
    lastKm: z.number().nullable(),
    nextKm: z.number().nullable(),
    nextDueAt: z.string().nullable(),
    dueInKm: z.number().nullable(),
  })
  .passthrough();

/** The full identity, including VIN and service. */
export const VehicleFullIdentitySchema = IdentitySchema.extend({
  vin: z.string().nullable(),
  year: z.number().nullable(),
  service: VehicleServiceSchema.nullable(),
}).passthrough();

/** The whole "now" payload. */
export const VehicleNowPayloadSchema = z
  .object({
    registrationNumber: z.string(),
    identity: VehicleFullIdentitySchema,
    view: VehicleViewSchema,
    readings: ReadingsSchema,
    headingDeg: z.number().nullable(),
    place: VehiclePlaceSchema,
    activity: ActivitySchema.nullable(),
    trip: VehicleTripSchema.nullable(),
    driver: VehicleDriverSchema.nullable(),
    chips: z.array(InsightChipSchema).default([]),
    nearbyHelp: z.array(NearbyHelpSchema).default([]),
    issues: z.array(IssueSchema).default([]),
  })
  .passthrough();

export const VehicleNowResponseSchema = heldOr(VehicleNowPayloadSchema);

/** The ETA for one destination. */
export const WhereNextEtaSchema = z
  .object({
    at: z.string(),
    earliestAt: z.string(),
    latestAt: z.string(),
    driveMin: z.number(),
    breakMin: z.number(),
    congestion: z.enum(['LIGHT', 'USUAL', 'HEAVY']).nullable(),
    congestionWhy: z.string().nullable(),
  })
  .passthrough();

/** The road the fleet usually takes between two places. */
export const WhereNextRouteSchema = z
  .object({
    polyline: z.array(z.tuple([z.number(), z.number()])),
    km: z.number(),
    viaNames: z.array(z.string()).default([]),
    usedTimes: z.number(),
  })
  .passthrough();

/** One destination the truck is likely to head to. */
export const WhereNextDestinationSchema = z
  .object({
    place: PlaceSchema,
    probability: z.number(),
    reason: z.string(),
    eta: WhereNextEtaSchema.nullable(),
    route: WhereNextRouteSchema.nullable(),
    breakHabit: z
      .object({
        probability: z.number(),
        usualPlace: PlaceSchema.nullable(),
        usualMin: z.number().nullable(),
        text: z.string(),
      })
      .passthrough()
      .nullable(),
    overspeedRisk: z
      .object({
        probability: z.number(),
        place: PlaceSchema.nullable(),
        text: z.string(),
      })
      .passthrough()
      .nullable(),
  })
  .passthrough();

export const WhereNextPayloadSchema = z
  .object({
    computedAt: z.string(),
    basis: WhySchema,
    destinations: z.array(WhereNextDestinationSchema).default([]),
    noPredictionWhy: WhySchema.nullable(),
  })
  .passthrough();

export const WhereNextResponseSchema = heldOr(WhereNextPayloadSchema);
