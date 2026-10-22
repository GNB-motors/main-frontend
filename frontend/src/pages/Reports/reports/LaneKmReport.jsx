import { createElement, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Route, Settings2, Gauge } from 'lucide-react';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { canEditSap } from '../../Sap/sapModel';
import { getUserRole } from '../../../utils/session';
import LaneKmTable from './LaneKmTable';
import '../../Sap/Sap.css';

const SapRoutes = lazy(() => import('../../Sap/SapRoutes'));
const SapSettings = lazy(() => import('../../Sap/SapSettings'));

const TABS = [
  ['routes', 'SAP routes', Route],
  ['settings', 'Settings & import', Settings2],
  ['register', 'Refuel register lanes', Gauge],
];

/**
 * SAP lives on routes (pickup place → drop place). Owners and managers of an org with SAP
 * (`sapV2`) set it here; everyone else, and every org without it, sees the refuel-register
 * lane table as before.
 */
export default function LaneKmReport() {
  const [params, setParams] = useSearchParams();
  const { isEnabled } = useFeatureFlags();
  const sap = canEditSap(getUserRole()) && isEnabled('sapV2');
  if (!sap) return <LaneKmTable />;
  const requested = params.get('sapTab');
  const tab = TABS.some(([id]) => id === requested) ? requested : 'routes';
  return (
    <div>
      <nav className="sap-view-nav" aria-label="SAP views">
        {TABS.map(([id, label, icon]) => (
          <button
            className="sap-view-tab"
            aria-pressed={tab === id}
            type="button"
            key={id}
            onClick={() => {
              const next = new URLSearchParams(params);
              if (id === 'routes') next.delete('sapTab');
              else next.set('sapTab', id);
              setParams(next, { replace: true });
            }}
          >
            {createElement(icon, { size: 15, 'aria-hidden': true })}
            {label}
          </button>
        ))}
      </nav>
      <Suspense fallback={<p className="sap-panel">Loading…</p>}>
        {tab === 'settings' ? (
          <SapSettings />
        ) : tab === 'register' ? (
          <LaneKmTable />
        ) : (
          <SapRoutes />
        )}
      </Suspense>
    </div>
  );
}
