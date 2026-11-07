/**
 * GET /api/fleet-view/digest  (contract §10)
 */
import { z } from 'zod';
import { LinkSchema, SeveritySchema, heldOr } from './redesignPrimitives.js';
import { ReportCardSchema } from './intelligence.schema.js';

/** One card in the day's story. */
export const DigestStoryCardSchema = z
  .object({
    key: z.enum([
      'loaded',
      'empty',
      'goodDrivers',
      'needsWord',
      'fuel',
      'questions',
      'issues',
      'reconnect',
    ]),
    tone: SeveritySchema,
    title: z.string(),
    big: z.string(),
    text: z.string(),
    items: z
      .array(
        z
          .object({
            label: z.string(),
            value: z.string().nullable(),
            tone: SeveritySchema,
            link: LinkSchema.nullable(),
          })
          .passthrough(),
      )
      .default([]),
    link: LinkSchema.nullable(),
  })
  .passthrough();

/** A vendor account that needs re-linking. */
export const DigestReconnectSchema = z
  .object({
    accountName: z.string(),
    state: z.string(),
    since: z.string().nullable(),
    trucksAffected: z.number(),
    action: z
      .object({
        label: z.string(),
        to: z.string(),
      })
      .passthrough(),
  })
  .passthrough();

export const DigestPayloadSchema = z
  .object({
    date: z.string(),
    headline: z.string(),
    story: z.array(DigestStoryCardSchema).default([]),
    reconnect: z.array(DigestReconnectSchema).default([]),
    goodDrivers: z.array(ReportCardSchema).default([]),
    needsAttention: z.array(ReportCardSchema).default([]),
  })
  .passthrough();

export const DigestResponseSchema = heldOr(DigestPayloadSchema);

export const DailyFuelTrendSchema = z
  .object({
    items: z.array(
      z
        .object({
          day: z.string(),
          litres: z.number().nullable(),
          measuredTrucks: z.number(),
          partial: z.boolean(),
          sources: z.array(z.string()),
          freshAsOf: z.string().nullable(),
        })
        .passthrough(),
    ),
    basis: z.string(),
  })
  .passthrough();
