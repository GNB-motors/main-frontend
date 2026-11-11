import { lazy, Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import '../../Sap/Sap.css';
import './DeliveryRoutes.css';

const SapSettings = lazy(() => import('../../Sap/SapSettings'));
const SapMonthly = lazy(() => import('../../Sap/SapMonthly'));
const SapLossLanes = lazy(() => import('../../Sap/SapLossLanes'));
const VIEWS = [
  ['month', 'SAP performance'],
  ['loss-lanes', 'Loss lanes'],
  ['settings', 'Settings & import'],
];

/** SAP analysis and settings, opened from the delivery-route list. */
export default function SapWorkspace({ view, onView, onChanged }) {
  return (
    <div className="ud-workspace sap-panel">
      <div className="ud-sap-bar">
        <Button variant="outline" size="sm" onClick={() => onView(null)}>
          <ArrowLeft size={14} /> Delivery routes
        </Button>
        <nav className="ud-segmented" aria-label="SAP analysis">
          {VIEWS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => onView(id)}>
              {label}
            </button>
          ))}
        </nav>
      </div>
      <Suspense fallback={<p role="status">Loading SAP…</p>}>
        {view === 'settings' ? (
          <SapSettings onChanged={onChanged} />
        ) : view === 'month' ? (
          <SapMonthly />
        ) : (
          <SapLossLanes />
        )}
      </Suspense>
    </div>
  );
}
