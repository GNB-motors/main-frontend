import { describe, it, expect } from 'vitest';
import { laneRow, filterLanes, LANE_VERDICT } from './laneKmReportUtils';

describe('laneKmReportUtils', () => {
  const over = {
    fromLabel: 'OCL',
    toLabel: 'COSSIPORE',
    sapValues: [169, 338],
    source: 'SAP_SHEET',
    measured: {
      n: 74,
      trucks: 20,
      medianKm: 385.9,
      spreadKm: 11.6,
      verdict: 'OVER_SAP',
      matchingSap: [],
      extraKmPerTrip: 47.9,
    },
  };

  it('shows every SAP value as listed and the extra km per trip and in all', () => {
    expect(laneRow(over)).toMatchObject({
      sapText: '169 / 338',
      severalSap: true,
      measuredKm: 385.9,
      trips: 74,
      label: 'Runs over SAP',
      tone: 'critical',
      extraPerTrip: 47.9,
      extraTotal: 3545,
    });
  });

  it('a lane trucks run that the sheet lacks, with its likely sheet spelling', () => {
    const r = laneRow({
      fromLabel: 'OCL',
      toLabel: 'COSSIPURE',
      sapValues: [],
      source: 'REGISTER',
      possibly: 'OCL → COSSIPORE',
      measured: { n: 18, trucks: 12, medianKm: 372.8, spreadKm: 13.6, verdict: 'NOT_IN_SAP' },
    });
    expect(r).toMatchObject({
      sapText: '—',
      fromRegister: true,
      possibly: 'OCL → COSSIPORE',
      label: 'Not in SAP',
      extraTotal: null,
    });
  });

  it('a lane never measured reads as too few trips; SAP 0 says so', () => {
    expect(
      laneRow({ fromLabel: 'OCL', toLabel: 'BAGNAN', sapValues: [], listedWithoutSap: true }),
    ).toMatchObject({
      verdict: 'THIN',
      sapText: 'SAP 0',
      trips: 0,
    });
  });

  it('filters by verdict and searches FROM or TO', () => {
    const rows = [
      laneRow(over),
      laneRow({ ...over, toLabel: 'AMTA', measured: { ...over.measured, verdict: 'MATCHES' } }),
    ];
    expect(filterLanes(rows, 'OVER_SAP', '').map((r) => r.to)).toEqual(['COSSIPORE']);
    expect(filterLanes(rows, 'all', 'amta').map((r) => r.to)).toEqual(['AMTA']);
    expect(filterLanes(rows, 'all', 'ocl')).toHaveLength(2);
  });

  it('every verdict has a word and a tone', () => {
    for (const v of Object.values(LANE_VERDICT)) {
      expect(v.label).toBeTruthy();
      expect(['critical', 'caution', 'ok', 'inert']).toContain(v.tone);
    }
  });
});
