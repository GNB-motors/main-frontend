import { useEffect, useMemo, useState } from 'react';
import { Download, MapPin } from 'lucide-react';
import FleetDataService from '../../services/FleetDataService';
import useApi from '../../hooks/useApi';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { formatLitres, formatNum } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { buildCsvString, triggerFileDownload } from '../../utils/reportCsvExport';
import VehicleLink from '../../components/Fleet/VehicleLink.jsx';

const PAGE_SIZE = 20;
const FUEL_TYPES = new Set(['RefuelAlert', 'FuelDrainAlert']);

const SEVERITY_COLOR = {
  critical: 'var(--critical)',
  caution: 'var(--caution)',
  info: 'var(--cluster-text-dim)',
};

/* No lamp--info exists in the design system — base .lamp renders the inert dot. */
const lampClass = (severity) =>
  severity === 'critical' || severity === 'caution' ? `lamp lamp--${severity}` : 'lamp';

export default function FleetAlertsPage({ embedded = false }) {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [vehicleInput, setVehicleInput] = useState('');
  const [vehicle, setVehicle] = useState('');

  /* Debounce the vehicle filter; uppercase to match registration numbers. */
  useEffect(() => {
    const t = setTimeout(() => {
      setVehicle(vehicleInput.trim().toUpperCase());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [vehicleInput]);

  const { data: summary } = useApi((signal) => FleetDataService.getFleetAlertSummary({}, signal), []);

  const { data, loading, error } = useApi(
    (signal) =>
      FleetDataService.getFleetAlerts(
        {
          ...(type ? { type } : {}),
          ...(vehicle ? { vehicle } : {}),
          page,
          limit: PAGE_SIZE,
        },
        signal,
      ),
    [type, vehicle, page],
  );

  /* Newest first, regardless of backend ordering. */
  const records = useMemo(() => {
    const list = data?.records || [];
    return [...list].sort(
      (a, b) => new Date(b.eventDateTime || b.receivedAt || 0) - new Date(a.eventDateTime || a.receivedAt || 0),
    );
  }, [data]);

  const byType = summary?.byType || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total ?? 0;

  const selectType = (t) => {
    setType(t);
    setPage(1);
  };

  const exportCsv = () => {
    const csv = buildCsvString(
      ['Time', 'Type', 'Vehicle', 'Severity', 'Message', 'Litres'],
      records.map((a) => [
        formatDateTimeIST(a.eventDateTime),
        a.type,
        a.registrationNumber,
        a.severity,
        a.message,
        a.fuelDifferenceL ?? '',
      ]),
    );
    triggerFileDownload(csv, `fleet-alerts-page-${page}.csv`, 'text/csv');
  };

  return (
    <div className={embedded ? 'fleet-embedded space-y-5' : 'cluster-page space-y-5'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Embedded: AlertsHub owns the title; CSV export stays. */}
        {!embedded && (
          <div>
            <h1 className="cluster-title text-xl">FleetEdge feed</h1>
            <p className="text-dim mt-1 text-sm">
              Raw alerts pushed by the device — refuels, fuel drains, geofence events, overspeed and SOS.
            </p>
          </div>
        )}
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

      <PanelErrorBoundary name="fleet-alerts">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => selectType('')}
            className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
            style={type === '' ? { borderColor: 'var(--gnb-400)', color: 'var(--gnb-400)' } : { color: 'var(--cluster-text-dim)' }}
          >
            All alerts{summary?.totalAlerts != null ? <> · <span className="num">{formatNum(summary.totalAlerts)}</span></> : null}
          </button>
          {byType.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => selectType(t.type)}
              className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
              style={type === t.type ? { borderColor: 'var(--gnb-400)', color: 'var(--gnb-400)' } : { color: 'var(--cluster-text-dim)' }}
            >
              {t.title} · <span className="num">{formatNum(t.count)}</span>
            </button>
          ))}
          <input
            type="text"
            value={vehicleInput}
            onChange={(e) => setVehicleInput(e.target.value)}
            placeholder="Filter by vehicle"
            aria-label="Filter by vehicle"
            className="cluster-inset num w-full px-3 py-1.5 text-xs font-semibold uppercase outline-none sm:w-44"
            style={{ color: 'var(--cluster-text)' }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="cluster-inset flex min-w-[130px] flex-1 flex-col gap-1 p-4">
            <span className="cluster-eyebrow">Total alerts</span>
            <span className="num text-xl font-bold" style={{ color: 'var(--cluster-text)' }}>
              {formatNum(summary?.totalAlerts ?? 0)}
            </span>
          </div>
          {byType.map((t) => (
            <div key={t.type} className="cluster-inset flex min-w-[130px] flex-1 flex-col gap-1 p-4">
              <span className="cluster-eyebrow">{t.title}</span>
              <span className="num text-xl font-bold" style={{ color: SEVERITY_COLOR[t.severity] || 'var(--cluster-text)' }}>
                {formatNum(t.count)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4">
          {loading && !data ? (
            <div className="flex flex-col gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="cluster-inset h-12 animate-pulse" />
              ))}
            </div>
          ) : error && !data ? (
            <EmptyState
              title="Alerts unavailable"
              hint="The alert feed could not be reached just now. Please review again in a moment — the rest of the page is unaffected."
            />
          ) : records.length === 0 ? (
            <EmptyState
              title="No alerts in this window"
              hint="FleetEdge pushes refuel, fuel-drain, geofence, overspeed and SOS events to GNB the moment they happen. Once a linked vehicle triggers one, it lands here."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {records.map((a) => (
                <div
                  key={a.id}
                  className="cluster-inset p-3"
                  style={a.severity === 'critical' ? { borderLeft: '2px solid var(--critical)' } : undefined}
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={lampClass(a.severity)}>{a.severity}</span>
                    <span className="text-sm font-semibold">{a.title}</span>
                    {a.registrationNumber ? <VehicleLink reg={a.registrationNumber} /> : null}
                    {FUEL_TYPES.has(a.type) && a.fuelDifferenceL != null ? (
                      <span
                        className="cluster-inset num px-2 py-0.5 text-[11px] font-semibold"
                        style={{ color: a.type === 'FuelDrainAlert' ? 'var(--critical)' : 'var(--ok)' }}
                      >
                        {a.fuelDifferenceL > 0 ? '+' : ''}{formatLitres(a.fuelDifferenceL)}
                      </span>
                    ) : null}
                    {a.latitude != null && a.longitude != null ? (
                      <a
                        href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-75"
                        style={{ color: 'var(--gnb-400)' }}
                      >
                        <MapPin size={11} /> Map
                      </a>
                    ) : null}
                    <span className="num text-dim ml-auto text-[11px]">{formatDateTimeIST(a.eventDateTime)}</span>
                  </div>
                  {a.message ? <p className="text-dim mt-1.5 text-xs leading-relaxed">{a.message}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {records.length > 0 ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
              style={{ color: 'var(--cluster-text-dim)' }}
            >
              Prev
            </button>
            <span className="text-dim text-xs">
              Page <span className="num">{formatNum(page)}</span> of <span className="num">{formatNum(totalPages)}</span>
              {' · '}<span className="num">{formatNum(total)}</span> alerts
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
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
