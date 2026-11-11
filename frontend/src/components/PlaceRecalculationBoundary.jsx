import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import useMergeJob from '../pages/PlaceHub/intelligence/useMergeJob';
import MergeJobStatus from '../pages/PlaceHub/intelligence/MergeJobStatus';

export default function PlaceRecalculationBoundary({ children }) {
  const { profile, isEnabled, organization } = useFeatureFlags();
  const { pathname, search } = useLocation();
  const [revision, setRevision] = useState(0);
  const enabled =
    !!organization?._id &&
    isEnabled('fleetIntelligence') &&
    ['OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(profile?.role);
  const progress = useMergeJob(() => setRevision((v) => v + 1), { enabled });
  const dependent =
    /^\/(place-hub|auto-trips|route-hub|sap|reports|owner|intelligence|lanes|mileage|fuel-integrity|performance|leaderboard|idling|cycles)/.test(
      pathname,
    );
  const controls =
    pathname === '/place-hub' && new URLSearchParams(search).get('tab') === 'duplicates';
  if (progress.busy && dependent && !controls)
    return <MergeJobStatus job={progress.job} error={progress.error} onRetry={progress.retry} />;
  return <div key={revision}>{children}</div>;
}
