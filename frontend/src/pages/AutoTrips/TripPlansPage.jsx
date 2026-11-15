import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import TripPlanService from '../../services/TripPlanService';
import { formatNum } from '../../utils/formatters';
import TripPlanDialog from './TripPlanDialog';
import TripPlansTable from './TripPlansTable';
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
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  // { kind: 'create' } | null
  const [dialog, setDialog] = useState(null);

  const params = { page, limit: PAGE_SIZE, ...(tab ? { status: tab } : {}) };
  const { data, loading, error, refetch } = useApi(
    (signal) => TripPlanService.list(params, { signal }),
    [page, tab],
  );

  const total = data?.total ?? 0;
  const tabCounts = data?.tabCounts ?? {};
  const countFor = (key) =>
    key === '' ? Object.values(tabCounts).reduce((a, b) => a + (b || 0), 0) : tabCounts[key] || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

        <TripPlansTable
          data={data}
          loading={loading}
          error={error}
          refetch={refetch}
          pagination={pagination}
        />
      </div>

      <TripPlanDialog
        open={dialog?.kind === 'create'}
        onOpenChange={(o) => setDialog(o ? { kind: 'create' } : null)}
        onCreated={refetch}
      />
    </div>
  );
}
