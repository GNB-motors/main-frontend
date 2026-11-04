import { useApi } from '../../hooks/useApi';
import SapService from '../../services/SapService';
import DataTable from '../../components/ui/DataTable';
import './Sap.css';

/**
 * The SAP reads are OWNER/MANAGER-only and some orgs have no SAP module turned
 * on: a 403/404 means the section is not served, so it disappears quietly —
 * no error toast, nothing broken for the rest of the report.
 */
const HIDDEN_STATUS = new Set([403, 404]);

/** Money the API could not price is unknown, never ₹0. */
const rupees = (n) =>
  typeof n === 'number' && Number.isFinite(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';

const km = (n) => (typeof n === 'number' && Number.isFinite(n) ? `${n} km` : '—');

/** The rate sources the API priced this lane with — the basis of the figure. */
const basisOf = (r) => {
  const parts = [];
  if (r.kmPerLSource && r.kmPerLSource !== 'NONE') parts.push(`${r.kmPerLSource} km/L`);
  if (r.inrPerLSource && r.inrPerLSource !== 'NONE') parts.push(`${r.inrPerLSource} ₹/L`);
  return parts.join(' · ');
};

function columns() {
  return [
    {
      key: 'lane',
      label: 'Lane',
      render: (r) => (
        <div>
          <div className="cell-primary font-medium">{r.lane || '—'}</div>
          <div className="text-xs text-slate-500">{r.routeKey || 'no route key'}</div>
        </div>
      ),
    },
    {
      key: 'trips',
      label: 'Trips',
      align: 'right',
      render: (r) => <div className="cell-primary">{r.trips ?? 0}</div>,
    },
    {
      key: 'km',
      label: 'Shortfall km / trip',
      align: 'right',
      render: (r) => (
        <div>
          <div className="cell-primary">{km(r.shortfallKmPerTrip)}</div>
          <div className="text-xs text-slate-500">
            {typeof r.shortfallKmTotal === 'number' ? `${r.shortfallKmTotal} km in total` : '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'loss',
      label: 'Loss',
      align: 'right',
      render: (r) => (
        <div>
          <div className="cell-primary">{rupees(r.shortfallInrTotal)}</div>
          {r.unpricedTrips ? (
            <div className="text-xs text-slate-500">
              {r.unpricedTrips} trip{r.unpricedTrips === 1 ? '' : 's'} unpriced
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'basis',
      label: 'Basis',
      render: (r) =>
        r.noMoneyReason ? (
          <div>
            <div className="cell-primary">Not priced</div>
            <div className="text-xs text-slate-500">{r.noMoneyReason}</div>
          </div>
        ) : (
          <div>
            <div className="cell-primary">{basisOf(r) || '—'}</div>
            <div className="text-xs text-slate-500">
              {typeof r.litresTotal === 'number' ? `${r.litresTotal} litres` : '—'}
            </div>
          </div>
        ),
    },
  ];
}

/**
 * Lanes SAP pays less than the truck physically drives — the shortfall in rupees,
 * with the rate sources it was priced from.
 */
export default function SapLossLanes() {
  const q = useApi((signal) => SapService.lossLanes({ limit: 50 }, { signal }), []);
  const status = q.error?.status ?? q.error?.response?.status;
  if (HIDDEN_STATUS.has(status)) return null;

  const rows = q.data?.rows || [];
  const pricedFrom = q.data?.pricedFrom;
  return (
    <div className="sap-panel">
      <div className="sap-card">
        <div className="sap-card-heading">
          <div>
            <h3>Loss lanes</h3>
            <p>
              Lanes where the SAP pays less than the truck physically drives — the shortfall in
              rupees, priced on each trip&apos;s own truck and summed per lane.
            </p>
          </div>
        </div>
        <DataTable
          columns={columns()}
          rows={q.error ? [] : rows}
          rowKey={(r, i) => r.routeKey || r.lane || i}
          loading={q.loading && !q.data}
          error={q.error}
          onRetry={q.refetch}
          showing={rows.length}
          total={rows.length}
          emptyTitle="No loss lanes"
          emptyHint="Every lane so far runs within its SAP."
        />
        {pricedFrom?.note ? <div className="sap-card-footer">{pricedFrom.note}</div> : null}
      </div>
    </div>
  );
}
