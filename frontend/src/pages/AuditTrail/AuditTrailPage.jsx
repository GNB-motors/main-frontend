import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { formatNum } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { buildCsvString, triggerFileDownload } from '../../utils/reportCsvExport';

const PAGE_SIZE = 25;
const ALL = 'ALL';

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

  const selectType = (t) => {
    setType(t);
    setPage(1);
  };

  const exportCsv = () => {
    const csv = buildCsvString(
      ['Time', 'Type', 'Who', 'Entity'],
      records.map((r) => [
        formatDateTimeIST(r.at),
        humanizeType(r.type),
        r.user?.email || 'system',
        `${r.entityType || ''} ${r.entityId || ''}`.trim(),
      ]),
    );
    triggerFileDownload(csv, 'audit-trail.csv', 'text/csv');
  };

  const forbidden = error?.statusCode === 403;

  return (
    <div className="cluster-page space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="cluster-title text-xl">Audit Trail</h1>
          <p className="text-dim mt-1 text-sm">
            Who changed what, when. FleetEdge account and token events today.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!records.length}
          className="cluster-inset flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
          style={{ color: 'var(--cluster-text-dim)' }}
        >
          <Download size={13} /> CSV
        </button>
      </div>

      <PanelErrorBoundary name="audit-trail">
        {types.length > 0 && !forbidden ? (
          <div className="flex flex-wrap items-center gap-2">
            {[ALL, ...types].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => selectType(t)}
                className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
                style={type === t ? { borderColor: 'var(--gnb-400)', color: 'var(--gnb-400)' } : { color: 'var(--cluster-text-dim)' }}
              >
                {t === ALL ? 'All' : humanizeType(t)}
              </button>
            ))}
          </div>
        ) : null}

        <div className="cluster-panel mt-4 overflow-hidden">
          {loading && !data ? (
            <div className="flex flex-col gap-2 p-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="cluster-inset h-10 animate-pulse" />
              ))}
            </div>
          ) : forbidden ? (
            <EmptyState
              title="Owner access required"
              hint="The audit trail is visible to the fleet owner account. Please sign in with the owner account to review these events."
            />
          ) : error && !data ? (
            <EmptyState
              title="Audit trail unavailable"
              hint="Audit events appear here as FleetEdge accounts and tokens are connected, reconnected or changed."
            />
          ) : records.length === 0 ? (
            <EmptyState
              title="No audit events yet"
              hint="Audit events appear here as FleetEdge accounts and tokens are connected, reconnected or changed."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: 'var(--cluster-text-dim)', borderBottom: '1px solid var(--hairline)' }}>
                    <th className="px-4 py-3 font-semibold">When</th>
                    <th className="px-4 py-3 font-semibold">Who</th>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold">Entity</th>
                    <th className="px-4 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const hasDetail = r.before != null || r.after != null;
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                        <td className="num px-4 py-3 whitespace-nowrap">{formatDateTimeIST(r.at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs">{r.user?.email || 'system'}</span>
                            {r.user?.role ? (
                              <span className="cluster-inset num w-fit px-2 py-0.5 text-[10px] uppercase tracking-wide" style={{ color: 'var(--cluster-text-dim)' }}>
                                {r.user.role}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">{humanizeType(r.type)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs">{r.entityType || '—'}</span>{' '}
                          <span className="num text-dim text-xs" title={r.entityId || ''}>{truncateId(r.entityId)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {hasDetail ? (
                            <details>
                              <summary className="cursor-pointer text-xs font-semibold" style={{ color: 'var(--gnb-400)' }}>view</summary>
                              <pre className="num mt-2 max-w-md overflow-x-auto text-[11px]">{JSON.stringify(r.after ?? r.before, null, 2)}</pre>
                            </details>
                          ) : (
                            <span className="text-dim text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && !error && data && totalPages > 1 ? (
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
              style={{ color: 'var(--cluster-text-dim)' }}
            >
              Prev
            </button>
            <span className="num text-dim text-xs">
              Page {formatNum(data.page || page)} of {formatNum(totalPages)} · {formatNum(data.total ?? records.length)} events
            </span>
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
    </div>
  );
}
