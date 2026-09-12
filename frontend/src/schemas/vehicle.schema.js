/**
 * Zod validation for Vehicle API responses.
 * Permissive by design: known fields are typed, unknown fields pass through,
 * and every optional field also accepts null (see schemas/primitives.js).
 */
import { z } from 'zod';
import { str, ref, listMeta } from './primitives.js';

export const vehicleSchema = z
  .object({
    _id: str,
    id: str,
    registrationNumber: str,
    vehicleNumber: str,
    model: str,
    make: str,
    status: str,
    branchId: ref,
  })
  .passthrough();

export const vehicleListSchema = z.array(vehicleSchema);

export const vehicleListResponseSchema = z
  .object({
    status: str,
    data: z.union([vehicleListSchema, vehicleSchema]),
    meta: listMeta,
  })
  .passthrough();

export const vehicleResponseSchema = z
  .object({
    status: str,
    data: vehicleSchema,
  })
  .passthrough();
