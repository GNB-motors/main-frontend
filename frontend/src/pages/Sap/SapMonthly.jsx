import { useApi } from '../../hooks/useApi';
import SapService from '../../services/SapService';
import DataTable from '../../components/ui/DataTable';
import './Sap.css';

/** A section the API may not serve for this org (403/404): it disappears quietly. */
const HIDDEN_STATUS = new Set([403, 404]);

/** Money the API could not price is unknown, never ₹0. */
const rupees = (n) =>
  typeof n === 'number' && Number.isFinite(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';

const km = (n) => (typeof n === 'number' && Number.isFinite(n) ? `${n} km` : '—');

/** The rate sources the API priced this group with — the basis of the figure. */
const basisOf = (r) => {
  const parts = [];
  if (r.kmPerLSource && r.kmPerLSource !== 'NONE') parts.push(`${r.kmPerLSource} km/L`);
  if (r.inrPerLSource && r.inrPerLSource !== 'NONE') parts.push(`${r.inrPerLSource} ₹/L`);
  return parts.join(' · ');
};

function columns() {
  return [
    {
      key: 'month',
      label: 'Month',
      render: (r) => (
        <div>
          <div className="cell-primary font-medium">{r.label || r.group || '—'}</div>
          <div className="text-xs text-slate-500">{r.group || ''}</div>
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
      key: 'verdicts',
      label: 'Against SAP',
      render: (r) => (
        <div>
          <div className="cell-primary">{`${r.over ?? 0} over · ${r.under ?? 0} under`}</div>
          <div className="text-xs text-slate-500">{`${r.within ?? 0} within · ${r.noKm ?? 0} without km`}</div>
        </div>
      ),
    },
    {
      key: 'km',
      label: 'Extra km',
      align: 'right',
      render: (r) => (
        <div>
          <div className="cell-primary">{km(r.extraKm)}</div>
          <div className="text-xs text-slate-500">
            {typeof r.savedKm === 'number' ? `${r.savedKm} km saved` : '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'money',
      label: 'Extra money',
      align: 'right',
      render: (r) => (
        <div>
          <div className="cell-primary">{rupees(r.extraInr)}</div>
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
              {typeof r.extraLitres === 'number' ? `${r.extraLitres} litres` : '—'}
            </div>
          </div>
        ),
    },
  ];
}

/**
 * SAP performance month by month — the trips judged against their route's SAP,
 * the extra km they drove and what that extra km cost.
 */
export default function SapMonthly() {
  const q = useApi((signal) => SapService.summary({ groupBy: 'month' }, { signal }), []);
  const status = q.error?.status ?? q.error?.response?.status;
  if (HIDDEN_STATUS.has(status)) return null;

  const rows = q.data?.rows || [];
  return (
    <div className="sap-panel">
      <div className="sap-card">
        <div className="sap-card-heading">
          <div>
            <h3>By month</h3>
            <p>
              Every trip judged against its route&apos;s SAP, grouped by the month it ran — the extra
              kilometres and what they cost.
            </p>
          </div>
        </div>
        <DataTable
          columns={columns()}
          rows={q.error ? [] : rows}
          rowKey={(r, i) => r.group || i}
          loading={q.loading && !q.data}
          error={q.error}
          onRetry={q.refetch}
          showing={rows.length}
          total={rows.length}
          emptyTitle="No monthly SAP figures yet"
          emptyHint="Months appear as trips are delivered against a route SAP."
        />
      </div>
    </div>
  );
}
