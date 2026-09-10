/**
 * Zod validation for Profile API responses.
 * Permissive by design: known fields are typed, unknown fields pass through,
 * and every optional field also accepts null (see schemas/primitives.js).
 */
import { z } from 'zod';
import { str } from './primitives.js';

export const profileSchema = z
  .object({
    _id: str,
    id: str,
    companyName: str,
    ownerEmail: str,
    gstin: str,
    primaryThemeColor: str,
    businessRefId: str,
  })
  .passthrough();

export const profileResponseSchema = z
  .object({
    status: str,
    data: profileSchema,
  })
  .passthrough();
