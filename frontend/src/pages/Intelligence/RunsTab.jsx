import { ArrowLeftRight } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import SectionCard from '@/components/redesign/SectionCard';
import StatTile from '@/components/redesign/StatTile';
import { formatKm, formatNumber, formatPct } from '@/utils/redesign/format';
import IntelligenceDataState from './IntelligenceDataState';
import RunsTruckBar from './RunsTruckBar';
import IntelligenceService from './IntelligenceService';
import { isYmd, istDayEnd, istDayStart, runBarsByTruck } from './intelligenceModel';

const RUNS_LOADED_TIP = 'Km driven with load, from a plant to a customer or siding.';
const RUNS_EMPTY_TIP = 'Km driven without load, usually from a customer back to a plant.';
const RUNS_REPOSITION_TIP =
  'The truck went from one plant straight to another without coming back empty. This is normal: plants work like warehouses, and it often saves an empty run.';

/**
 * RunsTab — how much of the driving carried load.
 *
 * A truck going from one plant straight to another is a normal run, so it is
 * shown on its own and never counted as an empty run.
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
    <div className="flex flex-col gap-3">
      <IntelligenceDataState
        loading={loading}
        loadingVariant="metrics"
        loadingCount={3}
        error={error}
        held={held}
        what="The run numbers"
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label="Loaded km"
            value={formatKm(runs?.loadedKm)}
            tone="good"
            why={{ text: RUNS_LOADED_TIP }}
            sub={runs ? `on ${formatNumber(runs.loadedTrips)} loaded trips` : ''}
          />
          <StatTile
            label="Empty km"
            value={formatKm(runs?.emptyKm)}
            tone="watch"
            why={{ text: RUNS_EMPTY_TIP }}
            sub="driving back empty"
          />
          <StatTile
            label="Plant-to-plant"
            value={runs ? `${formatNumber(runs.plantToPlant)} runs` : ''}
            tone="info"
            why={{ text: RUNS_REPOSITION_TIP }}
            sub="went straight to another plant"
          />
        </div>

        {runs?.why?.text ? (
          <p className="m-0 mt-3 text-[13px] leading-relaxed text-[var(--rd-ink-2)]">
            {runs.why.text}
            {runs.why.basis ? (
              <span className="block text-[12px] text-[var(--rd-ink-3)]">{runs.why.basis}</span>
            ) : null}
          </p>
        ) : null}
      </IntelligenceDataState>

      <SectionCard
        icon={ArrowLeftRight}
        tone="info"
        title="Kilometres by truck"
        info={{
          text: 'Every truck of the period, split into loaded, empty and plant-to-plant kilometres. Click a bar to see that truck on the map.',
        }}
      >
        <IntelligenceDataState
          loading={tripsLoading}
          error={tripsError}
          isEmpty={bars.length === 0}
          emptyMessage="No trips were recorded in this period."
          what="The trips of this period"
          onRetry={refetchTrips}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--rd-ink-2)]">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full bg-[var(--rd-leg-loaded)]"
                />
                Loaded
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full bg-[var(--rd-leg-empty)]"
                />
                Empty
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full bg-[var(--rd-leg-reposition)]"
                />
                Plant-to-plant
              </span>
            </div>

            {bars.map((row) => (
              <RunsTruckBar
                key={row.registrationNumber}
                row={row}
                maxKm={maxKm}
                from={rangeReady ? istDayStart(from) : null}
                to={rangeReady ? istDayEnd(to) : null}
              />
            ))}

            {runs ? (
              <p className="m-0 text-[12px] text-[var(--rd-ink-3)]">
                {`Empty share: ${formatPct(runs.emptySharePct)} of ${formatKm(totalKm)}.`}
              </p>
            ) : null}
          </div>
        </IntelligenceDataState>
      </SectionCard>
    </div>
  );
}
