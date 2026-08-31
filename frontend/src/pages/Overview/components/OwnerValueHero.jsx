import { Link } from 'react-router-dom';
import { ShieldAlert, Fuel, Receipt, Timer, Route, Droplets, ArrowUpRight, Wallet } from 'lucide-react';
import FleetHealthGauge from '../../../components/cluster/FleetHealthGauge';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import EmptyState from '../../../components/cluster/EmptyState';
import { useHealthScore, useMoney } from '../../../hooks/useOwnerValue';
import { formatINR, formatInrCompact } from '../../../utils/formatters';

const MONEY_TILES = [
  { key: 'theftLossInr', label: 'Theft loss', icon: ShieldAlert, to: '/fuel-integrity', tone: 'var(--critical)' },
  { key: 'billFraudSuspectInr', label: 'Bill fraud suspect', icon: Receipt, to: '/fuel-integrity', tone: 'var(--critical)' },
  { key: 'idlingWasteInr', label: 'Idling waste', icon: Timer, to: '/owner-alerts', tone: 'var(--caution)' },
  { key: 'detourWasteInr', label: 'Detour waste', icon: Route, to: '/route-deviation', tone: 'var(--caution)' },
  { key: 'defCostInr', label: 'DEF cost', icon: Droplets, to: '/def-ledger', tone: 'var(--gnb-400)' },
  { key: 'fuelCostInr', label: 'Fuel cost', icon: Fuel, to: '/fuel-spend', tone: 'var(--gnb-400)' },
];

function MoneyStrip({ money }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {MONEY_TILES.map((tile) => {
        const value = money?.[tile.key];
        const Icon = tile.icon;
        return (
          <Link
            key={tile.key}
            to={tile.to}
            className="cluster-inset group flex flex-col gap-1.5 p-3 transition-transform hover:-translate-y-0.5"
            title={`Open ${tile.label}`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide" style={{ color: 'var(--cluster-text-dim)' }}>
              <Icon size={12} style={{ color: tile.tone }} />
              {tile.label}
              <ArrowUpRight size={11} className="ml-auto opacity-0 transition-opacity group-hover:opacity-60" />
            </span>
            <span className="num text-lg font-bold" style={{ color: value > 0 ? tile.tone : 'var(--cluster-text)' }}>
              {formatInrCompact(value)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function PenaltyBreakdown({ components }) {
  const entries = Object.entries(components || {});
  if (!entries.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {entries.map(([name, c]) => {
        const pct = c?.weight > 0 ? Math.min(100, ((c?.penalty || 0) / c.weight) * 100) : 0;
        const color = pct === 0 ? 'var(--ok)' : pct >= 60 ? 'var(--critical)' : 'var(--caution)';
        return (
          <div key={name} className="flex items-center gap-3" title={c?.detail || ''}>
            <span className="w-24 shrink-0 text-xs font-medium capitalize" style={{ color: 'var(--cluster-text-dim)' }}>
              {name}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--hairline)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="num w-12 shrink-0 text-right text-xs font-semibold" style={{ color }}>
              {c?.penalty > 0 ? `−${Number(c.penalty).toFixed(1)}` : '0'}
            </span>
          </div>
        );
      })}
      <p className="text-dim mt-1 text-[11px] leading-relaxed">
        {(entries.find(([, c]) => c?.penalty > 0)?.[1]?.detail) || 'No penalties in the last 7 days.'}
      </p>
    </div>
  );
}

function TopWasteVehicles({ topVehicles }) {
  if (!topVehicles?.length) {
    return (
      <EmptyState
        title="No waste attributed to any vehicle"
        hint="When telemetry flags theft, detours or idling, the five costliest vehicles show up here."
      />
    );
  }
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: 'var(--hairline)' }}>
      {topVehicles.slice(0, 5).map((v, i) => (
        <Link
          key={v.registrationNumber}
          to={`/vehicles/${encodeURIComponent(v.registrationNumber)}`}
          className="flex items-center gap-3 py-2 transition-opacity hover:opacity-75"
        >
          <span className="num text-dim w-5 text-xs">{i + 1}</span>
          <span className="reg-plate">{v.registrationNumber}</span>
          <span className="num ml-auto text-sm font-bold" style={{ color: 'var(--critical)' }}>
            {formatINR(v.wasteInr)}
          </span>
        </Link>
      ))}
    </div>
  );
}

/**
 * OwnerValueHero — the top of the Overview: fleet health gauge + penalty
 * breakdown + the six-figure money strip + top-5 waste vehicles.
 * Each column is independently error-boundaried; a dead endpoint never blanks
 * the row.
 */
export default function OwnerValueHero({ moneyParams = {}, hasFleetData = true }) {
  const { data: health, loading: healthLoading, error: healthError } = useHealthScore();
  const { data: moneyData, loading: moneyLoading, error: moneyError } = useMoney(moneyParams);
  const noFleetData = hasFleetData === false;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <PanelErrorBoundary name="health-score">
        <div className="cluster-panel flex h-full flex-col items-center justify-center gap-3 p-5">
          <div className="flex w-full items-center justify-between">
            <span className="cluster-eyebrow">Fleet health</span>
            <span className="text-dim text-[11px]">last 7 days</span>
          </div>
          {healthLoading && !health ? (
            <div className="flex h-[220px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: 'var(--gnb-400)' }} />
            </div>
          ) : healthError && !health ? (
            <EmptyState title="Health score unavailable" hint="The score computes from telemetry, compliance and mileage data — it appears once those pipelines have run." />
          ) : (
            <>
              <FleetHealthGauge
                score={health?.score ?? 0}
                grade={health?.grade ?? 'D'}
                components={health?.components ?? {}}
                noData={noFleetData}
              />
              {noFleetData ? (
                <p className="text-dim max-w-[220px] text-center text-[11px] leading-relaxed">
                  Fleet health score appears once the fleet has vehicles, trips, and telemetry.
                </p>
              ) : null}
            </>
          )}
          {health?.components && !noFleetData ? <PenaltyBreakdown components={health.components} /> : null}
        </div>
      </PanelErrorBoundary>

      <PanelErrorBoundary name="money-strip">
        <div className="cluster-panel flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="cluster-eyebrow">Money in the window</span>
            <Wallet size={14} style={{ color: 'var(--cluster-text-dim)' }} />
          </div>
          {moneyLoading && !moneyData ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="cluster-inset h-[62px] animate-pulse" />
              ))}
            </div>
          ) : moneyError && !moneyData ? (
            <EmptyState title="Money rollup unavailable" hint="Estimated ₹ figures appear once telemetry and fuel data have been processed." />
          ) : (
            <>
              <MoneyStrip money={moneyData?.money} />
              <p className="text-dim mt-auto text-[11px] leading-relaxed">{moneyData?.disclaimer}</p>
            </>
          )}
        </div>
      </PanelErrorBoundary>

      <PanelErrorBoundary name="top-waste">
        <div className="cluster-panel flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="cluster-eyebrow">Costliest vehicles</span>
            <span className="text-dim text-[11px]">by estimated waste</span>
          </div>
          {moneyLoading && !moneyData ? (
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="cluster-inset h-8 animate-pulse" />
              ))}
            </div>
          ) : (
            <TopWasteVehicles topVehicles={moneyData?.topVehicles} />
          )}
        </div>
      </PanelErrorBoundary>
    </div>
  );
}
