/**
 * Zod validation for the Place Intelligence API (/api/place-intelligence).
 * Permissive by design (see schemas/primitives.js): known fields typed, nulls
 * accepted, unknown fields pass through.
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';
import { tripSapSchema } from './sap.schema.js';

const routeStatSchema = z.object({ p50: num, p90: num, n: num }).passthrough();
export const deliveryLegSchema = z
  .object({
    _id: str,
    fromSiteId: str,
    toSiteId: str,
    fromName: str,
    toName: str,
    n: num,
    trucks: num,
    review: str,
    shortHop: z.boolean().nullish(),
    km: routeStatSchema.nullish(),
    minutes: routeStatSchema.nullish(),
    fuelPerKm: routeStatSchema.nullish(),
    sap: tripSapSchema.nullish(),
    samples: z
      .array(
        z
          .object({
            autoTripId: str,
            registrationNumber: str,
            departedAt: str,
            arrivedAt: str,
            km: num,
            minutes: num,
            fuelL: num,
          })
          .passthrough(),
      )
      .nullish(),
  })
  .passthrough();
export const deliveryLegListSchema = z
  .object({
    rows: z.array(deliveryLegSchema),
    total: num,
    page: num,
    limit: num,
  })
  .passthrough();

const duplicateSiteSchema = z
  .object({
    _id: str,
    name: str,
    siteType: str,
    status: str,
    visits: num,
    lat: num,
    lng: num,
  })
  .passthrough();
export const duplicateListSchema = z
  .object({
    pairs: z.array(
      z
        .object({
          a: duplicateSiteSchema,
          b: duplicateSiteSchema,
          verdict: str,
          distanceM: num,
          roadKm: num,
          tripsAffected: num,
        })
        .passthrough(),
    ),
  })
  .passthrough();
export const mergeHistorySchema = z.array(
  z
    .object({
      _id: str,
      survivorId: str,
      memberIds: z.array(z.string()).nullish(),
      undoneAt: str,
    })
    .passthrough(),
);
export const placeMutationSchema = z.object({}).passthrough();

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
    // The drawn label the nightly step settled, and an open contradiction (placeLabels).
    display: z
      .object({ type: str, source: str, leaning: str, confidence: num, computedAt: str })
      .passthrough()
      .nullish(),
    labelReview: z
      .object({ kind: str, reason: str, withSiteId: str, at: str })
      .passthrough()
      .nullish(),
    // Task 11 — auto-confidence = fraction of the place's own stoppages that
    // fall inside `confidenceRadiusM` of the centroid. `lowConfidence` hides
    // the place from the suggestion picker unless it is opted in.
    confidence: num.nullish(),
    stoppageCount: num.nullish(),
    confidentStoppageCount: num.nullish(),
    lowConfidence: z.boolean().nullish(),
    confidenceComputedAt: str.nullish(),
    confidenceRadiusM: num.nullish(),
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

// Task 11 — ranked place picker. The server does the ranking; the picker only
// has to render the order it was given.
export const siteSuggestionSchema = z
  .object({
    id: str,
    name: str,
    siteType: str,
    status: str,
    origins: z.array(z.string()).nullish(),
    erpRoles: z.array(z.string()).nullish(),
    centroidLat: num,
    centroidLng: num,
    visitCount: num,
    confidence: num.nullish(),
    lowConfidence: z.boolean().nullish(),
    stoppageCount: num.nullish(),
    confidenceRadiusM: num.nullish(),
    prefixMatch: z.boolean().nullish(),
    rank: z.record(z.number()).nullish(),
  })
  .passthrough();

export const siteSuggestionListSchema = z
  .object({
    records: z.array(siteSuggestionSchema),
    total: num,
    query: z.record(z.any()).nullish(),
  })
  .passthrough();

/** Pin-drop duplicate check: places within the merge radius of a point. */
export const nearbySitesSchema = z
  .object({
    items: z.array(
      z
        .object({
          id: str,
          name: str,
          siteType: str,
          status: str,
          centroidLat: num,
          centroidLng: num,
          visitCount: num,
          confidence: num.nullish(),
          lowConfidence: z.boolean().nullish(),
          distanceM: num,
        })
        .passthrough(),
    ),
    radiusM: num.nullish(),
  })
  .passthrough();

/** One duplicate group as the merge preview returns it. */
export const mergePreviewGroupSchema = z
  .object({
    survivor: orgSiteSchema,
    memberIds: z.array(str),
    maxDistanceM: num,
    memberSummaries: z.array(z.any()).nullish(),
    richerRecord: z
      .object({
        survivorId: str,
        name: str,
        erpAddress: str.nullish(),
        centroidLat: num,
        centroidLng: num,
        radiusM: num,
        origins: z.array(z.string()).nullish(),
        erpRoles: z.array(z.string()).nullish(),
        confidence: num.nullish(),
        fromCount: num,
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

export const mergePreviewSchema = z
  .object({ groups: z.array(mergePreviewGroupSchema), total: num, radiusM: num })
  .passthrough();

/** What a merge will do, shown before the manager commits to it. */
export const mergeApplyPreviewSchema = z
  .object({
    richer: z.any().nullish(),
    survivor: z.any().nullish(),
    members: z.array(z.any()).nullish(),
    stoppageRepointCount: num,
  })
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

const routePathSchema = z
  .object({
    source: z.enum(['DRIVEN', 'ENGINE', 'NONE']),
    overviewSegments: z.array(z.string()).default([]),
    geomSegments: z.array(z.string()).optional(),
    km: num,
    agreement: num,
  })
  .passthrough();
export const routesMapSchema = z
  .object({
    legs: z.array(
      legSchema.extend({
        fromSiteId: z.string(),
        toSiteId: z.string(),
        pairKey: z.string(),
        sameRoadAsReverse: z.boolean(),
        inPlant: z.boolean(),
        path: routePathSchema,
        latestRunMinutes: num,
        detourKm: num,
        engine: z.object({ km: num, minutes: num }).passthrough().nullish(),
      }),
    ),
    sites: z.array(
      z
        .object({
          _id: z.string(),
          lat: num,
          lng: num,
          name: str,
          siteType: str,
          address: addressSchema.nullish(),
          runs: num,
        })
        .passthrough(),
    ),
    totals: z.object({
      legs: z.number(),
      inPlant: z.number(),
      runs: z.number(),
      places: z.number(),
    }),
    fleetMedianFuelPerKm: num,
    truncated: z.boolean().optional(),
    total: num,
    generatedAt: z.string(),
  })
  .passthrough();

const tollFares = z
  .object({ lcv: num, bus: num, multiaxle: num, axle_4_6: num, axle_7_plus: num })
  .passthrough();

/** GET /place-intelligence/toll-plazas — toll plazas, marked visited by this org's trucks. */
export const tollPlazaListSchema = z
  .object({
    scope: z.string().nullish(),
    truncated: z.boolean().nullish(),
    items: z
      .array(
        z
          .object({
            id: z.string(),
            name: z.string().nullish(),
            lat: z.number(),
            lng: z.number(),
            radiusM: num,
            evidenceLevel: z.string().nullish(),
            source: z.string().nullish(),
            nhNo: z.string().nullish(),
            state: z.string().nullish(),
            corroborated: z.boolean().nullish(),
            visited: z.boolean().nullish(),
            visits: z
              .object({
                stops: num,
                lastAt: z.string().nullish(),
                signals: z.array(z.string()).nullish(),
              })
              .passthrough()
              .nullish(),
            fares: tollFares.nullish(),
          })
          .passthrough(),
      )
      .nullish(),
  })
  .passthrough();
