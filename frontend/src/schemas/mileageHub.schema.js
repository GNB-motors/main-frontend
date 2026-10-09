/**
 * Zod validation for the Diesel & Mileage hub (/mileage) reads. Each schema
 * covers the response body the hub uses. Permissive by design (see
 * schemas/primitives.js): known fields typed, unknown fields pass through.
 */
import { z } from 'zod';
import { str, num, money, ref, listMeta } from './primitives.js';

const list = (row, meta = listMeta) =>
  z.object({ data: z.array(row).nullish(), meta }).passthrough();

/** GET /api/fuel-logs/unified */
export const unifiedFeedSchema = list(
  z
    .object({
      id: str,
      verificationStatus: str,
      vehicleNumber: str,
      vehicleModel: str,
      at: str,
      litres: num,
      slip: z
        .object({ id: str, litres: money, totalAmount: money, rate: money, location: str })
        .passthrough()
        .nullish(),
      sensor: z
        .object({ litres: num, rawLitres: num, bandL: num, billVarianceL: num, lat: num, lng: num })
        .passthrough()
        .nullish(),
    })
    .passthrough(),
  z
    .object({
      total: num,
      totalPages: num,
      verified: num,
      flagged: num,
      unverified: num,
      slipOnly: num,
      sensorGlitch: num,
      totalSpendInr: num,
    })
    .passthrough()
    .nullish(),
);

/** GET /api/mileage/model-comparison */
export const modelComparisonSchema = list(
  z
    .object({
      model: str,
      avgMileage: num,
      totalDistanceKm: num,
      totalFuelL: num,
      vehicleCount: num,
      vehicles: z
        .array(
          z
            .object({ vehicleId: str, vehicleNumber: str, avgMileage: num, recordCount: num })
            .passthrough(),
        )
        .nullish(),
    })
    .passthrough(),
  z.object({ excludedCycleCount: num }).passthrough().nullish(),
);

/** GET /api/mileage/intervals */
export const intervalsSchema = list(
  z
    .object({
      _id: str,
      vehicleId: ref,
      startDate: str,
      endDate: str,
      distanceKm: num,
      fuelConsumedLiters: num,
      mileageKmPerL: num,
      fuelCost: num,
    })
    .passthrough(),
);

/** GET /api/reports/fuel-cycles (rows under `data`) */
export const fuelCyclesSchema = z
  .object({
    data: z
      .object({ rows: z.array(z.object({ registrationNumber: str }).passthrough()).nullish() })
      .passthrough()
      .nullish(),
  })
  .passthrough();

/** GET /api/fuel-comparison/records (rows under `data.records`) */
export const billVsTankSchema = z
  .object({
    data: z
      .object({
        records: z
          .array(
            z
              .object({
                _id: str,
                vehicleNumber: str,
                billLitres: num,
                telemetryLitres: num,
                varianceL: num,
                status: str,
              })
              .passthrough(),
          )
          .nullish(),
      })
      .passthrough()
      .nullish(),
    meta: listMeta,
  })
  .passthrough();

/** GET /api/fuel-model/expected */
export const expectedFuelSchema = z
  .object({
    windows: z
      .array(
        z
          .object({ windowFrom: str, distanceKm: num, actualL: num, expectedL: num, source: str })
          .passthrough(),
      )
      .nullish(),
    summary: z.object({}).passthrough().nullish(),
  })
  .passthrough();
