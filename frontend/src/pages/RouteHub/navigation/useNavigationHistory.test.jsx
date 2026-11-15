import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import useNavigationHistory from './useNavigationHistory';
import NavigationService from '../../../services/NavigationService';
import { getOrgId } from '../../../utils/session';

vi.mock('../../../services/NavigationService', () => ({
  default: { sessions: vi.fn(), session: vi.fn() },
}));
vi.mock('../../../utils/session', () => ({
  getOrgId: vi.fn(() => 'org-a'),
  getBranchId: () => 'branch-a',
  getUserId: () => 'owner-a',
}));

const query = { vehicleId: 'truck-a', from: '2026-10-31T00:00:00Z', to: '2026-10-31T03:00:00Z' };
const version = (n) => ({
  routeVersion: n,
  route: {
    navigation: {
      payload: {
        routes: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [88, 22],
                [89, 23],
              ],
            },
          },
        ],
      },
    },
  },
});
beforeEach(() => {
  vi.clearAllMocks();
  getOrgId.mockReturnValue('org-a');
  NavigationService.sessions.mockResolvedValue({ sessions: [{ id: 'session-a' }] });
  NavigationService.session.mockResolvedValue({
    session: { routeVersion: 2 },
    routeVersions: [version(1), version(2)],
  });
});

it('selects the server active version and lets an owner inspect earlier immutable versions', async () => {
  const { result } = renderHook(() => useNavigationHistory(query));
  await waitFor(() => expect(result.current.selected?.routeVersion).toBe(2));
  act(() => result.current.selectVersion(1));
  expect(result.current.selected.routeVersion).toBe(1);
  expect(NavigationService.session).toHaveBeenCalledTimes(1);
});

it('hides old route geometry immediately on tenant change and discards its late response', async () => {
  const { result, rerender } = renderHook(() => useNavigationHistory(query));
  await waitFor(() => expect(result.current.path).toHaveLength(2));
  let resolve;
  NavigationService.sessions.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  getOrgId.mockReturnValue('org-b');
  rerender();
  expect(result.current.path).toEqual([]);
  expect(result.current.sessions).toEqual([]);
  getOrgId.mockReturnValue('org-c');
  NavigationService.sessions.mockResolvedValue({ sessions: [] });
  rerender();
  await act(async () => resolve({ sessions: [{ id: 'wrong-tenant' }] }));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.sessions).toEqual([]);
  expect(result.current.path).toEqual([]);
});

it('does not fetch fleet-wide sessions before a replay context is selected', () => {
  const { result } = renderHook(() => useNavigationHistory({}));
  expect(result.current.enabled).toBe(false);
  expect(NavigationService.sessions).not.toHaveBeenCalled();
});

it('uses an explicit vehicle window fallback without claiming it is a linked trip session', async () => {
  NavigationService.sessions.mockResolvedValueOnce({ sessions: [] });
  NavigationService.sessions.mockResolvedValueOnce({ sessions: [{ id: 'session-a' }] });
  const { result } = renderHook(() => useNavigationHistory({ ...query, autoTripId: 'trip-a' }));
  await waitFor(() => expect(result.current.path).toHaveLength(2));
  expect(NavigationService.sessions.mock.calls[0][0]).toEqual({ autoTripId: 'trip-a' });
  expect(NavigationService.sessions.mock.calls[1][0]).toEqual(query);
  expect(result.current.association).toBe('VEHICLE_WINDOW');
});
