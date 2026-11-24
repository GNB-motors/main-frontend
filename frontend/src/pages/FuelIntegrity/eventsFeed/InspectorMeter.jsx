import { formatINR, formatLitres } from '../../../utils/formatters';
import { fillBillView } from '../fillBillView';
import {
  defComparisonBand,
  defComparisonLabel,
  DEF_COMPARISON_COPY,
} from '../../../utils/defComparison';

function DefMeter({ event }) {
  const band = defComparisonBand(event.defBand ?? event.window?.defBand);
  const scale = Math.max(15, band?.max || 0, Number(event.defPct) || 0);
  return (
    <div className="fi-reconciliation-meter" title={DEF_COMPARISON_COPY}>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span>DEF per 100 litres of diesel</span>
        <span>{event.defFlag || 'Check this reading'}</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-slate-200 overflow-hidden">
        {band && (
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/25"
            style={{
              left: `${(band.min / scale) * 100}%`,
              width: `${((band.max - band.min) / scale) * 100}%`,
            }}
            title={defComparisonLabel(band)}
          />
        )}
        {event.defPct != null && (
          <div
            className="h-full bg-amber-500"
            style={{ width: `${Math.min(100, Math.max(0, (event.defPct / scale) * 100))}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs">
        <span>Measured: {event.defPct == null ? '—' : `${event.defPct}%`}</span>
        <span>{defComparisonLabel(band)}</span>
      </div>
    </div>
  );
}

/** The event-specific meter or gauge at the top of the inspector. */
const InspectorMeter = ({ activeEvent, isDef, isFill, isLoss }) => (
  <>
    {isDef && <DefMeter event={activeEvent} />}

    {isLoss && (
      <div className="fi-reconciliation-meter bg-red-50/60 dark:bg-red-950/20 border-red-200/80 dark:border-red-800/60">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-300">
            {activeEvent.lossLabel || 'Fuel down while parked'}
          </span>
          <span className="text-red-600 dark:text-red-400 font-bold">
            {activeEvent.confidence
              ? `${activeEvent.confidence} Confidence`
              : 'Confidence not rated'}
          </span>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
          <div
            className="bg-red-500 h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(15, (Math.abs(activeEvent.litres ?? 0) / 50) * 100))}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>
            Loss: {activeEvent.litres == null ? '—' : formatLitres(Math.abs(activeEvent.litres))}
          </span>
          <span className="text-red-600 dark:text-red-400 font-semibold">
            {activeEvent.inr != null ? formatINR(activeEvent.inr) : '—'}
          </span>
        </div>
      </div>
    )}

    {isFill &&
      (() => {
        const bill = fillBillView(activeEvent);
        const hasBill = bill.hasBill;
        const sensorL = activeEvent.litres;
        const billedL = activeEvent.claimedLitres;
        const isEstimated = activeEvent.confirmationStatus === 'ESTIMATED';
        const isConfirmed = activeEvent.confirmationStatus === 'CONFIRMED';

        let statusText;
        let statusColor;
        let barWidthPct = 0;
        let barColor = 'bg-slate-300 dark:bg-slate-600';

        if (hasBill) {
          statusText = bill.statusText;
          statusColor = !bill.comparable
            ? 'text-slate-500'
            : bill.flagged
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-emerald-600 dark:text-emerald-400 font-bold';
          barWidthPct = sensorL == null ? 0 : Math.min(100, Math.max(0, (sensorL / billedL) * 100));
          barColor = !bill.comparable
            ? 'bg-slate-400'
            : bill.flagged
              ? 'bg-amber-500'
              : 'bg-emerald-500';
        } else {
          statusText = isEstimated
            ? 'Estimated · No Bill on File'
            : isConfirmed
              ? 'Confirmed · Awaiting Bill'
              : 'No Bill on File';
          statusColor = isEstimated
            ? 'text-amber-600 dark:text-amber-400 font-semibold'
            : 'text-blue-600 dark:text-blue-400 font-semibold';
          barWidthPct = isConfirmed ? 50 : 25;
          barColor = isEstimated
            ? 'bg-amber-400/80 dark:bg-amber-500/70'
            : 'bg-blue-400/80 dark:bg-blue-500/70';
        }

        return (
          <div className="fi-reconciliation-meter">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">
                Sensor Rise vs Invoice Billed
              </span>
              <span className={statusColor}>{statusText}</span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex relative">
              <div
                className={`${barColor} h-full rounded-full transition-all`}
                style={{ width: `${barWidthPct}%` }}
              />
              {hasBill && bill.flagged && (
                <div
                  className="bg-red-500/80 h-full rounded-r-full"
                  style={{ width: `${100 - barWidthPct}%` }}
                  title="Unreconciled invoice variance"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Sensor: +{formatLitres(sensorL)}</span>
              <span>Billed: {hasBill ? `${formatLitres(billedL)}` : 'No bill linked'}</span>
            </div>
          </div>
        );
      })()}
  </>
);

export default InspectorMeter;
