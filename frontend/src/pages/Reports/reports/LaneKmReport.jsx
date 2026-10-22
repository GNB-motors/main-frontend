import { createElement, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Route, Settings2, Lock } from 'lucide-react';
import { canEditSap } from '../../Sap/sapModel';
import { getUserRole } from '../../../utils/session';
import '../../Sap/Sap.css';

const SapRoutes = lazy(() => import('../../Sap/SapRoutes'));
const SapSettings = lazy(() => import('../../Sap/SapSettings'));

const TABS = [
  ['routes', 'SAP routes', Route],
  ['settings', 'Settings & import', Settings2],
];

/**
 * SAP lives on routes (pickup place → drop place); owners and managers set it here. The
 * catalog shows this report only to orgs with `sapV2`.
 */
export default function LaneKmReport() {
  const [params, setParams] = useSearchParams();
  if (!canEditSap(getUserRole()))
    return (
      <div className="sap-card sap-empty" role="status">
        <Lock size={24} aria-hidden="true" />
        <strong>SAP routes are managed by owners and managers</strong>
      </div>
    );
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
        {tab === 'settings' ? <SapSettings /> : <SapRoutes />}
      </Suspense>
    </div>
  );
}
