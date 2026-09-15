/**
 * Shared zod primitives for API-response schemas.
 *
 * Two rules the hand-written schemas kept getting wrong:
 *
 * 1. `z.string().optional()` accepts `undefined` but REJECTS `null`. Mongo
 *    returns explicit `null` for an unset field all the time, so an optional
 *    string was throwing on healthy responses — and a thrown ZodError reaches
 *    the page as a failed request, so a schema drift looked like an outage.
 *    `nullish()` accepts string | null | undefined, which is what the API
 *    actually sends.
 *
 * 2. Reference fields are not strings. The services `.populate()` vehicleId,
 *    driverId, partyId and branchId on most list endpoints, so the same field
 *    is a bare id on one route and `{ _id, name }` on another. `ref` accepts
 *    both, plus null.
 */
import { z } from 'zod';

/** string | null | undefined */
export const str = z.string().nullish();

/** number | null | undefined */
export const num = z.number().nullish();

/** Amounts and quantities arrive as either a number or a numeric string. */
export const money = z.union([z.number(), z.string()]).nullish();

/**
 * A Mongo reference: a bare ObjectId string, a populated document, or null.
 * `.passthrough()` on the populated branch keeps whatever fields the route
 * chose to project.
 */
export const ref = z
  .union([
    z.string(),
    z
      .object({
        _id: z.string().optional(),
        id: z.string().optional(),
        name: z.string().optional(),
      })
      .passthrough(),
    z.null(),
  ])
  .optional();

/** The `meta` envelope shared by every paginated list response. */
export const listMeta = z
  .object({
    total: num,
    page: num,
    limit: num,
    totalPages: num,
  })
  .passthrough()
  .optional();

export default { str, num, money, ref, listMeta };
