import { verdictFor } from './fuelVerdicts';

/**
 * The fuel window, in the shape the contract says.
 *
 * The windows endpoint is one of the few the 3 Nov 2026 contract changed: it
 * now answers with `items` and a verdict per window. The live endpoint still
 * answers with `records` and the old fields, so this module maps one onto the
 * other. The old fields are kept (the schema passes them through) because the
 * page still shows the fills, the engine burn and the tank change.
 *
 * A window the backend has not judged gets the "we cannot tell yet" verdict.
 * That is not a guess: until the check has been made against the truck's
 * driving, nobody can say what happened, and saying so is the honest answer.
 */
export function toContractWindow(record) {
  if (!record) return null;
  return {
    ...record,
    id: String(record.id ?? record._id ?? ''),
    registrationNumber: record.registrationNumber ?? '',
    startAt: record.startAt ?? record.windowFrom ?? '',
    endAt: record.endAt ?? record.windowTo ?? null,
    startFuelL: record.startFuelL ?? null,
    endFuelL: record.endFuelL ?? null,
    fuelUsedL: record.fuelUsedL ?? record.fillsLitres ?? null,
    km: record.km ?? null,
    verdict: record.verdict ?? 'NOT_ENOUGH_DATA',
    verdictWhy: record.verdictWhy ?? {
      text: verdictFor(record).text ?? verdictFor(record).tip,
      basis: null,
    },
    parkedDropL: record.parkedDropL ?? null,
    drivingUseL: record.drivingUseL ?? null,
    expectedDrivingUseL: record.expectedDrivingUseL ?? null,
    siphonSuspected: record.siphonSuspected ?? null,
  };
}

/**
 * The endpoint's answer, in the shape the contract says. `records` and
 * `total` are kept so the page that already reads them keeps working.
 */
export function normaliseWindowsPayload(body) {
  const list = Array.isArray(body?.records)
    ? body.records
    : Array.isArray(body?.items)
      ? body.items
      : [];
  const items = list.map(toContractWindow);
  const total = body?.total ?? items.length;
  return {
    ...body,
    items,
    records: items,
    total,
    totals: body?.totals ?? { parkedDropL: null, windows: total },
  };
}
