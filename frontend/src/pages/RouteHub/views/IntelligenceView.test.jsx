import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

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
    );
  });

  it('no evidence at this hour: says typical, never fakes rows', async () => {
    RoadService.getEngineStatus.mockResolvedValue({ enabled: true });
    RoadService.getCongestion.mockResolvedValue({ how: 3, rows: [] });
    render(<IntelligenceView />);
    await waitFor(() => expect(screen.getByText('Typical for this hour')).toBeInTheDocument());
    expect(screen.queryAllByTestId('congestion-row')).toHaveLength(0);
  });
});
