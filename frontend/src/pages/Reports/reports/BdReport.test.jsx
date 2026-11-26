import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, within, act } from '@testing-library/react';
import BdReport from './BdReport';

const { BdReportService, getUserRole, getOrgId } = vi.hoisted(() => ({
  BdReportService: { list: vi.fn(), download: vi.fn(), build: vi.fn() },
  getUserRole: vi.fn(),
  getOrgId: vi.fn(() => 'org-1'),
}));

vi.mock('../../../services/BdReportService', async (importOriginal) => ({
  ...(await importOriginal()),
  BdReportService,
}));

vi.mock('../../../utils/session', async (importOriginal) => ({
  ...(await importOriginal()),
  getUserRole,
  getOrgId,
}));

const oilRow = {
  _id: 'oil-1',
  kind: 'OIL',
  day: '2026-03-01',
  fileName: 'bd-oil-2026-03-01.xlsx',
  rows: 42,
  flagged: 3,
  createdAt: '2026-03-01T18:30:00.000Z',
};
const olderRow = {
  _id: 'oil-0',
  kind: 'OIL',
  day: '2026-02-27',
  fileName: 'bd-oil-2026-02-27.xlsx',
  rows: 10,
  flagged: 0,
  createdAt: '2026-02-27T18:30:00.000Z',
};

