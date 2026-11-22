import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IdentifyJourneyPlaceDialog from './IdentifyJourneyPlaceDialog';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService';

const { confirm } = vi.hoisted(() => ({ confirm: vi.fn() }));
vi.mock('../../components/ui/confirmContext', () => ({ useConfirm: () => confirm }));
vi.mock('../PlaceHub/intelligence/PlaceIntelligenceService', () => ({
  default: { identifyStopPlace: vi.fn(), identifyTrackPointPlace: vi.fn() },
}));
beforeEach(() => vi.resetAllMocks());

async function fillNameAndType() {
  fireEvent.change(screen.getByRole('textbox', { name: 'Place name' }), {
    target: { value: '  Dankuni yard  ' },
  });
  fireEvent.click(screen.getByRole('combobox', { name: 'Place type' }));
  const option = await screen.findByRole('option', { name: 'Warehouse' });
  // The type picker only commits the option that is highlighted, and a pointer
  // move is what highlights it in a test.
  fireEvent.mouseMove(option);
  fireEvent.pointerDown(option, { pointerType: 'mouse' });
  fireEvent.click(option);
}

it('uses the shared naming form and preserves the journey naming request', async () => {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  PlaceIntelligenceService.identifyStopPlace.mockResolvedValue({ placeId: 'saved' });
  render(
    <IdentifyJourneyPlaceDialog stop={{ stopId: 'stop-1' }} onSaved={onSaved} onClose={onClose} />,
  );
  await fillNameAndType();
  fireEvent.click(screen.getByRole('button', { name: 'Save place' }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ placeId: 'saved' }));
  expect(PlaceIntelligenceService.identifyStopPlace).toHaveBeenCalledWith({
    id: 'stop-1',
    name: 'Dankuni yard',
    siteType: 'WAREHOUSE',
  });
  expect(onClose).toHaveBeenCalledOnce();
});

it('keeps the entered name available when warehouse impact confirmation is cancelled', async () => {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  PlaceIntelligenceService.identifyTrackPointPlace.mockRejectedValue({
    status: 409,
    body: { impact: { openTripsAffected: 2, vehicles: 1 } },
  });
  confirm.mockResolvedValue(false);
  render(
    <IdentifyJourneyPlaceDialog
      stop={{ fixAt: '2026-11-20T10:00:00Z' }}
      registrationNumber="WB11F6762"
      onSaved={onSaved}
      onClose={onClose}
    />,
  );
  await fillNameAndType();
  fireEvent.click(screen.getByRole('button', { name: 'Save place' }));
  await waitFor(() => expect(confirm).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save place' })).toBeEnabled());
  expect(screen.getByRole('textbox', { name: 'Place name' })).toHaveValue('  Dankuni yard  ');
  expect(onSaved).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  expect(PlaceIntelligenceService.identifyTrackPointPlace).toHaveBeenCalledTimes(1);
});
