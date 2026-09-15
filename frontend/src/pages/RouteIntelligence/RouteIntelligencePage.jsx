import { Fragment, useMemo, useState, useCallback } from 'react';
import {
  MapPin,
  Route,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Clock,
  Check,
  Loader2,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import RouteIntelligenceService from './RouteIntelligenceService';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import ExportButton from '../../components/ui/ExportButton';
import PlaceLabel from '../../components/ui/PlaceLabel';
import EtaBand from '../../components/ui/EtaBand';
import { footerSummary } from '../../lib/tableState';
import { humanise, label } from '../../lib/vocabulary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination';
import { formatNum } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';
import '../OwnerAlerts/OwnerAlerts.css';

const PAGE_SIZE = 25;
const ALL = 'ALL';

/** Client-side search over the loaded page (the backend has no q param). */
function matchesQ(q, values) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return values.some((v) =>
    String(v ?? '')
      .toLowerCase()
      .includes(needle),
  );
}

function siteMatches(q, site) {
  return matchesQ(q, [site.key, site.siteType, site.status]);
}

function corridorMatches(q, c) {
  return matchesQ(q, [
    c.usableForDeviation ? 'usable' : 'unusable',
    c.insightsDominated ? 'dominated' : '',
    c.p90CellGapKm,
    c.sampleTrackCount,
  ]);
}

function deviationMatches(q, d) {
  return matchesQ(q, [d.registrationNumber, d.status]);
}

function arrivalMatches(q, a) {
  return matchesQ(q, [a.registrationNumber, a.siteId, a.status]);
}

// Export shapes — one set of columns per tab, rows mapped so no UPPER_SNAKE
// or raw coordinate ever lands in the file.
const SITES_EXPORT_COLUMNS = [
  { key: 'key', label: 'Key' },
  { key: 'siteType', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'radiusM', label: 'Radius (m)', type: 'number' },
  { key: 'visitCount', label: 'Visits', type: 'number' },
  { key: 'distinctVehicleCount', label: 'Vehicles', type: 'number' },
];
const siteExportRows = (records) =>
  records.map((s) => ({
    key: s.key,
    siteType: humanise(s.siteType),
    status: label('status', s.status),
    radiusM: s.radiusM,
    visitCount: s.visitCount,
    distinctVehicleCount: s.distinctVehicleCount,
  }));

const CORRIDORS_EXPORT_COLUMNS = [
  { key: 'sampleTrackCount', label: 'Sample tracks', type: 'number' },
  { key: 'p90CellGapKm', label: 'p90 cell gap (km)', type: 'number' },
  { key: 'usableForDeviation', label: 'Usable for deviation' },
  { key: 'insightsDominated', label: 'Insights dominated' },
];
const corridorExportRows = (records) =>
  records.map((c) => ({
    sampleTrackCount: c.sampleTrackCount,
    p90CellGapKm: c.p90CellGapKm,
    usableForDeviation: c.usableForDeviation ? 'Yes' : 'No',
    insightsDominated: c.insightsDominated ? 'Yes' : 'No',
  }));

const DEVIATIONS_EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'detectedAt', label: 'Detected' },
  { key: 'maxOffKm', label: 'Max off corridor (km)', type: 'number' },
  { key: 'offCorridorPoints', label: 'Off points', type: 'number' },
  { key: 'extraKmEstimate', label: 'Extra km', type: 'number' },
  { key: 'status', label: 'Status' },
];
const deviationExportRows = (records) =>
  records.map((d) => ({
    registrationNumber: d.registrationNumber,
    detectedAt: d.detectedAt ? new Date(d.detectedAt) : null,
    maxOffKm: d.maxOffKm,
    offCorridorPoints: d.offCorridorPoints,
    extraKmEstimate: d.extraKmEstimate,
    status: label('status', d.status),
  }));

