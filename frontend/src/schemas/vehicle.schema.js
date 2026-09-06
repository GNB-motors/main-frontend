/**
 * Zod validation for Vehicle API responses.
 * Permissive by design: known fields are typed, unknown fields pass through.
 */
import { z } from 'zod';

export const vehicleSchema = z.object({
    _id: z.string().optional(),
    id: z.string().optional(),
    registrationNumber: z.string().optional(),
    vehicleNumber: z.string().optional(),
    model: z.string().optional(),
    make: z.string().optional(),
    status: z.string().optional(),
    branchId: z.string().optional(),
}).passthrough();

export const vehicleListSchema = z.array(vehicleSchema);

export const vehicleListResponseSchema = z.object({
    status: z.string().optional(),
    data: z.union([vehicleListSchema, vehicleSchema]),
    meta: z.object({
        total: z.number().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
        totalPages: z.number().optional(),
    }).passthrough().optional(),
}).passthrough();

export const vehicleResponseSchema = z.object({
    status: z.string().optional(),
    data: vehicleSchema,
}).passthrough();
