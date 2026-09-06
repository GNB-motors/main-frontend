/**
 * Zod validation for Driver API responses.
 * Permissive by design: known fields are typed, unknown fields pass through.
 */
import { z } from 'zod';

export const driverSchema = z.object({
    _id: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    mobileNumber: z.string().optional(),
    phone: z.string().optional(),
    licenseNumber: z.string().optional(),
    status: z.string().optional(),
    branchId: z.string().optional(),
}).passthrough();

export const driverListSchema = z.array(driverSchema);

export const driverListResponseSchema = z.object({
    status: z.string().optional(),
    data: z.union([driverListSchema, driverSchema]),
    meta: z.object({
        total: z.number().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
        totalPages: z.number().optional(),
    }).passthrough().optional(),
}).passthrough();

export const driverResponseSchema = z.object({
    status: z.string().optional(),
    data: driverSchema,
}).passthrough();
