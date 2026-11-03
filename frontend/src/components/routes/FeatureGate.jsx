import React from 'react';
import { Link } from 'react-router-dom';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext.jsx';
import EmptyState from '../cluster/EmptyState';

/**
 * A page whose API answers 404 while its feature flag is off for the org.
 * The sidebar already hides it; this covers a typed or old link, which would
 * otherwise land on a raw "Not Found" or "Could not load" panel.
 */
export default function FeatureGate({ flag, name, children }) {
  const { isEnabled, ready } = useFeatureFlags();
  if (!ready || isEnabled(flag)) return children;
  return (
    <EmptyState
      className="min-h-[60vh]"
      title={`${name} is not switched on for your organisation`}
      hint="Ask your GNB contact to turn it on. Everything else keeps working as before."
      action={
        <Link className="btn btn--sm" to="/live-tracking">
          Back to Track
        </Link>
      }
    />
  );
}
