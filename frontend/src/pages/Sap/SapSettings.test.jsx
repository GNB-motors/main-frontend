import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, it, expect, beforeEach } from 'vitest';
import SapSettings from './SapSettings';
import SapService from '../../services/SapService';
import { getUserRole } from '../../utils/session';
vi.mock('../../utils/session', () => ({ getUserRole: vi.fn() }));
vi.mock('../../services/SapService', () => ({
  default: {
    settings: vi.fn(),
    saveSettings: vi.fn(),
    importPreview: vi.fn(),
    importApply: vi.fn(),
  },
}));
vi.mock('../PlaceHub/intelligence/PlaceIntelligenceService', () => ({
  default: { listSites: vi.fn() },
}));
const proposals = [
  {
    ref: 'OCL -> TARAKESHWAR',
    fromLabel: 'OCL',
    toLabel: 'TARAKESHWAR',
    sapValues: [280, 560],
    from: { siteId: 'p1', candidates: [{ siteId: 'p1', name: 'DALMIA OCL', via: 'REGISTER' }] },
    to: { siteId: 't1', candidates: [{ siteId: 't1', name: 'TARAKESHWAR', via: 'NAME' }] },
    ready: true,
    existing: null,
  },
  {
    ref: 'OCL -> NOWHERE',
    fromLabel: 'OCL',
    toLabel: 'NOWHERE',
    sapValues: [150],
    from: { siteId: 'p1', candidates: [{ siteId: 'p1', name: 'DALMIA OCL', via: 'REGISTER' }] },
    to: { siteId: null, candidates: [] },
    ready: false,
    existing: null,
  },
];
beforeEach(() => {
  vi.clearAllMocks();
  getUserRole.mockReturnValue('OWNER');
  SapService.settings.mockResolvedValue({
    tolerancePct: 10,
    minKmForVerdict: 10,
    directionPolicy: 'DIRECTED',
    basisPolicy: 'DECLARED',
  });
  SapService.saveSettings.mockImplementation(async (body) => body);
  SapService.importPreview.mockResolvedValue({
    proposals,
    skipped: [{ line: 4, reason: 'numeric label (shifted column?)' }],
    totals: { lanes: 2, ready: 1, needPlaces: 1, alreadySet: 0 },
  });
  SapService.importApply.mockResolvedValue({ created: 1, unchanged: 0 });
});

it('a sheet becomes proposals; only the chosen ones are saved, with their basis', async () => {
  render(<SapSettings />);
  const csv = 'FROM,TO,SAP\nOCL,TARAKESHWAR,280\n';
  // jsdom's File has no text().
  const file = Object.assign(new File([csv], 'lanes.csv', { type: 'text/csv' }), {
    text: async () => csv,
  });
  fireEvent.change(await screen.findByLabelText('Sheet file'), { target: { files: [file] } });
  await waitFor(() =>
    expect(SapService.importPreview.mock.calls[0][0]).toEqual({
      csv: 'FROM,TO,SAP\nOCL,TARAKESHWAR,280\n',
    }),
  );
  expect(await screen.findByText(/places found for 1 · 1 need places/)).toBeTruthy();
  expect(SapService.importApply).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText('SAP km for OCL -> TARAKESHWAR'), {
    target: { value: '560' },
  });
  fireEvent.change(screen.getByLabelText('Basis for OCL -> TARAKESHWAR'), {
    target: { value: 'ROUND_TRIP' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save 1 route SAPs' }));
  await waitFor(() =>
    expect(SapService.importApply).toHaveBeenCalledWith(
      {
        entries: [
          {
            fromSiteId: 'p1',
            toSiteId: 't1',
            sapKm: 560,
            basis: 'ROUND_TRIP',
            importRef: 'OCL -> TARAKESHWAR',
          },
        ],
      },
      expect.anything(),
    ),
  );
  expect(screen.queryByText(/Sheet preview/)).toBeNull();
});

it('a lane without places cannot be used until it has them', async () => {
  render(<SapSettings />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Use the lane sheet already uploaded' }),
  );
  await waitFor(() =>
    expect(SapService.importPreview).toHaveBeenCalledWith(
      { fromStoredSheet: true },
      expect.anything(),
    ),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Need places' }));
  expect(screen.getByLabelText('Use OCL -> NOWHERE').disabled).toBe(true);
  expect(screen.getByText(/Line 4: numeric label/)).toBeTruthy();
});

it('saves the comparison settings and the two route rules', async () => {
  render(<SapSettings />);
  fireEvent.change(await screen.findByLabelText('Tolerance (%)'), { target: { value: '15' } });
  fireEvent.change(screen.getByLabelText('Routes'), { target: { value: 'UNDIRECTED' } });
  fireEvent.change(screen.getByLabelText('One way or round trip'), { target: { value: 'AUTO' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
  await waitFor(() =>
    expect(SapService.saveSettings.mock.calls[0][0]).toEqual({
      tolerancePct: 15,
      minKmForVerdict: 10,
      directionPolicy: 'UNDIRECTED',
      basisPolicy: 'AUTO',
    }),
  );
});

it('other roles see the settings but cannot change them or import', async () => {
  getUserRole.mockReturnValue('DRIVER');
  render(<SapSettings />);
  expect((await screen.findByLabelText('Tolerance (%)')).disabled).toBe(true);
  expect(screen.queryByLabelText('Sheet file')).toBeNull();
});
