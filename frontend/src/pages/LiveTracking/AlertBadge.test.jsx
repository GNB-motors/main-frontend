import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlertBadge from './AlertBadge';
import { alertCountsByVehicle } from './trackAlertsModel';

const now = Date.parse('2026-11-04T10:00:00Z');

describe('the alert badge', () => {
  it('uses an icon with the count in its accessible label', () => {
    render(<AlertBadge count={3} />);
    expect(screen.getByRole('button', { name: 'View 3 unacknowledged alerts' }).textContent).toBe(
      '',
    );
  });

  it('keeps one alert accessible without visible count text', () => {
    render(<AlertBadge count={1} />);
    expect(screen.getByRole('button', { name: 'View 1 unacknowledged alert' }).textContent).toBe(
      '',
    );
  });

  it('is nothing when there is no alert', () => {
    const { container } = render(<AlertBadge count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('counts each truck its own unacknowledged alerts of the day', () => {
    const alerts = [
      { id: 'a1', vehicleNumber: 'MH 12 AB 1234', createdAt: '2026-11-04T09:00:00Z' },
      { id: 'a2', vehicleNumber: 'MH12AB1234', createdAt: '2026-11-04T08:00:00Z' },
      {
        id: 'a3',
        vehicleNumber: 'MH 12 AB 1234',
        acknowledged: true,
        createdAt: '2026-11-04T08:30:00Z',
      },
      { id: 'a4', vehicleNumber: 'MH 12 AB 1234', createdAt: '2026-11-01T08:00:00Z' },
      {
        id: 'a5',
        vehicleNumber: 'MH 12 AB 1234',
        status: 'ACKNOWLEDGED',
        createdAt: '2026-11-04T07:00:00Z',
      },
    ];
    const counts = alertCountsByVehicle(alerts, now);
    expect(counts.get('MH12AB1234')).toBe(2);
  });

  it('counts an alert nobody can place on a truck nowhere', () => {
    const counts = alertCountsByVehicle([{ id: 'a1', createdAt: '2026-11-04T09:00:00Z' }], now);
    expect(counts.size).toBe(0);
  });
});
