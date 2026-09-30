import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import VehicleDashboardPanel from './VehicleDashboardPanel';

describe('VehicleDashboardPanel', () => {
  const dummyVehicle = {
    _id: 'veh-123',
    registrationNumber: 'WB25R9540',
    model: '4928.S',
    manufacturer: 'TATA',
    chassisNumber: 'MAT123456789',
    ownerName: 'ADITYA SHARMA',
    documents: {
      RC: { uploaded: true, expiryDate: '2030-01-01', ocrStatus: 'SUCCESS' },
      INSURANCE: { uploaded: false },
    },
  };

  it('renders the empty state when no vehicle is selected', () => {
    render(
      <VehicleDashboardPanel
        selectedVehicle={null}
        selectedDocKey={null}
        onSelectDoc={vi.fn()}
        onBackToOverview={vi.fn()}
        onClose={vi.fn()}
        onManageVehicle={vi.fn()}
        onOpenChallanModal={vi.fn()}
      />,
    );

    expect(screen.getByText('No vehicle selected')).toBeInTheDocument();
    expect(
      screen.getByText(/Select any vehicle to view all document & challan details/i),
    ).toBeInTheDocument();
  });

  it('renders vehicle overview mode with challans and document cards when selected', () => {
    const onSelectDoc = vi.fn();
    const onOpenChallanModal = vi.fn();

    render(
      <VehicleDashboardPanel
        selectedVehicle={dummyVehicle}
        selectedDocKey={null}
        onSelectDoc={onSelectDoc}
        onBackToOverview={vi.fn()}
        onClose={vi.fn()}
        onManageVehicle={vi.fn()}
        onOpenChallanModal={onOpenChallanModal}
      />,
    );

    expect(screen.getByText('Documents & Challan')).toBeInTheDocument();
    expect(screen.getByText('WB25R9540')).toBeInTheDocument();
    expect(screen.getByText(/0 Pending Challans worth/i)).toBeInTheDocument();
    expect(screen.getByText('Vehicle Documents')).toBeInTheDocument();
    expect(screen.getByText('Registration Certificate')).toBeInTheDocument();

    // Clicking document card triggers onSelectDoc
    fireEvent.click(screen.getByText('Registration Certificate'));
    expect(onSelectDoc).toHaveBeenCalledWith('RC');

    // Clicking check live status opens challan modal
    fireEvent.click(screen.getByText('Check Live Status'));
    expect(onOpenChallanModal).toHaveBeenCalled();
  });

  it('renders document detail mode when a docKey is selected', () => {
    const onBackToOverview = vi.fn();

    render(
      <VehicleDashboardPanel
        selectedVehicle={dummyVehicle}
        selectedDocKey="RC"
        onSelectDoc={vi.fn()}
        onBackToOverview={onBackToOverview}
        onClose={vi.fn()}
        onManageVehicle={vi.fn()}
        onOpenChallanModal={vi.fn()}
      />,
    );

    expect(screen.getByText('Registration Certificate')).toBeInTheDocument();
    expect(screen.getByText(/Scanned Document Photo/i)).toBeInTheDocument();
    expect(screen.getByText('All Documents')).toBeInTheDocument();

    fireEvent.click(screen.getByText('All Documents'));
    expect(onBackToOverview).toHaveBeenCalled();
  });
});
