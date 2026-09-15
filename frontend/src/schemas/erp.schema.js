/**
 * Zod validation for ERP API responses (delivery orders, placements,
 * advances, bills, consignments, pods).
 * Permissive by design: known fields are typed, unknown fields pass through,
 * and every optional field also accepts null (see schemas/primitives.js).
 */
import { z } from 'zod';
import { str, money, ref, listMeta } from './primitives.js';

export const deliveryOrderSchema = z
  .object({
    _id: str,
    id: str,
    doNumber: str,
    partyId: ref,
    partyName: str,
    material: str,
    quantity: money,
    rate: money,
    status: str,
    date: str,
  })
  .passthrough();

export const placementSchema = z
  .object({
    _id: str,
    id: str,
    doId: ref,
    vehicleId: ref,
    driverId: ref,
    status: str,
    date: str,
  })
  .passthrough();

export const advanceSchema = z
  .object({
    _id: str,
    id: str,
    tripId: ref,
    amount: money,
    status: str,
    date: str,
  })
  .passthrough();

export const billSchema = z
  .object({
    _id: str,
    id: str,
    billNumber: str,
    partyName: str,
    amount: money,
    status: str,
    date: str,
  })
  .passthrough();

export const erpListSchema = z.array(z.record(z.string(), z.unknown()));

export const erpListResponseSchema = z
  .object({
    status: str,
    data: z.union([
      z.array(deliveryOrderSchema),
      z.array(placementSchema),
      z.array(advanceSchema),
      z.array(billSchema),
    ]),
    meta: listMeta,
  })
  .passthrough();
