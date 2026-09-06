/**
 * Zod validation for ERP API responses (delivery orders, placements,
 * advances, bills, consignments, pods).
 * Permissive by design: known fields are typed, unknown fields pass through.
 */
import { z } from 'zod';

const money = z.union([z.number(), z.string()]).optional();

export const deliveryOrderSchema = z.object({
    _id: z.string().optional(),
    id: z.string().optional(),
    doNumber: z.string().optional(),
    partyId: z.string().optional(),
    partyName: z.string().optional(),
    material: z.string().optional(),
    quantity: money,
    rate: money,
    status: z.string().optional(),
    date: z.string().optional(),
}).passthrough();

export const placementSchema = z.object({
    _id: z.string().optional(),
    id: z.string().optional(),
    doId: z.string().optional(),
    vehicleId: z.string().optional(),
    driverId: z.string().optional(),
    status: z.string().optional(),
    date: z.string().optional(),
}).passthrough();

export const advanceSchema = z.object({
    _id: z.string().optional(),
    id: z.string().optional(),
    tripId: z.string().optional(),
    amount: money,
    status: z.string().optional(),
    date: z.string().optional(),
}).passthrough();

export const billSchema = z.object({
    _id: z.string().optional(),
    id: z.string().optional(),
    billNumber: z.string().optional(),
    partyName: z.string().optional(),
    amount: money,
    status: z.string().optional(),
    date: z.string().optional(),
}).passthrough();

export const erpListSchema = z.array(z.record(z.string(), z.unknown()));

export const erpListResponseSchema = z.object({
    status: z.string().optional(),
    data: z.union([z.array(deliveryOrderSchema), z.array(placementSchema), z.array(advanceSchema), z.array(billSchema)]),
    meta: z.object({
        total: z.number().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
        totalPages: z.number().optional(),
    }).passthrough().optional(),
}).passthrough();
