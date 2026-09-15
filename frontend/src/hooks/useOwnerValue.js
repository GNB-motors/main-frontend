import { useMemo } from 'react';
import useApi from './useApi';
import OwnerValueService from '../services/OwnerValueService';

/**
 * Typed hooks over the owner-value layer (PR 2.1).
 * One hook per endpoint; every hook is abortable via useApi and re-runs when
 * its {from,to} window changes. Components read `data` verbatim — the backend
 * already writes human-readable `detail` strings.
 */

export function useMoney({ from, to } = {}) {
  const deps = useMemo(() => [from || '', to || ''], [from, to]);
  return useApi((signal) => OwnerValueService.getMoney({ from, to }, signal), deps);
}

export function useHealthScore() {
  return useApi((signal) => OwnerValueService.getHealthScore(signal), []);
}

export function useUtilization({ from, to } = {}) {
  const deps = useMemo(() => [from || '', to || ''], [from, to]);
  return useApi((signal) => OwnerValueService.getUtilization({ from, to }, signal), deps);
}

export function useDowntimeRisk() {
  return useApi((signal) => OwnerValueService.getDowntimeRisk(signal), []);
}

export function useComplianceRisk({ days = 30 } = {}) {
  return useApi((signal) => OwnerValueService.getComplianceRisk({ days }, signal), [days]);
}

export function useTripPnl(tripId) {
  return useApi((signal) => OwnerValueService.getTripPnl({ tripId }, signal), [tripId], { enabled: Boolean(tripId) });
}
