/**
 * Zod validation for GET /api/mileage-rollup — the ONE fleet km/L rollup.
 * Permissive by design (see schemas/primitives.js): known fields typed, unknown
 * fields pass through, so a shape the API grows later never fails the page.
 */
import { z } from 'zod';
import { str, num } from './primitives.js';

const groupSchema = z
  .object({
    group: num,
    label: str,
    vehicles: num,
    vehiclesCounted: num,
    cycles: num,
    km: num,
    litres: num,
    kmPerL: num,
    ranked: z.boolean().nullish(),
    excludeNote: str,
    excludedTrucks: z
      .array(z.object({ registrationNumber: str, reason: str }).passthrough())
      .nullish(),
  })
  .passthrough();

const rankingSchema = z
  .object({
    rank: num,
    dutyGroup: num,
    registrationNumber: str,
    model: str,
    cycles: num,
    km: num,
    litres: num,
    kmPerL: num,
    ecuKmPerL: num,
    expectedKmPerL: num,
    expectedBasis: str,
    variancePct: num,
  })
  .passthrough();

const withheldSchema = z
  .object({
    registrationNumber: str,
    dutyGroup: num,
    cycles: num,
    km: num,
    litres: num,
    reason: str,
  })
  .passthrough();

const gateSchema = z
  .object({
    minCycles: num,
    minKm: num,
    minLitres: num,
    trucks: num,
    source: str,
  })
  .passthrough();

export const mileageRollupSchema = z
  .object({
    status: str,
    data: z
      .object({
        unit: str,
        window: z.object({ from: str, to: str, days: num }).passthrough().nullish(),
        kmPerLitre: z
          .object({
            basis: str,
            window: z.object({ from: str, to: str }).passthrough().nullish(),
            fleet: z
              .object({
                vehicles: num,
                vehiclesPublished: num,
                cycles: num,
                km: num,
                litres: num,
                kmPerL: num,
              })
              .passthrough(),
            ecu: z
              .object({
                source: str,
                km: num,
                litres: num,
                kmPerL: num,
                from: str,
                to: str,
              })
              .passthrough(),
            gap: z.object({ kmPerL: num, pctOfEcu: num, over: str }).passthrough(),
            ecuUncovered: z.object({ km: num, litres: num, note: str }).passthrough(),
            duty: z.object({ basis: str, cutKmPerCycle: num, trucksDescribed: num }).passthrough(),
            groups: z.array(groupSchema).nullish(),
            byRegistration: z
              .array(
                z
                  .object({
                    registrationNumber: str,
                    model: str,
                    dutyGroup: num,
                    cycles: num,
                    km: num,
                    litres: num,
                    kmPerL: num,
                    published: z.boolean().nullish(),
                    withheldReason: str,
                  })
                  .passthrough(),
              )
              .nullish(),
            ranking: z.array(rankingSchema).nullish(),
            withheld: z.array(withheldSchema).nullish(),
            learned: z
              .object({
                basis: str,
                groups: z.record(z.string(), gateSchema).nullish(),
                learnedAt: str,
                source: str,
              })
              .passthrough()
              .nullish(),
          })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();
