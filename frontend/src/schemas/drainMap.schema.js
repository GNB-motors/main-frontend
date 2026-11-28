import { z } from 'zod';
import { str, num } from './primitives';

export const drainMapSchema = z
  .object({
    from: str,
    to: str,
    gridDeg: num,
    scope: z.object({ vehicle: str, driver: str, evidence: str }).passthrough().nullish(),
    buckets: z.array(
      z
        .object({
          cell: str,
          centerLat: num,
          centerLng: num,
          count: num,
          totalLitres: num,
          estimatedInr: num,
          vehicles: z.array(z.string()).nullish(),
          events: z
            .array(
              z
                .object({
                  id: str,
                  source: str,
                  registrationNumber: str,
                  startAt: str,
                  endAt: str,
                  litres: num,
                })
                .passthrough(),
            )
            .nullish(),
        })
        .passthrough(),
    ),
  })
  .passthrough();
