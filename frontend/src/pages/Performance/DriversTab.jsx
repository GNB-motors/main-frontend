import React, { useMemo, useState } from 'react';
import useApi from '../../hooks/useApi';
import PerformanceApi from '../../api/performance';
import IntelligenceDataState from '../Intelligence/IntelligenceDataState';
import SourceCell from './SourceCell';
import PaceCell from './PaceCell';
import SourceLegend from './SourceLegend';
import DriverDrawer from './DriverDrawer';
import { PerformanceBriefing, PerformanceNoNumbers, PerformanceTable } from './PerformanceParts';
import {
  columnGaps,
  columnMedian,
  hiddenLine,
  sourcesPresent,
  windowLabel,
} from './performanceGaps';
import { formatCellNumber } from './performanceCells';
import { DRIVER_METRICS, driverTrucks } from './driversModel';

const metricCell = (metric, d) =>
  metric.pace ? (
    <PaceCell cell={d[metric.key]} reason="hidden" />
  ) : (
    <SourceCell cell={d[metric.key]} decimals={metric.decimals} reason="hidden" />
  );

/**
 * Drivers — each driver's DNA score, harsh events, idling and road pace over
 * the server's window, every number with its source. A row opens the driver's
 * DNA.
 */
export default function DriversTab({ from, to } = {}) {
  const { data, loading, error, refetch } = useApi(
    (signal) => PerformanceApi.drivers({ from, to }, signal),
    [from, to],
    { scopeKey: `${from || 'default'}:${to || 'default'}` },
  );
  const drivers = useMemo(() => data?.drivers ?? [], [data]);
  const [open, setOpen] = useState(null);

  const gaps = useMemo(
    () =>
      columnGaps(
        drivers,
        DRIVER_METRICS.map((metric) => ({
          key: metric.key,
          label: metric.label,
          cell: (d) => d[metric.key],
        })),
      ),
    [drivers],
  );
  const shownMetrics = DRIVER_METRICS.filter((metric) => !gaps.hidden.has(metric.key));
  const present = sourcesPresent(drivers, (d) => shownMetrics.map((metric) => d[metric.key]));

  const score = columnMedian(drivers, (d) => d.dnaScore);
  const harsh = columnMedian(drivers, (d) => d.harshPer100Km);
  const idle = columnMedian(drivers, (d) => d.idlePct);
  const days = data?.window?.days ?? 30;
  const range = windowLabel(from && to ? { from, to } : data?.window);
  const count = drivers.length;

  const columns = [
    {
      key: 'driver',
      label: 'Driver',
      render: (d) => (
        <button
          type="button"
          className="intelligence-table-open pf-open pf-open--person"
          aria-label={`Open ${d.name || 'this driver'}`}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(d);
          }}
        >
          {d.name || 'Name not on record'}
          <small>{driverTrucks(d)}</small>
        </button>
      ),
    },
    ...shownMetrics.map((metric) => ({
      key: metric.key,
      label: metric.label,
      align: 'right',
      render: (d) => metricCell(metric, d),
    })),
  ];

  const lead = (
    <>
      <b>{count.toLocaleString('en-IN')}</b> {count === 1 ? 'driver' : 'drivers'} in this read.
      {score.median !== null ? (
        <>
          {' '}
          Half of them score above <b>{formatCellNumber(score.median, 0)}</b> on Driving DNA
          {harsh.median !== null ? (
            <>
              , and half have fewer than <b>{formatCellNumber(harsh.median, 1)}</b> harsh events per
              100 km.
            </>
          ) : (
            '.'
          )}
        </>
      ) : null}
    </>
  );

  return (
    <div className="pf-tab">
      <IntelligenceDataState
        loading={loading && !data}
        loadingVariant="table"
        error={error}
        isEmpty={!count}
        emptyMessage={`No driver has a reading ${range ? `for ${range}` : `in the last ${days} days`} yet. A driver shows up once a truck they drive reports.`}
        what="Driver performance"
        onRetry={refetch}
      >
        {shownMetrics.length ? (
          <>
            <PerformanceBriefing
              label="Driver performance read"
              eyebrow={`Driver read · ${range || `last ${days} days`}`}
              lead={lead}
              notes={[range ? `Readings from ${range}.` : null, ...gaps.notes.map(hiddenLine)]}
              kpis={[
                {
                  label: 'Drivers',
                  value: count.toLocaleString('en-IN'),
                  note: `${score.known} with a DNA score`,
                },
                {
                  label: 'Median DNA score',
                  value: score.median === null ? '—' : formatCellNumber(score.median, 0),
                  note:
                    score.median === null
                      ? 'No driver has a DNA day yet'
                      : `out of 100 · ${score.known} of ${count} drivers`,
                },
                {
                  label: 'Median harsh events',
                  value: harsh.median === null ? '—' : formatCellNumber(harsh.median, 1),
                  note:
                    harsh.median === null
                      ? 'No driver has push telemetry'
                      : `per 100 km · ${harsh.known} of ${count} drivers`,
                },
                {
                  label: 'Median idle share',
                  value: idle.median === null ? '—' : `${formatCellNumber(idle.median, 1)}%`,
                  note:
                    idle.median === null
                      ? 'No driver has an idle day'
                      : `of engine-on time · ${idle.known} of ${count} drivers`,
                },
              ]}
            >
              <SourceLegend present={present} />
            </PerformanceBriefing>

            <PerformanceTable
              columns={columns}
              rows={drivers}
              rowKey={(d) => d.driverId}
              searchText={(d) => `${d.name || ''} ${(d.vehicles ?? []).join(' ')}`}
              searchLabel="Search a driver or plate"
              noun={{ one: 'driver', many: 'drivers' }}
              placeholder="Search a driver or plate"
              openKey={open?.driverId ?? null}
              onOpen={setOpen}
              emptyTitle="No drivers in this read"
            />
          </>
        ) : (
          <PerformanceNoNumbers
            title={`No driver numbers ${range ? `for ${range} ` : ''}yet`}
            lead={`${count.toLocaleString('en-IN')} ${count === 1 ? 'driver is' : 'drivers are'} on record for this window, but none has a number we can stand behind yet. They show up here as soon as the readings arrive.`}
            notes={gaps.notes}
          />
        )}
      </IntelligenceDataState>

      <DriverDrawer
        from={from}
        to={to}
        driver={drivers.find((driver) => driver.driverId === open?.driverId) || null}
        window={data?.window}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}
