/**
 * Zod validation for Trip API responses.
 * Permissive by design: known fields are typed, unknown fields pass through,
 * and every optional field also accepts null (see schemas/primitives.js).
 */
import { z } from 'zod';
import { str, ref, listMeta } from './primitives.js';

export const tripSchema = z
  .object({
    _id: str,
    id: str,
    tripNumber: str,
    tripNo: str,
    status: str,
    // Populated to a document on most list routes, a bare id on others.
    vehicleId: ref,
    driverId: ref,
    startDate: str,
    endDate: str,
    source: str,
    destination: str,
  })
  .passthrough();

export const tripListSchema = z.array(tripSchema);

export const tripListResponseSchema = z
  .object({
    status: str,
    data: z.union([tripListSchema, tripSchema]),
    meta: listMeta,
  })
  .passthrough();

export const tripResponseSchema = z
  .object({
    status: str,
    data: tripSchema,
  })
  .passthrough();
