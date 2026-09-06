import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarDays, RefreshCw, AlertTriangle } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import { CommandCenterService } from './CommandCenterService.jsx';
import { C } from '../../utils/erpChartTheme';
import { PageSkeleton } from './CommandCenterPrimitives';
import {
  HeroBand,
  OrderToCashPanel,
  FleetPanel,
  MoneySection,
  FleetPLSection,
} from './CommandCenterPanels';

/* ── Page ─────────────────────────────────────────────────────────────────── */

const RANGE_OPTIONS = [
  { value: 7, label: '7D' },
  { value: 14, label: '14D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
];

const CommandCenterPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedOnce = useRef(false);

  const fetchData = useCallback(async () => {
    if (!hasLoadedOnce.current) setIsLoading(true);
    else setIsFetching(true);
    setError(null);
    try {
      const result = await CommandCenterService.load({ days });
      setData(result);
      setLastUpdated(new Date());
      hasLoadedOnce.current = true;
    } catch (err) {
      setError(err?.detail || 'Could not load the overview. Please try again.');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle size={30} className="text-red-500" />
        </div>
        <p className="text-lg font-bold" style={{ color: C.ink }}>
          Something went wrong
        </p>
        <p className="max-w-md text-sm" style={{ color: C.muted }}>
          {error}
        </p>
        <button
          onClick={fetchData}
          className="mt-1 rounded-lg px-5 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: C.cat[0] }}
        >
          Try again
        </button>
      </div>
    );
  }

  const erp = data?.erp;
  const fleet = data?.fleet;
  const fuel = data?.fuel;
  const fin = data?.financials?.summary;

  return (
    <PageShell
      title="Overview"
      subtitle="Order-to-cash and the fleet behind it, in one view"
      freshnessAt={lastUpdated?.toISOString()}
      actions={
        <div className="flex items-center gap-2.5">
          <CalendarDays
            size={16}
            strokeWidth={2.5}
            className="shrink-0"
            style={{ color: C.muted }}
          />
          {isFetching && (
            <RefreshCw size={13} className="animate-spin" style={{ color: C.cat[0] }} />
          )}
          <div
            className="flex items-center gap-0.5 rounded-lg p-0.5"
            style={{ background: '#eef1f6' }}
            role="group"
            aria-label="Date range for fleet metrics"
          >
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setDays(o.value)}
                aria-pressed={days === o.value}
                className="num rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                style={
                  days === o.value
                    ? {
                        background: '#fff',
                        color: C.ink,
                        boxShadow: '0 1px 2px rgba(15,23,42,0.08)',
                      }
                    : { color: C.muted }
                }
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="rounded-lg border p-2 transition-colors hover:bg-slate-50"
            style={{ borderColor: C.grid }}
            aria-label="Refresh"
          >
            <RefreshCw size={14} style={{ color: C.muted }} />
          </button>
        </div>
      }
    >
      {isFetching && (
        <div className="fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden">
          <div
            className="h-full w-full animate-pulse"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, #4f46e5 30%, #8b83ed 50%, #4f46e5 70%, transparent 100%)',
            }}
          />
        </div>
      )}

      <div className="space-y-6 font-sans antialiased">
        {/* ── Hero band ── */}
        <HeroBand erp={erp} fleet={fleet} />

        {/* ── Two-column body ──
            h-full + flex-col on the cards so each one fills its stretched grid
            cell; otherwise the shorter column ends early and leaves a large dead
            gap under it. */}
        <div className="grid gap-5 xl:grid-cols-2">
          <OrderToCashPanel erpFailed={data?.erpFailed} erp={erp} />
          <FleetPanel fleetFailed={data?.fleetFailed} fleet={fleet} fuel={fuel} days={days} />
        </div>

        {/* ── Money detail ── */}
        <MoneySection erp={erp} />

        {/* ── Fleet P&L (only when the endpoint returned something) ── */}
        {fin && <FleetPLSection fin={fin} days={days} />}
      </div>
    </PageShell>
  );
};

export default CommandCenterPage;
