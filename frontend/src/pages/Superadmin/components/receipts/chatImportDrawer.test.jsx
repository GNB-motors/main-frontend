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

const renderDrawer = (overrides = {}) =>
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
      {...overrides}
    />,
  );

const postCalls = (suffix) => apiClient.post.mock.calls.filter(([url]) => url.endsWith(suffix));

describe('ReceiptApprovalDrawer — a chat-import row', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serveGet();
    apiClient.post.mockResolvedValue({ data: { data: { success: true } } });
  });

  it('shows the photos, the caption and the plain-word reasons', async () => {
    renderDrawer();

    expect(await screen.findByText('Check the fill before you approve it')).toBeInTheDocument();
    // The reasons and the caption live in the folding sections of the drawer.
    fireEvent.click(screen.getByRole('button', { name: /^Checks/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Audit/ }));
    expect(screen.getByText('Filled the tank at Jhargram pump')).toBeInTheDocument();
    expect(screen.getByText('The truck could not be read from the photo.')).toBeInTheDocument();
    expect(screen.getByText('The litres on the photo are not readable.')).toBeInTheDocument();
    expect(screen.getByAltText('Photo from the chat')).toHaveAttribute(
      'src',
      'https://example.com/pump.jpg',
    );
  });

  it('approves with the values the person changed', async () => {
    const { container } = renderDrawer();
    await screen.findByText('Check the fill before you approve it');

    // Pick the truck the photo could be, fix the litres and the amount.
    const truckSelect = container.querySelector('#ra-chat-truck--native');
    fireEvent.change(truckSelect, { target: { value: 'v2' } });
    fireEvent.change(screen.getByLabelText('Litres'), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '13425' } });
    fireEvent.change(screen.getByLabelText('Full tank or top-up?'), {
      target: { value: 'PARTIAL' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use suggested time' }));

    fireEvent.click(screen.getByRole('button', { name: /Approve & Publish/i }));

    await waitFor(() => expect(postCalls('/publish')).toHaveLength(1));
    expect(postCalls('/publish')[0][1]).toEqual({
      vehicleId: 'v2',
      truckPlate: 'WB25R9540',
      litres: 150,
      amount: 13425,
      fillingType: 'PARTIAL',
      time: { action: 'accept' },
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('blocks approval and focuses the first missing key field', async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
    try {
      renderDrawer();
      await screen.findByText('Check the fill before you approve it');

      const approve = screen.getByRole('button', { name: /Approve & Publish/i });
      fireEvent.click(approve);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Key field missing: Truck, Fill time',
      );
      expect(postCalls('/publish')).toHaveLength(0);
      expect(screen.getByRole('button', { name: /Approve & Publish/i })).toHaveClass(
        'ra-btn--blocked',
        'ra-btn--shake',
      );
      expect(vibrate).toHaveBeenCalledWith(200);
      expect(document.activeElement?.closest('[data-key-field="TRUCK"]')).not.toBeNull();
    } finally {
      delete navigator.vibrate;
    }
  });

  it('uses the same blocked feedback when the server returns 422', async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
    apiClient.post.mockRejectedValue({
      response: { status: 422, data: { missing: ['TRUCK', 'FILL_TIME'] } },
    });
    const { container } = renderDrawer();
    await screen.findByText('Check the fill before you approve it');
    fireEvent.change(container.querySelector('#ra-chat-truck--native'), {
      target: { value: 'v2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use suggested time' }));

    fireEvent.click(screen.getByRole('button', { name: /Approve & Publish/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Key field missing: Truck, Fill time',
    );
    expect(postCalls('/publish')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Approve & Publish/i })).toHaveClass(
      'ra-btn--blocked',
      'ra-btn--shake',
    );
    expect(vibrate).toHaveBeenCalledWith(200);
    expect(document.activeElement?.closest('[data-key-field="TRUCK"]')).not.toBeNull();
    delete navigator.vibrate;
  });

  it('reads the missing key fields the server sends inside the body', async () => {
    apiClient.post.mockRejectedValue({
      response: {
        status: 422,
        data: {
          success: false,
          message: 'Key field missing: Truck, Fill time',
          data: { missing: ['TRUCK', 'FILL_TIME'] },
        },
      },
    });
    const { container } = renderDrawer();
    await screen.findByText('Check the fill before you approve it');
    fireEvent.change(container.querySelector('#ra-chat-truck--native'), {
      target: { value: 'v2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use suggested time' }));

    fireEvent.click(screen.getByRole('button', { name: /Approve & Publish/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Key field missing: Truck, Fill time',
    );
    expect(postCalls('/publish')).toHaveLength(1);
  });

  it('closes on a press of the dimmed background, but not on a press inside the panel', async () => {
    const onClose = vi.fn();
    const { container } = renderDrawer({ onClose });
    await screen.findByText('Check the fill before you approve it');

    fireEvent.mouseDown(container.querySelector('.ra-drawer'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(container.querySelector('.ra-drawer-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the drawer open and says so when the person has unsaved changes', async () => {
    const onClose = vi.fn();
    const { container } = renderDrawer({ onClose });
    await screen.findByText('Check the fill before you approve it');

    fireEvent.change(container.querySelector('#ra-chat-truck--native'), {
      target: { value: 'v2' },
    });
    fireEvent.mouseDown(container.querySelector('.ra-drawer-backdrop'));

    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByText('You have unsaved changes')).toBeInTheDocument();
  });

  it('accepts the predicted time with the approve', async () => {
    const { container } = renderDrawer();
    await screen.findByText('Check the fill before you approve it');

    fireEvent.change(container.querySelector('#ra-chat-truck--native'), {
      target: { value: 'v2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use suggested time' }));
    fireEvent.click(screen.getByRole('button', { name: /Approve & Publish/i }));

    await waitFor(() => expect(postCalls('/publish')).toHaveLength(1));
    expect(postCalls('/publish')[0][1]).toMatchObject({ time: { action: 'accept' } });
  });

  it('accepts the suggested time and litres in one click', async () => {
    const { container } = renderDrawer();
    await screen.findByText('Check the fill before you approve it');

    fireEvent.change(container.querySelector('#ra-chat-truck--native'), {
      target: { value: 'v2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use suggested time and 218 L' }));
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
    const { container } = renderDrawer();
    await screen.findByText('Check the fill before you approve it');

    fireEvent.change(container.querySelector('#ra-chat-truck--native'), {
      target: { value: 'v2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use suggested time' }));
    fireEvent.click(screen.getByRole('button', { name: /Approve & Publish/i }));

    expect(
      await screen.findByText(
        'The time on this photo is only predicted — accept it or type the real time.',
      ),
    ).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
