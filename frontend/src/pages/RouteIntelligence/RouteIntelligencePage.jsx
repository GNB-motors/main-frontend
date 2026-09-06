import { useMemo, useState, useCallback } from 'react';
import { MapPin, Route } from 'lucide-react';
import useApi from '../../hooks/useApi';
import RouteIntelligenceService from './RouteIntelligenceService';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import ExportButton from '../../components/ui/ExportButton';
import PlaceLabel from '../../components/ui/PlaceLabel';
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

const PAGE_SIZE = 25;
const ALL = 'ALL';

/** Client-side search over the loaded page (the backend has no q param). */
function matchesQ(q, values) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return values.some((v) => String(v ?? '').toLowerCase().includes(needle));
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
function TabToolbar({ q, onQChange, activeFilters, exportProps }) {
  return (
    <FilterBar
      searchValue={q}
      onSearchChange={onQChange}
      searchPlaceholder="Search this page…"
      activeCount={q.trim() ? activeFilters + 1 : activeFilters}
      onClear={() => onQChange('')}
      right={<ExportButton {...exportProps} />}
    />
  );
}

function TableShell({ title, caption, children }) {
  return (
    <div className="cluster-panel overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h2 className="cluster-title text-sm">{title}</h2>
        {caption ? <p className="text-dim mt-1 text-xs leading-relaxed">{caption}</p> : null}
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
    <div className="mt-3 flex items-center justify-between px-4 pb-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange((p) => Math.max(1, p - 1))}
        className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
        style={{ color: 'var(--cluster-text-dim)' }}
      >
        Prev
      </button>
      <span className="num text-dim text-xs">
        Page {formatNum(page)} of {formatNum(totalPages)} · {formatNum(total ?? 0)} {label}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange((p) => p + 1)}
        className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
        style={{ color: 'var(--cluster-text-dim)' }}
      >
        Next
      </button>
    </div>
  );
}

function statusTone(status) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
    case 'PROPOSED':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

