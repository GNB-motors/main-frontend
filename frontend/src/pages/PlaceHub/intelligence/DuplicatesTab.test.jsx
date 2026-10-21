import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect, beforeEach } from 'vitest';
import DuplicatesTab from './DuplicatesTab';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import placeHubTabs from '../page/placeHubTabs';
const a = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Plant A', visits: 10, siteType: 'PLANT' };
const b = { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Plant B', visits: 20, siteType: 'PLANT' };
vi.mock('./DuplicateMap', () => ({ default: () => <div>Pair map</div> }));
vi.mock('../../../utils/session', () => ({ getUserRole: () => 'OWNER' }));
vi.mock('../../../components/ui/confirmContext', () => ({ useConfirm: () => async () => true }));
vi.mock('./PlaceIntelligenceService', () => ({
  default: {
    duplicates: vi.fn(),
    mergeSites: vi.fn(),
    distinctSites: vi.fn(),
    listMerges: vi.fn(),
    undoMerge: vi.fn(),
    listSites: vi.fn(),
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  PlaceIntelligenceService.duplicates.mockResolvedValue([
    { a, b, distanceM: 23, roadKm: 0.02, tripsAffected: 485, verdict: 'LIKELY_SAME' },
  ]);
  PlaceIntelligenceService.mergeSites.mockResolvedValue({});
  PlaceIntelligenceService.distinctSites.mockResolvedValue({});
  PlaceIntelligenceService.listMerges.mockResolvedValue([
    { _id: 'merge1', memberIds: [a._id], members: [{ name: 'Plant A' }] },
  ]);
  PlaceIntelligenceService.undoMerge.mockResolvedValue({ restored: 1 });
});
it('only adds the duplicate review tab when enabled', () => {
  expect(placeHubTabs({ allowSites: true }).some((t) => t.id === 'duplicates')).toBe(false);
  expect(
    placeHubTabs({ allowSites: true, allowHygiene: true }).some((t) => t.id === 'duplicates'),
  ).toBe(true);
});
it('defaults the survivor to most visits, merges and supports undo', async () => {
  render(
    <MemoryRouter>
      <DuplicatesTab />
    </MemoryRouter>,
  );
  expect((await screen.findByLabelText('Keep this place')).value).toBe(b._id);
  fireEvent.click(screen.getByRole('button', { name: 'Merge' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.mergeSites).toHaveBeenCalledWith(
      { survivorId: b._id, memberIds: [a._id] },
      expect.anything(),
    ),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Undo merge' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.undoMerge).toHaveBeenCalledWith('merge1', expect.anything()),
  );
});
it('marks a pair distinct with the other place ID', async () => {
  render(
    <MemoryRouter>
      <DuplicatesTab />
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Different places' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.distinctSites).toHaveBeenCalledWith(
      { id: a._id, otherId: b._id },
      expect.anything(),
    ),
  );
});
