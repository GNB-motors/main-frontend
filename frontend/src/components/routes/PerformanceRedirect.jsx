import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext.jsx';

/**
 * Old routes, new home — behind the `performanceSection` flag.
 *
 * Flag ON:
 *   /driving-dna            -> /performance?tab=drivers
 *   /mileage?tab=performance -> /performance?tab=vehicles
 *
 * Flag OFF: nothing changes. The old page renders exactly as it did today.
 *
 * Nothing is deleted — every old URL still lands somewhere, and the redirect
 * is a redirect, never a 404.
 */
export default function PerformanceRedirect({ children, to, when = () => true }) {
  const { isEnabled } = useFeatureFlags();
  const [searchParams] = useSearchParams();

  if (!isEnabled('performanceSection')) return children;
  if (!when(searchParams)) return children;

  return <Navigate to={to} replace />;
}
