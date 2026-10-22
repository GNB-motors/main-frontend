import { useDeferredValue, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import PageShell from '../../../components/ui/PageShell';
import DataTable from '../../../components/ui/DataTable';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import useApi from '../../../hooks/useApi';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SapPill from '../../Sap/SapPill';
import { BASIS_LABEL, kmText } from '../../Sap/sapModel';
import { minutesLabel } from './model/unitLabels';
import useReportPage from '../../Reports/reports/useReportPage';
import DeliveryRouteDetail from './DeliveryRouteDetail';
const PAGE_SIZE = 50;
export default function DeliveryRoutes({ version }) {
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search);
  const [review, setReview] = useState('');
  const [page, setPage] = useReportPage(`${term}|${review}`);
  const [params, setParams] = useSearchParams();
  const openId = params.get('leg');
  const q = useApi(
    (signal) =>
      PlaceIntelligenceService.listDeliveryLegs(
        { search: term || undefined, review: review || undefined, page, limit: PAGE_SIZE },
        { signal },
      ),
    [term, review, page, version],
  );
  const toggle = (id) => {
    const next = new URLSearchParams(params);
    if (openId === id) next.delete('leg');
    else next.set('leg', id);
    setParams(next, { replace: true });
  };
  const rows = q.data?.records || q.data?.rows || q.data?.items || [];
  const total = q.data?.total ?? rows.length;
  const columns = [
    {
      key: 'route',
      label: 'Delivery route',
      width: '28%',
      render: (r) => (
        <button
          className="sap-route-toggle"
          type="button"
          aria-expanded={openId === r._id}
          aria-label={`${r.fromName} → ${r.toName}`}
          onClick={() => toggle(r._id)}
        >
          {openId === r._id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <span>
            <span className="sap-cell-title">{r.fromName}</span>
            <span className="sap-cell-sub">→ {r.toName}</span>
          </span>
        </button>
      ),
    },
    { key: 'trips', label: 'Trips', align: 'right', render: (r) => r.n },
    { key: 'trucks', label: 'Trucks', align: 'right', render: (r) => r.trucks },
    {
      key: 'distance',
      label: 'Usual distance',
      align: 'right',
      render: (r) => (
        <>
          {kmText(r.km?.p50)}
          <span className="sap-cell-sub">P90 {kmText(r.km?.p90)}</span>
        </>
      ),
    },
    {
      key: 'time',
      label: 'Usual time',
      align: 'right',
      render: (r) => minutesLabel(r.minutes?.p50),
    },
    {
      key: 'fuel',
      label: 'Fuel / km',
      align: 'right',
      render: (r) => (r.fuelPerKm?.p50 == null ? '—' : `${r.fuelPerKm.p50.toFixed(2)} L`),
    },
    {
      key: 'sap',
      label: 'SAP comparison',
      render: (r) => (
        <div className="sap-stack">
          <span>
            {kmText(r.sap?.sapKm)}
            {r.sap?.basis ? ` · ${BASIS_LABEL[r.sap.basis]?.toLowerCase()}` : ''}
          </span>
          {r.sap && <SapPill comparison={r.sap.comparison} tolerance={r.sap.tolerancePct ?? 10} />}
        </div>
      ),
    },
    {
      key: 'review',
      label: 'Review',
      render: (r) => (
        <span
          className={`sap-pill ${r.review === 'ACCEPTED' ? 'sap-pill--within' : r.review === 'NEEDS_REVIEW' ? 'sap-pill--under' : ''}`}
        >
          {r.review === 'NEEDS_REVIEW'
            ? 'Needs review'
            : r.review === 'ACCEPTED'
              ? 'Accepted'
              : r.review === 'REJECTED'
                ? 'Rejected'
                : 'Unreviewed'}
        </span>
      ),
    },
  ];
  return (
    <PageShell
      className="sap-panel sap-page"
      title="Delivery routes"
      count={q.data ? total : null}
      subtitle="Plant-to-drop routes learned from your trips, with typical distance, time and SAP comparisons."
    >
      <div className="sap-toolbar">
        <div className="sap-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search deliveries"
            placeholder="Search plant or drop…"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sap-tabs" aria-label="Route review status">
          {[
            ['', 'Usual routes'],
            ['NEEDS_REVIEW', 'Needs review'],
            ['REJECTED', 'Rejected'],
          ].map(([key, label]) => (
            <button
              type="button"
              className="sap-tab"
              key={key}
              aria-pressed={review === key}
              onClick={() => setReview(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {q.loading && q.data && (
        <p role="status" className="sap-muted">
          Updating routes…
        </p>
      )}
      {openId && q.data && !rows.some((r) => r._id === openId) && (
        <DeliveryRouteDetail key={openId} id={openId} onChanged={q.refetch} />
      )}
      <DataTable
        className="sap-table"
        columns={columns}
        rows={rows}
        total={total}
        rowKey={(r) => r._id}
        loading={q.loading && !q.data}
        error={q.error}
        onRetry={q.refetch}
        emptyTitle="No delivery routes in this view"
        emptyHint="Try another search or review status."
        expandedKeys={new Set(openId ? [openId] : [])}
        renderExpanded={(r) => <DeliveryRouteDetail key={r._id} id={r._id} onChanged={q.refetch} />}
        pagination={
          <EnterprisePagination
            page={page}
            totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            totalItems={total || null}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        }
      />
    </PageShell>
  );
}
