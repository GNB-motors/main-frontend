import { z } from 'zod';
import { str, num } from './primitives';

/** One comparison: the SAP km against the trip's (or route's) km on the SAP's basis. */
export const sapComparisonSchema = z
  .object({ actualKm: num, sapKm: num, deltaKm: num, deltaPct: num, verdict: str })
  .passthrough();

/** A trip's SAP snapshot: its route and that route's SAP (also a delivery route's `sap`). */
export const tripSapSchema = z
  .object({
    status: str,
    routeKey: str,
    fromSiteId: str,
    toSiteId: str,
    routeSapId: str,
    sapKm: num,
    basis: str,
    basisSource: str,
    source: str,
    comparison: sapComparisonSchema.nullish(),
    verdict: str,
    tolerancePct: num,
    computedAt: str,
  })
  .passthrough();

export const sapSettingsSchema = z
  .object({
    tolerancePct: num,
    minKmForVerdict: num,
    directionPolicy: str,
    basisPolicy: str,
  })
  .passthrough();

/** A route's SAP entry, as a person (or a confirmed import) set it. */
export const sapRouteEntrySchema = z
  .object({
    _id: str,
    fromSiteId: str,
    toSiteId: str,
    sapKm: num,
    basis: str,
    basisSource: str,
    source: str,
    importRef: str,
    note: str,
    updatedAt: str,
    supersededAt: str,
  })
  .passthrough();

const policySchema = z.object({ direction: str, basis: str }).passthrough();

export const sapTripDetailSchema = z
  .object({
    trip: z.object({ _id: str }).passthrough(),
    sap: tripSapSchema,
    route: z
      .object({ key: str, fromSiteId: str, toSiteId: str, fromName: str, toName: str })
      .passthrough()
      .nullish(),
    routeSap: sapRouteEntrySchema.nullish(),
    history: z.array(sapRouteEntrySchema).nullish(),
    policy: policySchema.nullish(),
  })
  .passthrough();

const kmStat = z.object({ p50: num, p90: num }).passthrough();
export const sapRouteListSchema = z
  .object({
    rows: z.array(
      z
        .object({
          key: str,
          fromSiteId: str,
          toSiteId: str,
          fromName: str,
          toName: str,
          trips: num,
          trucks: num,
          ladenKm: kmStat.nullish(),
          roundTripKm: kmStat.nullish(),
          shortestOneWayKm: num,
          lastTripAt: str,
          sap: sapRouteEntrySchema.nullish(),
          comparison: sapComparisonSchema.nullish(),
          verdict: str,
        })
        .passthrough(),
    ),
    total: num,
    page: num,
    limit: num,
    totals: z
      .object({ routes: num, withSap: num, withoutSap: num, over: num, extraKm: num })
      .passthrough()
      .nullish(),
    settings: sapSettingsSchema.nullish(),
    policy: policySchema.nullish(),
  })
  .passthrough();

export const sapHintSchema = z
  .object({
    routeKey: str,
    shortestOneWayKm: num,
    suggestion: z
      .object({
        basis: str,
        basisSource: str,
        belowShortest: z.boolean().nullish(),
        shortfallKm: num,
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const candidateSchema = z.object({ siteId: str, name: str, via: str }).passthrough();
const endSchema = z
  .object({ siteId: str, candidates: z.array(candidateSchema).nullish() })
  .passthrough();
export const sapImportPreviewSchema = z
  .object({
    proposals: z.array(
      z
        .object({
          ref: str,
          fromLabel: str,
          toLabel: str,
          sapValues: z.array(num).nullish(),
          from: endSchema,
          to: endSchema,
          ready: z.boolean().nullish(),
          existing: sapRouteEntrySchema.nullish(),
        })
        .passthrough(),
    ),
    skipped: z.array(z.unknown()).nullish(),
    totals: z
      .object({ lanes: num, ready: num, needPlaces: num, alreadySet: num })
      .passthrough()
      .nullish(),
  })
  .passthrough();

export const sapImportApplySchema = z.object({ created: num, unchanged: num }).passthrough();

export const sapDeleteSchema = z.object({ ok: z.boolean() }).passthrough();
