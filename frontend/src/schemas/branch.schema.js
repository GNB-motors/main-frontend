/**
 * Zod validation for Branch (operational location) API responses.
 * Permissive by design: known fields are typed, unknown fields pass through.
 */
import { z } from 'zod';

export const branchSchema = z.object({
    _id: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional(),
    code: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    status: z.string().optional(),
}).passthrough();

export const branchListSchema = z.array(branchSchema);

export const branchResponseSchema = z.object({
    status: z.string().optional(),
    data: z.union([branchListSchema, branchSchema]),
}).passthrough();
