import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  it('shows each lane against SAP and filters by verdict', async () => {
    render(<LaneKmReport />);
    expect(await screen.findByText('OCL → TARAKESHWAR')).toBeTruthy();
    expect(screen.getByText('Runs over SAP')).toBeTruthy();
    expect(screen.getByText('FARAKKA → PIRPAINTI')).toBeTruthy();
    expect(screen.getByText('3,815 km')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Over SAP' }));
    expect(screen.queryByText('FARAKKA → PIRPAINTI')).toBeNull();
    expect(screen.getByText('OCL → TARAKESHWAR')).toBeTruthy();
  });
});
