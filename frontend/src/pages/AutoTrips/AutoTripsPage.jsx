import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileSpreadsheet, MapPinned, TriangleAlert } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import AutoTripService from '../../services/AutoTripService';

const TABS = [
  { key: '', label: 'All' },
  { key: 'COMPLETE', label: 'Complete' },
  { key: 'NEEDS_REVIEW', label: 'Needs review' },
  { key: 'OPEN', label: 'On the road' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'DISMISSED', label: 'Dismissed' },
];

const STATUS_VARIANT = {
  COMPLETE: 'default',
  CONFIRMED: 'default',
  NEEDS_REVIEW: 'secondary',
  OPEN: 'outline',
  DISMISSED: 'destructive',
};

const STATUS_LABEL = {
  COMPLETE: 'Complete',
  CONFIRMED: 'Confirmed',
  NEEDS_REVIEW: 'Needs review',
  OPEN: 'On the road',
  DISMISSED: 'Dismissed',
};

const PAGE_SIZE = 50;

function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function fmtKm(v) {
  return v == null ? '—' : `${Math.round(v)} km`;
}

function routeOf(trip) {
  const from = trip.pickup?.name || '—';
  const to = trip.drop?.name || (trip.drop?.source === 'UNKNOWN' ? 'unknown' : 'inferred');
  return `${from} → ${to}`;
}

export default function AutoTripsPage() {
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, ...(statusTab ? { status: statusTab } : {}) }),
    [page, statusTab],
  );

  const { data, loading, error, refetch } = useApi(
    (signal) => AutoTripService.list(params, { signal }),
    [JSON.stringify(params)],
  );

  const { data: coverage } = useApi((signal) => AutoTripService.coverage({ signal }), []);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const tabCounts = data?.tabCounts ?? {};
  const allCount = Object.values(tabCounts).reduce((a, b) => a + (b || 0), 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const countFor = (key) => (key === '' ? allCount : (tabCounts[key] ?? 0));

  const columns = useMemo(
    () => [
      { key: 'registrationNumber', label: 'Truck', render: (r) => r.registrationNumber || '—' },
      { key: 'route', label: 'Route', render: (r) => routeOf(r) },
      { key: 'departedAt', label: 'Left pickup', render: (r) => fmtDate(r.pickup?.departedAt) },
      { key: 'laden', label: 'Laden', align: 'right', render: (r) => fmtKm(r.km?.laden) },
      {
        key: 'drop',
        label: 'Drop',
        render: (r) =>
          r.drop?.source === 'LABELLED_PLACE'
            ? 'Labelled'
            : r.drop?.source === 'HUMAN'
              ? 'Confirmed'
              : r.drop?.source === 'INFERRED_TURNAROUND'
                ? 'Inferred'
                : 'Unknown',
      },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <Badge variant={STATUS_VARIANT[r.status] || 'outline'}>
            {STATUS_LABEL[r.status] || r.status}
          </Badge>
        ),
      },
    ],
    [],
  );

  const changeTab = (key) => {
    setStatusTab(key);
    setPage(1);
  };

  return (
    <PageShell
      title="Auto Trips"
      count={total}
      subtitle="Trips detected from GPS stops and your confirmed pickup / drop places — no ERP needed."
      actions={
        <Button size="sm" variant="outline" onClick={() => navigate('/auto-trips/oil-average')}>
          <FileSpreadsheet size={16} /> Oil &amp; Average report
        </Button>
      }
    >
      {coverage?.trucksMissing > 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            marginBottom: 12,
            borderRadius: 8,
            background: 'var(--muted, #f6f7f9)',
            fontSize: 13,
          }}
        >
          <TriangleAlert size={16} aria-hidden="true" />
          <span>
            {coverage.trucksMissing} trucks have no trips yet — usually their plant isn&apos;t a
            confirmed pickup place.
          </span>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {TABS.map((t) => (
          <Button
            key={t.key || 'all'}
            type="button"
            size="sm"
            variant={statusTab === t.key ? 'default' : 'outline'}
            onClick={() => changeTab(t.key)}
          >
            {t.label}
            <Badge variant="secondary" style={{ marginLeft: 6 }}>
              {countFor(t.key)}
            </Badge>
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(r) => r._id}
        loading={loading}
        error={error}
        onRetry={refetch}
        onRowClick={(r) => navigate(`/auto-trips/${r._id}`)}
        emptyTitle="No trips in this view"
        emptyHint={
          statusTab
            ? 'Try another tab, or confirm pickup / drop places so more trips are detected.'
            : 'Trips appear once GPS stops are detected at confirmed pickup places.'
        }
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          marginTop: 12,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--muted-foreground, #666)' }}>
          <MapPinned
            size={14}
            style={{ verticalAlign: 'middle', marginRight: 4 }}
            aria-hidden="true"
          />
          Page {page} / {totalPages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft size={16} /> Prev
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </PageShell>
  );
}
