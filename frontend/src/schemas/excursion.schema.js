/**
 * Zod for the Excursions (deviations) API (/api/excursions). Permissive:
 * known fields typed, nulls accepted, unknown fields pass through.
 */
import { z } from 'zod';
import { str, num, ref } from './primitives.js';

const point = z.object({ lat: num, lng: num, at: str }).passthrough().nullish();

const visit = z
  .object({
    visitId: str,
    siteId: str,
    regionId: str,
    name: str,
    placeKind: str, // HOME | WATCHED | WORKSHOP | UNEXPLAINED
    arrivedAt: str,
    departedAt: str,
    dwellMin: num,
  })
  .passthrough();

export const excursionSchema = z
  .object({
    _id: str,
    key: str,
    registrationNumber: str,
    vehicleId: ref,
    driverId: ref,
    attributable: z.boolean().nullish(),
    status: str, // DEVIATION | APPROVED | APPROVED_LATE | NOT_DEVIATION
    purpose: str,
    note: str,
    loadState: str, // EMPTY | LADEN
    km: z
      .object({
        total: num,
        direct: num,
        extra: num,
        approvedExtra: num,
        excess: num,
        rawExtra: num,
        sigma: num,
        withinNoise: z.boolean().nullish(),
      })
      .passthrough()
      .nullish(),
    fuelL: num,
    fuel: z.object({ totalL: num, approvedL: num, excessL: num }).passthrough().nullish(),
    dwellMin: num,
    openedAt: str,
    closedAt: str,
    openAtDataEnd: z.boolean().nullish(),
    P: point,
    Q: point,
    visits: z.array(visit).nullish(),
    statusHistory: z
      .array(z.object({ status: str, at: str, by: ref, note: str }).passthrough())
      .nullish(),
    approvalId: ref,
    algoVersion: str,
  })
  .passthrough();

export const excursionListSchema = z
  .object({ items: z.array(excursionSchema), total: num, page: num, limit: num })
  .passthrough();

export const excursionDetailSchema = excursionSchema;
