import { useMemo, useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import NavigationService from '../../../services/NavigationService';
import { getOrgId, getBranchId, getUserId } from '../../../utils/session';
import { plannedPath, routeVersionOf, rowId } from './navigationHistory';

export default function useNavigationHistory({ vehicleId, autoTripId, from, to } = {}) {
  const scope = JSON.stringify([
    getOrgId(),
    getBranchId(),
    getUserId(),
    vehicleId,
    autoTripId,
    from,
    to,
  ]);
  const enabled = Boolean(autoTripId || (vehicleId && from && to));
  const [selection, setSelection] = useState(null);
  const list = useApi(
    async (signal) => {
      const linked = await NavigationService.sessions(
        autoTripId ? { autoTripId } : { vehicleId, from, to },
        signal,
      );
      if (autoTripId && !linked.sessions?.length && vehicleId && from && to && !signal.aborted) {
        const related = await NavigationService.sessions({ vehicleId, from, to }, signal);
        return { ...related, association: 'VEHICLE_WINDOW' };
      }
      return { ...linked, association: autoTripId ? 'TRIP' : 'VEHICLE_WINDOW' };
    },
    [scope],
    { enabled, scopeKey: scope },
  );
  const sessions = list.data?.sessions ?? [];
  const requestedId = selection?.scope === scope ? selection.sessionId : null;
  const sessionId = sessions.some((s) => rowId(s) === requestedId)
    ? requestedId
    : rowId(sessions[0]);
  const detail = useApi(
    (signal) => NavigationService.session(sessionId, signal),
    [sessionId, scope],
    { enabled: enabled && Boolean(sessionId), scopeKey: `${scope}:${sessionId}` },
  );
  const versions = detail.data?.routeVersions ?? [];
  const requestedVersion =
    selection?.scope === scope && selection.sessionId === sessionId ? selection.version : null;
  const activeVersion = detail.data?.session?.routeVersion;
  const selected =
    versions.find((v) => routeVersionOf(v) === requestedVersion) ??
    versions.find((v) => routeVersionOf(v) === activeVersion) ??
    versions.at(-1) ??
    null;
  const path = useMemo(() => plannedPath(selected), [selected]);
  return {
    enabled,
    association: list.data?.association,
    sessions,
    sessionId,
    versions,
    selected,
    path,
    loading: enabled && (list.loading || (Boolean(sessionId) && detail.loading)),
    error: list.error || detail.error,
    selectSession: (id) => setSelection({ scope, sessionId: id, version: null }),
    selectVersion: (version) => setSelection({ scope, sessionId, version }),
    retry: () => {
      list.refetch();
      if (sessionId) detail.refetch();
    },
    nextCursor: list.data?.nextCursor,
  };
}
