import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { formatKm, formatNumber, formatPct } from '@/utils/redesign/format';
import IntelligenceDataState from './IntelligenceDataState';
import RunsTruckBar from './RunsTruckBar';
import IntelligenceService from './IntelligenceService';
import { isYmd, istDayEnd, istDayStart } from './intelligenceModel';
import {
  classifiedTotal,
  loadedShare,
  runBarsByTruck,
  unknownKmTruckNote,
} from './runsBarsModel';
import '../Vehicle360/panels/overview/referenceOverview.css';
import './runsPlacesReference.css';

/** The empty share of a truck, when every km behind it was measured. */
const emptyShareOf = (row) =>
  row?.totalKm > 0 && row?.emptyKm != null && row?.partial !== true
    ? row.emptyKm / row.totalKm
    : null;

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
  const total = classifiedTotal(runs);
  const bars = Array.isArray(runs?.byTruck)
    ? runs.byTruck
    : runBarsByTruck(trips?.items || [], { limit: Number.MAX_SAFE_INTEGER });
  // A truck whose km were not measured stays in the list; only a truck with no
  // km at all (a real 0) is left out.
  const measured = bars.filter((row) => row.totalKm == null || row.totalKm > 0);
  // The empty share of a partly measured truck would be a share of the km that
  // are known, not of the km the truck drove, so it is not shown.
  const highEmpty = measured.filter((row) => (emptyShareOf(row) ?? 0) > 0.25);
  const shown = (filter === 'empty' ? highEmpty : measured).slice(0, 20);
  const maxKm = measured.reduce((max, row) => Math.max(max, row.totalKm ?? 0), 0);
  const carriedShare = loadedShare(runs);
  const serverBars = Array.isArray(runs?.byTruck);
  const unknownKmTrucks = bars.filter((row) => row.partial === true).length;
  // The bars now come from the trip list, which the API pages.
  const loadedTrips = trips?.items?.length ?? 0;
  const tripTotal = trips?.total ?? 0;
  const fromFirstTrips =
    !serverBars && tripTotal > loadedTrips ? `${loadedTrips} of ${tripTotal}` : null;
  // Plant-to-plant km is its own tile only while the server still sends it.
  const plantToPlantKm = runs?.repositionKm;
  const plantKnown = typeof plantToPlantKm === 'number';
  const showPlantTile = !(runs != null && plantToPlantKm === null);
  const plantRuns = runs?.plantToPlant;
  const loadedTripsNote = runs
    ? runs.loadedTrips != null
      ? `on ${formatNumber(runs.loadedTrips)} loaded trips`
      : '—'
    : 'No reading';
  const plantNote = runs ? (plantRuns != null ? `${formatNumber(plantRuns)} runs` : '—') : 'No reading';
  const kpiTiles = [
    ['Loaded km', formatKm(runs?.loadedKm), loadedTripsNote, 'loaded'],
    ['Empty km', formatKm(runs?.emptyKm), 'running with no load', 'empty'],
    ...(showPlantTile
      ? [['Plant-to-plant', formatKm(plantToPlantKm), plantNote, 'plant']]
      : []),
    [
      'Empty share',
      formatPct(runs?.emptySharePct),
      total != null ? `of ${formatKm(total)} driven` : 'No classified distance',
      'share',
    ],
  ];
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
              {carriedShare != null ? (
                <>
                  {formatPct(carriedShare)} of the {formatKm(total)} classified driving carried
                  load.{' '}
                </>
              ) : (
                'Not enough classified distance is available to calculate the loaded share. '
              )}
              {plantKnown ? 'Plant-to-plant running is shown separately from empty returns. ' : null}
              {!showPlantTile && plantRuns != null
                ? `${formatNumber(plantRuns)} plant-to-plant runs. `
                : null}
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
                'Empty share is the empty running the server reports for this period.'}
            </small>
          </div>
          <div className="intel-runs-kpis">
            {kpiTiles.map(([label, value, note, key]) => (
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
            {shown.map((row) => {
              const share = emptyShareOf(row);
              return (
                <div className="intel-reference-truck-bar" key={row.registrationNumber}>
                  <RunsTruckBar
                    row={row}
                    maxKm={maxKm}
                    from={rangeReady ? istDayStart(from) : null}
                    to={rangeReady ? istDayEnd(to) : null}
                  />
                  {share != null && share > 0.25 ? (
                    <small>
                      {formatPct(share * 100)} empty · {formatKm(row.emptyKm)} of{' '}
                      {formatKm(row.totalKm)}
                    </small>
                  ) : null}
                </div>
              );
            })}
          </div>
        </IntelligenceDataState>
        <footer>
          Showing {shown.length} of {measured.length} trucks with classified distance.{' '}
          {unknownKmTrucks > 0 ? `${unknownKmTruckNote(unknownKmTrucks)} ` : ''}
          {fromFirstTrips ? `From the first ${fromFirstTrips} trips. ` : ''}
          {serverBars
            ? 'Based on active trip records for the selected period.'
            : 'Based on the trip records returned by the API.'}
        </footer>
      </section>
    </div>
  );
}
