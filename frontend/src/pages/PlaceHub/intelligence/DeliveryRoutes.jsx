import { lazy, Suspense, useDeferredValue, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Settings2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import PageShell from '../../../components/ui/PageShell';
import DataTable from '../../../components/ui/DataTable';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import { Button } from '../../../components/ui/button';
import useApi from '../../../hooks/useApi';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../../utils/session';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SetSapDialog from '../../Sap/SetSapDialog';
import { BASIS_LABEL, canEditSap, kmText } from '../../Sap/sapModel';
import useReportPage from '../../Reports/reports/useReportPage';
import RouteComparison from './RouteComparison';
import DeliveryRouteDetail from './DeliveryRouteDetail';
import '../../Sap/Sap.css';
import './DeliveryRoutes.css';

const SapSettings = lazy(() => import('../../Sap/SapSettings'));
const SapMonthly = lazy(() => import('../../Sap/SapMonthly'));
const SapLossLanes = lazy(() => import('../../Sap/SapLossLanes'));
const PAGE_SIZE = 50;

export default function DeliveryRoutes({ version }) {
  const { isEnabled } = useFeatureFlags();
  const showSap = canEditSap(getUserRole()) && isEnabled('sapV2');
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search);
  const [review, setReview] = useState('');
  const [sapStatus, setSapStatus] = useState('');
  const [page, setPage] = useReportPage(`${term}|${review}|${sapStatus}`);
  const [params, setParams] = useSearchParams();
  const openId =
    params.get('delivery') || (params.get('tab') === 'deliveries' ? params.get('leg') : null);
  const [dialog, setDialog] = useState(null);
  const [revision, setRevision] = useState(0);
  const sapTab = showSap ? params.get('sapTab') : null;
  const q = useApi(
    (signal) =>
      PlaceIntelligenceService.listDeliveryLegs(
        {
          search: term || undefined,
          review: review || undefined,
          sapStatus: showSap ? sapStatus || undefined : undefined,
          page,
          limit: PAGE_SIZE,
        },
        { signal },
      ),
    [term, review, sapStatus, showSap, page, version, revision],
  );
  const rows = q.data?.rows || q.data?.records || [];
  const totals = q.data?.totals;
  const total = q.data?.total ?? rows.length;
  const setIntent = (intent) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (intent) next.set('sapTab', intent);
      else next.delete('sapTab');
      return next;
    });
  const selectRoute = (id) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('tab', 'routes');
      next.set('routeView', 'deliveries');
      next.delete('leg');
      if (id) next.set('delivery', id);
      else next.delete('delivery');
      return next;
    });
  const changed = () => {
    setRevision((n) => n + 1);
  };
  const saved = () => {
    changed();
    toast.success('Route SAP saved. Trip snapshots refresh shortly.');
  };
  const columns = [
    {
      key: 'route',
      label: 'Delivery route',
      render: (r) => (
        <button
          type="button"
          className="ud-route-button"
          aria-label={`${r.fromName} → ${r.toName}`}
          aria-pressed={String(openId) === String(r._id)}
          onClick={() => selectRoute(r._id)}
        >
          <strong>{r.fromName || 'Unnamed pickup'}</strong>
          <span>→ {r.toName || 'Unnamed drop'}</span>
          <small>{r.n ? 'Learned from trips' : 'Configured · awaiting first trip'}</small>
        </button>
      ),
    },
    { key: 'trips', label: 'Trips', align: 'right', render: (r) => r.n },
    {
      key: 'distance',
      label: 'Learned distance',
      align: 'right',
      render: (r) => (
        <>
          {kmText(r.km?.p50)}
          <small className="ud-sub">loaded · median</small>
        </>
      ),
    },
    ...(showSap
      ? [
          {
            key: 'sap',
            label: 'Agreed SAP',
            align: 'right',
            render: (r) => (
              <>
                {kmText(r.sap?.sapKm)}
                <small className="ud-sub">{BASIS_LABEL[r.sap?.basis]}</small>
              </>
            ),
          },
          { key: 'comparison', label: 'Comparison', render: (r) => <RouteComparison route={r} /> },
        ]
      : []),
  ];
  if (['settings', 'month', 'loss-lanes'].includes(sapTab))
    return (
      <div className="ud-workspace sap-panel">
        <div className="ud-actions">
          <Button variant="outline" onClick={() => setIntent(null)}>
            <ArrowLeft size={14} /> Delivery routes
          </Button>
          <nav aria-label="SAP analysis">
            <button onClick={() => setIntent('settings')} aria-pressed={sapTab === 'settings'}>
              Settings & import
            </button>
            <button onClick={() => setIntent('month')} aria-pressed={sapTab === 'month'}>
              By month
            </button>
            <button onClick={() => setIntent('loss-lanes')} aria-pressed={sapTab === 'loss-lanes'}>
              Loss lanes
            </button>
          </nav>
        </div>
        <Suspense fallback={<p role="status">Loading SAP…</p>}>
          {sapTab === 'settings' ? (
            <SapSettings onChanged={changed} />
          ) : sapTab === 'month' ? (
            <SapMonthly />
          ) : (
            <SapLossLanes />
          )}
        </Suspense>
      </div>
    );
  return (
    <PageShell
      className="ud-workspace sap-panel"
      title="Your routes, understood."
      subtitle="Pickup-to-drop journeys, grouped across trips. Learned distance and agreed SAP stay separate."
      actions={
        showSap && (
          <div className="ud-actions">
            <Button variant="outline" onClick={() => setIntent('settings')}>
              <Settings2 size={14} /> Settings & import
            </Button>
            <Button variant="outline" onClick={() => setIntent('month')}>
              SAP performance
            </Button>
            <Button onClick={() => setDialog({ kind: 'new' })}>
              <Plus size={14} /> New route
            </Button>
          </div>
        )
      }
    >
      {totals && !q.error && (
        <div className="ud-metrics" aria-label="Route summary">
          <div>
            <span>Delivery routes</span>
            <strong>{totals.routes}</strong>
            <small>Including configured routes with no trips</small>
          </div>
          <div>
            <span>Trips behind these routes</span>
            <strong>{totals.trips}</strong>
            <small>Individual loaded journeys</small>
          </div>
          {showSap && (
            <>
              <div>
                <span>Over SAP</span>
                <strong>{totals.over}</strong>
                <small>Typical distance beyond tolerance</small>
              </div>
              <div>
                <span>SAP not set</span>
                <strong>{totals.withoutSap}</strong>
                <small>Add your agreed distance</small>
              </div>
            </>
          )}
        </div>
      )}
      <div className="ud-grid">
        <section className="ud-list" aria-label="Delivery route list">
          <div className="ud-toolbar">
            <label className="sap-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search deliveries"
                placeholder="Search pickup or destination…"
                maxLength={60}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {showSap && (
              <select
                aria-label="Filter SAP status"
                value={sapStatus}
                onChange={(e) => setSapStatus(e.target.value)}
              >
                {[
                  ['', 'All SAP statuses'],
                  ['OVER', 'Over SAP'],
                  ['WITHIN', 'Within SAP'],
                  ['UNDER', 'Under SAP'],
                  ['NO_SAP', 'SAP not set'],
                  ['NO_TRIPS', 'No trips yet'],
                  ['NO_KM', 'Missing distance evidence'],
                ].map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <nav className="ud-review" aria-label="Route review status">
            {[
              ['', 'Usual routes'],
              ['NEEDS_REVIEW', 'Needs review'],
              ['REJECTED', 'Rejected'],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={review === v}
                onClick={() => setReview(v)}
              >
                {label}
              </button>
            ))}
          </nav>
          <DataTable
            columns={columns}
            rows={q.error ? [] : rows}
            total={total}
            rowKey={(r) => r._id}
            loading={q.loading && !q.data}
            error={q.error}
            onRetry={q.refetch}
            emptyTitle="No delivery routes in this view"
            emptyHint="Routes appear from completed loaded trips. Try another search or review status; configured SAP routes remain visible before their first trip."
            pagination={
              <EnterprisePagination
                page={page}
                totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                totalItems={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            }
          />
          {q.loading && q.data && (
            <p role="status" className="sap-muted">
              Updating routes…
            </p>
          )}
        </section>
        {openId ? (
          <DeliveryRouteDetail
            key={openId}
            id={openId}
            version={`${version}:${revision}`}
            showSap={showSap}
            onChanged={changed}
            onClose={() => selectRoute(null)}
          />
        ) : (
          <aside className="ud-detail ud-pick">
            <h2>Select a delivery route</h2>
            <p>
              See its usual distance, the individual trips behind it
              {showSap ? ', and its SAP agreement' : ''}.
            </p>
            <p>Trips are individual journeys. Routes explain what is usual.</p>
          </aside>
        )}
      </div>
      {dialog && <SetSapDialog onClose={() => setDialog(null)} onSaved={saved} />}
    </PageShell>
  );
}
