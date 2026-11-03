import { Fuel, Gauge } from 'lucide-react';
import SlideOver from '../../components/cluster/SlideOver.jsx';
import { formatInIST } from '../../utils/dateUtils';
import { formatLitres } from '../../utils/formatters';
import FuelVerdictBadge from './FuelVerdictBadge';
import { drivingUseSentence, parkedDropL } from './fuelVerdicts';

function Cell({ label, value, full = false }) {
  return (
    <div className={`fi-detail-cell ${full ? 'fi-detail-cell--full' : ''}`}>
      <div className="fi-detail-label">{label}</div>
      <div className="fi-detail-value">{value ?? '—'}</div>
    </div>
  );
}

const kmText = (km) => (km == null ? '—' : `${Number(km).toLocaleString('en-IN')} km`);

/**
 * The drilldown into one fuel window.
 *
 * It shows what was measured — the fills, the engine's own figure, the tank
 * level, the distance — and what the check concluded. It never names a
 * culprit: the old drawer used to, and the page has to be able to say "this
 * number went down" without saying who took it.
 */
export default function FuelWindowDrilldown({ open, onClose, fuelWindow = null }) {
  if (!fuelWindow) return null;

  const sentence = drivingUseSentence(fuelWindow);
  const windowLabel = [
    formatInIST(fuelWindow.windowFrom ?? fuelWindow.startAt, 'DD MMM'),
    formatInIST(fuelWindow.windowTo ?? fuelWindow.endAt, 'DD MMM YY'),
  ]
    .filter(Boolean)
    .join(' → ');

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={`${fuelWindow.registrationNumber || 'Truck'} — fuel window`}
      subtitle={windowLabel || 'Mass-balance window'}
      width={480}
    >
      <div className="flex flex-col gap-4">
        <div className="ov-inset flex flex-col gap-2 p-4">
          <FuelVerdictBadge fuelWindow={fuelWindow} />
          {sentence ? <p className="text-dim m-0 text-xs leading-relaxed">{sentence}</p> : null}
        </div>

        <div className="fi-detail-grid">
          <Cell label="Fuel used" value={formatLitres(fuelWindow.fuelUsedL ?? fuelWindow.fillsLitres)} />
          <Cell label="Distance" value={kmText(fuelWindow.km)} />
          <Cell label="Driving use" value={formatLitres(fuelWindow.drivingUseL)} />
          <Cell label="Usually needs" value={formatLitres(fuelWindow.expectedDrivingUseL)} />
          <Cell
            label="Fuel down while parked"
            value={formatLitres(parkedDropL(fuelWindow))}
            full
          />
          <Cell label="Fills" value={formatLitres(fuelWindow.fillsLitres)} />
          <Cell label="Engine burn" value={formatLitres(fuelWindow.engineBurnL)} />
          <Cell label="Tank change" value={formatLitres(fuelWindow.tankDeltaL)} />
          <Cell
            label="DEF used, % of diesel"
            value={
              fuelWindow.defToFuelRatioPct != null ? `${fuelWindow.defToFuelRatioPct}%` : '—'
            }
            full
          />
        </div>

        <p className="text-dim flex items-start gap-1.5 text-[11px] leading-relaxed">
          <Fuel size={12} className="mt-0.5 shrink-0" />
          These are the readings for this window. A flag means “please review”, not a
          conclusion about anybody.
        </p>

        <p className="text-dim flex items-start gap-1.5 text-[11px] leading-relaxed">
          <Gauge size={12} className="mt-0.5 shrink-0" />
          The engine’s own fuel figure under-counts, so a truck parked with the engine off
          used to look like it was losing diesel. The check now compares the window with the
          distance the truck actually drove.
        </p>
      </div>
    </SlideOver>
  );
}
