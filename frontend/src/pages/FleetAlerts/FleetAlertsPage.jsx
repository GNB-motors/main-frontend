import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import FleetDataService from '../../services/FleetDataService';
import useApi from '../../hooks/useApi';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import StatusChip from '../../components/ui/StatusChip';
import PlaceLabel from '../../components/ui/PlaceLabel';
import { formatLitres, formatNum } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { buildCsvString, triggerFileDownload } from '../../utils/reportCsvExport';

const PAGE_SIZE = 20;
const FUEL_TYPES = new Set(['RefuelAlert', 'FuelDrainAlert']);

const SEVERITY_COLOR = {
  critical: 'var(--critical)',
  caution: 'var(--caution)',
  info: 'var(--cluster-text-dim)',
};

export default function FleetAlertsPage() {
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

  const { data: summary } = useApi(
    (signal) => FleetDataService.getFleetAlertSummary({}, signal),
    [],
  );

  const { data, loading, error } = useApi(
    (signal) =>
      FleetDataService.getFleetAlerts(
        { ...(type ? { type } : {}), ...(vehicle ? { vehicle } : {}), page, limit: PAGE_SIZE },
        signal,
      ),
    [type, vehicle, page],
  );

  /* Newest first, regardless of backend ordering. */
  const records = useMemo(() => {
    const list = data?.records || [];
    return [...list].sort(
      (a, b) =>
        new Date(b.eventDateTime || b.receivedAt || 0) -
        new Date(a.eventDateTime || a.receivedAt || 0),
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

  const chips = [
    { key: '', label: 'All alerts', count: summary?.totalAlerts },
    ...byType.map((t) => ({ key: t.type, label: t.title, count: t.count })),
  ];

  return (
    <div className="cluster-page">
      <PageShell
        title="Fleet Alerts"
        subtitle="Native alerts pushed by FleetEdge — refuels, fuel drains, geofence events, overspeed and SOS."
        actions={
          <button
            type="button"
            onClick={exportCsv}
            disabled={!records.length}
            className="cluster-inset flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
            style={{ color: 'var(--cluster-text-dim)' }}
          >
            <Download size={13} /> CSV
          </button>
        }
        filters={
          <FilterBar
            searchValue={vehicleInput}
            onSearchChange={setVehicleInput}
            searchPlaceholder="Filter by vehicle"
            chips={chips}
            selectedKeys={[type]}
            onToggleChip={selectType}
          />
        }
      >
        <PanelErrorBoundary name="fleet-alerts">
          <div className="flex flex-wrap gap-3">
            <div className="cluster-inset flex min-w-[130px] flex-1 flex-col gap-1 p-4">
              <span className="cluster-eyebrow">Total alerts</span>
              <span className="num text-xl font-bold" style={{ color: 'var(--cluster-text)' }}>
                {formatNum(summary?.totalAlerts ?? 0)}
              </span>
            </div>
            {byType.map((t) => (
              <div
                key={t.type}
                className="cluster-inset flex min-w-[130px] flex-1 flex-col gap-1 p-4"
              >
                <span className="cluster-eyebrow">{t.title}</span>
                <span
                  className="num text-xl font-bold"
                  style={{ color: SEVERITY_COLOR[t.severity] || 'var(--cluster-text)' }}
                >
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
                    style={
                      a.severity === 'critical'
                        ? { borderLeft: '2px solid var(--critical)' }
                        : undefined
                    }
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <StatusChip group="severity" value={a.severity} />
                      <span className="text-sm font-semibold">{a.title}</span>
                      {a.registrationNumber ? (
                        <span className="reg-plate">{a.registrationNumber}</span>
                      ) : null}
                      {FUEL_TYPES.has(a.type) && a.fuelDifferenceL != null ? (
                        <span
                          className="cluster-inset num px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            color: a.type === 'FuelDrainAlert' ? 'var(--critical)' : 'var(--ok)',
                          }}
                        >
                          {a.fuelDifferenceL > 0 ? '+' : ''}
                          {formatLitres(a.fuelDifferenceL)}
                        </span>
                      ) : null}
                      {a.latitude != null && a.longitude != null ? (
                        <PlaceLabel lat={a.latitude} lng={a.longitude} />
                      ) : null}
                      <span className="num text-dim ml-auto text-[11px]">
                        {formatDateTimeIST(a.eventDateTime)}
                      </span>
                    </div>
                    {a.message ? (
                      <p className="text-dim mt-1.5 text-xs leading-relaxed">{a.message}</p>
                    ) : null}
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
                Page <span className="num">{formatNum(page)}</span> of{' '}
                <span className="num">{formatNum(totalPages)}</span>
                {' · '}
                <span className="num">{formatNum(total)}</span> alerts
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
      </PageShell>
    </div>
  );
}
