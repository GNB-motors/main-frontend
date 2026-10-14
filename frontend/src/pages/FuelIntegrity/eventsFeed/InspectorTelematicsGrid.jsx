import { formatINR, formatLitres } from '../../../utils/formatters';

/** Telematics metrics of the inspected event (litres, levels, timing, fill context). */
const InspectorTelematicsGrid = ({ activeCtx, activeEvent, isDef, isFill, isLoss }) => (
  <div className="fi-telematics-grid">
    {isDef && (
      <>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Event Nature</span>
          <span className="fi-tele-val text-amber-600 dark:text-amber-400">DEF Anomaly</span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Flag Status</span>
          <span className="fi-tele-val text-xs truncate">
            {activeEvent.defFlag || 'Dosing Anomaly'}
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">DEF Dosing Ratio</span>
          <span className="fi-tele-val">
            {activeEvent.defPct != null ? `${activeEvent.defPct}%` : '—'}
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">BS-VI Range</span>
          <span className="fi-tele-val text-emerald-600 dark:text-emerald-400 text-xs">
            4.0% – 7.0%
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Window Fuel Burn</span>
          <span className="fi-tele-val">
            {activeEvent.window?.engineBurnL != null
              ? formatLitres(activeEvent.window.engineBurnL)
              : '—'}
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Tank Level Δ</span>
          <span className="fi-tele-val">
            {activeEvent.window?.tankDeltaL != null
              ? `${activeEvent.window.tankDeltaL >= 0 ? '+' : ''}${formatLitres(activeEvent.window.tankDeltaL)}`
              : '—'}
          </span>
        </div>
      </>
    )}

    {isLoss && (
      <>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Event Nature</span>
          <span className="fi-tele-val text-red-600 dark:text-red-400">Siphon Loss</span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Est. Financial Loss</span>
          <span className="fi-tele-val text-red-600 dark:text-red-400">
            {activeEvent.inr != null ? formatINR(activeEvent.inr) : '—'}
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Lost Volume</span>
          <span className="fi-tele-val text-red-600 dark:text-red-400">
            −{formatLitres(Math.abs(activeEvent.litres ?? 0))}
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Siphon Confidence</span>
          <span className="fi-tele-val capitalize">{activeEvent.confidence || 'HIGH'}</span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Engine Burn (CAN)</span>
          <span className="fi-tele-val">
            {activeEvent.window?.engineBurnL != null
              ? formatLitres(activeEvent.window.engineBurnL)
              : '—'}
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Physical Tank Δ</span>
          <span className="fi-tele-val">
            {activeEvent.window?.tankDeltaL != null
              ? `${activeEvent.window.tankDeltaL >= 0 ? '+' : ''}${formatLitres(activeEvent.window.tankDeltaL)}`
              : '—'}
          </span>
        </div>
      </>
    )}

    {isFill && (
      <>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Event Nature</span>
          <span className="fi-tele-val text-emerald-600 dark:text-emerald-400">Refuel Fill</span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Est. Financial Value</span>
          <span className="fi-tele-val text-emerald-600 dark:text-emerald-400">
            {activeEvent.inr != null ? formatINR(activeEvent.inr) : '—'}
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Sensor Tank Jump</span>
          <span className="fi-tele-val">
            {activeEvent.smoothedJumpL != null
              ? `+${formatLitres(activeEvent.smoothedJumpL)}`
              : formatLitres(activeEvent.litres ?? 0)}
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Previous Fill</span>
          <span className="fi-tele-val">
            {activeCtx?.previousFill != null ? formatLitres(activeCtx.previousFill) : '—'}
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Vehicle Avg Fill</span>
          <span className="fi-tele-val">
            {activeCtx?.averageFill != null ? formatLitres(activeCtx.averageFill) : '—'}
          </span>
        </div>
        <div className="fi-tele-item">
          <span className="fi-tele-label">Odometer Reading</span>
          <span className="fi-tele-val">
            {activeEvent.odometer != null ? `${activeEvent.odometer.toLocaleString()} km` : '—'}
          </span>
        </div>
      </>
    )}
  </div>
);

export default InspectorTelematicsGrid;
