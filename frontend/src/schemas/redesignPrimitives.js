/**
 * Shared zod primitives for the 3 Nov 2026 redesign endpoints.
 *
 * The contract (API_CONTRACTS.md §0.1) is the only source of truth for these
 * shapes. Two rules hold everywhere:
 *
 * 1. Unknown is null, never 0. A field the API says is `| null` must accept
 *    null, so a missing measurement never crashes the screen and never
 *    becomes a fake zero.
 * 2. Objects use `.passthrough()`. The backend adds fields without asking,
 *    and a new field must never break an old screen.
 */
import { z } from 'zod';

/** live = ≤ 5 min old; recent = older but inside the truck's own limit; stale = older. */
// 'not_learned': the backend has no learned silence cut-off for this truck or its org yet;
// the badge then shows the plain age, never a guessed 'recent' or 'stale'.
export const FreshnessSchema = z.enum(['live', 'recent', 'stale', 'never', 'not_learned']);

/** Where a value comes from. */
export const SourceSchema = z.enum(['FLEETEDGE', 'IALERT', 'SINK', 'LEARNED', 'MANUAL']).nullable();

/** A measured value with the time it was measured, not the time it was pulled. */
export const ReadingSchema = z
  .object({
    value: z.number().nullable(),
    at: z.string().nullable(),
    ageMin: z.number().nullable(),
    freshness: FreshnessSchema,
    source: SourceSchema,
  })
  .passthrough();

/** A plain explanation and, when we have it, the evidence behind it. */
export const WhySchema = z
  .object({
    text: z.string(),
    basis: z.string().nullable().optional(),
  })
  .passthrough();

/** Where a click goes. The frontend never builds these URLs itself. */
export const LinkSchema = z
  .object({
    label: z.string(),
    to: z.string(),
  })
  .passthrough();

/** good | info | watch | act */
export const SeveritySchema = z.enum(['good', 'info', 'watch', 'act']);

/** A place, in the owner's words. Never "Unknown site". */
export const PlaceSchema = z
  .object({
    id: z.string().nullable(),
    kind: z.enum(['SITE', 'CAMPUS', 'POI', 'CLUSTER', 'ADDRESS']),
    name: z.string(),
    category: z.string().nullable(),
    lat: z.number(),
    lng: z.number(),
    radiusM: z.number().nullable(),
  })
  .passthrough();

/** The held wrapper every contract endpoint may answer with. */
export const HeldSchema = z
  .object({
    held: z.literal(true),
    why: WhySchema,
  })
  .passthrough();

/**
 * A payload that may be held: the real thing, or a "not shown yet" note.
 * `held` is detected by the `held === true` check on the parsed object.
 */
export function heldOr(payload) {
  return z.union([payload, HeldSchema]);
}

/** A reading whose value may be null — used where the API nests a Reading. */
export const ReadingValueSchema = z
  .object({
    litres: ReadingSchema.nullable(),
    pct: ReadingSchema.nullable(),
    tankL: z.number().nullable(),
  })
  .passthrough();

/** The DEF tank, which may have been learned from top-ups rather than reported. */
export const DefTankSchema = z
  .object({
    pct: ReadingSchema.nullable(),
    litres: ReadingSchema.nullable(),
    tankL: z.number().nullable(),
    tankSource: z.enum(['VENDOR', 'LEARNED']).nullable(),
  })
  .passthrough();

/**
 * The ignition reading. Its value is a boolean, not a number, so it gets
 * its own shape rather than being forced through ReadingSchema.
 */
export const IgnitionReadingSchema = z
  .object({
    value: z.boolean().nullable(),
    at: z.string().nullable(),
    ageMin: z.number().nullable(),
    freshness: FreshnessSchema,
    source: SourceSchema,
  })
  .passthrough();

/** Every reading a truck reports, each with its own time. */
export const ReadingsSchema = z
  .object({
    fuel: ReadingValueSchema,
    def: DefTankSchema,
    odometerKm: ReadingSchema.nullable(),
    ignition: IgnitionReadingSchema.nullable(),
    gps: z
      .object({
        at: z.string().nullable(),
        ageMin: z.number().nullable(),
        freshness: FreshnessSchema,
        satellites: z.number().nullable(),
      })
      .passthrough()
      .nullable(),
  })
  .passthrough();

/** The live-view object the backend computes for each position row. */
export const VehicleViewSchema = z
  .object({
    status: z.string().nullable(),
    isOffline: z.boolean().nullable(),
    freshness: FreshnessSchema.nullable(),
    lastFixAt: z.string().nullable(),
    ageMin: z.number().nullable(),
    hasPosition: z.boolean().nullable(),
    hasGpsFix: z.boolean().nullable(),
    speedKmh: z.number().nullable(),
    ignition: z.string().nullable(),
    offlineAfterMin: z.number().nullable(),
    movingSpeedKmh: z.number().nullable(),
    rule: z.string().nullable(),
  })
  .passthrough();

/** Who the truck is: make, model and VIN. */
export const IdentitySchema = z
  .object({
    make: z.enum(['TATA', 'ASHOK_LEYLAND', 'OTHER']).nullable(),
    model: z.string().nullable(),
    modelLine: z.string().nullable(),
  })
  .passthrough();

/** The state of the vendor account behind a truck. */
export const AccountStateSchema = z
  .object({
    linked: z.boolean().nullable(),
    state: z.enum(['HEALTHY', 'EXPIRING', 'NEEDS_RELINK', 'RECOVERING']).nullable(),
  })
  .passthrough();

/** One thing we know about a truck or driver, good or bad. */
export const InsightChipSchema = z
  .object({
    key: z.enum([
      'CRUISE',
      'GEAR',
      'IDLE',
      'OVERSPEED',
      'MILEAGE',
      'HARSH',
      'NIGHT',
      'DETOUR',
      'FUEL',
      'DWELL',
    ]),
    tone: z.enum(['good', 'bad', 'neutral']),
    label: z.string(),
    why: WhySchema,
    link: LinkSchema,
  })
  .passthrough();

/** A problem that needs the owner. */
export const IssueSchema = z
  .object({
    id: z.string(),
    kind: z.enum([
      'GPS_FROZEN',
      'GPS_JUMPS',
      'GPS_SILENT_MIDROAD',
      'FUEL_SENSOR_NOISY',
      'FUEL_SENSOR_CALIBRATION',
      'DEF_SENSOR',
      'ACCOUNT_DISCONNECTED',
      'ACCOUNT_EXPIRING',
      'WARNING_LAMP',
      'BATTERY',
      'COOLANT',
      'SERVICE_DUE',
      'NO_DATA',
    ]),
    severity: SeveritySchema,
    registrationNumber: z.string().nullable(),
    accountName: z.string().nullable(),
    title: z.string(),
    detail: z.string(),
    advice: z.string(),
    firstSeenAt: z.string(),
    lastSeenAt: z.string(),
    occurrences: z.number(),
    evidence: z
      .array(
        z
          .object({
            at: z.string(),
            text: z.string(),
            link: LinkSchema.nullable(),
          })
          .passthrough(),
      )
      .default([]),
    action: z
      .object({
        kind: z.enum(['RECONNECT', 'CALL_DEALER', 'OPEN_REPLAY']),
        label: z.string(),
        to: z.string(),
      })
      .passthrough()
      .nullable(),
  })
  .passthrough();
