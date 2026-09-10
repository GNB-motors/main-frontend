/**
 * Zod validation for Branch (operational location) API responses.
 * Permissive by design: known fields are typed, unknown fields pass through,
 * and every optional field also accepts null (see schemas/primitives.js).
 */
import { z } from 'zod';
import { str } from './primitives.js';

export const branchSchema = z
  .object({
    _id: str,
    id: str,
    name: str,
    code: str,
    city: str,
    address: str,
    status: str,
  })
  .passthrough();

export const branchListSchema = z.array(branchSchema);

export const branchResponseSchema = z
  .object({
    status: str,
    data: z.union([branchListSchema, branchSchema]),
  })
  .passthrough();
