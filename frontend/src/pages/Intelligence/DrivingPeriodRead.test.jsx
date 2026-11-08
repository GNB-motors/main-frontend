import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import DrivingBriefing, { DrivingPeriodRead } from './DrivingPeriodRead';
import IntelligenceService from './IntelligenceService';
vi.mock('./IntelligenceService', () => ({ default: { getInstances: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());
describe('Driving period read', () => {
  it.each(['overspeed', 'detour', 'cruise', 'gear'])(
    'shows real %s readings and preserves zero totals',
    (kind) => {
      render(
        <DrivingPeriodRead
          kind={kind}
          summary={{ count: 0, totalMin: 0, totalL: 0, totalInr: 0 }}
          total={0}
        />,
      );
      expect(screen.getByRole('region', { name: 'Driving period read' })).toHaveTextContent(
        'Period read',
      );
      expect(screen.getByText('0 L')).toBeInTheDocument();
      expect(screen.getByText('₹0')).toBeInTheDocument();
    },
  );
  it('does not turn failed or held summaries into an all-clear', () => {
    const { rerender } = render(
      <DrivingPeriodRead kind="overspeed" error={new Error('Offline')} summary={{ count: 3 }} />,
    );
    expect(screen.getByText('The driving summary is unavailable.')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(4);
    rerender(<DrivingPeriodRead kind="overspeed" held={{ text: 'Assignments are missing.' }} />);
    expect(screen.getByText('Assignments are missing.')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(4);
  });
  it('requests the selected period and vehicle/driver scope', async () => {
    IntelligenceService.getInstances.mockResolvedValue({ summary: { count: 7 }, total: 7 });
    render(
      <DrivingBriefing
        kind="detour"
        from="2026-11-01"
        to="2026-11-07"
        vehicle="WB11T0662"
        driver="driver-one"
      />,
    );
    const region = await screen.findByRole('region', { name: 'Driving period read' });
    expect(await within(region).findAllByText('7')).toHaveLength(2);
    expect(IntelligenceService.getInstances).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'detour',
        from: '2026-11-01',
        to: '2026-11-07',
        vehicle: 'WB11T0662',
        driver: 'driver-one',
        limit: 1,
      }),
    );
  });
});
