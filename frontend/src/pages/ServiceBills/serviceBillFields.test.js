import { describe, it, expect } from 'vitest';
import {
  buildFieldRows,
  buildQueueRows,
  buildReviewPayload,
  confidenceBand,
  formatFieldValue,
  formatLineItemAmount,
  scanStatusLabel,
  summariseRows,
} from './serviceBillFields';

const field = (over) => ({
  field: 'grandTotal',
  label: 'Grand total',
  value: 14040,
  confidence: 96,
  source: 'OCR',
  status: 'PROPOSED',
  blankReason: null,
  ...over,
});

describe('formatFieldValue — a value is never shown without its confidence', () => {
  it('formats money, dates and distances for reading', () => {
    expect(formatFieldValue(field({ field: 'grandTotal' }))).toBe('₹14,040');
    expect(formatFieldValue(field({ field: 'invoiceDate', value: '2026-10-19' }))).toBe('2026-10-19');
    expect(formatFieldValue(field({ field: 'odometerKm', value: 48210 }))).toBe('48,210 km');
  });

  it('renders a blank as nothing at all — never zero, never a dash', () => {
    expect(
      formatFieldValue(field({ status: 'BLANK', value: null, blankReason: 'PRINT_FAINT' })),
    ).toBeNull();
    expect(formatFieldValue(field({ status: 'BLANK', value: 0, blankReason: 'NOT_ON_BILL' }))).toBeNull();
    expect(formatFieldValue(undefined)).toBeNull();
  });
});

describe('confidenceBand — the extractor’s own number, never a gate of its own', () => {
  it('bands the reported confidence', () => {
    expect(confidenceBand(96)).toBe('high');
    expect(confidenceBand(70)).toBe('medium');
    expect(confidenceBand(41)).toBe('low');
  });

  it('has its own band for "no confidence reported" — not zero', () => {
    expect(confidenceBand(null)).toBe('none');
    expect(confidenceBand(undefined)).toBe('none');
    expect(confidenceBand(0)).toBe('low');
  });
});

describe('buildFieldRows — a disagreement keeps both sides, never a blend', () => {
  const extraction = {
    fields: [
      field({}),
      field({ field: 'odometerKm', label: 'Odometer (km)', value: 48210, confidence: 41 }),
      field({
        field: 'gstin',
        label: 'Vendor GSTIN',
        value: null,
        confidence: null,
        status: 'BLANK',
        blankReason: 'PRINT_FAINT',
      }),
    ],
    disagreements: [
      {
        field: 'grandTotal',
        proposed: { value: 14040, confidence: 96, source: 'OCR' },
        recorded: { value: 15000, source: 'RECORD' },
        differs: true,
      },
      {
        field: 'odometerKm',
        proposed: { value: 48210, confidence: 41, source: 'OCR' },
        recorded: { value: 48000, source: 'RECORD' },
        differs: true,
      },
    ],
    maintenanceRecord: {
      amount: 15000,
      date: '2026-10-19',
      workshop: 'Highway Motors',
      currentKm: 48000,
    },
  };

  it('shows the extracted figure and the recorded figure side by side', () => {
    const rows = buildFieldRows(extraction);
    const total = rows.find((r) => r.field === 'grandTotal');
    expect(total.extracted).toBe('₹14,040');
    expect(total.recorded).toBe('₹15,000');
    expect(total.differs).toBe(true);
    // No blended figure is produced anywhere.
    expect(JSON.stringify(rows)).not.toContain('14,520');
  });

  it('marks a blank with the reason, and offers nothing to decide on', () => {
    const gstin = buildFieldRows(extraction).find((r) => r.field === 'gstin');
    expect(gstin.extracted).toBeNull();
    expect(gstin.blankLabel).toBe('Print too faint to read');
    expect(gstin.actionable).toBe(false);
  });

  it('keeps a low-confidence reading as a proposal rather than hiding it', () => {
    const odo = buildFieldRows(extraction).find((r) => r.field === 'odometerKm');
    expect(odo.extracted).toBe('48,210 km');
    expect(odo.confidence).toBe(41);
    expect(odo.band).toBe('low');
    expect(odo.actionable).toBe(true);
  });

  it('does not call a field disagreed when nothing is on the record', () => {
    const rows = buildFieldRows({ fields: [field({ field: 'plate', label: 'Vehicle on bill', value: 'MH12AB1234' })] });
    expect(rows[0].recorded).toBeNull();
    expect(rows[0].differs).toBe(false);
  });
});

