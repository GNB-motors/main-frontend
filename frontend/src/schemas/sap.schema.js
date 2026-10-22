import { z } from 'zod';
import { str, num } from './primitives';
export const sapComparisonSchema = z
  .object({ actualKm: num, sapKm: num, deltaKm: num, deltaPct: num, verdict: str })
  .passthrough();
export const tripSapSchema = z
  .object({
    status: str,
    sapKm: num,
    values: z.array(num).nullish(),
    multipleSap: z.boolean().nullish(),
    source: str,
    fromLabel: str,
    toLabel: str,
    tolerancePct: num,
    computedAt: str,
    oneWay: sapComparisonSchema.nullish(),
    roundTrip: sapComparisonSchema.nullish(),
  })
  .passthrough();

export const sapSettingsSchema = z
  .object({
    tolerancePct: num,
    multiValuePolicy: str,
    minKmForVerdict: num,
  })
  .passthrough();

export const sapRouteKmSchema = z
  .object({
    _id: str,
    fromSiteId: str,
    toSiteId: str,
    sapKm: num,
    note: str,
  })
  .passthrough();

export const sapAliasSchema = z
  .object({
    _id: str,
    kind: str,
    label: str,
    orgSiteId: str,
    status: str,
    score: num,
  })
  .passthrough();

export const sapTripDetailSchema = z
  .object({
    trip: z.object({ _id: str }).passthrough(),
    sap: tripSapSchema,
    routeKm: sapRouteKmSchema.nullish(),
    candidates: z
      .object({
        plantLabels: z.array(z.string()).nullish(),
        dropLabels: z.array(z.string()).nullish(),
        suggestions: z.array(sapAliasSchema).nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

export const sapLaneListSchema = z
  .object({
    rows: z.array(
      z
        .object({
          id: str,
          source: str,
          fromLabel: str,
          toLabel: str,
          verdict: str,
          sapValues: z.array(z.number()).nullish(),
          gps: z
            .object({ medianLadenKm: num, p90: num, n: num, trucks: num })
            .passthrough()
            .nullish(),
          register: z.object({ medianKm: num, spreadKm: num, n: num }).passthrough().nullish(),
        })
        .passthrough(),
    ),
    total: num,
    page: num,
    limit: num,
    totals: z.object({ lanes: num, over: num, noSap: num, extraKm: num }).passthrough().nullish(),
  })
  .passthrough();

const matchSite = z.object({ orgSiteId: str, name: str }).passthrough();
export const sapMatchReviewSchema = z
  .object({
    plants: z.array(
      z
        .object({
          label: str,
          laneCount: num,
          sites: z.array(matchSite).nullish(),
          suggestions: z.array(matchSite).nullish(),
        })
        .passthrough(),
    ),
    drops: z.array(
      z
        .object({
          orgSiteId: str,
          name: str,
          label: str,
          tripCount: num,
          matched: z.boolean().nullish(),
          suggestions: z.array(sapAliasSchema).nullish(),
        })
        .passthrough(),
    ),
    unnamedDrops: z
      .object({
        count: num,
        top: z.array(z.object({ lat: num, lng: num, tripCount: num }).passthrough()).nullish(),
      })
      .passthrough()
      .nullish(),
    unusedLabels: num,
  })
  .passthrough();

export const sapImportSchema = z
  .object({
    dryRun: z.boolean().nullish(),
    rows: num,
    lanes: num,
    written: num,
    skipped: z.array(z.unknown()).nullish(),
    rejectedNumericLabels: z.array(z.unknown()).nullish(),
    possibleDuplicates: z.array(z.unknown()).nullish(),
  })
  .passthrough();

export const sapDeleteSchema = z.object({ ok: z.boolean() }).passthrough();