const ARRIVALS_EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'siteId', label: 'Site' },
  { key: 'arrivedAt', label: 'Arrived' },
  { key: 'departedAt', label: 'Departed' },
  { key: 'dwellMin', label: 'Dwell (min)', type: 'number' },
  { key: 'status', label: 'Status' },
];
const arrivalExportRows = (records) =>
  records.map((a) => ({
    registrationNumber: a.registrationNumber,
    siteId: a.siteId,
    arrivedAt: a.arrivedAt ? new Date(a.arrivedAt) : null,
    departedAt: a.departedAt ? new Date(a.departedAt) : null,
    dwellMin: a.dwellMin,
    status: label('status', a.status),
  }));

/** One FilterBar + ExportButton row, mounted inside each tab panel. */
function TabToolbar({ q, onQChange, activeFilters, exportProps, children = null }) {
  return (
    <FilterBar
      searchValue={q}
      onSearchChange={onQChange}
      searchPlaceholder="Search this page…"
      activeCount={q.trim() ? activeFilters + 1 : activeFilters}
      onClear={() => onQChange('')}
      right={
        <div className="flex items-center gap-2">
          {children}
          <ExportButton {...exportProps} />
        </div>
      }
    />
  );
}

function TableShell({ title, caption, children }) {
  return (
    <div className="oa-table-wrapper">
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {caption ? (
            <p className="text-slate-500 mt-0.5 text-xs leading-relaxed">{caption}</p>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function ListSkeleton({ rows = 6 }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="cluster-inset h-10 animate-pulse" />
      ))}
    </div>
  );
}

function SimplePagination({ page, totalPages, total, onChange, label = 'items' }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-white">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange((p) => Math.max(1, p - 1))}
        className="ov-btn"
        style={{ padding: '5px 12px', fontSize: 12, borderRadius: 9999 }}
      >
        Prev
      </button>
      <span className="num text-slate-500 text-xs font-medium">
        Page {page} of {totalPages}
        {total != null ? ` (${total} ${label})` : ''}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange((p) => Math.min(totalPages, p + 1))}
        className="ov-btn"
        style={{ padding: '5px 12px', fontSize: 12, borderRadius: 9999 }}
      >
        Next
      </button>
    </div>
  );
}

function statusTone(status) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold';
    case 'PROPOSED':
      return 'bg-amber-50 text-amber-900 border border-amber-300 font-bold';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-800 border border-rose-300 font-bold';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-300 font-medium';
  }
}

function typeTone(type) {
  switch (type) {
    case 'LOADING':
      return 'bg-blue-50 text-blue-800 border border-blue-300 font-semibold';
    case 'PARKING':
      return 'bg-purple-50 text-purple-800 border border-purple-300 font-semibold';
    case 'FUEL_PUMP':
      return 'bg-amber-50 text-amber-900 border border-amber-300 font-semibold';
    case 'WORKSHOP':
    case 'SERVICE':
      return 'bg-indigo-50 text-indigo-800 border border-indigo-300 font-semibold';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-300 font-medium';
  }
}

