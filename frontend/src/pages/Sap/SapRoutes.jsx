import { useDeferredValue, useState } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import { Button } from '../../components/ui/button';
import useApi from '../../hooks/useApi';
import SapService from '../../services/SapService';
import SapPill from './SapPill';
import SetSapDialog from './SetSapDialog';
import { BASIS_LABEL, SOURCE_LABEL, kmText } from './sapModel';
import './Sap.css';

const PAGE_SIZE = 50;
const HAS = [
  ['', 'All routes'],
  ['sap', 'With SAP'],
  ['nosap', 'Without SAP'],
];
const VERDICTS = [
  ['', 'Any result'],
  ['OVER', 'Over SAP'],
  ['UNDER', 'Under SAP'],
  ['WITHIN', 'Within'],
];

function columns(onSet) {
  return [
    {
      key: 'route',
      label: 'Route',
      render: (r) => (
        <div>
          <div className="cell-primary font-medium">
            {r.fromName || 'Unnamed place'} → {r.toName || 'Unnamed place'}
          </div>
          <div className="text-xs text-slate-500">
            {r.trips
              ? `${r.trips} trips · ${r.trucks} trucks`
              : 'Defined by a person, no trips yet'}
          </div>
        </div>
      ),
    },
    {
      key: 'laden',
      label: 'Usual loaded km',
      align: 'right',
      render: (r) => (
        <div>
          {kmText(r.ladenKm?.p50)}
          {r.roundTripKm?.p50 != null && (
            <div className="text-xs text-slate-500">round trip {kmText(r.roundTripKm.p50)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'sap',
      label: 'SAP',
      align: 'right',
      render: (r) =>
        r.sap ? (
          <div>
            <div className="cell-primary">{kmText(r.sap.sapKm)}</div>
            <div className="text-xs text-slate-500">
              {BASIS_LABEL[r.sap.basis]} · {SOURCE_LABEL[r.sap.source] || SOURCE_LABEL.MANUAL}
            </div>
          </div>
        ) : (
          <span className="sap-muted">Not set</span>
        ),
    },
    {
      key: 'verdict',
      label: 'Against SAP',
      render: (r) =>
        r.sap ? (
          <SapPill comparison={r.comparison} tolerance={r.tolerancePct} />
        ) : (
          <span className="sap-muted">—</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <Button variant="outline" size="sm" onClick={() => onSet(r)}>
          <Pencil size={13} />
          {r.sap ? 'Change' : 'Set SAP'}
        </Button>
      ),
    },
  ];
}

/**
 * Every route — the ones our trips ran, and the ones a person defined — with its usual km and
 * its SAP compared on the SAP's basis. SAP is set here, per route.
 */
export default function SapRoutes() {
  const [filters, setFilters] = useState({ search: '', has: '', verdict: '', page: 1 });
  const search = useDeferredValue(filters.search.trim());
  // { kind: 'new' } | { kind: 'set', row } | null
  const [dialog, setDialog] = useState(null);
  const q = useApi(
    (signal) =>
      SapService.routes(
        {
          page: filters.page,
          limit: PAGE_SIZE,
          ...(search ? { search } : {}),
          ...(filters.has ? { has: filters.has } : {}),
          ...(filters.verdict ? { verdict: filters.verdict } : {}),
        },
        { signal },
      ),
    [search, filters.has, filters.verdict, filters.page],
  );
  const set = (patch) => setFilters((f) => ({ ...f, page: 1, ...patch }));
  const tolerance = q.data?.settings?.tolerancePct ?? 10;
  const rows = (q.data?.rows || []).map((r) => ({ ...r, tolerancePct: tolerance }));
  const total = q.data?.total ?? 0;
  const totals = q.data?.totals || {};
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const saved = () => {
    q.refetch();
    toast.success('Route SAP saved — its trips refresh shortly');
  };
  const activeFilters = [search, filters.has, filters.verdict].filter(Boolean).length;
  return (
    <PageShell
      className="sap-panel sap-page"
      title="SAP routes"
      subtitle={`${totals.routes ?? 0} routes · ${totals.withSap ?? 0} with SAP · ${totals.over ?? 0} over SAP · ${kmText(totals.extraKm)} extra`}
      actions={
        <Button onClick={() => setDialog({ kind: 'new' })}>
          <Plus size={14} />
          New route
        </Button>
      }
      filters={
        <div className="sap-toolbar">
          <label className="sap-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search routes"
              placeholder="Search plant or drop"
              maxLength={60}
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
            />
          </label>
          <select
            className="sap-filter"
            aria-label="SAP set"
            value={filters.has}
            onChange={(e) => set({ has: e.target.value })}
          >
            {HAS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            className="sap-filter"
            aria-label="Against SAP"
            value={filters.verdict}
            onChange={(e) => set({ verdict: e.target.value })}
          >
            {VERDICTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      }
      footer={
        <div className="sap-row">
          <span>
            Page {filters.page} of {pages} · {total} routes
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1 || q.loading}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page >= pages || q.loading}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            Next
          </Button>
        </div>
      }
    >
      <DataTable
        columns={columns((row) => setDialog({ kind: 'set', row }))}
        rows={q.error ? [] : rows}
        rowKey={(r) => r.key}
        loading={q.loading && !q.data}
        error={q.error}
        onRetry={q.refetch}
        showing={rows.length}
        total={total}
        activeFilters={activeFilters}
        emptyTitle={activeFilters ? 'No route matches these filters' : 'No routes yet'}
        emptyHint={
          activeFilters
            ? 'Clear the search or the filters.'
            : 'Routes appear as trips are delivered. Use New route to set SAP between two places now.'
        }
      />
      {dialog?.kind === 'new' && <SetSapDialog onClose={() => setDialog(null)} onSaved={saved} />}
      {dialog?.kind === 'set' && (
        <SetSapDialog
          from={{ id: dialog.row.fromSiteId, name: dialog.row.fromName }}
          to={{ id: dialog.row.toSiteId, name: dialog.row.toName }}
          current={dialog.row.sap}
          onClose={() => setDialog(null)}
          onSaved={saved}
        />
      )}
    </PageShell>
  );
}
