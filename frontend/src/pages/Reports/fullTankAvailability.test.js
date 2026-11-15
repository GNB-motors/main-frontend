import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  FULL_TANK_REPORT_ID,
  probeFullTankAvailability,
  resetFullTankAvailability,
  useFullTankAvailable,
  withoutFullTankReport,
} from './fullTankAvailability';
import { REPORT_GROUPS, resolveReport, visibleReportGroups } from './reportCatalog';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
import apiClient from '../../utils/axiosConfig';

/**
 * The "Full tank" report is newer than the rest of the Reports API, so a
 * backend that has not shipped it yet answers 404. These tests are the proof
 * that the row is hidden there — and only there.
 */

beforeEach(() => {
  vi.clearAllMocks();
  resetFullTankAvailability();
});

describe('the full tank row in the catalog', () => {
  it('sits in the trips group behind the autoTrips flag', () => {
    const rows = REPORT_GROUPS.flatMap((g) => g.children);
    const entry = rows.find((r) => r.id === FULL_TANK_REPORT_ID);
    expect(entry).toBeTruthy();
    expect(entry.label).toBe('Full tank');
    expect(entry.flag).toBe('autoTrips');
  });

  it('is only offered to an org that can open the auto trips reports', () => {
    const ids = (groups) => groups.flatMap((g) => g.children.map((c) => c.id));
    expect(ids(visibleReportGroups(() => false))).not.toContain(FULL_TANK_REPORT_ID);
    expect(ids(visibleReportGroups(() => true))).toContain(FULL_TANK_REPORT_ID);
    expect(resolveReport(FULL_TANK_REPORT_ID, () => true)).toBe(FULL_TANK_REPORT_ID);
  });
});

describe('withoutFullTankReport', () => {
  const groups = [
    { id: 'fuel', label: 'FUEL', children: [{ id: 'vehicle', label: 'Vehicle Report' }] },
    {
      id: 'trips',
      label: 'TRIPS',
      children: [
        { id: 'fuelCycles', label: 'Fuel Cycles' },
        { id: FULL_TANK_REPORT_ID, label: 'Full tank' },
      ],
    },
  ];

  it('drops the full tank row and keeps the rest', () => {
    const kept = withoutFullTankReport(groups);
    expect(kept[1].children.map((r) => r.id)).toEqual(['fuelCycles']);
  });

  it('drops a group that held nothing but the full tank row', () => {
    const onlyFullTank = [{ id: 'trips', label: 'TRIPS', children: [{ id: FULL_TANK_REPORT_ID }] }];
    expect(withoutFullTankReport(onlyFullTank)).toEqual([]);
  });
});

describe('useFullTankAvailable', () => {
  it('is available once the backend answers the endpoint', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { trucks: [] } });
    const { result } = renderHook(() => useFullTankAvailable());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.available).toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith(
      'api/reports/fuel-cycles/full-tank-tab',
      expect.objectContaining({ params: { days: 90 } }),
    );
  });

  it('is not available when the backend answers 404', async () => {
    apiClient.get.mockRejectedValueOnce({ response: { status: 404, data: {} } });
    const { result } = renderHook(() => useFullTankAvailable());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.available).toBe(false);
  });

  it('remembers a 404 instead of asking again on every render', async () => {
    apiClient.get.mockRejectedValueOnce({ response: { status: 404, data: {} } });
    const first = renderHook(() => useFullTankAvailable());
    await waitFor(() => expect(first.result.current.loading).toBe(false));

    const second = renderHook(() => useFullTankAvailable());
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('keeps the row and asks again when the probe fails for another reason', async () => {
    apiClient.get.mockRejectedValueOnce({ response: { status: 503, data: {} } });
    const first = renderHook(() => useFullTankAvailable());

    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.available).toBe(true);

    // A server error is not a fact about the server: the next mount asks again.
    apiClient.get.mockResolvedValueOnce({ data: { trucks: [] } });
    await probeFullTankAvailability();
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });
});
