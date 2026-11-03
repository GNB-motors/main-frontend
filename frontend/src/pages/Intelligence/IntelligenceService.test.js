import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
vi.mock('../../services/fleetViewService', () => ({
  default: {
    getIntelligenceSummary: vi.fn(),
    getIntelligenceIssues: vi.fn(),
    getPlaceQuestions: vi.fn(),
  },
}));

import apiClient from '../../utils/axiosConfig';
import fleetViewService from '../../services/fleetViewService';
import IntelligenceService from './IntelligenceService';

describe('IntelligenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks the shared service for the summary of the period', async () => {
    fleetViewService.getIntelligenceSummary.mockResolvedValue({ tiles: [] });
    const { signal } = new AbortController();

    await IntelligenceService.getSummary({ from: '2026-10-27', to: '2026-11-02', signal });

    expect(fleetViewService.getIntelligenceSummary).toHaveBeenCalledWith({
      from: '2026-10-27',
      to: '2026-11-02',
      signal,
    });
  });

  it('asks the shared service for the issues of the period', async () => {
    fleetViewService.getIntelligenceIssues.mockResolvedValue({ items: [] });

    await IntelligenceService.getIssues({ from: '2026-10-27', to: '2026-11-02' });

    expect(fleetViewService.getIntelligenceIssues).toHaveBeenCalledWith({
      from: '2026-10-27',
      to: '2026-11-02',
      signal: undefined,
    });
  });

  it('asks the API for the report cards of one subject', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [] } });

    await IntelligenceService.getReportCards({ subject: 'driver', from: '2026-10-27', to: '2026-11-02' });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/intelligence/report-cards',
      expect.objectContaining({
        params: { subject: 'driver', from: '2026-10-27', to: '2026-11-02' },
      }),
    );
  });

  it('asks the API for the instances of one kind, with the page', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [], total: 0 } });

    await IntelligenceService.getInstances({
      kind: 'idle',
      from: '2026-10-27',
      to: '2026-11-02',
      page: 2,
      limit: 25,
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/intelligence/instances',
      expect.objectContaining({
        params: {
          kind: 'idle',
          from: '2026-10-27',
          to: '2026-11-02',
          vehicle: undefined,
          driver: undefined,
          page: 2,
          limit: 25,
        },
      }),
    );
  });

  it('asks the API for the mileage of the period, truck by truck', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [] } });

    await IntelligenceService.getMileage({ from: '2026-10-27', to: '2026-11-02' });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/fleet-view/mileage',
      expect.objectContaining({
        params: { groupBy: 'truck', from: '2026-10-27', to: '2026-11-02', vehicle: undefined },
      }),
    );
  });

  it('asks the API for the visits of the period', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [] } });

    await IntelligenceService.getTripsHistory({ from: '2026-10-27', to: '2026-11-02', limit: 200 });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/fleet-view/trips/history',
      expect.objectContaining({ params: expect.objectContaining({ from: '2026-10-27', to: '2026-11-02' }) }),
    );
  });

  it('passes the abort signal to the API', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [] } });
    const { signal } = new AbortController();

    await IntelligenceService.getAutoTrips({ from: 'a', to: 'b', signal });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/auto-trips',
      expect.objectContaining({ signal }),
    );
  });

  it('turns a failed request into a typed error', async () => {
    apiClient.get.mockRejectedValue({ response: { status: 404, data: { requestId: 'r-1' } } });

    await expect(IntelligenceService.getAutoTrips({ from: 'a', to: 'b' })).rejects.toMatchObject({
      status: 404,
    });
  });
});
