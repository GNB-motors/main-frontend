import { HeartPulse, Truck, Users, Route as RouteIcon, Gauge, IndianRupee } from 'lucide-react';
import { KpiTile, StatusPill } from './overview.primitives.jsx';
import MetricNote from '../../../components/Fleet/MetricNote.jsx';
import { formatNum, formatInrCompact, gradeSignal } from '../../../utils/formatters';

const GRADE_TONE = {
  ok: 'var(--ok)',
  caution: 'var(--caution)',
  critical: 'var(--critical)',
};

/**
 * Executive summary rail — the 5-to-10-second read.
 * Fleet Health leads as the emphasised primary tile; the rest are compact,
 * equally-weighted operational counters. Estimated Waste is toned critical so
 * financial exposure never hides among neutral numbers.
 */
export default function KpiRail({ vehicles, drivers, trips, kilometers, health, riskMoney }) {
  const idle = vehicles ? Math.max(0, (vehicles.total || 0) - (vehicles.active || 0)) : 0;
  const grade = health?.grade ?? '—';
  const score = health?.score;
  const tone = GRADE_TONE[gradeSignal(grade)] || 'var(--inert)';
  const wasteInr = riskMoney?.totalWasteInr;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiTile
        primary
        to="#fleet-health"
        note={
          <MetricNote label="Fleet Health">
            A 0–100 roll-up of how the fleet is running: telemetry coverage,
            document compliance, service overdue-ness and fuel anomalies. The
            grade is the same score banded A–E. Open the Fleet Health panel
            below for the component-by-component breakdown.
          </MetricNote>
        }
        label={
          <>
            <HeartPulse size={13} style={{ color: tone }} /> Fleet Health
          </>
        }
        value={score != null ? Math.round(score) : '—'}
        tone={tone}
        sub={<StatusPill tone={gradeSignal(grade)}>Grade {grade}</StatusPill>}
      />
      <KpiTile
        to="/vehicles"
        label={<><Truck size={13} /> Vehicles</>}
        value={formatNum(vehicles?.total || 0)}
        sub={`${formatNum(vehicles?.active || 0)} active · ${formatNum(idle)} idle`}
      />
      <KpiTile
        to="/drivers"
        label={<><Users size={13} /> Drivers</>}
        value={formatNum(drivers?.total || 0)}
        sub={`${formatNum(drivers?.active || 0)} active`}
      />
      <KpiTile
        to="/fleet/trips"
        label={<><RouteIcon size={13} /> Trips</>}
        value={formatNum(trips?.total || 0)}
        sub={`${formatNum(trips?.completed || 0)} done · ${formatNum(trips?.ongoing || 0)} ongoing`}
      />
      <KpiTile
        label={<><Gauge size={13} /> Distance</>}
        value={`${formatNum(kilometers?.total || 0)}`}
        sub="km this period"
      />
      <KpiTile
        to="/fleet/alerts?tab=inbox"
        label={<><IndianRupee size={13} style={{ color: wasteInr > 0 ? 'var(--critical)' : undefined }} /> Est. Waste</>}
        value={formatInrCompact(wasteInr || 0)}
        note={
          <MetricNote label="Estimated waste">
            An estimate of money at risk today, not a confirmed loss: suspected
            fuel siphoning, detours off the usual corridor, and idling burn,
            priced at your recorded fuel rate. Every figure behind it is a flag
            to review — open Alerts to see the individual events.
          </MetricNote>
        }
        tone={wasteInr > 0 ? 'var(--critical)' : undefined}
        sub="estimated exposure"
      />
    </div>
  );
}
