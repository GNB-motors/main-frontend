/**
 * Zod validation for Profile API responses.
 * Permissive by design: known fields are typed, unknown fields pass through.
 */
import { z } from 'zod';

export const profileSchema = z.object({
    _id: z.string().optional(),
    id: z.string().optional(),
    companyName: z.string().optional(),
    ownerEmail: z.string().optional(),
    gstin: z.string().optional(),
    primaryThemeColor: z.string().optional(),
    businessRefId: z.string().optional(),
}).passthrough();

export const profileResponseSchema = z.object({
    status: z.string().optional(),
    data: profileSchema,
}).passthrough();
