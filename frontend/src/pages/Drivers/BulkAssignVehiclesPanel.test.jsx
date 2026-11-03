import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import BulkAssignVehiclesPanel from './BulkAssignVehiclesPanel';
import Service from '@/services/DriverVehicleAssignmentService';

vi.mock('@/services/DriverVehicleAssignmentService', () => ({
  default: { previewBulk: vi.fn(), applyBulk: vi.fn() },
}));
vi.mock('xlsx', () => ({
  read: () => ({ SheetNames: ['Fleet'], Sheets: { Fleet: {} } }),
  utils: {
    sheet_to_json: () => [
      ['Employee', 'Truck', 'Other'],
      ['9876543210', 'WB01AB1234', 'ignored'],
    ],
  },
}));
const preview = {
  dryRun: true,
  effectiveAt: '2026-01-01T00:00:00Z',
  counts: { ready: 1, assigned: 0, skipped: 0, error: 0 },
  rows: [
    {
      rowNumber: 2,
      employee: '9876543210',
      vehicle: 'WB01AB1234',
      employeeName: 'Anil Das',
      status: 'ready',
      message: 'Ready to assign',
    },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  Service.previewBulk.mockResolvedValue(preview);
});
afterEach(cleanup);
async function uploadAndMap() {
  fireEvent.change(screen.getByLabelText('Excel or CSV file'), {
    target: {
      files: [{ name: 'fleet.xlsx', size: 100, arrayBuffer: async () => new ArrayBuffer(1) }],
    },
  });
  await screen.findByText('fleet.xlsx · 1 rows');
  fireEvent.change(screen.getByLabelText('Employee mobile number *'), { target: { value: '0' } });
  fireEvent.change(screen.getByLabelText('Vehicle registration *'), { target: { value: '1' } });
}

describe('Bulk Assign Vehicles panel', () => {
  it('requires mapping, previews without applying and submits the exact reviewed payload', async () => {
    const onAssigned = vi.fn();
    Service.applyBulk.mockResolvedValue({
      ...preview,
      dryRun: false,
      counts: { ...preview.counts, ready: 0, assigned: 1 },
    });
    render(<BulkAssignVehiclesPanel onClose={vi.fn()} onAssigned={onAssigned} />);
    await uploadAndMap();
    expect(Service.previewBulk).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Preview assignments' }));
    await screen.findByText('Anil Das');
    expect(Service.applyBulk).not.toHaveBeenCalled();
    const payload = Service.previewBulk.mock.calls[0][0];
    expect(payload.rows).toEqual([{ rowNumber: 2, employee: '9876543210', vehicle: 'WB01AB1234' }]);
    fireEvent.click(screen.getByRole('button', { name: 'Assign 1 valid rows' }));
    await waitFor(() => expect(onAssigned).toHaveBeenCalledOnce());
    expect(Service.applyBulk).toHaveBeenCalledWith(payload);
    expect(screen.queryByRole('button', { name: 'Assign 1 valid rows' })).not.toBeInTheDocument();
  });
  it('invalidates a preview when mapping changes', async () => {
    render(<BulkAssignVehiclesPanel onClose={vi.fn()} />);
    await uploadAndMap();
    fireEvent.click(screen.getByRole('button', { name: 'Preview assignments' }));
    await screen.findByText('Anil Das');
    fireEvent.change(screen.getByLabelText('Vehicle registration *'), { target: { value: '2' } });
    expect(screen.queryByText('Anil Das')).not.toBeInTheDocument();
    expect(Service.applyBulk).not.toHaveBeenCalled();
  });
  it('requires another preview after an uncertain apply failure', async () => {
    Service.applyBulk.mockRejectedValue(new Error('Network Error'));
    render(<BulkAssignVehiclesPanel onClose={vi.fn()} />);
    await uploadAndMap();
    fireEvent.click(screen.getByRole('button', { name: 'Preview assignments' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Assign 1 valid rows' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Preview again');
    expect(screen.queryByRole('button', { name: 'Assign 1 valid rows' })).not.toBeInTheDocument();
  });
});