describe('summariseRows — honest counts', () => {
  it('counts blanks and faint readings rather than hiding them', () => {
    const rows = buildFieldRows({
      fields: [
        field({}),
        field({ field: 'odometerKm', value: 48210, confidence: 41 }),
        field({ field: 'gstin', value: null, confidence: null, status: 'BLANK', blankReason: 'NOT_ON_BILL' }),
      ],
      disagreements: [
        {
          field: 'grandTotal',
          proposed: { value: 14040 },
          recorded: { value: 15000 },
          differs: true,
        },
      ],
      maintenanceRecord: { amount: 15000 },
    });
    expect(summariseRows(rows)).toEqual({
      total: 3,
      proposed: 2,
      blank: 1,
      faint: 2,
      disagreed: 1,
    });
  });
});

describe('buildQueueRows', () => {
  it('says how much of the bill was read', () => {
    const rows = buildQueueRows([
      {
        _id: 'b1',
        vehicleId: '64b0000000000000000000b1',
        createdAt: '2026-10-20T10:00:00.000Z',
        scanStatus: 'PARTIAL',
        reviewedAt: null,
        sourceFile: { publicUrl: 'https://x/bill.jpg' },
        fields: [
          field({}),
          field({ field: 'gstin', value: null, status: 'BLANK', confidence: null, blankReason: 'PRINT_FAINT' }),
        ],
      },
    ]);
    expect(rows[0]).toMatchObject({
      id: 'b1',
      fieldsRead: 1,
      fieldsTotal: 2,
      scanStatusLabel: 'Partly read',
      needsReview: true,
      total: '₹14,040',
      totalBand: 'high',
    });
  });

  it('never prints a total for a bill that was not read', () => {
    const rows = buildQueueRows([
      {
        _id: 'b2',
        scanStatus: 'FAILED',
        sourceFile: {},
        fields: [field({ value: null, status: 'BLANK', confidence: null, blankReason: 'OCR_FAILED' })],
      },
    ]);
    expect(rows[0].total).toBeNull();
    expect(rows[0].scanStatusLabel).toBe('Nothing read from this photo');
  });
});

describe('scanStatusLabel', () => {
  it('names the three honest outcomes', () => {
    expect(scanStatusLabel('SUCCESS')).toBe('Bill read in full');
    expect(scanStatusLabel('PARTIAL')).toBe('Partly read');
    expect(scanStatusLabel('FAILED')).toBe('Nothing read from this photo');
  });
});

describe('formatLineItemAmount', () => {
  it('shows a line amount and nothing for an unreadable line', () => {
    expect(formatLineItemAmount({ amount: 9000 })).toBe('₹9,000');
    expect(formatLineItemAmount({ status: 'BLANK', amount: null })).toBeNull();
  });
});

describe('buildReviewPayload — only decisions, and never a blank as a value', () => {
  it('sends the action, and the reviewer value only for a correction', () => {
    expect(
      buildReviewPayload({
        grandTotal: { action: 'ACCEPT' },
        invoiceDate: { action: 'CORRECT', value: '2026-10-19' },
        odometerKm: { action: 'KEEP_RECORDED' },
      }),
    ).toEqual({
      fields: {
        grandTotal: { action: 'ACCEPT' },
        invoiceDate: { action: 'CORRECT', value: '2026-10-19' },
        odometerKm: { action: 'KEEP_RECORDED' },
      },
    });
  });

  it('drops entries with no decision at all', () => {
    expect(buildReviewPayload({ grandTotal: null, plate: {} })).toEqual({ fields: {} });
  });
});