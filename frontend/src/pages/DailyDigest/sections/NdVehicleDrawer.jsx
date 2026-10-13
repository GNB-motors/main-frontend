import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X as XIcon, Wrench, Route as RouteIcon } from 'lucide-react';
import { formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { formatDateIST, formatDateTimeIST } from '../../../utils/dateUtils';
import { EVT_COLOR } from './calendarEventStyles';

export default function NdVehicleDrawer({ vehicle, onClose }) {
  const navigate = useNavigate();
  const open = Boolean(vehicle);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Mouse-only affordance: keyboard users close with Escape (listener above). */}
      <div
        role="presentation"
        className={`nd-scrim ${open ? 'nd-on' : ''}`.trim()}
        onClick={onClose}
      />
      <aside className={`nd-vdrawer ${open ? 'nd-open' : ''}`.trim()} aria-hidden={!open}>
        {vehicle ? (
          <>
            <div className="nd-vd-head">
              <span className="nd-vd-tile">
                <RouteIcon size={24} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nd-plate">{vehicle.registrationNumber}</div>
                <div className="nd-model">{vehicle.model || '—'}</div>
              </div>
              <button
                type="button"
                className="nd-btn nd-btn--icon nd-btn--sm"
                aria-label="Close"
                onClick={onClose}
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="nd-vd-body">
              <div className="nd-vd-sec">
                <span className="nd-eyebrow">Today</span>
                <div className="nd-vd-grid">
                  <div className="nd-vd-stat">
                    <div className="nd-k">Idling</div>
                    <div className="nd-v">
                      {vehicle.idleMinutes != null ? `${vehicle.idleMinutes} min` : '—'}
                    </div>
                  </div>
                  <div className="nd-vd-stat">
                    <div className="nd-k">Detour</div>
                    <div className="nd-v">
                      {vehicle.detourKm != null ? formatKm(vehicle.detourKm) : '—'}
                    </div>
                  </div>
                  <div className="nd-vd-stat">
                    <div className="nd-k">Fuel in tank</div>
                    <div className="nd-v">
                      {vehicle.fuelLevelL != null ? `${vehicle.fuelLevelL} L` : '—'}
                    </div>
                  </div>
                  <div className="nd-vd-stat">
                    <div className="nd-k">Efficiency</div>
                    <div className="nd-v">
                      {vehicle.kmpl != null ? `${vehicle.kmpl} km/L` : '—'}
                    </div>
                  </div>
                </div>
                {vehicle.fill ? (
                  <div className="nd-vd-line" style={{ marginTop: 10 }}>
                    <span
                      className="nd-evdot"
                      style={{
                        background: vehicle.fill.tankVerified === false ? '#C2323A' : '#187A32',
                      }}
                    />
                    <span>
                      Refuelled {formatLitres(vehicle.fill.litres)} · {vehicle.fill.station || '—'}
                    </span>
                    <span className="nd-sp" />
                    <span className="nd-when">
                      {vehicle.fill.refuelTime ? formatDateTimeIST(vehicle.fill.refuelTime) : ''}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="nd-vd-sec">
                <span className="nd-eyebrow">Live status</span>
                {vehicle.profileLoading ? (
                  <div className="nd-vd-line">
                    <span className="nd-when">Loading…</span>
                  </div>
                ) : vehicle.profile?.health ? (
                  <div className="nd-vd-grid">
                    <div className="nd-vd-stat">
                      <div className="nd-k">Fuel</div>
                      <div className="nd-v">
                        {vehicle.profile.health.primaryFuelLevel != null
                          ? `${vehicle.profile.health.primaryFuelLevel}%`
                          : '—'}
                      </div>
                    </div>
                    <div className="nd-vd-stat">
                      <div className="nd-k">DEF</div>
                      <div className="nd-v">
                        {vehicle.profile.health.defLevel != null
                          ? `${vehicle.profile.health.defLevel}%`
                          : '—'}
                      </div>
                    </div>
                    <div className="nd-vd-stat">
                      <div className="nd-k">Odometer</div>
                      <div className="nd-v">
                        {vehicle.profile.health.canOdo != null
                          ? formatKm(vehicle.profile.health.canOdo)
                          : '—'}
                      </div>
                    </div>
                    <div className="nd-vd-stat">
                      <div className="nd-k">Engine hrs</div>
                      <div className="nd-v">
                        {vehicle.profile.health.engineRunHour != null
                          ? formatNum(vehicle.profile.health.engineRunHour)
                          : '—'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="nd-vd-line">
                    <span className="nd-when">No live telemetry available.</span>
                  </div>
                )}
                {vehicle.profile?.assignedDriver ? (
                  <div className="nd-vd-line" style={{ marginTop: 10 }}>
                    <span className="nd-evdot" style={{ background: 'var(--nova-rage-400)' }} />
                    <span>
                      {vehicle.profile.assignedDriver.name || 'Driver assigned'}
                      {vehicle.profile.assignedDriver.group
                        ? ` · ${vehicle.profile.assignedDriver.group}`
                        : ''}
                    </span>
                  </div>
                ) : vehicle.profile ? (
                  <div className="nd-vd-line" style={{ marginTop: 10 }}>
                    <span className="nd-when">No driver assigned.</span>
                  </div>
                ) : null}
                {vehicle.profile?.prediction ? (
                  <div className="nd-vd-line" style={{ marginTop: 6 }}>
                    <span className="nd-evdot" style={{ background: EVT_COLOR.service }} />
                    <span>
                      Next service:{' '}
                      {vehicle.profile.prediction.risk
                        ? vehicle.profile.prediction.risk.toLowerCase().replace('_', ' ')
                        : '—'}
                      {vehicle.profile.prediction.daysUntilDue != null
                        ? ` · ${formatNum(vehicle.profile.prediction.daysUntilDue)} days`
                        : ''}
                      {vehicle.profile.prediction.kmUntilDue != null
                        ? ` · ${formatKm(vehicle.profile.prediction.kmUntilDue)} left`
                        : ''}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="nd-vd-sec">
                <span className="nd-eyebrow">Trips &amp; events</span>
                {vehicle.events?.length ? (
                  vehicle.events.map((e, i) => (
                    <div key={i} className="nd-vd-line">
                      <span className="nd-evdot" style={{ background: EVT_COLOR[e.type] }} />
                      <span>
                        {e.label}
                        {e.tons ? ` · ${e.tons} t` : ''}
                      </span>
                      <span className="nd-sp" />
                      <span className="nd-when">{formatDateIST(e.date)}</span>
                    </div>
                  ))
                ) : (
                  <div className="nd-vd-line">
                    <span className="nd-when">No scheduled events.</span>
                  </div>
                )}
              </div>
              <div className="nd-vd-sec" style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="nd-btn nd-btn--sm nd-btn--primary"
                  style={{ flex: 1 }}
                  onClick={() =>
                    navigate(`/vehicles/${encodeURIComponent(vehicle.registrationNumber)}`)
                  }
                >
                  <RouteIcon size={14} />
                  View vehicle
                </button>
                <button
                  type="button"
                  className="nd-btn nd-btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate('/vehicles/service-intelligence')}
                >
                  <Wrench size={14} />
                  Log service
                </button>
              </div>
            </div>
          </>
        ) : null}
      </aside>
    </>
  );
}
