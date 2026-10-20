import { Route as RouteIcon } from 'lucide-react';
import { EVT_ICON } from './calendarEventStyles';

export default function NdMonth({ vehicles, onOpenVehicle }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const startPad = (first.getDay() + 6) % 7;
  const dkey = (d) => d.toISOString().slice(0, 10);

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(first);
    d.setDate(d.getDate() + (i - startPad));
    const off = d.getMonth() !== today.getMonth();
    const isToday = dkey(d) === dkey(today);
    const evs = [];
    vehicles.forEach((v) =>
      (v.events || []).forEach((e) => {
        const ed = new Date(today);
        ed.setDate(ed.getDate() + e.start);
        if (dkey(ed) === dkey(d)) evs.push({ v, e });
      }),
    );
    return (
      <button
        key={i}
        type="button"
        className={`nd-mday ${off ? 'nd-out' : ''} ${isToday ? 'nd-today' : ''}`.trim()}
        onClick={() => evs[0] && onOpenVehicle(evs[0].v.vehicleId)}
      >
        <div className="nd-mday-top">
          <span className={`nd-dnum ${isToday ? 'nd-dnum--today' : ''}`}>{d.getDate()}</span>
          {evs.length > 0 && <span className="nd-mday-count">{evs.length}</span>}
        </div>
        <div className="nd-mday-chips">
          {evs.slice(0, 3).map((x, i2) => {
            const EvIcon = EVT_ICON[x.e.type] || RouteIcon;
            return (
              <span
                key={i2}
                className={`nd-mchip nd-mchip--${x.e.type}`}
                title={`${x.v.registrationNumber} — ${x.e.label}`}
              >
                <EvIcon size={10} className="nd-mchip-ico" />
                <span className="nd-mchip-reg">{x.v.registrationNumber.slice(-4)}</span>
                <span className="nd-mchip-lbl">{x.e.label}</span>
              </span>
            );
          })}
          {evs.length > 3 ? <span className="nd-mmore">+{evs.length - 3} more</span> : null}
        </div>
      </button>
    );
  });

  return (
    <div className="nd-mgrid">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
        <div key={d} className="nd-mdow">
          {d}
        </div>
      ))}
      {cells}
    </div>
  );
}