function typeTone(type) {
  switch (type) {
    case 'LOADING':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'PARKING':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    case 'FUEL_PUMP':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300';
    case 'WORKSHOP':
    case 'SERVICE':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

function SitesTable({ records, onConfirm, confirmingId }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[840px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: 'var(--cluster-text-dim)', borderBottom: '1px solid var(--hairline)' }}>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Key</th>
            <th className="px-4 py-3 font-semibold">Centroid</th>
            <th className="px-4 py-3 font-semibold">Radius</th>
            <th className="px-4 py-3 font-semibold">Visits</th>
            <th className="px-4 py-3 font-semibold">Vehicles</th>
            <th className="px-4 py-3 font-semibold">Evidence</th>
            <th className="px-4 py-3 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {records.map((site) => (
            <tr key={site._id} style={{ borderBottom: '1px solid var(--hairline)' }}>
              <td className="px-4 py-3">
                <span className={`num inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(site.status)}`}>
                  {site.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeTone(site.siteType)}`}>
                  {site.siteType || 'UNKNOWN'}
                </span>
              </td>
              <td className="px-4 py-3">{site.key}</td>
              <td className="px-4 py-3">
                <PlaceLabel lat={site.centroidLat} lng={site.centroidLng} />
              </td>
              <td className="num px-4 py-3">{formatNum(site.radiusM)} m</td>
              <td className="num px-4 py-3">{formatNum(site.visitCount)}</td>
              <td className="num px-4 py-3">{formatNum(site.distinctVehicleCount)}</td>
              <td className="px-4 py-3">
                {site.evidence?.length ? (
                  <details>
                    <summary className="cursor-pointer text-xs font-semibold" style={{ color: 'var(--gnb-400)' }}>
                      {site.evidence.length} sample{site.evidence.length === 1 ? '' : 's'}
                    </summary>
                    <ul className="mt-2 max-w-xs list-disc pl-4 text-[11px] text-muted-foreground">
                      {site.evidence.slice(0, 5).map((e, i) => (
                        <li key={i} className="break-words">{e}</li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <span className="text-dim text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {site.status === 'PROPOSED' ? (
                  <Button
                    size="sm"
                    disabled={confirmingId === site._id}
                    onClick={() => onConfirm(site._id)}
                  >
                    {confirmingId === site._id ? 'Confirming…' : 'Confirm'}
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CorridorsTable({ records }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: 'var(--cluster-text-dim)', borderBottom: '1px solid var(--hairline)' }}>
            <th className="px-4 py-3 font-semibold">Origin</th>
            <th className="px-4 py-3 font-semibold">Destination</th>
            <th className="px-4 py-3 font-semibold">Sample Tracks</th>
            <th className="px-4 py-3 font-semibold">p90 Cell Gap</th>
            <th className="px-4 py-3 font-semibold">Usable for Deviation</th>
            <th className="px-4 py-3 font-semibold">Insights Dominated</th>
          </tr>
        </thead>
        <tbody>
          {records.map((c) => (
            <tr key={c._id} style={{ borderBottom: '1px solid var(--hairline)' }}>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <PlaceLabel lat={c.originLat} lng={c.originLng} showMap={false} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <PlaceLabel lat={c.destinationLat} lng={c.destinationLng} showMap={false} />
                </div>
              </td>
              <td className="num px-4 py-3">{formatNum(c.sampleTrackCount)}</td>
              <td className="num px-4 py-3">{c.p90CellGapKm != null ? `${c.p90CellGapKm.toFixed(2)} km` : '—'}</td>
              <td className="px-4 py-3">
                <Badge variant={c.usableForDeviation ? 'default' : 'destructive'}>
                  {c.usableForDeviation ? 'Yes' : 'No'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={c.insightsDominated ? 'secondary' : 'outline'}>
                  {c.insightsDominated ? 'Yes' : 'No'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeviationsTable({ records }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: 'var(--cluster-text-dim)', borderBottom: '1px solid var(--hairline)' }}>
            <th className="px-4 py-3 font-semibold">Vehicle</th>
            <th className="px-4 py-3 font-semibold">Detected</th>
            <th className="px-4 py-3 font-semibold">Max Off Corridor</th>
            <th className="px-4 py-3 font-semibold">Off Points</th>
            <th className="px-4 py-3 font-semibold">Extra km</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((d) => (
            <tr key={d._id} style={{ borderBottom: '1px solid var(--hairline)' }}>
              <td className="px-4 py-3"><span className="reg-plate">{d.registrationNumber}</span></td>
              <td className="num px-4 py-3 whitespace-nowrap">{formatDateTimeIST(d.detectedAt)}</td>
              <td className="num px-4 py-3">{d.maxOffKm != null ? `${d.maxOffKm.toFixed(2)} km` : '—'}</td>
              <td className="num px-4 py-3">{formatNum(d.offCorridorPoints)}</td>
              <td className="num px-4 py-3">{d.extraKmEstimate != null ? `${d.extraKmEstimate.toFixed(2)} km` : '—'}</td>
              <td className="px-4 py-3">
                <span className={`num inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(d.status === 'OPEN' ? 'PROPOSED' : 'CONFIRMED')}`}>
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
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: 'var(--cluster-text-dim)', borderBottom: '1px solid var(--hairline)' }}>
            <th className="px-4 py-3 font-semibold">Vehicle</th>
            <th className="px-4 py-3 font-semibold">Site</th>
            <th className="px-4 py-3 font-semibold">Arrived</th>
            <th className="px-4 py-3 font-semibold">Departed</th>
            <th className="px-4 py-3 font-semibold">Dwell</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((a) => (
            <tr key={a._id} style={{ borderBottom: '1px solid var(--hairline)' }}>
              <td className="px-4 py-3"><span className="reg-plate">{a.registrationNumber}</span></td>
              <td className="num px-4 py-3 text-xs">{a.siteId}</td>
              <td className="num px-4 py-3 whitespace-nowrap">{formatDateTimeIST(a.arrivedAt)}</td>
              <td className="num px-4 py-3 whitespace-nowrap">{a.departedAt ? formatDateTimeIST(a.departedAt) : '—'}</td>
              <td className="num px-4 py-3">{a.dwellMin != null ? `${a.dwellMin.toFixed(0)} min` : '—'}</td>
              <td className="px-4 py-3">
                <span className={`num inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(a.status === 'OPEN' ? 'PROPOSED' : 'CONFIRMED')}`}>
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
  } = useApi((signal) => RouteIntelligenceService.listCorridors({ page: corridorPage, limit: PAGE_SIZE }, { signal }), [corridorPage]);

  const {
    data: deviationsData,
    loading: deviationsLoading,
    error: deviationsError,
  } = useApi((signal) => RouteIntelligenceService.listDeviations({ page: deviationPage, limit: PAGE_SIZE }, { signal }), [deviationPage]);

  const {
    data: arrivalsData,
    loading: arrivalsLoading,
    error: arrivalsError,
  } = useApi((signal) => RouteIntelligenceService.listArrivals({ page: arrivalPage, limit: PAGE_SIZE }, { signal }), [arrivalPage]);

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

  const siteRecords = (sitesData?.records || []).filter((s) => siteMatches(siteQ, s));
  const corridorRecords = (corridorsData?.records || []).filter((c) => corridorMatches(corridorQ, c));
  const deviationRecords = (deviationsData?.records || []).filter((d) => deviationMatches(deviationQ, d));
  const arrivalRecords = (arrivalsData?.records || []).filter((a) => arrivalMatches(arrivalQ, a));

  const siteStatusOptions = [ALL, 'PROPOSED', 'CONFIRMED', 'REJECTED'];
  const siteTypeOptions = [ALL, 'LOADING', 'PARKING', 'FUEL_PUMP', 'WORKSHOP', 'SERVICE', 'UNEXPLAINED', 'UNKNOWN'];

  const resetSitePage = () => setSitePage(1);

  const tabTotals = {
    sites: sitesData?.total,
    corridors: corridorsData?.total,
    deviations: deviationsData?.total,
    arrivals: arrivalsData?.total,
  };
  const tabQueries = { sites: siteQ, corridors: corridorQ, deviations: deviationQ, arrivals: arrivalQ };
  const tabFiltered = { sites: siteRecords, corridors: corridorRecords, deviations: deviationRecords, arrivals: arrivalRecords };
  const activeTabFilters =
    activeTab === 'sites' ? (siteStatus !== ALL ? 1 : 0) + (siteType !== ALL ? 1 : 0) : 0;

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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sites" className="flex items-center gap-1.5">
            <MapPin size={14} /> Sites
          </TabsTrigger>
          <TabsTrigger value="corridors" className="flex items-center gap-1.5">
            <Route size={14} /> Corridors
          </TabsTrigger>
          <TabsTrigger value="deviations">Deviations</TabsTrigger>
          <TabsTrigger value="arrivals">Arrivals</TabsTrigger>
        </TabsList>

        <TabsContent value="sites" className="space-y-4">
          <PanelErrorBoundary name="route-intelligence-sites">
            <div className="flex flex-wrap items-center gap-2">
              {siteStatusOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSiteStatus(s); resetSitePage(); }}
                  className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
                  style={siteStatus === s ? { borderColor: 'var(--gnb-400)', color: 'var(--gnb-400)' } : { color: 'var(--cluster-text-dim)' }}
                >
                  {s === ALL ? 'All' : s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {siteTypeOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setSiteType(t); resetSitePage(); }}
                  className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
                  style={siteType === t ? { borderColor: 'var(--gnb-400)', color: 'var(--gnb-400)' } : { color: 'var(--cluster-text-dim)' }}
                >
                  {t === ALL ? 'All types' : t}
                </button>
              ))}
            </div>

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
                    ...(siteQ.trim() ? [{ label: 'Search (this page)', value: siteQ.trim() }] : []),
                    ...(siteStatus !== ALL ? [{ label: 'Status', value: humanise(siteStatus) }] : []),
                    ...(siteType !== ALL ? [{ label: 'Type', value: humanise(siteType) }] : []),
                  ],
                },
              }}
            />

            <TableShell title="Discovered Sites" caption="Sites learned from vehicle stops. Confirm a proposed site so it can generate arrival events.">
              {sitesLoading && !sitesData ? (
                <ListSkeleton />
              ) : sitesError && !sitesData ? (
                <div className="p-4">
                  <EmptyState title="Sites unavailable" hint="Route site discovery data could not be loaded." />
                </div>
              ) : siteRecords.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title={siteQ.trim() && (sitesData?.records?.length ?? 0) > 0 ? `No sites on this page match “${siteQ.trim()}”` : 'No sites discovered'}
                    hint={siteQ.trim() && (sitesData?.records?.length ?? 0) > 0 ? 'Search narrows the loaded page only — try another term or clear the search.' : 'Vehicle stop clusters will appear here once the route-intelligence cron has run.'}
                  />
                </div>
              ) : (
                <>
                  <SitesTable records={siteRecords} onConfirm={handleConfirm} confirmingId={confirmingId} />
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
                  filters: corridorQ.trim() ? [{ label: 'Search (this page)', value: corridorQ.trim() }] : [],
                },
              }}
            />
            <TableShell title="Learned Corridors" caption="Baseline paths between site pairs. Corridors with a wide p90 cell gap are not usable for deviation detection.">
              {corridorsLoading && !corridorsData ? (
                <ListSkeleton />
              ) : corridorsError && !corridorsData ? (
                <div className="p-4">
                  <EmptyState title="Corridors unavailable" hint="Learned corridor data could not be loaded." />
                </div>
              ) : corridorRecords.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title={corridorQ.trim() && (corridorsData?.records?.length ?? 0) > 0 ? `No corridors on this page match “${corridorQ.trim()}”` : 'No corridors learned'}
                    hint={corridorQ.trim() && (corridorsData?.records?.length ?? 0) > 0 ? 'Try “usable”, “unusable” or a number such as the p90 gap.' : 'Corridors appear once enough trips have been driven between discovered sites.'}
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
                  filters: deviationQ.trim() ? [{ label: 'Search (this page)', value: deviationQ.trim() }] : [],
                },
              }}
            />
            <TableShell title="Route Deviations" caption="Trips that left a learned corridor. A flag means 'please review', not an accusation.">
              {deviationsLoading && !deviationsData ? (
                <ListSkeleton />
              ) : deviationsError && !deviationsData ? (
                <div className="p-4">
                  <EmptyState title="Deviations unavailable" hint="Deviation data could not be loaded." />
                </div>
              ) : deviationRecords.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title={deviationQ.trim() && (deviationsData?.records?.length ?? 0) > 0 ? `No deviations on this page match “${deviationQ.trim()}”` : 'No deviations'}
                    hint={deviationQ.trim() && (deviationsData?.records?.length ?? 0) > 0 ? 'Search narrows the loaded page only — try another term or clear the search.' : 'Vehicles are following the learned corridors, or no corridor has enough samples to compare against.'}
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
                  filters: arrivalQ.trim() ? [{ label: 'Search (this page)', value: arrivalQ.trim() }] : [],
                },
              }}
            />
            <TableShell title="Arrival Events" caption="Vehicles entering confirmed sites and dwelling past the threshold.">
              {arrivalsLoading && !arrivalsData ? (
                <ListSkeleton />
              ) : arrivalsError && !arrivalsData ? (
                <div className="p-4">
                  <EmptyState title="Arrivals unavailable" hint="Arrival event data could not be loaded." />
                </div>
              ) : arrivalRecords.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title={arrivalQ.trim() && (arrivalsData?.records?.length ?? 0) > 0 ? `No arrivals on this page match “${arrivalQ.trim()}”` : 'No arrivals'}
                    hint={arrivalQ.trim() && (arrivalsData?.records?.length ?? 0) > 0 ? 'Search narrows the loaded page only — try another term or clear the search.' : 'Arrivals appear once sites are confirmed and vehicles stop inside their radius.'}
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
    </PageShell>
  );
}
