import { L1, signedL1, L0 } from './mileageNumbers';

/**
 * What the ⓘ next to a fill says: one plain sentence, then the figures it
 * came from. Rows only show the verdict; the arithmetic waits here.
 * @returns {{ title: string, text: string, lines: Array<[string, string]> }}
 */
export function fillExplanation(row) {
  const learned =
    row.gainBills > 0
      ? `from ${row.gainBills} bill${row.gainBills === 1 ? '' : 's'} of this truck`
      : 'fleet average, no bills for this truck yet';
  const tank = [
    ['Gauge rose', L1(row.rawLitres)],
    ['Corrected to', L1(row.sensorLitres)],
    ['Correction', learned],
    ['Normal error', row.bandL == null ? '—' : `± ${L1(row.bandL)}`],
  ];
  const vsBill = [
    ['Bill', L1(row.slipLitres)],
    ['Tank − bill', signedL1(row.billVarianceL)],
    ['Allowed', row.billToleranceL == null ? '—' : `± ${L1(row.billToleranceL)}`],
  ];
  switch (row.result) {
    case 'GAUGE_JUMP':
      return {
        title: 'Not a refill',
        text: 'The tank gauge jumped up and came back down, so no diesel went in. It is left out of every total.',
        lines: [['Gauge jumped', L1(row.rawLitres)]],
      };
    case 'NO_TANK_READING':
      return {
        title: 'Bill without a tank reading',
        text: 'There is a bill, but the tank sensor saw no diesel go in around that time. The sensor may have been offline, or the bill is for another truck.',
        lines: [['Bill', L1(row.slipLitres)]],
      };
    case 'BILL_MISSING':
      return {
        title: 'Diesel went in, no bill',
        text: 'The tank sensor saw diesel go in, but no bill has been uploaded for it yet.',
        lines: tank,
      };
    case 'BILL_MATCHES':
      return {
        title: 'Bill matches the tank',
        text: 'The litres on the bill and the rise in the tank agree, within this truck’s normal error.',
        lines: [...tank, ...vsBill],
      };
    case 'BILL_TOO_HIGH':
      return {
        title: 'Bill is more than the tank got',
        text: 'The bill says more diesel than reached the tank, by more than this truck normally varies.',
        lines: [...tank, ...vsBill],
      };
    case 'BILL_TOO_LOW':
      return {
        title: 'Tank got more than the bill',
        text: 'More diesel reached the tank than the bill says. Check the bill was read correctly.',
        lines: [...tank, ...vsBill],
      };
    default:
      return null;
  }
}

/** ⓘ for a Bill vs tank row (raw gauge rise, fixed 10 L allowance). */
export function reconciliationExplanation(r) {
  return {
    title: 'Bill vs tank',
    text: 'The bill compared with how far the tank gauge rose at that fill.',
    lines: [
      ['Bill', L1(r.billLitres)],
      ['Tank rose', L1(r.telemetryLitres)],
      ['Tank − bill', signedL1(r.varianceL)],
      ['Allowed', '± 10.0 L'],
    ],
  };
}

/**
 * The drawer's opening line for one fill, and what to do about it.
 * @returns {{ headline: string, next: string } | null}
 */
export function fillVerdict(detail) {
  const bill = L0(detail?.bill?.litres);
  const tank = L0(detail?.sensor?.litres);
  const driver = detail?.bill?.driverName?.split(' ')[0];
  switch (detail?.result) {
    case 'BILL_MATCHES':
      return { headline: 'The bill and the tank agree.', next: 'Nothing to do.' };
    case 'BILL_TOO_HIGH':
      return {
        headline: `The bill says ${bill}, the tank got about ${tank}.`,
        next: 'Check the bill photo and ask the driver. If it keeps happening at this pump, avoid the pump.',
      };
    case 'BILL_TOO_LOW':
      return {
        headline: `The tank got about ${tank}, more than the ${bill} on the bill.`,
        next: 'Check the litres were read off the bill correctly.',
      };
    case 'BILL_MISSING':
      return {
        headline: `About ${tank} went into the tank. No bill uploaded yet.`,
        next: driver ? `Ask ${driver} to upload the bill.` : 'Ask the driver to upload the bill.',
      };
    case 'NO_TANK_READING':
      return {
        headline: `Bill for ${bill}, but the tank sensor saw nothing go in.`,
        next: 'Check the bill is for this truck. The tank sensor may have been offline.',
      };
    case 'GAUGE_JUMP':
      return {
        headline: 'The gauge jumped and came back. Not a refill.',
        next: 'Nothing to do.',
      };
    default:
      return null;
  }
}
