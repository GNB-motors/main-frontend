import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import FullTankTabReport from './FullTankTabReport';

vi.mock('../../../utils/axiosConfig', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
import apiClient from '../../../utils/axiosConfig';

/**
 * The "Full tank" report, exercised against the response the backend sends.
 * Three shapes are checked for every figure: a real value, a null (the
 * backend could not measure it) and an absent field (an older backend).
 */

const TRUCK = {
  vehicleId: 'v1',
  registrationNumber: 'WB11A1234',
  model: 'LPT 4830',
  status: 'OPEN',
  lastFullAt: '2026-11-02T06:10:00.000Z',
  lastFullBasis: 'REGISTER_MAIN',
  lastFullOdo: 412345,
  fullCycles: 7,
  otherCycles: 1,
  partialsSinceFull: { count: 1, litres: 80 },
  daysSinceFull: 6.4,
  kmSinceFull: null,
  lastKmPerL: 3.1,
  medianKmPerL: 3.0,
};

const FIXTURE = {
  trucks: [TRUCK],
  summary: {
    trucks: 126,
    fullCycles: 540,
    openTabs: 120,
    noFullYet: 6,
    fromSlip: 80,
    fromRegister: 460,
  },
  models: [{ modelKey: 'LPT 4830', n: 230, trucks: 50, medianPct: 0.16, abovePeers: true }],
  days: 90,
};

beforeEach(() => {
  vi.clearAllMocks();
});

/** Renders the report against one response body and waits for its rows. */
const renderReport = async (body, plate = 'WB11A1234') => {
  apiClient.get.mockResolvedValueOnce({ data: body });
  render(<FullTankTabReport />);
  if (plate) await screen.findByText(plate);
};

const tables = () => screen.getAllByRole('table');
const truckTable = () => tables()[0];
const modelTable = () => tables()[1];

/** One row of a table as { header: cell text }, read by the column names. */
const rowCells = (table, index) => {
  const headers = within(table)
    .getAllByRole('columnheader')
    .map((th) => th.textContent.trim());
  const rows = within(table).getAllByRole('row');
  const cells = within(rows[index + 1]).getAllByRole('cell');
  return Object.fromEntries(headers.map((header, i) => [header, cells[i].textContent.trim()]));
};

/** The whole screen as one string — used to prove nothing prints "undefined". */
const screenText = () => document.body.textContent;

describe('the full tank report', () => {
  it('asks the backend for the 90-day full-tank tab', async () => {
    await renderReport(FIXTURE);
    expect(apiClient.get).toHaveBeenCalledWith(
      'api/reports/fuel-cycles/full-tank-tab',
      expect.objectContaining({ params: { days: 90, search: '' } }),
    );
  });

  it('shows the summary figures, the truck table and the model block', async () => {
    await renderReport(FIXTURE);

    const kpis = within(document.querySelector('.rpt-kpis'));
    const labels = [
      'Full cycles',
      'Open tabs',
      'Trucks with no full tank yet',
      'From slips',
      'From register',
    ];
    labels.forEach((label) => {
      expect(kpis.getByText(label)).toBeInTheDocument();
    });
    ['540', '120', '6', '80', '460'].forEach((value) => {
      expect(kpis.getByText(value)).toBeInTheDocument();
    });

    expect(rowCells(truckTable(), 0)).toEqual({
      Plate: 'WB11A1234',
      Model: 'LPT 4830',
      'Full cycles': '7',
      'Other cycles': '1',
      'Last full tank': '2 Nov 2026 · from register rows',
      'Days since': '6.4',
      'Km since': '—',
      'Partial fills since': '1 fill · 80 L',
      'Last km/L': '3.1 km/L',
      'Median km/L': '3 km/L',
    });

    expect(rowCells(modelTable(), 0)).toEqual({
      Model: 'LPT 4830',
      Cycles: '230',
      Trucks: '50',
      'Median km gap': '16%',
      'Ledger note': 'ledger misses more km on this model',
    });
  });

  it('reads a null figure as "—" and never as 0', async () => {
    await renderReport(FIXTURE);
    const cells = rowCells(truckTable(), 0);
    expect(cells['Km since']).toBe('—');
    expect(cells['Km since']).not.toBe('0');
    expect(
      screen.getByText('1 truck without a measured km since the last full tank'),
    ).toBeInTheDocument();
  });

  it('reads an absent figure as "—" and never as "undefined"', async () => {
    await renderReport(
      {
        trucks: [{ vehicleId: 'v2', registrationNumber: 'WB25R9540', model: 'Tata 407' }],
        summary: { fullCycles: 540 },
        days: 90,
      },
      'WB25R9540',
    );

    const cells = rowCells(truckTable(), 0);
    expect(cells['Full cycles']).toBe('—');
    expect(cells['Other cycles']).toBe('—');
    expect(cells['Last full tank']).toBe('—');
    expect(cells['Days since']).toBe('—');
    expect(cells['Km since']).toBe('—');
    expect(cells['Partial fills since']).toBe('—');
    expect(cells['Last km/L']).toBe('—');
    expect(cells['Median km/L']).toBe('—');
    expect(screenText()).not.toContain('undefined');
    // No model rows came back, so there is no model block to show.
    expect(tables()).toHaveLength(1);
  });

  it('prints nothing for a null model gap and nothing when the model is not above its peers', async () => {
    await renderReport({
      ...FIXTURE,
      models: [{ modelKey: 'LPT 4830', n: 230, trucks: 50, medianPct: null, abovePeers: false }],
    });

    const cells = rowCells(modelTable(), 0);
    expect(cells['Median km gap']).toBe('');
    expect(cells['Ledger note']).toBe('');
    expect(screenText()).not.toContain('0%');
    expect(screenText()).not.toContain('ledger misses more km on this model');
  });

  it('says the report is not available when the backend answers 404', async () => {
    apiClient.get.mockRejectedValueOnce({
      response: { status: 404, data: { message: 'Not found' } },
    });
    render(<FullTankTabReport />);

    expect(await screen.findByText('Full tank report not available')).toBeInTheDocument();
    expect(screenText()).not.toContain('undefined');
  });

  it('prints the whole report for the real response shape', async () => {
    await renderReport(FIXTURE);

    const dump = tables()
      .map((table) =>
        within(table)
          .getAllByRole('row')
          .map((row) =>
            [...row.querySelectorAll('th, td')].map((cell) => cell.textContent.trim()).join(' | '),
          )
          .join('\n'),
      )
      .join('\n\n');
    // The printed report is the point of this check: it shows what the screen
    // really says for the response the backend sends.
    console.log(`\nFull tank report\n${dump}`);
    expect(dump).toContain('WB11A1234 | LPT 4830 | 7 | 1');
  });
});
