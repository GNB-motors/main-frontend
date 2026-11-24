import useApi from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { predictionConfidence } from '../LiveTracking/whereNextModel';

export function useTripPrediction(reg, enabled) {
  return useApi((signal) => fleetViewService.getWhereNext(reg, { signal }), [reg], {
    enabled: Boolean(reg && enabled),
    scopeKey: reg,
    dedupeKey: `where-next:${reg}`,
  });
}

export function namedPrediction(data) {
  if (data?.held) return null;
  const candidate = data?.destinations?.[0];
  if (!candidate?.place?.name || /^unnamed\b/i.test(candidate.place.name)) return null;
  return {
    name: candidate.place.name,
    confidence: predictionConfidence(candidate),
  };
}
