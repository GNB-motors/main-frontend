import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { getDrift } from '../Profile/FleetEdgeAccountService';
import { getToken } from '../../utils/session.js';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { activeFilterCount } from '../../lib/tableState';
import { searchDriftRows } from './fleetEdgeAccountsDriftRows';

const driftColumns = [
  {
    key: 'vehicleReg',
    label: 'Vehicle',
    render: (r) => <span className="font-mono text-xs text-slate-700">{r.vehicleReg}</span>,
  },
  {
    key: 'fromLabel',
    label: 'From Account',
    render: (r) => <span className="text-slate-600">{r.fromLabel}</span>,
  },
  {
    key: 'toLabel',
    label: 'Arriving Account',
    render: (r) => <span className="text-slate-600">{r.toLabel}</span>,
  },
  {
    key: 'detectedAt',
    label: 'Detected At',
    type: 'date',
    render: (r) => (
      <span className="text-slate-400">
        {r.detectedAt ? new Date(r.detectedAt).toLocaleString() : '—'}
      </span>
    ),
  },
];

export default function DriftTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    const token = getToken();
    getDrift(token)
      .then((d) => setRows(d.drift || []))
      .catch((err) => {
        setLoadError(err);
        toast.error('Failed to load drift log');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side search over the loaded drift page (the endpoint has no text
  // filter and paginates at 50/page).
  const flatRows = useMemo(() => searchDriftRows(rows, q), [rows, q]);

  const searching = q.trim() !== '';

  return (
    <div>
      <FilterBar
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Search vehicle or account…"
        activeCount={activeFilterCount({ q })}
        onClear={() => setQ('')}
        right={
          <ExportButton
            rows={flatRows}
            columns={driftColumns}
            filename="fleetedge-drift-log"
            meta={{
              filters: [
                { label: 'Search', value: q.trim() || '—' },
                { label: 'Scope', value: 'Latest drift records (up to 50)' },
              ],
              generatedAt: new Date(),
            }}
          />
        }
      />
      <div className="mt-3">
        <DataTable
          columns={driftColumns}
          rows={flatRows}
          rowKey={(r) => r._id}
          loading={loading && rows.length === 0}
          error={loadError}
          onRetry={load}
          showing={flatRows.length}
          total={rows.length}
          activeFilters={activeFilterCount({ q })}
          emptyTitle={searching ? 'No drift records match your search' : 'No mismatches detected'}
          emptyHint={
            searching
              ? 'Try a different vehicle registration or account name.'
              : 'Vehicles appear here when they report through a different FleetEdge account than the one they are tagged to.'
          }
        />
      </div>
    </div>
  );
}
