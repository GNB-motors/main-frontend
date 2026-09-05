import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import SlideOver from '../../components/cluster/SlideOver';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import FreshnessBadge from '../../components/cluster/FreshnessBadge';
import { formatLitres, formatNum } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { buildCsvString, triggerFileDownload } from '../../utils/reportCsvExport';
import VehicleLink from '../../components/Fleet/VehicleLink.jsx';

function humanizeFlagType(type) {
  if (!type) return 'Flag';
  const s = String(type).toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function StatTile({ label, value, tone }) {
  return (
    <div className="cluster-inset flex flex-col gap-1 p-4">
      <span className="cluster-eyebrow">{label}</span>
      <span className="num text-xl font-bold" style={{ color: tone }}>{value}</span>
    </div>
  );
}

function FlagsDrawer({ vehicle, onClose }) {
  const flags = vehicle?.flags || [];
  return (
    <SlideOver
      open={Boolean(vehicle)}
      onClose={onClose}
      title={vehicle ? `DEF flags — ${vehicle.registrationNumber}` : ''}
      subtitle={vehicle ? `${formatNum(vehicle.flagCount ?? flags.length)} flag${(vehicle.flagCount ?? flags.length) === 1 ? '' : 's'} · balance ${formatLitres(vehicle.expectedBalanceL)}` : ''}
    >
      {flags.length === 0 ? (
        <EmptyState
          title="No flags on this vehicle"
          hint="Claimed DEF and measured consumption are in line. Flags appear here when a persistent gap shows up."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {flags.map((f, i) => (
            <div key={`${f.type}-${f.at}-${i}`} className="cluster-inset flex flex-col gap-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="lamp lamp--caution">{humanizeFlagType(f.type)}</span>
                {f.litres != null ? <span className="num text-xs font-semibold">{formatLitres(f.litres)}</span> : null}
              </div>
              <p className="text-sm leading-relaxed">{f.message}</p>
              <span className="num text-dim text-[11px]">{formatDateTimeIST(f.at)}</span>
            </div>
          ))}
        </div>
      )}
    </SlideOver>
  );
}

export default function DefLedgerPage({ embedded = false }) {
  const [selected, setSelected] = useState(null);

  const { data, loading, error } = useApi((signal) => FleetDataService.getDefLedger(signal), []);

  const vehicles = useMemo(() => data?.vehicles || [], [data]);
  const totals = data?.totals || {};

  const exportCsv = () => {
    const csv = buildCsvString(
      ['Vehicle', 'Claimed L', 'Consumed L', 'Balance L', 'Flags'],
      vehicles.map((v) => [v.registrationNumber, v.claimedAdblueL, v.telemetryDefL, v.expectedBalanceL, v.flagCount ?? (v.flags || []).length]),
    );
    triggerFileDownload(csv, 'def-ledger.csv', 'text/csv');
  };

  return (
    <div className={embedded ? 'fleet-embedded space-y-5' : 'cluster-page space-y-5'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Embedded: FuelHub owns the title; Export CSV stays. */}
        {!embedded && (
          <div>
            <h1 className="cluster-title text-xl">AdBlue Costs</h1>
            <p className="text-dim mt-1 text-sm">
              Claimed (billed) AdBlue vs what the vehicles actually consumed. A persistent gap is where tamper shows up.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={exportCsv}
          disabled={!vehicles.length}
          className="cluster-inset flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
          style={{ color: 'var(--cluster-text-dim)' }}
        >
          <Download size={13} /> CSV
        </button>
      </div>

      <PanelErrorBoundary name="def-ledger">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Vehicles" value={formatNum(totals.vehicles ?? vehicles.length)} tone="var(--cluster-text)" />
          <StatTile label="Flagged" value={formatNum(totals.flagged ?? 0)} tone="var(--caution)" />
          <StatTile label="Claimed" value={formatLitres(totals.claimedAdblueL)} tone="var(--cluster-text)" />
          <StatTile label="Consumed" value={formatLitres(totals.telemetryDefL)} tone="var(--cluster-text)" />
        </div>

        <div className="cluster-panel mt-4 overflow-hidden">
          {loading && !data ? (
            <div className="flex flex-col gap-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="cluster-inset h-10 animate-pulse" />
              ))}
            </div>
          ) : error && !data ? (
            <EmptyState
              title="DEF ledger unavailable"
              hint="The ledger fills in as DEF bills and CAN consumption data arrive."
            />
          ) : vehicles.length === 0 ? (
            <EmptyState
              title="No DEF data yet"
              hint="The ledger fills in as DEF bills and CAN consumption data arrive."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: 'var(--cluster-text-dim)', borderBottom: '1px solid var(--hairline)' }}>
                    <th className="px-4 py-3 font-semibold">Vehicle</th>
                    <th className="num px-4 py-3 text-right font-semibold">Claimed</th>
                    <th className="num px-4 py-3 text-right font-semibold">Consumed</th>
                    <th className="num px-4 py-3 text-right font-semibold">Balance</th>
                    <th className="px-4 py-3 font-semibold">Flags</th>
                    <th className="px-4 py-3 font-semibold">Computed</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => {
                    const flagCount = v.flagCount ?? (v.flags || []).length;
                    const balance = v.expectedBalanceL;
                    const balanceTone = balance != null && balance < 0 ? 'var(--critical)' : 'var(--ok)';
                    return (
                      <tr
                        key={v.vehicleId || v.registrationNumber}
                        onClick={() => setSelected(v)}
                        className="cursor-pointer transition-opacity hover:opacity-75"
                        style={{ borderBottom: '1px solid var(--hairline)' }}
                      >
                        <td className="px-4 py-3"><VehicleLink reg={v.registrationNumber} /></td>
                        <td className="num px-4 py-3 text-right">{formatLitres(v.claimedAdblueL)}</td>
                        <td className="num px-4 py-3 text-right">{formatLitres(v.telemetryDefL)}</td>
                        <td className="num px-4 py-3 text-right font-semibold" style={{ color: balanceTone }}>{formatLitres(balance)}</td>
                        <td className="px-4 py-3">
                          {flagCount > 0 ? (
                            <span className="lamp lamp--caution">{formatNum(flagCount)} flag{flagCount === 1 ? '' : 's'}</span>
                          ) : (
                            <span className="lamp lamp--ok">clear</span>
                          )}
                        </td>
                        <td className="px-4 py-3"><FreshnessBadge at={v.lastComputedAt} always prefix="Computed" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-dim mt-3 text-[11px]">
          Balance is claimed minus consumed. A negative balance means the vehicle used more DEF than was billed — please review those vehicles first.
        </p>
      </PanelErrorBoundary>

      <FlagsDrawer vehicle={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
