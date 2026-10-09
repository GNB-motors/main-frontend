import React from 'react';
import StatusChip from '../../../components/ui/StatusChip';
import { useApi } from '../../../hooks/useApi';
import { formatInrCompact, formatNum } from '../../../utils/formatters';
import { MileageApi } from '../mileageApi';
import { billCoverage, kpisFromSources, mileageBand } from '../mileageRows';
import InfoTip from './InfoTip';

const Tile = ({ label, explanation, value, valueClass = '', children }) => (
  <section className="mhub-kpi" aria-label={label}>
    <div className="mhub-kpi-head">
      <span>{label}</span>
      <InfoTip explanation={explanation} />
    </div>
    <div className={`mhub-kpi-value ${valueClass}`}>{value}</div>
    <div className="mhub-kpi-foot">{children}</div>
  </section>
);

/**
 * Four plain-word figures for the hub's dates. Reconciliation figures come
 * from the fill list's counts (diesel only, the tank sensor sees diesel);
 * average mileage is the model comparison's distance-weighted total, which
 * needs the vehicleActivity module.
 */
export default function MileageKpiBar({ range, showFleetMileage, refreshKey = 0 }) {
  const feed = useApi(
    (signal) => MileageApi.unifiedFeed(range, { fuelType: 'DIESEL', limit: 1 }, signal),
    [range.from, range.to, refreshKey],
  );
  const models = useApi(
    (signal) => MileageApi.modelComparison(range, signal),
    [range.from, range.to, refreshKey],
    { enabled: showFleetMileage },
  );

  const k = kpisFromSources({
    feedMeta: feed.data?.meta || null,
    modelData: showFleetMileage ? models.data?.data || null : null,
  });
  const pending = feed.loading ? '…' : '—';
  const coveragePct = k.sensorFills ? (k.matched / k.sensorFills) * 100 : null;
  const skipped = models.data?.meta?.excludedCycleCount;

  return (
    <div className="mhub-kpis">
      {showFleetMileage && (
        <Tile
          label="Average mileage"
          value={
            k.fleetKmPerL != null ? (
              <>
                {k.fleetKmPerL.toFixed(2)}
                <small>km/L</small>
              </>
            ) : models.loading ? (
              '…'
            ) : (
              '—'
            )
          }
          explanation={{
            title: 'How average mileage is worked out',
            text: 'All km driven divided by all diesel, over every full-tank-to-full-tank round that ended in these dates. Long rounds count more than short ones.',
            lines: [
              ['Trucks', k.vehicleCount != null ? formatNum(k.vehicleCount) : '—'],
              [
                'Rounds skipped',
                skipped != null ? `${formatNum(skipped)} (odometer looked wrong)` : '—',
              ],
            ],
          }}
        >
          {k.fleetKmPerL != null ? (
            <StatusChip group="mileageBand" value={mileageBand(k.fleetKmPerL)} />
          ) : null}
          <span>
            {k.vehicleCount ? `${k.vehicleCount} trucks` : 'No full-tank rounds in these dates'}
          </span>
        </Tile>
      )}

      <Tile
        label="Diesel bought"
        value={k.spendInr != null ? formatInrCompact(k.spendInr) : pending}
        explanation={{
          title: 'Diesel bought',
          text: 'The amounts on every diesel bill in these dates. AdBlue bills are not included.',
          lines: [['Bills', k.bills != null ? formatNum(k.bills) : '—']],
        }}
      >
        <span>{k.bills != null ? `${formatNum(k.bills)} bills` : ' '}</span>
      </Tile>

      <Tile
        label="Fills with a bill"
        value={
          k.sensorFills != null ? (
            <>
              {formatNum(k.matched)}
              <small>of {formatNum(k.sensorFills)}</small>
            </>
          ) : (
            pending
          )
        }
        explanation={{
          title: 'Fills with a bill',
          text: 'Of the refills the tank sensor saw, how many have a bill uploaded. The rest need the driver to upload one.',
          lines: [
            ['With a bill', k.matched != null ? formatNum(k.matched) : '—'],
            ['Tank saw', k.sensorFills != null ? formatNum(k.sensorFills) : '—'],
            ['Share', coveragePct != null ? `${Math.round(coveragePct)}%` : '—'],
          ],
        }}
      >
        {coveragePct != null ? (
          <StatusChip group="billCoverage" value={billCoverage(coveragePct)} />
        ) : null}
      </Tile>

      <Tile
        label="Bills to check"
        value={k.flagged != null ? formatNum(k.flagged) : pending}
        valueClass={k.flagged > 0 ? 'mhub-kpi-value--critical' : ''}
        explanation={{
          title: 'Bills to check',
          text: 'Bills where the litres on the bill and the rise in the tank disagree by more than that truck normally varies.',
          lines: [],
        }}
      >
        {k.flagged != null ? (
          <StatusChip group="billsToCheck" value={k.flagged > 0 ? 'NEEDS_A_LOOK' : 'ALL_CLEAR'} />
        ) : null}
      </Tile>
    </div>
  );
}
