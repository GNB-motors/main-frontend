import { formatINR, formatLitres } from '../../../utils/formatters';

/** The event-specific meter or gauge at the top of the inspector. */
const InspectorMeter = ({ activeEvent, isDef, isFill, isLoss }) => (
  <>
    {isDef && (
      <div className="fi-reconciliation-meter bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-300">DEF to Fuel Dosing Ratio</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">
            {activeEvent.defFlag || 'Dosing Anomaly'}
          </span>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/25 border-x border-emerald-500/40"
            style={{ left: '26.6%', width: '20%' }}
            title="Healthy BS-VI corridor: 4.0% - 7.0%"
          />
          <div
            className="bg-amber-500 h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(10, ((activeEvent.defPct ?? 0) / 15) * 100))}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Measured: {activeEvent.defPct != null ? `${activeEvent.defPct}%` : '—'}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            BS-VI Standard: 4.0% – 7.0%
          </span>
        </div>
      </div>
    )}

    {isLoss && (
      <div className="fi-reconciliation-meter bg-red-50/60 dark:bg-red-950/20 border-red-200/80 dark:border-red-800/60">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-300">Unaccounted Siphon Loss</span>
          <span className="text-red-600 dark:text-red-400 font-bold">
            {activeEvent.confidence || 'HIGH'} Confidence
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
          <span>Lost: −{formatLitres(Math.abs(activeEvent.litres ?? 0))}</span>
          <span className="text-red-600 dark:text-red-400 font-semibold">
            {activeEvent.inr != null ? formatINR(activeEvent.inr) : '—'}
          </span>
        </div>
      </div>
    )}

    {isFill &&
      (() => {
        const hasBill = activeEvent.claimedLitres != null;
        const sensorL = activeEvent.litres ?? 0;
        const billedL = activeEvent.claimedLitres;
        const varianceL =
          activeEvent.billVarianceL ?? (hasBill ? Math.abs(sensorL - billedL) : null);
        const isEstimated = activeEvent.confirmationStatus === 'ESTIMATED';
        const isConfirmed = activeEvent.confirmationStatus === 'CONFIRMED';

        let statusText;
        let statusColor;
        let barWidthPct = 0;
        let barColor = 'bg-slate-300 dark:bg-slate-600';

        if (hasBill) {
          if (activeEvent.billFlag) {
            const displayVar =
              typeof varianceL === 'number' ? varianceL.toFixed(1) : (varianceL ?? '—');
            statusText = `${displayVar} L Variance`;
            statusColor = 'text-amber-600 dark:text-amber-400 font-bold';
            barWidthPct = Math.max(
              10,
              Math.min(100, Math.round(((billedL - (varianceL || 0)) / (billedL || 1)) * 100)),
            );
            barColor = 'bg-amber-500';
          } else {
            statusText = '100% Reconciled';
            statusColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
            barWidthPct = 100;
            barColor = 'bg-emerald-500';
          }
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
              {hasBill && activeEvent.billFlag && (
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
