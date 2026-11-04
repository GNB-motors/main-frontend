import { useApi } from '@/hooks/useApi';
import { formatKm, formatNumber, formatPct } from '@/utils/redesign/format';
import IntelCard from './IntelCard';
import IntelligenceDataState from './IntelligenceDataState';
import IntelligenceKpi from './IntelligenceKpi';
import RunsTruckBar from './RunsTruckBar';
import IntelligenceService from './IntelligenceService';
import { isYmd, istDayEnd, istDayStart, runBarsByTruck } from './intelligenceModel';

const RUNS_LOADED_TIP = 'Km driven with load, from a plant to a customer or siding.';
const RUNS_EMPTY_TIP = 'Km driven without load, usually from a customer back to a plant.';
const RUNS_REPOSITION_TIP =
  'The truck went from one plant straight to another without coming back empty. This is normal: plants work like warehouses, and it often saves an empty run.';

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--rd-ink-2)]">
      {[
        ['Loaded', 'var(--rd-leg-loaded)'],
        ['Empty', 'var(--rd-leg-empty)'],
        ['Plant-to-plant', 'var(--rd-leg-reposition)'],
      ].map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

/**
 * RunsTab — how much of the driving carried load.
 *
 * Four numbers from the period summary, then the top trucks by distance
 * with their kilometres split by leg. A truck going from one plant straight
 * to another is a normal run, so it is shown on its own and never counted
 * as an empty run.
 */
export default function RunsTab({ from, to }) {
  const { data, loading, error, refetch } = useApi(
    (signal) => IntelligenceService.getSummary({ from, to, signal }),
    [from, to],
  );

  const rangeReady = isYmd(from) && isYmd(to);
  const {
    data: trips,
    loading: tripsLoading,
    error: tripsError,
    refetch: refetchTrips,
  } = useApi(
    (signal) =>
      IntelligenceService.getAutoTrips({
        from: rangeReady ? istDayStart(from).toISOString() : undefined,
        to: rangeReady ? istDayEnd(to).toISOString() : undefined,
        limit: 200,
        signal,
      }),
    [from, to],
  );

  const held = data?.held ? data.why : null;
  const runs = data?.runs ?? null;
  const totalKm = runs ? runs.loadedKm + runs.emptyKm + runs.repositionKm : 0;
  const bars = runBarsByTruck(trips?.items ?? [], { limit: 20 });
  const maxKm = bars.reduce((max, row) => Math.max(max, row.totalKm), 0);

  return (
    <div className="flex flex-col gap-4">
      <IntelligenceDataState
        loading={loading}
        loadingVariant="metrics"
        loadingCount={4}
        error={error}
        held={held}
        what="The run numbers"
        onRetry={refetch}
      >
        <div className="intel-kpi-strip intel-kpi-strip--inline">
          <IntelligenceKpi
            label="Loaded km"
            value={formatKm(runs?.loadedKm)}
            why={{ text: RUNS_LOADED_TIP }}
            context={runs ? `on ${formatNumber(runs.loadedTrips)} loaded trips` : null}
          />
          <IntelligenceKpi
            label="Empty km"
            value={formatKm(runs?.emptyKm)}
            why={{ text: RUNS_EMPTY_TIP }}
            context="driving back empty"
          />
          <IntelligenceKpi
            label="Plant-to-plant"
            value={formatKm(runs?.repositionKm)}
            why={{ text: RUNS_REPOSITION_TIP }}
            context={runs ? `${formatNumber(runs.plantToPlant)} runs` : null}
          />
          <IntelligenceKpi
            label="Empty share"
            value={formatPct(runs?.emptySharePct)}
            why={runs?.why ?? null}
            context={runs ? `of ${formatKm(totalKm)} driven` : null}
          />
        </div>
      </IntelligenceDataState>

      <IntelCard
        title="Kilometres by truck"
        count={bars.length ? `top ${bars.length} by distance` : null}
        info={{
          text: 'The trucks that drove most in the period, split into loaded, empty and plant-to-plant kilometres. Click a bar to see that truck on the map for the same days.',
        }}
        action={bars.length ? <Legend /> : null}
      >
        <IntelligenceDataState
          loading={tripsLoading}
          error={tripsError}
          isEmpty={bars.length === 0}
          emptyMessage="No trips were recorded in this period."
          what="The trips of this period"
          onRetry={refetchTrips}
        >
          <div className="intel-bars" style={{ '--rows': Math.ceil(bars.length / 2) }}>
            {bars.map((row) => (
              <RunsTruckBar
                key={row.registrationNumber}
                row={row}
                maxKm={maxKm}
                from={rangeReady ? istDayStart(from) : null}
                to={rangeReady ? istDayEnd(to) : null}
              />
            ))}
          </div>
        </IntelligenceDataState>
      </IntelCard>
    </div>
  );
}
