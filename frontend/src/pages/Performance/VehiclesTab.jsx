import React, { useMemo, useState } from 'react';
import useApi from '../../hooks/useApi';
import PerformanceApi from '../../api/performance';
import IntelligenceDataState from '../Intelligence/IntelligenceDataState';
import SourceCell from './SourceCell';
import SourceLegend from './SourceLegend';
import VehicleDrawer from './VehicleDrawer';
import { PerformanceBriefing, PerformanceNoNumbers, PerformanceTable } from './PerformanceParts';
import { VEHICLE_METRICS, keyOf, providerLabel } from './vehiclesModel';
import {
  columnGaps,
  columnMedian,
  hiddenLine,
  sourcesPresent,
  windowLabel,
} from './performanceGaps';
import { formatCellNumber } from './performanceCells';

/** The server's default page; a full page means the fleet may be cut off. */
const LIST_LIMIT = 50;

function EngineAlerts({ count }) {
  if (count === null || count === undefined) return <span className="pf-none">—</span>;
  if (count === 0) return <span className="pf-none">None</span>;
  return (
    <span className="pf-pill pf-pill--bad">{`${count} ${count === 1 ? 'alert' : 'alerts'}`}</span>
  );
}

/**
 * Vehicles — each truck's own km/L, idling and gear use over the server's
 * window, every number with its source.
 *
 * A column no truck can fill is left out and explained once in the briefing;
 * a row opens the truck's drawer with its gear, health and drift.
 */
export default function VehiclesTab() {
  const { data, loading, error, refetch } = useApi(
    (signal) => PerformanceApi.vehicles({}, signal),
    [],
  );
  const vehicles = useMemo(() => data?.vehicles ?? [], [data]);
  const [open, setOpen] = useState(null);

  const gaps = useMemo(
    () =>
      columnGaps(
        vehicles,
        VEHICLE_METRICS.map((metric) => ({
          key: metric.key,
          label: metric.label,
          cell: (v) => v[metric.key],
        })),
      ),
    [vehicles],
  );
  const shownMetrics = VEHICLE_METRICS.filter((metric) => !gaps.hidden.has(metric.key));
  const present = sourcesPresent(vehicles, (v) => shownMetrics.map((metric) => v[metric.key]));

  const mileage = columnMedian(vehicles, (v) => v.kmPerL);
  const idle = columnMedian(vehicles, (v) => v.idlePct);
  const withAlerts = vehicles.filter((v) => v.healthFindings > 0).length;
  const days = data?.window?.days ?? 30;
  const range = windowLabel(data?.window);
  const count = vehicles.length;
  const cutOff =
    count >= LIST_LIMIT
      ? `This list stops at ${LIST_LIMIT} trucks, ordered by plate; a bigger fleet is cut off here.`
      : null;

  const columns = [
    {
      key: 'vehicle',
      label: 'Truck',
      render: (v) => (
        <button
          type="button"
          className="intelligence-table-open pf-open"
          aria-label={`Open ${v.registration || 'this truck'}`}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(v);
          }}
        >
          {v.registration || '—'}
          <small>{providerLabel(v.provider)}</small>
        </button>
      ),
    },
    ...shownMetrics.map((metric) => ({
      key: metric.key,
      label: metric.label,
      align: 'right',
      render: (v) => <SourceCell cell={v[metric.key]} decimals={metric.decimals} reason="hidden" />,
    })),
    {
      key: 'healthFindings',
      label: 'Engine alerts',
      align: 'right',
      render: (v) => <EngineAlerts count={v.healthFindings} />,
    },
  ];

  const lead = (
    <>
      <b>{count.toLocaleString('en-IN')}</b> {count === 1 ? 'truck' : 'trucks'} in this read.
      {mileage.median !== null ? (
        <>
          {' '}
          Half of them do better than <b>{formatCellNumber(mileage.median, 2)} km/L</b>
          {idle.median !== null ? (
            <>
              , and half idle less than <b>{formatCellNumber(idle.median, 1)}%</b> of engine-on
              time.
            </>
          ) : (
            '.'
          )}
        </>
      ) : idle.median !== null ? (
        <>
          {' '}
          Half of them idle less than <b>{formatCellNumber(idle.median, 1)}%</b> of engine-on time.
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
        emptyMessage={`No truck has a reading in the last ${days} days yet. A truck shows up here once its device reports.`}
        what="Truck performance"
        onRetry={refetch}
      >
        {shownMetrics.length ? (
          <>
            <PerformanceBriefing
              label="Truck performance read"
              eyebrow={`Fleet read · last ${days} days`}
              lead={lead}
              notes={[
                range ? `Readings from ${range}.` : null,
                ...gaps.notes.map(hiddenLine),
                cutOff,
              ]}
              kpis={[
                {
                  label: 'Trucks',
                  value: count.toLocaleString('en-IN'),
                  note: `${mileage.known} with a mileage reading`,
                },
                {
                  label: 'Median mileage',
                  value:
                    mileage.median === null ? '—' : `${formatCellNumber(mileage.median, 2)} km/L`,
                  note:
                    mileage.median === null
                      ? 'No truck reported fuel and distance'
                      : `${mileage.known} of ${count} trucks measured`,
                },
                {
                  label: 'Median idle share',
                  value: idle.median === null ? '—' : `${formatCellNumber(idle.median, 1)}%`,
                  note:
                    idle.median === null
                      ? 'No truck reported idle time'
                      : `of engine-on time · ${idle.known} of ${count} trucks`,
                },
                {
                  label: 'Engine alerts',
                  value: withAlerts.toLocaleString('en-IN'),
                  note: withAlerts ? 'trucks with an engine alert' : 'No truck has an engine alert',
                },
              ]}
            >
              <SourceLegend present={present} />
            </PerformanceBriefing>

            <PerformanceTable
              columns={columns}
              rows={vehicles}
              rowKey={keyOf}
              searchText={(v) => `${v.registration || ''} ${providerLabel(v.provider)}`}
              searchLabel="Search a plate"
              noun={{ one: 'truck', many: 'trucks' }}
              placeholder="Search a plate"
              openKey={open ? keyOf(open) : null}
              onOpen={setOpen}
              emptyTitle="No trucks in this read"
            />
          </>
        ) : (
          <PerformanceNoNumbers
            title={`No truck numbers ${range ? `for ${range} ` : ''}yet`}
            lead={`${count.toLocaleString('en-IN')} ${count === 1 ? 'truck is' : 'trucks are'} on record for this window, but none has a number we can stand behind yet. They show up here as soon as the readings arrive.`}
            notes={gaps.notes}
          />
        )}
      </IntelligenceDataState>

      <VehicleDrawer vehicle={open} window={data?.window} onClose={() => setOpen(null)} />
    </div>
  );
}
