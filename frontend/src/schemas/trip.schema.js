/**
 * Zod validation for Trip API responses.
 * Permissive by design: known fields are typed, unknown fields pass through.
 */
import { z } from 'zod';

export const tripSchema = z.object({
    _id: z.string().optional(),
    id: z.string().optional(),
    tripNumber: z.string().optional(),
    tripNo: z.string().optional(),
    status: z.string().optional(),
    vehicleId: z.string().optional(),
    driverId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    source: z.string().optional(),
    destination: z.string().optional(),
}).passthrough();

export const tripListSchema = z.array(tripSchema);

export const tripListResponseSchema = z.object({
    status: z.string().optional(),
    data: z.union([tripListSchema, tripSchema]),
    meta: z.object({
        total: z.number().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
        totalPages: z.number().optional(),
    }).passthrough().optional(),
}).passthrough();

export const tripResponseSchema = z.object({
    status: z.string().optional(),
    data: tripSchema,
}).passthrough();