describe('BD oil & DEF report (spec 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // 2 Mar 2026, 00:30 IST — the day the books are closed on is 1 Mar.
    vi.setSystemTime(new Date('2026-03-01T19:00:00Z'));
    getUserRole.mockReturnValue('OWNER');
    getOrgId.mockReturnValue('org-1');
    BdReportService.list.mockResolvedValue([olderRow, oilRow]);
    BdReportService.download.mockResolvedValue({
      blob: new Blob(['xlsx']),
      fileName: 'bd-oil-2026-03-01.xlsx',
    });
    BdReportService.build.mockResolvedValue({ _id: 'oil-1' });
    URL.createObjectURL = vi.fn(() => 'blob:bd-report');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('lists the built reports newest first with the flagged count', async () => {
    render(<BdReport />);

    await waitFor(() => expect(screen.getByText('bd-oil-2026-03-01.xlsx')).toBeInTheDocument());
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('bd-oil-2026-03-01.xlsx');
    expect(rows[2]).toHaveTextContent('bd-oil-2026-02-27.xlsx');
    expect(screen.getByText('3 rows need a check')).toBeInTheDocument();
  });

  it('shows an empty state when nothing is built yet', async () => {
    BdReportService.list.mockResolvedValue([]);
    render(<BdReport />);
    await waitFor(() => expect(screen.getByText('No report built yet.')).toBeInTheDocument());
  });

  it('keeps an unknown count unknown instead of showing 0', async () => {
    BdReportService.list.mockResolvedValue([
      { ...oilRow, rows: null, flagged: null },
    ]);
    render(<BdReport />);
    await waitFor(() => expect(screen.getByText('bd-oil-2026-03-01.xlsx')).toBeInTheDocument());
    const rows = screen.getAllByRole('row');
    const cells = within(rows[1]).getAllByRole('cell');
    expect(cells[2]).toHaveTextContent('—');
    expect(cells[3]).toHaveTextContent('—');
    expect(cells[2]).not.toHaveTextContent('0');
  });

  it('shows a known zero flagged count as zero', async () => {
    BdReportService.list.mockResolvedValue([{ ...oilRow, flagged: 0 }]);
    render(<BdReport />);
    await waitFor(() => expect(screen.getByText('bd-oil-2026-03-01.xlsx')).toBeInTheDocument());
    const rows = screen.getAllByRole('row');
    const cells = within(rows[1]).getAllByRole('cell');
    expect(cells[3]).toHaveTextContent('0');
  });

  it('asks for one kind and ignores the late answer of the other kind', async () => {
    let resolveOil;
    BdReportService.list.mockImplementation((kind) =>
      kind === 'OIL' ? new Promise((r) => { resolveOil = r; }) : Promise.resolve([]),
    );
    render(<BdReport />);

    fireEvent.click(screen.getByRole('button', { name: 'DEF' }));
    await waitFor(() => expect(BdReportService.list).toHaveBeenCalledWith('DEF'));
    expect(BdReportService.list).toHaveBeenCalledTimes(2);

    resolveOil([oilRow]);
    await waitFor(() => expect(screen.queryByText('bd-oil-2026-03-01.xlsx')).toBeNull());
  });

  it('ignores a build that finishes after the kind changed', async () => {
    let resolveBuild;
    BdReportService.build.mockReturnValue(
      new Promise((resolve) => {
        resolveBuild = resolve;
      }),
    );
    render(<BdReport />);
    await waitFor(() => expect(screen.getByText('bd-oil-2026-03-01.xlsx')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Build now' }));
    await waitFor(() => expect(BdReportService.build).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'DEF' }));
    await waitFor(() => expect(BdReportService.list).toHaveBeenCalledWith('DEF'));
    BdReportService.list.mockClear();

    await act(async () => {
      resolveBuild({ _id: 'oil-1' });
    });

    // The OIL build must not replace the DEF list on screen.
    expect(BdReportService.list).not.toHaveBeenCalled();
  });

  it('ignores a list answer that belongs to the previous organization', async () => {
    let resolveList;
    let resolveReload;
    // The first answer belongs to the old organization; the reload for the new
    // organization is still waiting, so the screen keeps whatever the first
    // answer put there.
    BdReportService.list
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveList = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveReload = resolve;
          }),
      );
    render(<BdReport />);
    await waitFor(() => expect(BdReportService.list).toHaveBeenCalledTimes(1));

    // The organization changes while the request is in flight.
    getOrgId.mockReturnValue('org-2');
    await act(async () => {
      resolveList([oilRow]);
    });

    // The answer of the previous organization never lands on the screen...
    expect(screen.queryByText('bd-oil-2026-03-01.xlsx')).toBeNull();
    // ...and the new organization is read again.
    await waitFor(() => expect(BdReportService.list).toHaveBeenCalledTimes(2));

    await act(async () => {
      resolveReload([]);
    });
    expect(screen.queryByText('bd-oil-2026-03-01.xlsx')).toBeNull();
  });

  it('clears the rows and reloads them when the organization changes', async () => {
    render(<BdReport />);
    await waitFor(() => expect(screen.getByText('bd-oil-2026-03-01.xlsx')).toBeInTheDocument());

    getOrgId.mockReturnValue('org-2');
    BdReportService.list.mockResolvedValue([]);
    // Any re-render notices the new organization.
    fireEvent.click(screen.getAllByRole('button', { name: 'Download' })[0]);

    await waitFor(() => expect(BdReportService.list).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('No report built yet.')).toBeInTheDocument());
  });

  it('downloads a report file', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<BdReport />);
    await waitFor(() => expect(screen.getByText('bd-oil-2026-03-01.xlsx')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: 'Download' })[0]);
    await waitFor(() =>
      expect(BdReportService.download).toHaveBeenCalledWith('oil-1', {
        fallbackName: 'bd-oil-2026-03-01.xlsx',
      }),
    );
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('offers Build now to a manager and defaults to yesterday in IST', async () => {
    render(<BdReport />);
    const day = await screen.findByLabelText('Day (IST)');
    expect(day.value).toBe('2026-03-01');
    expect(screen.getByRole('button', { name: 'Build now' })).toBeInTheDocument();
  });

  it('hides Build now from a user who is not a manager', async () => {
    getUserRole.mockReturnValue('DRIVER');
    render(<BdReport />);
    await waitFor(() => expect(screen.getByText('bd-oil-2026-03-01.xlsx')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Build now' })).toBeNull();
    expect(screen.queryByLabelText('Day (IST)')).toBeNull();
  });

  it('builds the chosen day and refreshes the list', async () => {
    render(<BdReport />);
    await screen.findByLabelText('Day (IST)');
    BdReportService.list.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Build now' }));
    await waitFor(() =>
      expect(BdReportService.build).toHaveBeenCalledWith({ day: '2026-03-01', kind: 'OIL' }),
    );
    await waitFor(() => expect(BdReportService.list).toHaveBeenCalledWith('OIL'));
  });

  it('keeps the list untouched when the build fails', async () => {
    BdReportService.build.mockRejectedValue(new Error('build failed'));
    render(<BdReport />);
    await screen.findByLabelText('Day (IST)');
    BdReportService.list.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Build now' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('build failed'));
    expect(BdReportService.list).not.toHaveBeenCalled();
  });
});
