/**
 * Zod validation for ERP pickup/drop points (/api/places/erp-sites).
 * Permissive by design (see schemas/primitives.js).
 */
import { z } from 'zod';
import { str, num } from './primitives.js';

export const erpSiteSchema = z
  .object({
    _id: z.string(),
    name: str,
    lat: num,
    lng: num,
    radiusM: num,
    siteType: str,
    erpRoles: z.array(z.string()).nullish(),
    address: str,
  })
  .passthrough();

/** POST answers with the existing place instead of a duplicate when one covers the point. */
export const erpSiteDeclareSchema = z
  .object({ site: erpSiteSchema, existing: z.boolean() })
  .passthrough();
