import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import { useConfirm } from '../../components/ui/confirmContext';
import TripPlanService from '../../services/TripPlanService';
import { formatNum } from '../../utils/formatters';
import { fmtDayTime, fmtKm } from './autoTripFormat';
import { PLAN_STATUS_CLASS, PLAN_STATUS_LABEL, planEndName, planWarnings } from './tripForms';
import TripPlanDialog from './TripPlanDialog';
import LinkTripDialog from './LinkTripDialog';
import { erpPlanTracking } from './erpPlanTracking';
import './AutoTrips.css';
import './TripsWorkspace.css';

const TABS = [
  { key: '', label: 'All' },
  { key: 'PLANNED', label: 'Planned' },
  { key: 'IN_PROGRESS', label: 'On the road' },
  { key: 'COMPLETED', label: 'Done' },
  { key: 'CANCELLED', label: 'Cancelled' },
];
const PAGE_SIZE = 50;

/** Scheduled trips, each with the GPS trip that ran it: planned vs actual. */
export default function TripPlansPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  // { kind: 'create' } | { kind: 'link', plan } | null
  const [dialog, setDialog] = useState(null);

  const params = { page, limit: PAGE_SIZE, ...(tab ? { status: tab } : {}) };
  const { data, loading, error, refetch } = useApi(
    (signal) => TripPlanService.list(params, { signal }),
    [page, tab],
  );
  const cancelM = useMutation(TripPlanService.cancel);
  const unlinkM = useMutation(TripPlanService.unlink);
  const resumeM = useMutation(TripPlanService.resumeAutoMatch);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const tabCounts = data?.tabCounts ?? {};
  const countFor = (key) =>
    key === '' ? Object.values(tabCounts).reduce((a, b) => a + (b || 0), 0) : tabCounts[key] || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const act = async (mutation, payload, question, okMsg) => {
    if (!(await confirm({ title: question, confirmLabel: 'Yes' }))) return;
    try {
      await mutation.mutate(payload);
      toast.success(okMsg);
      refetch();
    } catch (e) {
      toast.error(e?.message || 'Action failed');
    }
  };

  const columns = [
    {
      key: 'truck',
      label: 'Truck',
      render: (p) => (
        <>
          <span className="atx-plate">{p.registrationNumber || '—'}</span>
          {p.source === 'ERP' ? (
            <Link
              className="atx-chip"
              to={`/erp/trips/${p.erpTripId}`}
              onClick={(e) => e.stopPropagation()}
            >
              ERP · {p.erpTripNumber}
            </Link>
          ) : null}
        </>
      ),
    },
    {
      key: 'route',
      label: 'Planned route',
      render: (p) => `${planEndName(p.pickup)} → ${planEndName(p.drop)}`,
    },
    { key: 'planned', label: 'Planned / ERP start', render: (p) => fmtDayTime(p.plannedStartAt) },
    {
      key: 'actual',
      label: 'Actual',
      render: (p) =>
        p.actual?.startedAt ? (
          <>
            {fmtDayTime(p.actual.startedAt)}
            {p.actual.dropName ? ` → ${p.actual.dropName}` : ''}
            {p.actual.km != null ? ` · ${fmtKm(p.actual.km)}` : ''}
          </>
        ) : (
          <span className="atx-muted">
            {p.source === 'ERP' ? 'GPS evidence pending' : 'not started'}
          </span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => (
        <>
          <span className={`atx-status ${PLAN_STATUS_CLASS[p.status] || 'atx-status--open'}`}>
            {PLAN_STATUS_LABEL[p.status] || p.status}
          </span>
          {p.source === 'ERP' ? <span className="atx-muted">{erpPlanTracking(p)}</span> : null}
          {planWarnings(p).map((w) => (
            <span key={w} className="atx-chip atx-chip--warn">
              {w}
            </span>
          ))}
        </>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (p) => (
        <span className="atx-row-actions">
          {p.autoMatch === false && p.status === 'PLANNED' && !p.autoTripId ? (
            <button
              type="button"
              className="atx-btn atx-btn--sm"
              disabled={resumeM.loading}
              onClick={(e) => {
                e.stopPropagation();
                act(
                  resumeM,
                  { id: p._id },
                  'Resume automatic GPS linking?',
                  'Automatic linking resumed',
                );
              }}
            >
              Resume auto-link
            </button>
          ) : null}
          {p.status !== 'CANCELLED' ? (
            <button
              type="button"
              className="atx-btn atx-btn--sm"
              onClick={(e) => {
                e.stopPropagation();
                setDialog({ kind: 'link', plan: p });
              }}
            >
              {p.autoTripId ? 'Change trip' : 'Link trip'}
            </button>
          ) : null}
          {p.autoTripId && p.status !== 'CANCELLED' ? (
            <button
              type="button"
              className="atx-btn atx-btn--sm"
              disabled={unlinkM.loading}
              onClick={(e) => {
                e.stopPropagation();
                act(unlinkM, { id: p._id }, 'Take the trip off this plan?', 'Trip unlinked');
              }}
            >
              Unlink
            </button>
          ) : null}
          {p.source !== 'ERP' && (p.status === 'PLANNED' || p.status === 'IN_PROGRESS') ? (
            <button
              type="button"
              className="atx-btn atx-btn--sm"
              disabled={cancelM.loading}
              onClick={(e) => {
                e.stopPropagation();
                act(cancelM, { id: p._id }, 'Cancel this plan?', 'Plan cancelled');
              }}
            >
              Cancel
            </button>
          ) : null}
        </span>
      ),
    },
  ];

  const pagination = (
    <EnterprisePagination
      page={page}
      totalPages={totalPages}
      totalItems={total || null}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );

  return (
    <div className="atx-page atx-list">
      <div className="atx-wrap">
        <div className="atx-head">
          <div className="atx-head-main">
            <div className="atx-title-row">
              <h1 className="atx-title">Planned trips</h1>
              <span className="atx-count">
                {formatNum(countFor(''))} plans
                {data?.late ? ` · ${formatNum(data.late)} not started on time` : ''}
              </span>
            </div>
            <p className="atx-sub">
              Compare scheduled trips with actual GPS activity, late starts and changed
              destinations.
            </p>
          </div>
          <div className="atx-actions">
            <Button variant="outline" onClick={() => navigate('/auto-trips')}>
              <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
              All trips
            </Button>
            <Button onClick={() => setDialog({ kind: 'create' })}>
              <CalendarPlus size={16} strokeWidth={2} aria-hidden="true" />
              Schedule trip
            </Button>
          </div>
        </div>

        <div role="tablist" aria-label="Filter plans" className="atx-tabs">
          {TABS.map((t) => (
            <button
              key={t.key || 'all'}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className="atx-tab"
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
            >
              {t.label}
              <span className="atx-tab-count">{formatNum(countFor(t.key))}</span>
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          rows={items}
          rowKey={(p) => p._id}
          loading={loading}
          error={error}
          onRetry={refetch}
          showing={items.length}
          total={total}
          pagination={pagination}
          onRowClick={(p) => (p.autoTripId ? navigate(`/auto-trips/${p.autoTripId}`) : null)}
          emptyTitle="No planned trips here"
          emptyHint="Schedule a trip and it is matched to the truck’s GPS trip when it runs."
        />
      </div>

      <TripPlanDialog
        open={dialog?.kind === 'create'}
        onOpenChange={(o) => setDialog(o ? { kind: 'create' } : null)}
        onCreated={refetch}
      />
      <LinkTripDialog
        plan={dialog?.kind === 'link' ? dialog.plan : null}
        onOpenChange={(o) => (o ? null : setDialog(null))}
        onLinked={refetch}
      />
    </div>
  );
}
