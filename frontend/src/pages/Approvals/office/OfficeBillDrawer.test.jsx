import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import billPhotoService from '../../../services/billPhotoService';
import OfficeBillDrawer from './OfficeBillDrawer';

vi.mock('../../../services/billPhotoService', () => ({
  default: {
    getBillPage: vi.fn(),
    getBillSuggestion: vi.fn(),
    saveBillLinks: vi.fn(),
    editBillLink: vi.fn(),
    getBillLinkHistory: vi.fn(),
  },
}));

const PENDING = {
  id: 'cap-1',
  status: 'pending',
  thumbnailUrl: '/api/fleet-view/bills/cap-1/pages/0',
  uploadedBy: { name: 'Asha', role: 'OWNER' },
  ocr: { litres: 180, amount: 4500, printedDate: '2026-11-01', pump: 'HP Pump 3' },
};

const CONFIRMED = {
  ...PENDING,
  link: {
    registrationNumber: 'WB11F6762',
    by: { name: 'Ravi', role: 'MANAGER' },
    via: 'APPROVALS',
  },
};

const SUGGESTION = {
  decision: 'ASK',
  askReason: 'NO_PRINTED_TIME',
  candidates: [
    {
      registrationNumber: 'WB11F6762',
      score: 0.92,
      reasons: ['the plate on the bill', 'the truck was at the pump'],
    },
    { registrationNumber: 'MH12AB1234', score: 0.4, reasons: ['the digits on the bill'] },
  ],
};

