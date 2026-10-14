import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import LaneKmReport from './LaneKmReport.jsx';

vi.mock('../../../utils/axiosConfig', () => ({
  default: {
    get: vi.fn(async () => ({
      data: {
        status: 'success',
        data: {
          rows: [
            {
              fromLabel: 'OCL',
              toLabel: 'TARAKESHWAR',
              sapValues: [280],
              source: 'SAP_SHEET',
              measured: {
                n: 33,
                trucks: 16,
                medianKm: 395.6,
                spreadKm: 14.8,
                verdict: 'OVER_SAP',
                matchingSap: [],
                extraKmPerTrip: 115.6,
              },
            },
            {
              fromLabel: 'FARAKKA',
              toLabel: 'PIRPAINTI',
              sapValues: [],
              source: 'REGISTER',
              measured: {
                n: 46,
                trucks: 17,
                medianKm: 276.7,
                spreadKm: 12.2,
                verdict: 'NOT_IN_SAP',
                matchingSap: [],
              },
            },
          ],
          totals: {
            lanes: 2,
            fromSheet: 1,
            fromRegister: 1,
            overSap: 1,
            notInSap: 1,
            matches: 0,
            extraKm: 3815,
          },
        },
      },
    })),
  },
}));

describe('LaneKmReport', () => {
  it('shows each lane against SAP with the totals as KPI cards', async () => {
    render(<LaneKmReport />);
    expect(await screen.findByText('OCL → TARAKESHWAR')).toBeTruthy();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Runs over SAP')).toBeTruthy();
    expect(screen.getByText('FARAKKA → PIRPAINTI')).toBeTruthy();
    expect(screen.getByText('Extra km over SAP')).toBeTruthy();
    expect(screen.getByText('3,815 km')).toBeTruthy();
    expect(screen.getByText('1–2 of 2 lanes')).toBeTruthy();
    expect(screen.getByText('Page 1 of 1')).toBeTruthy();
  });

  it('filters by verdict, including verdicts with no lanes', async () => {
    render(<LaneKmReport />);
    await screen.findByText('OCL → TARAKESHWAR');
    fireEvent.click(screen.getByRole('button', { name: 'Verdict: All lanes' }));
    const options = within(screen.getByRole('listbox', { name: 'Verdict' }))
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual([
      'All lanes',
      'Runs over SAP',
      'Not in SAP',
      'Between SAP values',
      'Runs under SAP',
      'Matches SAP',
      'Too few trips',
    ]);

    const pickVerdict = (label) => {
      fireEvent.mouseDown(screen.getByRole('option', { name: label }));
    };

    pickVerdict('Runs over SAP');
    expect(screen.queryByText('FARAKKA → PIRPAINTI')).toBeNull();
    expect(screen.getByText('OCL → TARAKESHWAR')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Verdict: Runs over SAP' }));
    pickVerdict('Runs under SAP');
    expect(screen.queryByText('OCL → TARAKESHWAR')).toBeNull();
    expect(screen.getByText('No lane matches these filters')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('OCL → TARAKESHWAR')).toBeTruthy();
    expect(screen.getByText('FARAKKA → PIRPAINTI')).toBeTruthy();
  });

  it('searches plant or town, ignoring case', async () => {
    render(<LaneKmReport />);
    await screen.findByText('OCL → TARAKESHWAR');
    fireEvent.change(screen.getByLabelText('Search plant or town'), {
      target: { value: 'farakka' },
    });
    expect(screen.queryByText('OCL → TARAKESHWAR')).toBeNull();
    expect(screen.getByText('FARAKKA → PIRPAINTI')).toBeTruthy();
  });
});
