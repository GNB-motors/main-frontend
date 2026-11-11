import { changeField } from '@/test/changeField';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import BulkAssignVehiclesPanel from './BulkAssignVehiclesPanel';
import Service from '@/services/DriverVehicleAssignmentService';
import DataImportService from '@/services/DataImportService';

vi.mock('@/services/DriverVehicleAssignmentService', () => ({
  default: { previewBulk: vi.fn(), applyBulk: vi.fn() },
}));
vi.mock('@/services/DataImportService', () => ({
  default: { preview: vi.fn() },
}));
vi.mock('xlsx', () => ({
  read: () => ({ SheetNames: ['Fleet'], Sheets: { Fleet: {} } }),
  utils: {
    sheet_to_json: () => [
      ['Name', 'Mobile', 'DL Number', 'Aadhaar', 'Vehicle'],
      ['Anil Das', '9876543210', 'DL123', '123456789012', 'WB01AB1234'],
      ['Sunil Das', '9876543211', 'DL124', '123456789013', 'WB01AB1235'],
    ],
  },
}));
const readyRow = {
  rowNumber: 2,
  name: 'Anil Das',
  phone: '9876543210',
  licence: 'DL123',
  aadhaar: '123456789012',
  vehicle: 'WB01AB1234',
  status: 'ready',
  message: 'Ready to assign',
};
const unsureRow = {
  rowNumber: 3,
  name: 'Sunil Das',
  phone: '9876543211',
  vehicle: 'WB01AB1235',
  status: 'error',
  code: 'did_you_mean',
  message: 'More than one driver looks like this',
  candidates: [
    { userId: 'u1', name: 'Sunil Das', phone: '9876543211', matched: ['name', 'phone'] },
    { userId: 'u2', name: 'Sunil Kumar', phone: '9999999999', matched: ['name'] },
  ],
};
const readyPreview = {
  dryRun: true,
  effectiveAt: '2026-01-01T00:00:00Z',
  counts: { ready: 1, assigned: 0, skipped: 0, error: 0 },
  rows: [readyRow],
};
const unsurePreview = {
  dryRun: true,
  effectiveAt: '2026-01-01T00:00:00Z',
  counts: { ready: 1, assigned: 0, skipped: 0, error: 1 },
  rows: [readyRow, unsureRow],
};
beforeEach(() => {
  vi.clearAllMocks();
  Service.previewBulk.mockResolvedValue(readyPreview);
  DataImportService.preview.mockResolvedValue({});
});
afterEach(cleanup);
async function uploadAndMap() {
  changeField(screen.getByLabelText('Excel, CSV or photos'), {
    target: {
      files: [{ name: 'fleet.xlsx', size: 100, arrayBuffer: async () => new ArrayBuffer(1) }],
    },
  });
  await screen.findByText('fleet.xlsx · 2 rows');
  // Column detection resolves after the file shows and re-renders the column
  // pickers; picking before it lands races the dropdown under a loaded run.
  await waitFor(() => expect(DataImportService.preview).toHaveBeenCalled());
  await act(async () => {});
  changeField(screen.getByLabelText('Name (optional)'), { target: { value: '0' } });
  changeField(screen.getByLabelText('Mobile number (optional)'), { target: { value: '1' } });
  changeField(screen.getByLabelText('DL number (optional)'), { target: { value: '2' } });
  changeField(screen.getByLabelText('Aadhaar number (optional)'), { target: { value: '3' } });
  changeField(screen.getByLabelText('Vehicle registration *'), { target: { value: '4' } });
}

