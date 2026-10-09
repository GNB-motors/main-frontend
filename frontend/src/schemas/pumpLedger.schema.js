/**
 * Zod validation for GET /api/fuel-integrity/pump-ledger (the `data` payload).
 * Permissive by design (see schemas/primitives.js).
 */
import { z } from 'zod';
import { str, num } from './primitives.js';

const pumpSchema = z
  .object({
    pump: str,
    fills: num,
    flaggedFills: num,
    claimedLitres: num,
    actualLitres: num,
    shortfallLitres: num,
    shortfallPct: num,
    estimatedLossInr: num,
    lat: num,
    lng: num,
    lastFillAt: str,
  })
  .passthrough();

export const pumpLedgerSchema = z
  .object({
    window: z.object({ from: str, to: str }).passthrough().nullish(),
    fuelPriceInrPerL: num,
    pumps: z.array(pumpSchema).nullish(),
    disclaimer: str,
  })
  .passthrough();
