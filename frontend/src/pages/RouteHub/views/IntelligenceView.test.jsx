import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';

vi.mock('../../../services/RoadService', () => ({
  default: { getEngineStatus: vi.fn(), getCongestion: vi.fn() },
}));
vi.mock('../../routeHubShared.jsx', async () => {
  const actual = await vi.importActual('../../routeHubShared.jsx');
  return actual;
});

import RoadService from '../../../services/RoadService';
import IntelligenceView from './IntelligenceView';
import { istHourOfWeek, howLabel } from '../intelligenceFormat.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Route Hub Intelligence tab (plan P5.6; maths R22)', () => {
  it('IST hour-of-week: Monday 00:00 IST = 0, Sunday 23:00 IST = 167', () => {
    expect(istHourOfWeek(new Date(Date.UTC(2026, 8, 27, 18, 30)))).toBe(0);
    expect(istHourOfWeek(new Date(Date.UTC(2026, 9, 4, 17, 30)))).toBe(167);
    expect(howLabel(11)).toBe('Mon 11:00 IST');
    expect(howLabel(167)).toBe('Sun 23:00 IST');
  });

  it('engine off: honest empty state, no congestion request', async () => {
    RoadService.getEngineStatus.mockResolvedValue({ enabled: false });
    render(<IntelligenceView />);
    await waitFor(() => expect(screen.getByText('Road engine off')).toBeInTheDocument());
    expect(RoadService.getCongestion).not.toHaveBeenCalled();
  });

  it('lists congested edges with the congestion index and speeds', async () => {
    RoadService.getEngineStatus.mockResolvedValue({ enabled: true });
    RoadService.getCongestion.mockResolvedValue({
      how: 11,
      rows: [
        {
          edgeKey: 'e1',
          roadClass: 'primary',
          region: 'q1',
          congestionIndex: 1.9,
          speedKmhNow: 26,
          speedKmhFreeFlow: 50,
          evidenceRows: 400,
        },
      ],
    });
    render(<IntelligenceView />);
    await waitFor(() => expect(screen.getAllByTestId('congestion-row')).toHaveLength(1));
    expect(screen.getByText('1.9× slower')).toBeInTheDocument();
    expect(screen.getByText('26 km/h')).toBeInTheDocument();
    expect(RoadService.getCongestion).toHaveBeenCalledWith(
      expect.objectContaining({ how: expect.any(Number), limit: 50 }),
      expect.any(AbortSignal),
    );
  });

  it('does not let an old hour replace the newly selected hour', async () => {
    let finishFirst;
    RoadService.getEngineStatus.mockResolvedValue({ enabled: true });
    RoadService.getCongestion
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({
        rows: [
          {
            edgeKey: 'new',
            roadClass: 'secondary',
            region: '123133',
            congestionIndex: 2,
            speedKmhNow: 20,
            speedKmhFreeFlow: 40,
            evidenceRows: 12,
          },
        ],
      });
    render(<IntelligenceView />);
    await waitFor(() => expect(RoadService.getCongestion).toHaveBeenCalledTimes(1));
    const oldSignal = RoadService.getCongestion.mock.calls[0][1];
    const select = screen.getByLabelText('Hour (IST)');
    fireEvent.change(select, { target: { value: String((Number(select.value) + 1) % 168) } });
    expect(await screen.findByText(/secondary/i)).toBeInTheDocument();
    await act(async () => finishFirst({ rows: [{ edgeKey: 'old', roadClass: 'motorway' }] }));
    expect(oldSignal.aborted).toBe(true);
    expect(screen.queryByText(/motorway/i)).not.toBeInTheDocument();
    expect(screen.getByText(/secondary/i)).toBeInTheDocument();
  });

  it('shows missing values honestly and preserves zero speeds and sample counts', async () => {
    RoadService.getEngineStatus.mockResolvedValue({ enabled: true });
    RoadService.getCongestion.mockResolvedValue({
      rows: [
        {
          edgeKey: 'e1',
          roadClass: null,
          region: null,
          congestionIndex: null,
          speedKmhNow: 0,
          speedKmhFreeFlow: null,
          evidenceRows: 0,
        },
      ],
    });
    render(<IntelligenceView />);
    expect(await screen.findByText('Unclassified')).toBeInTheDocument();
    expect(screen.getByText('0 km/h')).toBeInTheDocument();
    expect(screen.queryByText('null km/h')).not.toBeInTheDocument();
  });

  it('no evidence at this hour: says typical, never fakes rows', async () => {
    RoadService.getEngineStatus.mockResolvedValue({ enabled: true });
    RoadService.getCongestion.mockResolvedValue({ how: 3, rows: [] });
    render(<IntelligenceView />);
    await waitFor(() => expect(screen.getByText('Typical for this hour')).toBeInTheDocument());
    expect(screen.queryAllByTestId('congestion-row')).toHaveLength(0);
  });
});