describe('Bulk Assign Vehicles panel', () => {
  it('prefills the columns the server detected', async () => {
    DataImportService.preview.mockResolvedValue({
      detectedMapping: { Name: 'name', Mobile: 'phone', Vehicle: 'vehicle' },
    });
    render(<BulkAssignVehiclesPanel onClose={vi.fn()} />);
    changeField(screen.getByLabelText('Excel, CSV or photos'), {
      target: {
        files: [{ name: 'fleet.xlsx', size: 100, arrayBuffer: async () => new ArrayBuffer(1) }],
      },
    });
    await screen.findByText('fleet.xlsx · 2 rows');
    const columnValue = (label) => screen.getByLabelText(label).nextElementSibling.value;
    await waitFor(() => expect(columnValue('Name (optional)')).toBe('0'));
    expect(columnValue('Mobile number (optional)')).toBe('1');
    expect(columnValue('Vehicle registration *')).toBe('4');
    expect(columnValue('DL number (optional)')).toBe('');
  });
  it('sends every person column with the vehicle and submits the exact reviewed payload', async () => {
    const onAssigned = vi.fn();
    Service.applyBulk.mockResolvedValue({
      ...readyPreview,
      dryRun: false,
      counts: { ...readyPreview.counts, ready: 0, assigned: 1 },
    });
    render(<BulkAssignVehiclesPanel onClose={vi.fn()} onAssigned={onAssigned} />);
    await uploadAndMap();
    expect(Service.previewBulk).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Preview assignments' }));
    await screen.findByText('Anil Das');
    expect(Service.applyBulk).not.toHaveBeenCalled();
    const payload = Service.previewBulk.mock.calls[0][0];
    expect(payload.rows[0]).toEqual({
      rowNumber: 2,
      name: 'Anil Das',
      phone: '9876543210',
      licence: 'DL123',
      aadhaar: '123456789012',
      vehicle: 'WB01AB1234',
    });
    expect(payload.rows[1].name).toBe('Sunil Das');
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
    changeField(screen.getByLabelText('Vehicle registration *'), { target: { value: '0' } });
    expect(screen.queryByText('Anil Das')).not.toBeInTheDocument();
    expect(Service.applyBulk).not.toHaveBeenCalled();
  });
  it('asks who we meant, then sends the chosen driver on the next preview', async () => {
    Service.previewBulk.mockResolvedValue(unsurePreview);
    render(<BulkAssignVehiclesPanel onClose={vi.fn()} />);
    await uploadAndMap();
    fireEvent.click(screen.getByRole('button', { name: 'Preview assignments' }));
    await screen.findByText('Did you mean one of these drivers?');
    expect(screen.getByRole('button', { name: 'Assign 1 valid rows' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Did you mean for row 3'), { target: { value: 'u1' } });
    expect(screen.getByRole('button', { name: 'Assign 1 valid rows' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Preview assignments' }));
    await waitFor(() => expect(Service.previewBulk).toHaveBeenCalledTimes(2));
    expect(Service.previewBulk.mock.calls[1][0].rows[1].userId).toBe('u1');
    expect(screen.getByRole('button', { name: 'Assign 1 valid rows' })).toBeEnabled();
  });
  it('leaves the row out when the manager says none of these', async () => {
    Service.previewBulk.mockResolvedValue(unsurePreview);
    render(<BulkAssignVehiclesPanel onClose={vi.fn()} />);
    await uploadAndMap();
    fireEvent.click(screen.getByRole('button', { name: 'Preview assignments' }));
    await screen.findByText('Did you mean one of these drivers?');
    fireEvent.change(screen.getByLabelText('Did you mean for row 3'), { target: { value: 'none' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview assignments' }));
    await waitFor(() => expect(Service.previewBulk).toHaveBeenCalledTimes(2));
    expect(Service.previewBulk.mock.calls[1][0].rows[1]).not.toHaveProperty('userId');
    expect(screen.getByRole('button', { name: 'Assign 1 valid rows' })).toBeEnabled();
  });
  it('never shows a full Aadhaar number', async () => {
    render(<BulkAssignVehiclesPanel onClose={vi.fn()} />);
    await uploadAndMap();
    fireEvent.click(screen.getByRole('button', { name: 'Preview assignments' }));
    await screen.findByText('Anil Das');
    expect(screen.queryByText(/123456789012/)).not.toBeInTheDocument();
    expect(screen.getByText(/XXXX9012/)).toBeInTheDocument();
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
