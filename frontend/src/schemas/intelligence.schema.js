/**
 * GET /api/intelligence/summary  (contract §4.1)
 * GET /api/intelligence/issues  (contract §4.2)
 * GET /api/intelligence/report-cards  (contract §4.3)
 * GET /api/intelligence/instances  (contract §4.4)
 */
import { z } from 'zod';
import {
  InsightChipSchema,
  IssueSchema,
  LinkSchema,
  PlaceSchema,
  SeveritySchema,
  WhySchema,
  heldOr,
} from './redesignPrimitives.js';

/** The numbers at the top of the Intelligence page. */
export const IntelligenceSummaryPayloadSchema = z
  .object({
    period: z
      .object({
        from: z.string(),
        to: z.string(),
      })
      .passthrough(),
    fleet: z
      .object({
        trucks: z.number(),
        reporting: z.number(),
        disconnected: z.number(),
      })
      .passthrough(),
    runs: z
      .object({
        loadedKm: z.number().nullable(),
        emptyKm: z.number().nullable(),
        repositionKm: z.number().nullable(),
        loadedTrips: z.number().nullable().optional(),
        plantToPlant: z.number().nullable().optional(),
        emptySharePct: z.number().nullable(),
        why: WhySchema,
      })
      .passthrough(),
    tiles: z
      .array(
        z
          .object({
            key: z.string(),
            label: z.string(),
            value: z.string(),
            severity: SeveritySchema,
            why: WhySchema,
            link: LinkSchema,
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

export const IntelligenceSummaryResponseSchema = heldOr(IntelligenceSummaryPayloadSchema);

/** The open issues, with a count per tone for the tab badges. */
export const IntelligenceIssuesPayloadSchema = z
  .object({
    items: z.array(IssueSchema).default([]),
    total: z.number(),
    counts: z
      .object({
        good: z.number(),
        info: z.number(),
        watch: z.number(),
        act: z.number(),
      })
      .passthrough(),
  })
  .passthrough();

export const IntelligenceIssuesResponseSchema = heldOr(IntelligenceIssuesPayloadSchema);

/** A report card for one truck or one driver. */
export const ReportCardSchema = z
  .object({
    subject: z.enum(['vehicle', 'driver']),
    id: z.string(),
    name: z.string(),
    grade: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'FALLING', 'NOT_ENOUGH_DATA']),
    trend: z.enum(['UP', 'FLAT', 'DOWN']).nullable(),
    score: z.number().nullable(),
    headline: z.string(),
    strengths: z.array(InsightChipSchema).default([]),
    problems: z.array(InsightChipSchema.extend({ advice: z.string() }).passthrough()).default([]),
    kmInPeriod: z.number().nullable(),
    assignmentCoverage: z
      .object({
        assignmentCount: z.number().int().nonnegative(),
        trucks: z.array(z.string()),
        measuredDays: z.number().int().nonnegative(),
      })
      .nullable()
      .optional(),
    basis: WhySchema,
  })
  .passthrough();

export const ReportCardsPayloadSchema = z
  .object({
    items: z.array(ReportCardSchema).default([]),
  })
  .passthrough();

export const ReportCardsResponseSchema = heldOr(ReportCardsPayloadSchema);

/** One instance of an event: an idle, an overspeed, a detour. */
export const InstanceSchema = z
  .object({
    id: z.string(),
    registrationNumber: z.string(),
    driverName: z.string().nullable(),
    startAt: z.string(),
    endAt: z.string().nullable(),
    durationMin: z.number().nullable(),
    place: PlaceSchema.nullable(),
    value: z.number().nullable(),
    unit: z.string().nullable(),
    text: z.string(),
    replay: LinkSchema,
    trip: LinkSchema.nullable(),
  })
  .passthrough();

export const InstancesPayloadSchema = z
  .object({
    kind: z.string(),
    summary: z
      .object({
        count: z.number(),
        totalMin: z.number().nullable(),
        totalL: z.number().nullable(),
        totalInr: z.number().nullable(),
        why: WhySchema,
      })
      .passthrough(),
    items: z.array(InstanceSchema).default([]),
    total: z.number(),
  })
  .passthrough();

export const InstancesResponseSchema = heldOr(InstancesPayloadSchema);
