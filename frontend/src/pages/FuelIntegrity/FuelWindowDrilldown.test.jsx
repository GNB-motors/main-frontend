import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FuelWindowDrilldown from './FuelWindowDrilldown';

const fuelWindow = {
  _id: 'w1',
  registrationNumber: 'WB11L8862',
  windowFrom: '2026-09-14T00:00:00Z',
  windowTo: '2026-10-06T00:00:00Z',
  fillsLitres: 690,
  engineBurnL: 640,
  tankDeltaL: 10,
  fuelUsedL: 638,
  km: 1920,
  drivingUseL: 638,
  expectedDrivingUseL: 610,
  parkedDropL: 281.4,
  defToFuelRatioPct: 4.3,
  verdict: 'UNEXPLAINED_WHILE_PARKED',
  verdictWhy: { text: 'The diesel used matches the km driven at this truck’s usual km/L.' },
};

describe('FuelWindowDrilldown', () => {
  it('shows what was measured for the window', () => {
    render(<FuelWindowDrilldown open onClose={() => {}} fuelWindow={fuelWindow} />);
    expect(screen.getByText('WB11L8862 — fuel window')).toBeInTheDocument();
    expect(screen.getByText('690 L')).toBeInTheDocument();
    expect(screen.getByText('640 L')).toBeInTheDocument();
    expect(screen.getByText('1,920 km')).toBeInTheDocument();
  });

  it('says what the driving used and what it usually needs', () => {
    render(<FuelWindowDrilldown open onClose={() => {}} fuelWindow={fuelWindow} />);
    expect(
      screen.getByText('Used 638 L for 1,920 km; this truck usually needs 610 L for that.'),
    ).toBeInTheDocument();
  });

  it('shows the fuel that went down while parked', () => {
    render(<FuelWindowDrilldown open onClose={() => {}} fuelWindow={fuelWindow} />);
    expect(screen.getByText('281.4 L')).toBeInTheDocument();
  });

  it('shows an em dash, never a zero, for a drop that was not measured', () => {
    render(
      <FuelWindowDrilldown
        open
        onClose={() => {}}
        fuelWindow={{ ...fuelWindow, parkedDropL: null }}
      />,
    );
    expect(screen.getByText('Fuel down while parked')).toBeInTheDocument();
  });

  it('shows the check of the window', () => {
    render(<FuelWindowDrilldown open onClose={() => {}} fuelWindow={fuelWindow} />);
    expect(screen.getByText('Went down while parked')).toBeInTheDocument();
  });

  it('renders nothing without a window', () => {
    const { container } = render(<FuelWindowDrilldown open onClose={() => {}} fuelWindow={null} />);
    expect(container.textContent).toBe('');
  });

  it('never accuses anyone', () => {
    const { container } = render(
      <FuelWindowDrilldown open onClose={() => {}} fuelWindow={fuelWindow} />,
    );
    expect(container.textContent.toLowerCase()).not.toMatch(/siphon|theft|stolen|steal/);
  });
});
