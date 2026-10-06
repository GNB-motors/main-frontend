import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import ExcursionService from '../../services/ExcursionService';

const TABS = [
  { key: '', label: 'All' },
  { key: 'DEVIATION', label: 'To review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'APPROVED_LATE', label: 'Approved (late)' },
  { key: 'NOT_DEVIATION', label: 'Not a deviation' },
];

const STATUS_VARIANT = {
  DEVIATION: 'destructive',
  APPROVED: 'default',
  APPROVED_LATE: 'secondary',
  NOT_DEVIATION: 'outline',
};
const STATUS_LABEL = {
  DEVIATION: 'To review',
  APPROVED: 'Approved',
  APPROVED_LATE: 'Approved (late)',
  NOT_DEVIATION: 'Not a deviation',
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
const km = (v) => (v == null ? '—' : `${Math.round(v)} km`);
const litres = (v) => (v == null ? '—' : `${Number(v).toFixed(1)} L`);

function placeOf(e) {
  const v = Array.isArray(e.visits) && e.visits.length ? e.visits[0] : null;
  return e.purpose || v?.name || (v?.placeKind ? v.placeKind.toLowerCase() : '—');
}

export default function ExcursionsPage() {
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, ...(statusTab ? { status: statusTab } : {}) }),
    [page, statusTab],
  );
  const { data, loading, error, refetch } = useApi(
    (signal) => ExcursionService.list(params, { signal }),
    [JSON.stringify(params)],
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns = useMemo(
    () => [
      { key: 'openedAt', label: 'Opened', render: (r) => fmtDate(r.openedAt) },
      {
        key: 'vehicle',
        label: 'Vehicle',
        render: (r) => r.registrationNumber || '—',
      },
      { key: 'place', label: 'Place / purpose', render: (r) => placeOf(r) },
      { key: 'extra', label: 'Extra', align: 'right', render: (r) => km(r.km?.extra) },
      { key: 'excess', label: 'Charged', align: 'right', render: (r) => km(r.km?.excess) },
      { key: 'fuel', label: 'Fuel extra', align: 'right', render: (r) => litres(r.fuel?.excessL) },
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
      title="Deviations"
      count={total}
      subtitle="Non-business detours detected from trips — review each as approved or not a deviation, or give it a reason."
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/auto-trips')}>
          <ArrowLeft size={16} /> Trips
        </Button>
      }
    >
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
        onRowClick={(r) => navigate(`/auto-trips/excursions/${r._id}`)}
        emptyTitle="No deviations here"
        emptyHint="Deviations appear when a truck takes a non-business detour on a trip."
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
