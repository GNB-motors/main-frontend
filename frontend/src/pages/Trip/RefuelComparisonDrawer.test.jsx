import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import RefuelComparisonDrawer from './RefuelComparisonDrawer';

describe('RefuelComparisonDrawer', () => {
  const verifiedLog = {
    id: 'log_1',
    verificationStatus: 'VERIFIED',
    vehicleNo: 'WB25V8040',
    date: '2026-10-01',
    time: '10:00 AM',
    quantity: 120,
    rawLitres: 120,
    slip: {
      litres: 120,
      totalAmount: 11400,
      rate: 95,
      location: 'IOCL Dankuni',
      submissionChannel: 'APP',
      documentId: 'doc123',
    },
    sensor: {
      litres: 118,
      billVarianceL: 2,
      fuelPumpName: 'Dankuni Highway Pump',
      confirmationStatus: 'CONFIRMED',
      lat: 22.57,
      lng: 88.36,
    },
  };

  it('renders nothing when closed or log is null', () => {
    const { container: c1 } = render(
      <RefuelComparisonDrawer open={false} log={verifiedLog} onClose={() => {}} />,
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <RefuelComparisonDrawer open={true} log={null} onClose={() => {}} />,
    );
    expect(c2.firstChild).toBeNull();
  });

  it('renders verified reconciliation banner and matched values', () => {
    render(<RefuelComparisonDrawer open={true} log={verifiedLog} onClose={() => {}} />);
    expect(screen.getByText(/Verified Reconciliation/i)).toBeInTheDocument();
    expect(screen.getByText('120 L')).toBeInTheDocument();
    expect(screen.getByText('118 L')).toBeInTheDocument();
    expect(screen.getByText('IOCL Dankuni')).toBeInTheDocument();
    expect(screen.getByText('Dankuni Highway Pump')).toBeInTheDocument();
    expect(screen.getByText(/₹11,400/)).toBeInTheDocument();
  });

  it('renders flagged banner when verificationStatus is FLAGGED', () => {
    const flaggedLog = {
      ...verifiedLog,
      verificationStatus: 'FLAGGED',
      slip: { ...verifiedLog.slip, litres: 200 },
      sensor: { ...verifiedLog.sensor, litres: 150, billVarianceL: 50, billFlag: true },
    };
    render(<RefuelComparisonDrawer open={true} log={flaggedLog} onClose={() => {}} />);
    expect(screen.getByText(/Flagged: High Variance/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Bill claims 200 L, but the tank sensor detected 150 L/i),
    ).toBeInTheDocument();
  });

  it('renders unverified refill state when sensor-only', () => {
    const unverifiedLog = {
      id: 'fill_1',
      source: 'SENSOR',
      verificationStatus: 'UNVERIFIED',
      vehicleNo: 'KA01AB1234',
      date: '2026-10-01',
      time: '11:00 AM',
      quantity: 85,
      rawLitres: 85,
      slip: null,
      sensor: {
        litres: 85,
        confirmationStatus: 'ESTIMATED',
        fuelPumpName: 'Highway Fuel Station',
      },
    };
    render(<RefuelComparisonDrawer open={true} log={unverifiedLog} onClose={() => {}} />);
    expect(screen.getByText(/Unverified Refill/i)).toBeInTheDocument();
    expect(screen.getByText(/No bill uploaded yet/i)).toBeInTheDocument();
    expect(screen.getByText('AWAITING SLIP')).toBeInTheDocument();
    expect(screen.getByText('Pending Slip Upload')).toBeInTheDocument();
    expect(screen.queryByText('0 L')).toBeNull();
    expect(screen.queryByText('APP')).toBeNull();
    expect(screen.queryByText(/Billed Volume/i)).toBeNull();
    expect(screen.getByText('85 L')).toBeInTheDocument();
  });

  it('renders slip-only state when bill exists without sensor data', () => {
    const slipOnlyLog = {
      id: 'log_2',
      verificationStatus: 'SLIP_ONLY',
      vehicleNo: 'WB25V8040',
      slip: {
        litres: 40,
        totalAmount: 3800,
        location: 'Local Bunk',
      },
      sensor: null,
    };
    render(<RefuelComparisonDrawer open={true} log={slipOnlyLog} onClose={() => {}} />);
    expect(screen.getByText(/Slip Only \(No Telematics Event\)/i)).toBeInTheDocument();
    expect(screen.getByText(/No sensor telemetry match/i)).toBeInTheDocument();
    expect(screen.getByText('40 L')).toBeInTheDocument();
  });

  it('triggers onViewPhoto when View Uploaded Photo is clicked', () => {
    const onViewPhoto = vi.fn();
    render(
      <RefuelComparisonDrawer
        open={true}
        log={verifiedLog}
        onClose={() => {}}
        onViewPhoto={onViewPhoto}
      />,
    );
    const photoBtn = screen.getByRole('button', { name: /View Uploaded Photo/i });
    fireEvent.click(photoBtn);
    expect(onViewPhoto).toHaveBeenCalledWith(verifiedLog);
  });

  it('triggers onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<RefuelComparisonDrawer open={true} log={verifiedLog} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /Close panel/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
