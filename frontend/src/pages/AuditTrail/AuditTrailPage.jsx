import { useMemo, useState } from 'react';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { formatNum } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';

const PAGE_SIZE = 25;
const ALL = 'ALL';

const EXPORT_COLUMNS = [
  { key: 'at', label: 'Time', type: 'date' },
  { key: 'typeLabel', label: 'Type' },
  { key: 'who', label: 'Who' },
  { key: 'entity', label: 'Entity' },
];

/** FLEETEDGE_TOKEN_RECONNECTED → 'Token reconnected' */
function humanizeType(type) {
  if (!type) return '—';
  let s = String(type).toLowerCase().replace(/_/g, ' ');
  if (s.startsWith('fleetedge ')) s = s.slice('fleetedge '.length);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncateId(id) {
  if (!id) return '—';
  const s = String(id);
  return s.length > 10 ? `${s.slice(0, 10)}…` : s;
}

export default function AuditTrailPage() {
  const [type, setType] = useState(ALL);
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ type: type === ALL ? undefined : type, page, limit: PAGE_SIZE }),
    [type, page],
  );

  const { data, loading, error } = useApi(
    (signal) => FleetDataService.getAuditLogs(params, signal),
    [params],
  );

  const records = useMemo(() => data?.records || [], [data]);
  const types = useMemo(() => data?.types || [], [data]);
  const totalPages = data?.totalPages || 1;
  const total = data?.total ?? records.length;

  const selectType = (t) => {
    setType(t);
    setPage(1);
  };

  const forbidden = error?.statusCode === 403;

  const exportRows = useMemo(
    () =>
      records.map((r) => ({
        at: r.at,
        typeLabel: humanizeType(r.type),
        who: r.user?.email || 'system',
        entity: `${r.entityType || ''} ${r.entityId || ''}`.trim(),
      })),
    [records],
  );

  const columns = [
    {
      key: 'at',
      label: 'When',
      render: (r) => <span className="num whitespace-nowrap">{formatDateTimeIST(r.at)}</span>,
    },
    {
      key: 'who',
      label: 'Who',
      render: (r) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs">{r.user?.email || 'system'}</span>
          {r.user?.role ? (
            <span
              className="cluster-inset num w-fit px-2 py-0.5 text-[10px] uppercase tracking-wide"
              style={{ color: 'var(--cluster-text-dim)' }}
            >
              {r.user.role}
            </span>
          ) : null}
        </div>
      ),
    },
    { key: 'type', label: 'Event', render: (r) => humanizeType(r.type) },
    {
      key: 'entity',
      label: 'Entity',
      render: (r) => (
        <>
          <span className="text-xs">{r.entityType || '—'}</span>{' '}
          <span className="num text-dim text-xs" title={r.entityId || ''}>
            {truncateId(r.entityId)}
          </span>
        </>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (r) => {
        const hasDetail = r.before != null || r.after != null;
        if (!hasDetail) return <span className="text-dim text-xs">—</span>;
        return (
          <details>
            <summary
              className="cursor-pointer text-xs font-semibold"
              style={{ color: 'var(--gnb-400)' }}
            >
              view
            </summary>
            <pre className="num mt-2 max-w-md overflow-x-auto text-[11px]">
              {JSON.stringify(r.after ?? r.before, null, 2)}
            </pre>
          </details>
        );
      },
    },
  ];

  return (
    <div className="cluster-page">
      <PageShell
        title="Audit Trail"
        subtitle="Who changed what, when. FleetEdge account and token events today."
        count={total}
        actions={
          <ExportButton
            rows={exportRows}
            columns={EXPORT_COLUMNS}
            filename="audit-trail"
            disabled={!records.length}
          />
        }
        filters={
          types.length > 0 && !forbidden ? (
            <FilterBar
              chips={[ALL, ...types].map((t) => ({
                key: t,
                label: t === ALL ? 'All' : humanizeType(t),
              }))}
              selectedKeys={[type]}
              onToggleChip={selectType}
            />
          ) : null
        }
        footer={
          !loading && !error && data && totalPages > 1
            ? `Page ${formatNum(data.page || page)} of ${formatNum(totalPages)} · ${formatNum(data.total ?? records.length)} events`
            : null
        }
      >
        <PanelErrorBoundary name="audit-trail">
          {forbidden ? (
            <div className="cluster-panel p-4">
              <EmptyState
                title="Owner access required"
                hint="The audit trail is visible to the fleet owner account. Please sign in with the owner account to review these events."
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={records}
              rowKey={(r) => r.id}
              loading={loading}
              error={error && !data ? error : null}
              showing={records.length}
              total={total}
              emptyTitle="No audit events yet"
              emptyHint="Audit events appear here as FleetEdge accounts and tokens are connected, reconnected or changed."
            />
          )}

          {!loading && !error && data && totalPages > 1 ? (
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
                style={{ color: 'var(--cluster-text-dim)' }}
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
                style={{ color: 'var(--cluster-text-dim)' }}
              >
                Next
              </button>
            </div>
          ) : null}
        </PanelErrorBoundary>
      </PageShell>
    </div>
  );
}
