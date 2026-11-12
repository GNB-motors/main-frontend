import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import apiClient from '../../../../utils/axiosConfig';
import { toast } from 'react-toastify';
import ReceiptApprovalDrawer from '../ReceiptApprovalDrawer';

vi.mock('../../../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/** The chat-import row the drawer opens on. */
const chatDraft = {
  _id: 'c1',
  status: 'READY',
  source: 'CHAT_IMPORT',
  vehicleId: null,
  vehicleReg: null,
  phoneE164: '+919876543210',
  createdAt: '2026-11-10T10:00:00Z',
  litres: 120,
  rate: 89.5,
  amount: 10740,
  caption: 'Filled the tank at Jhargram pump',
  pipelineReason: 'The truck could not be read from the photo.',
  pipelineReasons: ['The litres on the photo are not readable.'],
  truck: {
    status: 'AMBIGUOUS',
    bucket: 'AMBIGUOUS',
    plate: 'WB25R9540',
    vehicleId: null,
    source: 'CHAT',
    candidates: [{ vehicleId: 'v2', registrationNumber: 'WB02CD3456', score: 0.6 }],
  },
  photos: [{ id: 'p1', kind: 'pump', url: 'https://example.com/pump.jpg' }],
  time: {
    predicted: {
      at: '2026-11-10T13:10:00.000Z',
      source: 'SENSOR_RISE',
      litres: 218,
      evidence: { sensor: { litres: 120 } },
    },
  },
};

const orgVehicles = [
  { _id: 'v1', registrationNumber: 'WB01AB1234', model: 'Tata 407' },
  { _id: 'v2', registrationNumber: 'WB02CD3456', model: 'Ashok Leyland' },
];

const serveGet = () =>
  apiClient.get.mockImplementation((url) => {
    if (url === '/api/whatsapp/admin/drafts/c1') {
      return Promise.resolve({ data: { data: chatDraft } });
    }
    if (url === '/api/vehicles/options') {
      return Promise.resolve({ data: { data: orgVehicles } });
    }
    return Promise.resolve({ data: { data: {} } });
  });

const renderDrawer = () =>
  render(
    <ReceiptApprovalDrawer
      draftId="c1"
      isOpen
      onClose={() => {}}
      onUpdated={() => {}}
      onPrev={() => {}}
      onNext={() => {}}
      hasPrev={false}
      hasNext={false}
      basePath="/approvals/whatsapp"
      navigate={() => {}}
    />,
  );

const postCalls = (suffix) =>
  apiClient.post.mock.calls.filter(([url]) => url.endsWith(suffix));

describe('ReceiptApprovalDrawer — a chat-import row', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serveGet();
    apiClient.post.mockResolvedValue({ data: { data: { success: true } } });
  });

  it('shows the photos, the caption and the plain-word reasons', async () => {
    renderDrawer();

    expect(await screen.findByText('Check the fill before you approve it')).toBeInTheDocument();
    expect(screen.getByText('Filled the tank at Jhargram pump')).toBeInTheDocument();
    expect(screen.getByText('The truck could not be read from the photo.')).toBeInTheDocument();
    expect(screen.getByText('The litres on the photo are not readable.')).toBeInTheDocument();
    expect(screen.getByAltText('Photo from the chat')).toHaveAttribute(
      'src',
      'https://example.com/pump.jpg',
    );
  });

  it('approves with the values the person changed', async () => {
    renderDrawer();
    await screen.findByText('Check the fill before you approve it');

    // Pick the truck the photo could be, fix the litres and the amount.
    fireEvent.change(screen.getByLabelText('Truck'), { target: { value: 'v2' } });
    fireEvent.change(screen.getByLabelText('Litres'), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '13425' } });
    fireEvent.change(screen.getByLabelText('Filling type'), { target: { value: 'PARTIAL' } });

    fireEvent.click(screen.getByRole('button', { name: /Approve & Publish/i }));

    await waitFor(() => expect(postCalls('/publish')).toHaveLength(1));
    expect(postCalls('/publish')[0][1]).toEqual({
      vehicleId: 'v2',
      truckPlate: 'WB25R9540',
      litres: 150,
      amount: 13425,
      fillingType: 'PARTIAL',
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('accepts the predicted time with the approve', async () => {
    renderDrawer();
    await screen.findByText('Check the fill before you approve it');

    fireEvent.click(screen.getByRole('button', { name: 'Use the predicted time' }));
    fireEvent.click(screen.getByRole('button', { name: /Approve & Publish/i }));

    await waitFor(() => expect(postCalls('/publish')).toHaveLength(1));
    expect(postCalls('/publish')[0][1]).toMatchObject({ time: { action: 'accept' } });
  });

  it('accepts the suggested time and litres in one click', async () => {
    renderDrawer();
    await screen.findByText('Check the fill before you approve it');

    fireEvent.click(screen.getByRole('button', { name: 'Accept suggested time and 218 L' }));
    fireEvent.click(screen.getByRole('button', { name: /Approve & Publish/i }));

    await waitFor(() => expect(postCalls('/publish')).toHaveLength(1));
    expect(postCalls('/publish')[0][1]).toMatchObject({ time: { action: 'accept' }, litres: 218 });
  });

  it('keeps a row that is not a fill, and says that it is kept', async () => {
    renderDrawer();
    await screen.findByText('Check the fill before you approve it');

    fireEvent.click(screen.getByRole('button', { name: 'Not a fill' }));
    expect(
      screen.getByText(/The photo is not deleted — it stays in the inbox/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Keep as not a fill' }));

    await waitFor(() => expect(postCalls('/reject')).toHaveLength(1));
    expect(postCalls('/reject')[0][0]).toBe('/api/whatsapp/admin/drafts/c1/reject');
  });

  it('marks a row as a market truck', async () => {
    renderDrawer();
    await screen.findByText('Check the fill before you approve it');

    fireEvent.click(screen.getByRole('button', { name: 'Market truck' }));

    await waitFor(() => expect(postCalls('/market')).toHaveLength(1));
    expect(postCalls('/market')[0][0]).toBe('/api/whatsapp/admin/drafts/c1/market');
  });

  it('shows the server refusal in plain words instead of a success', async () => {
    apiClient.post.mockResolvedValue({
      data: {
        data: {
          success: false,
          message: 'The time on this photo is only predicted — accept it or type the real time.',
        },
      },
    });
    renderDrawer();
    await screen.findByText('Check the fill before you approve it');

    fireEvent.click(screen.getByRole('button', { name: /Approve & Publish/i }));

    expect(
      await screen.findByText(
        'The time on this photo is only predicted — accept it or type the real time.',
      ),
    ).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
