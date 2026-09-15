/**
 * Zod validation for Driver API responses.
 * Permissive by design: known fields are typed, unknown fields pass through,
 * and every optional field also accepts null (see schemas/primitives.js).
 */
import { z } from 'zod';
import { str, ref, listMeta } from './primitives.js';

export const driverSchema = z
  .object({
    _id: str,
    id: str,
    name: str,
    firstName: str,
    lastName: str,
    mobileNumber: str,
    phone: str,
    licenseNumber: str,
    status: str,
    // The list endpoint populates branchId to { _id, name } for a branch-scoped
    // employee, and it's null for an enterprise-level one; other endpoints send
    // the raw id. `ref` covers all three.
    branchId: ref,
  })
  .passthrough();

export const driverListSchema = z.array(driverSchema);

export const driverListResponseSchema = z
  .object({
    status: str,
    data: z.union([driverListSchema, driverSchema]),
    meta: listMeta,
  })
  .passthrough();

export const driverResponseSchema = z
  .object({
    status: str,
    data: driverSchema,
  })
  .passthrough();