function SitesTable({ records, onConfirm, confirmingId }) {
  return (
    <div className="overflow-x-auto">
      <table className="oa-table">
        <thead>
          <tr>
            <th style={{ width: 110 }}>Status</th>
            <th style={{ width: 110 }}>Type</th>
            <th>Key</th>
            <th>Centroid</th>
            <th>Radius</th>
            <th>Visits</th>
            <th>Vehicles</th>
            <th>Evidence</th>
            <th style={{ textAlign: 'right', width: 110 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((site) => (
            <tr key={site._id}>
              <td>
                <span
                  className={`num inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusTone(site.status)}`}
                >
                  {site.status}
                </span>
              </td>
              <td>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide ${typeTone(site.siteType)}`}
                >
                  {site.siteType || 'UNKNOWN'}
                </span>
              </td>
              <td>
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {site.key}
                </span>
              </td>
              <td>
                <PlaceLabel lat={site.centroidLat} lng={site.centroidLng} />
              </td>
              <td className="num font-mono">{formatNum(site.radiusM)} m</td>
              <td className="num font-mono font-bold text-slate-800">
                {formatNum(site.visitCount)}
              </td>
              <td className="num font-mono font-bold text-slate-800">
                {formatNum(site.distinctVehicleCount)}
              </td>
              <td>
                {site.evidence?.length ? (
                  <details>
                    <summary className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-800">
                      {site.evidence.length} sample{site.evidence.length === 1 ? '' : 's'}
                    </summary>
                    <ul className="mt-2 max-w-xs list-disc pl-4 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                      {site.evidence.slice(0, 5).map((e, i) => (
                        <li key={i} className="break-words">
                          {e}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <span className="text-slate-400 text-xs">—</span>
                )}
              </td>
              <td className="text-right">
                {site.status === 'PROPOSED' ? (
                  <button
                    className="oa-ack-action"
                    disabled={confirmingId === site._id}
                    onClick={() => onConfirm(site._id)}
                  >
                    {confirmingId === site._id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}{' '}
                    Confirm
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CorridorEtaPanel({ corridor }) {
  const originSiteId = corridor.originSiteId ?? null;
  const destinationSiteId = corridor.destinationSiteId ?? null;
  const enabled = Boolean(originSiteId && destinationSiteId);
  const { data, loading, error } = useApi(
    (signal) =>
      RouteIntelligenceService.corridorEtaStats({ originSiteId, destinationSiteId }, { signal }),
    [originSiteId, destinationSiteId],
    { enabled },
  );

  if (!enabled) {
    return (
      <p className="text-xs" style={{ color: 'var(--cluster-text-dim)' }}>
        Transit stats become available once both endpoints are confirmed sites.
      </p>
    );
  }
  if (loading) {
    return <Skeleton className="h-8 w-full max-w-md" />;
  }
  if (error) {
    return (
      <p className="text-xs" style={{ color: 'var(--cluster-text-dim)' }}>
        Transit stats unavailable — the estimate will appear once the corridor feed responds.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <EtaBand stats={data?.stats ?? null} />
      {data?.windowDays != null && (
        <span className="text-xs" style={{ color: 'var(--cluster-text-dim)' }}>
          Window: last {data.windowDays} days
        </span>
      )}
    </div>
  );
}

function CorridorsTable({ records }) {
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div className="overflow-x-auto">
      <table className="oa-table">
        <thead>
          <tr>
            <th style={{ width: 44, textAlign: 'center' }} aria-label="Expand" />
            <th>Origin</th>
            <th>Destination</th>
            <th>Sample Tracks</th>
            <th>p90 Cell Gap</th>
            <th>Usable for Deviation</th>
            <th>Insights Dominated</th>
          </tr>
        </thead>
        <tbody>
          {records.map((c) => {
            const expanded = expandedId === c._id;
            return (
              <Fragment key={c._id}>
                <tr
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedId(expanded ? null : c._id)}
                >
                  <td style={{ textAlign: 'center' }} aria-hidden="true">
                    {expanded ? (
                      <ChevronDown size={14} className="text-blue-600" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-400" />
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <PlaceLabel lat={c.originLat} lng={c.originLng} showMap={false} />
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <PlaceLabel lat={c.destinationLat} lng={c.destinationLng} showMap={false} />
                    </div>
                  </td>
                  <td className="num font-mono font-bold text-slate-800">
                    {formatNum(c.sampleTrackCount)}
                  </td>
                  <td className="num font-mono">
                    {c.p90CellGapKm != null ? `${c.p90CellGapKm.toFixed(2)} km` : '—'}
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${c.usableForDeviation ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}
                    >
                      {c.usableForDeviation ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${c.insightsDominated ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                    >
                      {c.insightsDominated ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
                {expanded && (
                  <tr>
                    <td colSpan={7} className="p-4 bg-slate-50/80 border-b border-slate-200">
                      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Typical Transit Time & Statistics
                        </span>
                        <CorridorEtaPanel corridor={c} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DeviationsTable({ records }) {
  return (
    <div className="overflow-x-auto">
      <table className="oa-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Detected</th>
            <th>Max Off Corridor</th>
            <th>Off Points</th>
            <th>Extra km</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((d) => (
            <tr key={d._id}>
              <td>
                <span className="reg-plate font-mono font-bold text-slate-900">
                  {d.registrationNumber}
                </span>
              </td>
              <td className="num font-mono text-slate-600 whitespace-nowrap">
                {formatDateTimeIST(d.detectedAt)}
              </td>
              <td
                className="num font-mono font-semibold"
                style={{ color: d.maxOffKm > 5 ? '#e11d48' : '#0f172a' }}
              >
                {d.maxOffKm != null ? `${d.maxOffKm.toFixed(2)} km` : '—'}
              </td>
              <td className="num font-mono font-bold text-slate-800">
                {formatNum(d.offCorridorPoints)}
              </td>
              <td className="num font-mono">
                {d.extraKmEstimate != null ? `${d.extraKmEstimate.toFixed(2)} km` : '—'}
              </td>
              <td>
                <span
                  className={`num inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone(d.status === 'OPEN' ? 'PROPOSED' : 'CONFIRMED')}`}
                >
                  {d.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArrivalsTable({ records }) {
  return (
    <div className="overflow-x-auto">
      <table className="oa-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Site</th>
            <th>Arrived</th>
            <th>Departed</th>
            <th>Dwell</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((a) => (
            <tr key={a._id}>
              <td>
                <span className="reg-plate font-mono font-bold text-slate-900">
                  {a.registrationNumber}
                </span>
              </td>
              <td>
                <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {a.siteId}
                </span>
              </td>
              <td className="num font-mono text-slate-600 whitespace-nowrap">
                {formatDateTimeIST(a.arrivedAt)}
              </td>
              <td className="num font-mono text-slate-600 whitespace-nowrap">
                {a.departedAt ? formatDateTimeIST(a.departedAt) : '—'}
              </td>
              <td className="num font-mono font-bold text-slate-800">
                {a.dwellMin != null ? `${a.dwellMin.toFixed(0)} min` : '—'}
              </td>
              <td>
                <span
                  className={`num inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone(a.status === 'OPEN' ? 'PROPOSED' : 'CONFIRMED')}`}
                >
                  {a.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RouteIntelligencePage() {
  const [activeTab, setActiveTab] = useState('sites');
  const [siteStatus, setSiteStatus] = useState(ALL);
  const [siteType, setSiteType] = useState(ALL);
  const [sitePage, setSitePage] = useState(1);
  const [corridorPage, setCorridorPage] = useState(1);
  const [deviationPage, setDeviationPage] = useState(1);
  const [arrivalPage, setArrivalPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState(null);
  // Client-side search per tab — the backend list endpoints accept no q param,
  // so these narrow the records already on screen (the current page).
  const [siteQ, setSiteQ] = useState('');
  const [corridorQ, setCorridorQ] = useState('');
  const [deviationQ, setDeviationQ] = useState('');
  const [arrivalQ, setArrivalQ] = useState('');

  const siteParams = useMemo(
    () => ({
      status: siteStatus === ALL ? undefined : siteStatus,
      siteType: siteType === ALL ? undefined : siteType,
      page: sitePage,
      limit: PAGE_SIZE,
    }),
    [siteStatus, siteType, sitePage],
  );

  const {
    data: sitesData,
    loading: sitesLoading,
    error: sitesError,
    refetch: refetchSites,
  } = useApi((signal) => RouteIntelligenceService.listSites(siteParams, { signal }), [siteParams]);

  const {
    data: corridorsData,
    loading: corridorsLoading,
    error: corridorsError,
  } = useApi(
    (signal) =>
      RouteIntelligenceService.listCorridors({ page: corridorPage, limit: PAGE_SIZE }, { signal }),
    [corridorPage],
  );

  const {
    data: deviationsData,
    loading: deviationsLoading,
    error: deviationsError,
  } = useApi(
    (signal) =>
      RouteIntelligenceService.listDeviations(
        { page: deviationPage, limit: PAGE_SIZE },
        { signal },
      ),
    [deviationPage],
  );

  const {
    data: arrivalsData,
    loading: arrivalsLoading,
    error: arrivalsError,
  } = useApi(
    (signal) =>
      RouteIntelligenceService.listArrivals({ page: arrivalPage, limit: PAGE_SIZE }, { signal }),
    [arrivalPage],
  );

  const handleConfirm = useCallback(
    async (id) => {
      setConfirmingId(id);
      try {
        await RouteIntelligenceService.confirmSite(id);
        await refetchSites();
      } catch (err) {
        console.error('Failed to confirm site:', err);
      } finally {
        setConfirmingId(null);
      }
    },
    [refetchSites],
  );

  // A 404 from the backend means the fleetIntelligence feature flag is off for
  // this organization. Surface that calmly instead of crashing.
  const any404 =
    sitesError?.response?.status === 404 ||
    corridorsError?.response?.status === 404 ||
    deviationsError?.response?.status === 404 ||
    arrivalsError?.response?.status === 404;

  if (any404) {
    return (
      <PageShell
        title="Route Intelligence"
        subtitle="Where your trucks actually stop and the paths they drive between those stops."
      >
        <div className="cluster-panel">
          <EmptyState
            title="Route Intelligence is not enabled for this organization."
            hint="Ask your administrator to turn on the Fleet Intelligence feature flag to see discovered sites, learned corridors and deviations."
          />
        </div>
      </PageShell>
    );
  }

  function RouteIntelligenceSummary({
    sitesCount,
    corridorsCount,
    deviationsCount,
    arrivalsCount,
    proposedSitesCount,
  }) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="ov-kpi" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Discovered Sites</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              <MapPin size={14} />
            </span>
          </div>
          <span className="ov-kpi-value">{formatNum(sitesCount ?? 0)}</span>
          <span className="ov-kpi-sub">
            {proposedSitesCount > 0 ? (
              <span className="text-amber-700 font-semibold">
                {proposedSitesCount} proposed to confirm
              </span>
            ) : (
              'all learned stops'
            )}
          </span>
        </div>

        <div className="ov-kpi" style={{ borderLeft: '4px solid #4f46e5' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Learned Corridors</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Route size={14} />
            </span>
          </div>
          <span className="ov-kpi-value">{formatNum(corridorsCount ?? 0)}</span>
          <span className="ov-kpi-sub">baseline paths between sites</span>
        </div>

        <div className="ov-kpi" style={{ borderLeft: '4px solid #d97706' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Route Deviations</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle size={14} />
            </span>
          </div>
          <span
            className="ov-kpi-value"
            style={{ color: deviationsCount > 0 ? '#b45309' : undefined }}
          >
            {formatNum(deviationsCount ?? 0)}
          </span>
          <span className="ov-kpi-sub">off-corridor trips detected</span>
        </div>

        <div className="ov-kpi" style={{ borderLeft: '4px solid #059669' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Arrival Events</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Clock size={14} />
            </span>
          </div>
          <span className="ov-kpi-value">{formatNum(arrivalsCount ?? 0)}</span>
          <span className="ov-kpi-sub">site arrivals & dwells</span>
        </div>
      </div>
    );
  }

  const siteRecords = (sitesData?.records || []).filter((s) => siteMatches(siteQ, s));
  const corridorRecords = (corridorsData?.records || []).filter((c) =>
    corridorMatches(corridorQ, c),
  );
  const deviationRecords = (deviationsData?.records || []).filter((d) =>
    deviationMatches(deviationQ, d),
  );
  const arrivalRecords = (arrivalsData?.records || []).filter((a) => arrivalMatches(arrivalQ, a));

  const siteStatusOptions = [ALL, 'PROPOSED', 'CONFIRMED', 'REJECTED'];
  const siteTypeOptions = [
    ALL,
    'LOADING',
    'PARKING',
    'FUEL_PUMP',
    'WORKSHOP',
    'SERVICE',
    'UNEXPLAINED',
    'UNKNOWN',
  ];

  const resetSitePage = () => setSitePage(1);

  const tabTotals = {
    sites: sitesData?.total,
    corridors: corridorsData?.total,
    deviations: deviationsData?.total,
    arrivals: arrivalsData?.total,
  };
  const tabQueries = {
    sites: siteQ,
    corridors: corridorQ,
    deviations: deviationQ,
    arrivals: arrivalQ,
  };
  const tabFiltered = {
    sites: siteRecords,
    corridors: corridorRecords,
    deviations: deviationRecords,
    arrivals: arrivalRecords,
  };
  const activeTabFilters =
    activeTab === 'sites' ? (siteStatus !== ALL ? 1 : 0) + (siteType !== ALL ? 1 : 0) : 0;
  const proposedSitesCount = (sitesData?.records || []).filter(
    (s) => s.status === 'PROPOSED',
  ).length;

  return (
    <PageShell
      title="Route Intelligence"
      subtitle="Where your trucks actually stop and the paths they drive between those stops."
      count={tabTotals[activeTab] ?? null}
      footer={`${footerSummary({
        showing: tabFiltered[activeTab].length,
        total: tabTotals[activeTab] ?? tabFiltered[activeTab].length,
        activeFilters: activeTabFilters + (tabQueries[activeTab].trim() ? 1 : 0),
      })} on this page — search filters the loaded page`}
    >
      <div className="space-y-5">
        <RouteIntelligenceSummary
          sitesCount={tabTotals.sites}
          corridorsCount={tabTotals.corridors}
          deviationsCount={tabTotals.deviations}
          arrivalsCount={tabTotals.arrivals}
          proposedSitesCount={proposedSitesCount}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-300 rounded-xl shadow-sm w-full md:w-auto overflow-x-auto">
            <TabsTrigger
              value="sites"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600 hover:text-slate-900"
            >
              <MapPin size={14} />
              <span>Sites</span>
              {tabTotals.sites != null && (
                <span className="ml-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold bg-slate-100 text-slate-700 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                  {tabTotals.sites}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="corridors"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600 hover:text-slate-900"
            >
              <Route size={14} />
              <span>Corridors</span>
              {tabTotals.corridors != null && (
                <span className="ml-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold bg-slate-100 text-slate-700 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                  {tabTotals.corridors}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="deviations"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600 hover:text-slate-900"
            >
              <AlertTriangle size={14} />
              <span>Deviations</span>
              {tabTotals.deviations != null && (
                <span className="ml-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold bg-slate-100 text-slate-700 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                  {tabTotals.deviations}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="arrivals"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600 hover:text-slate-900"
            >
              <Clock size={14} />
              <span>Arrivals</span>
              {tabTotals.arrivals != null && (
                <span className="ml-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold bg-slate-100 text-slate-700 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                  {tabTotals.arrivals}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sites" className="space-y-4 mt-4">
            <PanelErrorBoundary name="route-intelligence-sites">
              <TabToolbar
                q={siteQ}
                onQChange={setSiteQ}
                activeFilters={(siteStatus !== ALL ? 1 : 0) + (siteType !== ALL ? 1 : 0)}
                exportProps={{
                  rows: siteExportRows(siteRecords),
                  columns: SITES_EXPORT_COLUMNS,
                  filename: 'route-sites',
                  meta: {
                    generatedAt: new Date(),
                    filters: [
                      ...(siteQ.trim()
                        ? [{ label: 'Search (this page)', value: siteQ.trim() }]
                        : []),
                      ...(siteStatus !== ALL
                        ? [{ label: 'Status', value: humanise(siteStatus) }]
                        : []),
                      ...(siteType !== ALL ? [{ label: 'Type', value: humanise(siteType) }] : []),
                    ],
                  },
                }}
              >
                <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-100 p-1">
                  {siteStatusOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSiteStatus(s);
                        resetSitePage();
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                        siteStatus === s
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {s === ALL ? 'All Statuses' : humanise(s)}
                    </button>
                  ))}
                </div>
                <div className="fi-field">
                  <select
                    value={siteType}
                    onChange={(e) => {
                      setSiteType(e.target.value);
                      resetSitePage();
                    }}
                    aria-label="Filter site type"
                  >
                    <option value={ALL}>All Types</option>
                    {siteTypeOptions
                      .filter((t) => t !== ALL)
                      .map((t) => (
                        <option key={t} value={t}>
                          {humanise(t)}
                        </option>
                      ))}
                  </select>
                </div>
              </TabToolbar>

              <TableShell
                title="Discovered Sites"
                caption="Sites learned from vehicle stops. Confirm a proposed site so it can generate arrival events."
              >
                {sitesLoading && !sitesData ? (
                  <ListSkeleton />
                ) : sitesError && !sitesData ? (
                  <div className="p-4">
                    <EmptyState
                      title="Sites unavailable"
                      hint="Route site discovery data could not be loaded."
                    />
                  </div>
                ) : siteRecords.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      title={
                        siteQ.trim() && (sitesData?.records?.length ?? 0) > 0
                          ? `No sites on this page match “${siteQ.trim()}”`
                          : 'No sites discovered'
                      }
                      hint={
                        siteQ.trim() && (sitesData?.records?.length ?? 0) > 0
                          ? 'Search narrows the loaded page only — try another term or clear the search.'
                          : 'Vehicle stop clusters will appear here once the route-intelligence cron has run.'
                      }
                    />
                  </div>
                ) : (
                  <>
                    <SitesTable
                      records={siteRecords}
                      onConfirm={handleConfirm}
                      confirmingId={confirmingId}
                    />
                    <SimplePagination
                      page={sitesData?.page || sitePage}
                      totalPages={sitesData?.totalPages || 1}
                      total={sitesData?.total}
                      onChange={setSitePage}
                      label="sites"
                    />
                  </>
                )}
              </TableShell>
            </PanelErrorBoundary>
          </TabsContent>

          <TabsContent value="corridors" className="space-y-4">
            <PanelErrorBoundary name="route-intelligence-corridors">
              <TabToolbar
                q={corridorQ}
                onQChange={setCorridorQ}
                activeFilters={0}
                exportProps={{
                  rows: corridorExportRows(corridorRecords),
                  columns: CORRIDORS_EXPORT_COLUMNS,
                  filename: 'route-corridors',
                  meta: {
                    generatedAt: new Date(),
                    filters: corridorQ.trim()
                      ? [{ label: 'Search (this page)', value: corridorQ.trim() }]
                      : [],
                  },
                }}
              />
              <TableShell
                title="Learned Corridors"
                caption="Baseline paths between site pairs. Corridors with a wide p90 cell gap are not usable for deviation detection."
              >
                {corridorsLoading && !corridorsData ? (
                  <ListSkeleton />
                ) : corridorsError && !corridorsData ? (
                  <div className="p-4">
                    <EmptyState
                      title="Corridors unavailable"
                      hint="Learned corridor data could not be loaded."
                    />
                  </div>
                ) : corridorRecords.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      title={
                        corridorQ.trim() && (corridorsData?.records?.length ?? 0) > 0
                          ? `No corridors on this page match “${corridorQ.trim()}”`
                          : 'No corridors learned'
                      }
                      hint={
                        corridorQ.trim() && (corridorsData?.records?.length ?? 0) > 0
                          ? 'Try “usable”, “unusable” or a number such as the p90 gap.'
                          : 'Corridors appear once enough trips have been driven between discovered sites.'
                      }
                    />
                  </div>
                ) : (
                  <>
                    <CorridorsTable records={corridorRecords} />
                    <SimplePagination
                      page={corridorsData?.page || corridorPage}
                      totalPages={corridorsData?.totalPages || 1}
                      total={corridorsData?.total}
                      onChange={setCorridorPage}
                      label="corridors"
                    />
                  </>
                )}
              </TableShell>
            </PanelErrorBoundary>
          </TabsContent>

          <TabsContent value="deviations" className="space-y-4">
            <PanelErrorBoundary name="route-intelligence-deviations">
              <TabToolbar
                q={deviationQ}
                onQChange={setDeviationQ}
                activeFilters={0}
                exportProps={{
                  rows: deviationExportRows(deviationRecords),
                  columns: DEVIATIONS_EXPORT_COLUMNS,
                  filename: 'route-deviations',
                  meta: {
                    generatedAt: new Date(),
                    filters: deviationQ.trim()
                      ? [{ label: 'Search (this page)', value: deviationQ.trim() }]
                      : [],
                  },
                }}
              />
              <TableShell
                title="Route Deviations"
                caption="Trips that left a learned corridor. A flag means 'please review', not an accusation."
              >
                {deviationsLoading && !deviationsData ? (
                  <ListSkeleton />
                ) : deviationsError && !deviationsData ? (
                  <div className="p-4">
                    <EmptyState
                      title="Deviations unavailable"
                      hint="Deviation data could not be loaded."
                    />
                  </div>
                ) : deviationRecords.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      title={
                        deviationQ.trim() && (deviationsData?.records?.length ?? 0) > 0
                          ? `No deviations on this page match “${deviationQ.trim()}”`
                          : 'No deviations'
                      }
                      hint={
                        deviationQ.trim() && (deviationsData?.records?.length ?? 0) > 0
                          ? 'Search narrows the loaded page only — try another term or clear the search.'
                          : 'Vehicles are following the learned corridors, or no corridor has enough samples to compare against.'
                      }
                    />
                  </div>
                ) : (
                  <>
                    <DeviationsTable records={deviationRecords} />
                    <SimplePagination
                      page={deviationsData?.page || deviationPage}
                      totalPages={deviationsData?.totalPages || 1}
                      total={deviationsData?.total}
                      onChange={setDeviationPage}
                      label="deviations"
                    />
                  </>
                )}
              </TableShell>
            </PanelErrorBoundary>
          </TabsContent>

          <TabsContent value="arrivals" className="space-y-4">
            <PanelErrorBoundary name="route-intelligence-arrivals">
              <TabToolbar
                q={arrivalQ}
                onQChange={setArrivalQ}
                activeFilters={0}
                exportProps={{
                  rows: arrivalExportRows(arrivalRecords),
                  columns: ARRIVALS_EXPORT_COLUMNS,
                  filename: 'route-arrivals',
                  meta: {
                    generatedAt: new Date(),
                    filters: arrivalQ.trim()
                      ? [{ label: 'Search (this page)', value: arrivalQ.trim() }]
                      : [],
                  },
                }}
              />
              <TableShell
                title="Arrival Events"
                caption="Vehicles entering confirmed sites and dwelling past the threshold."
              >
                {arrivalsLoading && !arrivalsData ? (
                  <ListSkeleton />
                ) : arrivalsError && !arrivalsData ? (
                  <div className="p-4">
                    <EmptyState
                      title="Arrivals unavailable"
                      hint="Arrival event data could not be loaded."
                    />
                  </div>
                ) : arrivalRecords.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      title={
                        arrivalQ.trim() && (arrivalsData?.records?.length ?? 0) > 0
                          ? `No arrivals on this page match “${arrivalQ.trim()}”`
                          : 'No arrivals'
                      }
                      hint={
                        arrivalQ.trim() && (arrivalsData?.records?.length ?? 0) > 0
                          ? 'Search narrows the loaded page only — try another term or clear the search.'
                          : 'Arrivals appear once sites are confirmed and vehicles stop inside their radius.'
                      }
                    />
                  </div>
                ) : (
                  <>
                    <ArrivalsTable records={arrivalRecords} />
                    <SimplePagination
                      page={arrivalsData?.page || arrivalPage}
                      totalPages={arrivalsData?.totalPages || 1}
                      total={arrivalsData?.total}
                      onChange={setArrivalPage}
                      label="arrivals"
                    />
                  </>
                )}
              </TableShell>
            </PanelErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
