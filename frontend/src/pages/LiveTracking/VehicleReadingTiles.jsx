import { formatIst } from '../../utils/redesign/format';
import { formatKm, formatKmh, formatL, formatNumber, formatPct } from '../../utils/redesign/format';
import { defTileValues, fuelTileValues } from './vehiclePanelModel';
import { effectiveFreshness } from '../../utils/redesign/freshness';

/**
 * VehicleReadingTiles — fuel, DEF, odometer and speed.
 *
 * The whole point of this component is honesty about age. A DEF reading
 * from September is shown in grey with "last known 9 Sep", never as a live
 * number. A missing reading says so; it never shows a zero.
 */
export default function VehicleReadingTiles({ now }) {
  const readings = now?.readings ?? {};
  const view = now?.view ?? {};
  const fuel = fuelTileValues(readings);
  const def = defTileValues(readings);
  const odo = readings.odometerKm ?? null;
  const service = now?.identity?.service ?? null;

  return (
    <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
      {/* Fuel */}
      <Tile
        label="Fuel"
        value={
          fuel.main === null
            ? 'Not received'
            : fuel.main.kind === 'litres'
              ? formatL(fuel.main.value)
              : fuel.main.kind === 'unitless'
                ? formatNumber(fuel.main.value, { digits: 1 })
                : formatPct(fuel.main.value)
        }
        secondary={
          fuel.main === null
            ? null
            : fuel.main.kind === 'unitless'
              ? fuel.secondary
              : fuel.main.kind === 'litres'
              ? readings.fuel.tankL != null && readings.fuel.pct?.value != null
                ? `of ${readings.fuel.tankL} L · ${formatPct(readings.fuel.pct.value)}`
                : null
              : readings.fuel.tankL != null
                ? `of ${readings.fuel.tankL} L`
                : null
        }
        reading={fuel.reading}
      />

      {/* DEF */}
      <Tile
        label="DEF"
        value={def.main === null ? 'Not received' : formatPct(def.main.value)}
        secondary={def.secondary}
        reading={def.reading}
        info={
          def.learned
            ? {
                text: 'The DEF litres are worked out from your top-ups, not read off the truck. After the first top-up they are exact.',
                basis: null,
              }
            : null
        }
      />

      {/* Odometer */}
      <Tile
        label="Odometer"
        value={odo?.value == null ? 'Not received' : formatKm(odo.value)}
        secondary={
          service?.dueInKm != null ? `Service due in ${formatKm(service.dueInKm)}` : null
        }
        reading={odo}
      />

      {/* Speed */}
      <Tile
        label="Speed"
        value={view.speedKmh == null ? 'Not received' : formatKmh(view.speedKmh)}
        reading={view.lastFixAt ? { freshness: view.freshness ?? 'never' } : null}
      />
    </div>
  );
}

/**
 * One tile: the value, its second line, and how old the value is.
 * The age is the point — a stale value is greyed and dated.
 */
function Tile({ label, value, secondary = null, reading = null, info = null }) {
  // A value we never received is one quiet line, not the biggest text on
  // the panel.
  if (value === 'Not received') {
    return (
      <div className="flex min-w-0 flex-col rounded-[var(--rd-radius)] border border-dashed border-[var(--rd-line)] px-2.5 py-2">
        <span className="text-[12px] text-[var(--rd-ink-2)]">{label}</span>
        <span className="mt-0.5 text-[12px] text-[var(--rd-ink-3)]">Not received</span>
      </div>
    );
  }
  const freshness = effectiveFreshness(reading?.freshness ?? 'never', reading?.ageMin);
  const at = reading?.at ?? null;
  const isMuted = freshness === 'stale' || freshness === 'never';
  const isQuiet = freshness === 'recent';

  return (
    <div className="flex min-w-0 flex-col rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-2.5 shadow-[var(--rd-shadow)]">
      <span className="flex items-center gap-1 text-[12px] text-[var(--rd-ink-2)]">
        {label}
        {info ? <span title={info.text}>ⓘ</span> : null}
      </span>
      <span
        className={`mt-0.5 truncate text-[22px] leading-tight font-[650] tabular-nums ${
          isMuted ? 'text-[var(--rd-ink-3)]' : isQuiet ? 'text-[var(--rd-ink-2)]' : 'text-[var(--rd-ink)]'
        }`}
        title={at ? `Measured ${formatIst(at, { withDate: true })}` : undefined}
      >
        {value}
      </span>
      {secondary ? (
        <span className="mt-0.5 text-[11px] text-[var(--rd-ink-3)]">{secondary}</span>
      ) : null}
      {isMuted && at ? (
        <span className="mt-0.5 text-[11px] text-[var(--rd-ink-3)]">last known {formatIst(at)}</span>
      ) : null}
      {isQuiet && reading?.ageMin != null ? (
        <span className="mt-0.5 text-[11px] text-[var(--rd-ink-3)]">
          {Math.round(reading.ageMin)} min ago
        </span>
      ) : null}
    </div>
  );
}
