import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { formatKm, formatNumber, formatPct } from '@/utils/redesign/format';
import IntelligenceDataState from './IntelligenceDataState';
import RunsTruckBar from './RunsTruckBar';
import IntelligenceService from './IntelligenceService';
import { isYmd, istDayEnd, istDayStart, runBarsByTruck } from './intelligenceModel';
import '../Vehicle360/panels/overview/referenceOverview.css';
import './runsPlacesReference.css';

export default function RunsTab({ from, to }) {
  const [filter, setFilter] = useState('all');
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
  const runs = data?.runs;
  const known = [runs?.loadedKm, runs?.emptyKm, runs?.repositionKm].filter((value) =>
    Number.isFinite(value),
  );
  const total = known.length ? known.reduce((sum, value) => sum + value, 0) : null;
  const bars = Array.isArray(runs?.byTruck)
    ? runs.byTruck
    : runBarsByTruck(trips?.items || [], { limit: Number.MAX_SAFE_INTEGER });
  const measured = bars.filter((row) => row.totalKm > 0);
  const highEmpty = measured.filter(
    (row) => row.emptyKm != null && row.emptyKm / row.totalKm > 0.25,
  );
  const shown = (filter === 'empty' ? highEmpty : measured).slice(0, 20);
  const maxKm = measured.reduce((max, row) => Math.max(max, row.totalKm), 0);
  const loadedShare = total > 0 && runs?.loadedKm != null ? (runs.loadedKm / total) * 100 : null;
  const serverBars = Array.isArray(runs?.byTruck);
  return (
    <div className="intel-runs-reference">
      <IntelligenceDataState
        loading={loading}
        loadingVariant="metrics"
        loadingCount={4}
        error={error}
        held={data?.held ? data.why : null}
        what="The run numbers"
        onRetry={refetch}
      >
        <section className="intel-runs-briefing">
          <div className="intel-runs-brief-copy">
            <span>✧ Period read</span>
            <p>
              {loadedShare != null ? (
                <>
                  {formatPct(loadedShare)} of the {formatKm(total)} classified driving carried
                  load.{' '}
                </>
              ) : (
                'Not enough classified distance is available to calculate the loaded share. '
              )}
              Plant-to-plant running is shown separately from empty returns.{' '}
              {highEmpty.length ? (
                <>
                  <button onClick={() => setFilter('empty')}>
                    {highEmpty.length} trucks drove more than a quarter of their classified
                    kilometres empty
                  </button>
                  .
                </>
              ) : null}
            </p>
            <small>
              {runs?.why?.text ||
                'Empty share counts empty and plant-to-plant kilometres together.'}
            </small>
          </div>
          <div className="intel-runs-kpis">
            {[
              [
                'Loaded km',
                formatKm(runs?.loadedKm),
                runs ? `on ${formatNumber(runs.loadedTrips)} loaded trips` : 'No reading',
                'loaded',
              ],
              ['Empty km', formatKm(runs?.emptyKm), 'driving back empty', 'empty'],
              [
                'Plant-to-plant',
                formatKm(runs?.repositionKm),
                runs ? `${formatNumber(runs.plantToPlant)} runs` : 'No reading',
                'plant',
              ],
              [
                'Empty share',
                formatPct(runs?.emptySharePct),
                total != null ? `of ${formatKm(total)} driven` : 'No classified distance',
                'share',
              ],
            ].map(([label, value, note, key]) => (
              <div key={key}>
                <span>
                  <i className={`intel-run-dot intel-run-dot--${key}`} />
                  {label}
                </span>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            ))}
          </div>
        </section>
      </IntelligenceDataState>
      <section className="intel-runs-card">
        <header>
          <div>
            <h3>Kilometres by truck</h3>
            <div className="intel-run-filter" role="group" aria-label="Filter run distance">
              <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
                All {measured.length}
              </button>
              <button aria-pressed={filter === 'empty'} onClick={() => setFilter('empty')}>
                High empty {highEmpty.length}
              </button>
            </div>
          </div>
          <div className="intel-run-legend">
            {[
              ['Loaded', 'loaded'],
              ['Empty', 'empty'],
              ['Plant-to-plant', 'plant'],
            ].map(([label, key]) => (
              <span key={key}>
                <i className={`intel-run-dot intel-run-dot--${key}`} />
                {label}
              </span>
            ))}
          </div>
        </header>
        <IntelligenceDataState
          loading={serverBars ? false : tripsLoading}
          error={serverBars ? null : tripsError}
          isEmpty={shown.length === 0}
          emptyMessage={
            filter === 'empty'
              ? 'No loaded records exceed the 25% empty-return threshold.'
              : 'No trips were recorded in this period.'
          }
          what="The trips of this period"
          onRetry={refetchTrips}
        >
          <div className="intel-runs-bars">
            {shown.map((row) => (
              <div className="intel-reference-truck-bar" key={row.registrationNumber}>
                <RunsTruckBar
                  row={row}
                  maxKm={maxKm}
                  from={rangeReady ? istDayStart(from) : null}
                  to={rangeReady ? istDayEnd(to) : null}
                />
                {row.emptyKm / row.totalKm > 0.25 ? (
                  <small>
                    {formatPct((row.emptyKm / row.totalKm) * 100)} empty · {formatKm(row.emptyKm)}{' '}
                    of {formatKm(row.totalKm)}
                  </small>
                ) : null}
              </div>
            ))}
          </div>
        </IntelligenceDataState>
        <footer>
          Showing {shown.length} of {measured.length} trucks with classified distance.{' '}
          {serverBars
            ? 'Based on active trip records for the selected period.'
            : 'Based on the trip records returned by the API.'}
        </footer>
      </section>
    </div>
  );
}
