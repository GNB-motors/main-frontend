import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect, beforeEach } from 'vitest';
import DuplicatesTab from './DuplicatesTab';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import placeHubTabs from '../page/placeHubTabs';
const a = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Plant A', visits: 10, siteType: 'PLANT' };
const b = { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Plant B', visits: 20, siteType: 'PLANT' };
vi.mock('./DuplicateMap', () => ({ default: () => <div>Pair map</div> }));
vi.mock('../../../utils/session', () => ({ getUserRole: () => 'OWNER', getPref: () => null }));
vi.mock('../../../components/ui/confirmContext', () => ({ useConfirm: () => async () => true }));
vi.mock('./PlaceIntelligenceService', () => ({
  default: {
    duplicates: vi.fn(),
    mergeSites: vi.fn(),
    distinctSites: vi.fn(),
    listMerges: vi.fn(),
    undoMerge: vi.fn(),
    listSites: vi.fn(),
    previewMergeJob: vi.fn(),
    activeMergeJob: vi.fn(),
    getMergeJob: vi.fn(),
    retryMergeJob: vi.fn(),
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  PlaceIntelligenceService.duplicates.mockResolvedValue([
    { a, b, distanceM: 23, roadKm: 0.02, tripsAffected: 485, verdict: 'LIKELY_SAME' },
  ]);
  PlaceIntelligenceService.previewMergeJob.mockResolvedValue({
    previewId: 'preview1',
    scope: { stopsToMove: 12, tripReferenceRows: 20 },
  });
  PlaceIntelligenceService.activeMergeJob.mockResolvedValue(null);
  PlaceIntelligenceService.mergeSites.mockResolvedValue({ jobId: 'job1', status: 'QUEUED' });
  PlaceIntelligenceService.getMergeJob.mockResolvedValue({ jobId: 'job1', status: 'COMPLETE' });
  PlaceIntelligenceService.distinctSites.mockResolvedValue({});
  PlaceIntelligenceService.listMerges.mockResolvedValue([
    { _id: 'merge1', memberIds: [a._id], members: [{ name: 'Plant A' }] },
  ]);
  PlaceIntelligenceService.undoMerge.mockResolvedValue({
    jobId: 'undo1',
    status: 'QUEUED',
    direction: 'UNDO',
  });
});
it('includes duplicate review with place management without a separate feature flag', () => {
  expect(placeHubTabs({ allowSites: true }).some((t) => t.id === 'duplicates')).toBe(true);
  expect(placeHubTabs({ allowSites: false }).some((t) => t.id === 'duplicates')).toBe(false);
});
it('defaults to the older site ID, merges and supports undo', async () => {
  render(
    <MemoryRouter>
      <DuplicatesTab />
    </MemoryRouter>,
  );
  expect(await screen.findByRole('radio', { name: 'Plant A (10 visits)' })).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Merge' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.mergeSites).toHaveBeenCalledWith(
      { previewId: 'preview1' },
      expect.anything(),
    ),
  );
  expect(PlaceIntelligenceService.previewMergeJob).toHaveBeenCalledWith([
    { survivorId: a._id, memberIds: [b._id] },
  ]);
  fireEvent.click(screen.getByText('Merge history and undo'));
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
it('prefers the earlier creation time when it disagrees with ID order', async () => {
  PlaceIntelligenceService.duplicates.mockResolvedValue([
    {
      a: { ...a, createdAt: '2026-11-02T00:00:00Z' },
      b: { ...b, createdAt: '2026-11-01T00:00:00Z' },
      distanceM: 23,
      tripsAffected: 1,
      verdict: 'CHECK',
    },
  ]);
  render(
    <MemoryRouter>
      <DuplicatesTab />
    </MemoryRouter>,
  );
  expect(await screen.findByRole('radio', { name: 'Plant B (20 visits)' })).toBeChecked();
});