describe('the office bill drawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:photo');
    globalThis.URL.revokeObjectURL = vi.fn();
    billPhotoService.getBillPage.mockRejectedValue(new Error('no photo'));
    billPhotoService.getBillSuggestion.mockResolvedValue(SUGGESTION);
  });

  it('shows the truck suggestions as selectable rows with the reasons on their own lines', async () => {
    render(<OfficeBillDrawer capture={PENDING} open onClose={vi.fn()} vehicles={[]} />);
    const first = await screen.findByRole('button', { name: /WB11F6762/ });
    expect(first).toHaveTextContent('Strong match');
    expect(screen.getByText('the plate on the bill')).toBeInTheDocument();
    expect(screen.getByText('the truck was at the pump')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /MH12AB1234/ })).toHaveTextContent('Weak match');
  });

  it('says that it could not suggest a truck when there are none', async () => {
    billPhotoService.getBillSuggestion.mockResolvedValue({ decision: 'ASK', candidates: [] });
    render(<OfficeBillDrawer capture={PENDING} open onClose={vi.fn()} vehicles={[]} />);
    expect(
      await screen.findByText('We could not suggest a truck for this bill — pick one below.'),
    ).toBeInTheDocument();
  });

  it('requires an explicit truck choice before confirming', async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
    try {
      render(<OfficeBillDrawer capture={PENDING} open onClose={vi.fn()} vehicles={[]} />);
      const suggestion = await screen.findByRole('button', { name: /WB11F6762/ });
      expect(suggestion).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(screen.getByRole('button', { name: /^Confirm$/ }));

      expect(screen.getByRole('alert')).toHaveTextContent('Key field missing: Truck');
      expect(billPhotoService.saveBillLinks).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /^Confirm$/ })).toHaveClass(
        'ra-btn--blocked',
        'ra-btn--shake',
      );
      expect(vibrate).toHaveBeenCalledWith(200);
      expect(document.activeElement).toBe(screen.getByLabelText('Truck'));
    } finally {
      delete navigator.vibrate;
    }
  });

  it('confirms the chosen truck, and shows that it is confirming', async () => {
    let resolveSave;
    billPhotoService.saveBillLinks.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const onSaved = vi.fn();
    render(
      <OfficeBillDrawer capture={PENDING} open onClose={vi.fn()} onSaved={onSaved} vehicles={[]} />,
    );
    const suggestion = await screen.findByRole('button', { name: /WB11F6762/ });
    fireEvent.click(suggestion);
    fireEvent.click(screen.getByRole('button', { name: /Confirm/ }));
    await waitFor(() => expect(screen.getByText('Confirming.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Confirming\./ })).toBeDisabled();
    expect(billPhotoService.saveBillLinks).toHaveBeenCalledWith([
      {
        captureId: 'cap-1',
        registrationNumber: 'WB11F6762',
        reason: null,
        via: 'APPROVALS',
      },
    ]);
    resolveSave({});
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('cap-1'));
  });

  it('keeps the drawer and the choice when the confirm fails', async () => {
    billPhotoService.saveBillLinks.mockRejectedValue(new Error('offline'));
    const onClose = vi.fn();
    render(<OfficeBillDrawer capture={PENDING} open onClose={onClose} vehicles={[]} />);
    const suggestion = await screen.findByRole('button', { name: /WB11F6762/ });
    fireEvent.click(suggestion);
    fireEvent.click(screen.getByRole('button', { name: /Confirm/ }));
    expect(await screen.findByText('Could not confirm. Try again.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /WB11F6762/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('changes the truck of a confirmed bill, with a reason', async () => {
    billPhotoService.editBillLink.mockResolvedValue({});
    const onSaved = vi.fn();
    render(
      <OfficeBillDrawer
        capture={CONFIRMED}
        open
        onClose={vi.fn()}
        onSaved={onSaved}
        vehicles={[{ _id: 'v1', registrationNumber: 'MH12AB1234' }]}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Change truck' }));
    const save = screen.getByRole('button', { name: /Save change/ });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Reason (required)'), {
      target: { value: 'the bill is for the other truck' },
    });
    fireEvent.change(screen.getByLabelText('Change truck'), {
      target: { value: 'MH12AB1234' },
    });
    fireEvent.click(save);
    await waitFor(() =>
      expect(billPhotoService.editBillLink).toHaveBeenCalledWith('cap-1', {
        registrationNumber: 'MH12AB1234',
        reason: 'the bill is for the other truck',
      }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('cap-1'));
  });

  it('says when the link of a confirmed bill cannot be changed', async () => {
    billPhotoService.editBillLink.mockRejectedValue({ response: { status: 409 } });
    render(
      <OfficeBillDrawer
        capture={CONFIRMED}
        open
        onClose={vi.fn()}
        vehicles={[{ _id: 'v1', registrationNumber: 'MH12AB1234' }]}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Change truck' }));
    fireEvent.change(screen.getByLabelText('Reason (required)'), {
      target: { value: 'the bill is for the other truck' },
    });
    fireEvent.change(screen.getByLabelText('Change truck'), {
      target: { value: 'MH12AB1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save change/ }));
    expect(await screen.findByText(/This link cannot be changed/)).toBeInTheDocument();
  });

  it('closes on a press of the dimmed background, but not on a press inside the panel', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <OfficeBillDrawer capture={PENDING} open onClose={onClose} vehicles={[]} />,
    );
    await screen.findByRole('button', { name: /WB11F6762/ });

    fireEvent.mouseDown(container.querySelector('.ra-drawer'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(container.querySelector('.ra-drawer-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the drawer open and says so when there are unsaved changes', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <OfficeBillDrawer capture={PENDING} open onClose={onClose} vehicles={[]} />,
    );
    // A truck picked but not confirmed yet is work that would be lost.
    fireEvent.click(await screen.findByRole('button', { name: /WB11F6762/ }));

    fireEvent.mouseDown(container.querySelector('.ra-drawer-backdrop'));

    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByText('You have unsaved changes')).toBeInTheDocument();
  });

  it('shows the confirmed truck and hides the suggestions for a confirmed bill', async () => {
    render(<OfficeBillDrawer capture={CONFIRMED} open onClose={vi.fn()} vehicles={[]} />);
    expect(await screen.findByText('Truck: WB11F6762 · confirmed by Ravi')).toBeInTheDocument();
    expect(screen.queryByText('Truck suggestions')).not.toBeInTheDocument();
    // The change-truck card shows the truck it sits on, with a Change button.
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
    expect(screen.getAllByText('WB11F6762').length).toBeGreaterThan(0);
  });

  it('opens the log of a confirmed bill', async () => {
    const onHistory = vi.fn();
    render(
      <OfficeBillDrawer
        capture={CONFIRMED}
        open
        onClose={vi.fn()}
        onHistory={onHistory}
        vehicles={[]}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: /Log/ }));
    expect(onHistory).toHaveBeenCalledWith(CONFIRMED);
  });
});
