import { Route as RouteIcon, Truck } from 'lucide-react';
import { EVT_ICON } from './calendarEventStyles';

// Packs vehicle events into non-overlapping vertical lanes so overlapping
// events (e.g. planned trip + service due on the same day) never clash.
function packEventLanes(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.len - a.len);
  const laneEndTimes = [];

  const packed = sorted.map((e) => {
    let lane = -1;
    for (let i = 0; i < laneEndTimes.length; i++) {
      if (laneEndTimes[i] <= e.start) {
        lane = i;
        laneEndTimes[i] = e.start + e.len;
        break;
      }
    }
    if (lane === -1) {
      lane = laneEndTimes.length;
      laneEndTimes.push(e.start + e.len);
    }
    return { ...e, lane };
  });

  return {
    events: packed,
    totalLanes: Math.max(1, laneEndTimes.length),
  };
}

export default function NdGantt({ vehicles, days, onOpenVehicle, selectedVehicleId }) {
  const heads = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    const we = [0, 6].includes(d.getDay());
    const isToday = i === 0;
    return (
      <div key={i} className={`nd-gcell ${isToday ? 'nd-today' : ''} ${we ? 'nd-we' : ''}`.trim()}>
        <div className="nd-d">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
        <div className="nd-n-badge">
          <span>{d.getDate()}</span>
          {isToday && <span className="nd-today-dot" title="Current Day" />}
        </div>
      </div>
    );
  });
  const nowPct = (new Date().getHours() * 60 + new Date().getMinutes()) / 1440;

  return (
    <div className="nd-gantt">
      <div className="nd-grow" style={{ '--days': days }}>
        <div className="nd-ghead nd-gsticky">
          <span className="nd-vcol-title">
            <Truck size={13} />
            <span>VEHICLE</span>
            <span className="nd-vcol-badge">{vehicles.length}</span>
          </span>
        </div>
        <div
          className="nd-ghead"
          style={{
            gridColumn: '2 / -1',
            display: 'grid',
            gridTemplateColumns: `repeat(${days}, minmax(64px, 1fr))`,
          }}
        >
          {heads}
        </div>
        {vehicles.map((v) => {
          const rawEvents = (v.events || []).filter((e) => e.start + e.len > 0 && e.start < days);
          const { events: packedEvents, totalLanes } = packEventLanes(rawEvents);
          const laneHeight = 26;
          const laneGap = 8;
          const lanePitch = laneHeight + laneGap; // 34px
          const rowPad = 14;
          const rowHeight = totalLanes === 1 ? 64 : rowPad * 2 + totalLanes * lanePitch - laneGap;

          const bars = packedEvents.map((e, i) => {
            const s = Math.max(0, e.start);
            const end = Math.min(days, e.start + e.len);
            const span = Math.max(1, end - s);
            const isOngoing = e.state === 'OPEN';
            // An event that covers today or future is not past/done
            const isDone = e.type === 'trip' && e.start + e.len < 0;
            const EvIcon = EVT_ICON[e.type] || RouteIcon;

            // Intelligent label that always renders cleanly without overflow
            let labelText = e.label || '';
            if (span >= 3) {
              labelText = `${e.label}${e.tons ? ` · ${e.tons}t` : ''}`;
            } else if (span === 2) {
              labelText = e.label;
            } else if (span === 1) {
              if (e.type === 'service') labelText = e.overdue ? 'Overdue' : 'Service';
              else if (e.type === 'doc') labelText = 'Doc Due';
              else if (isOngoing) labelText = 'Trip';
              else labelText = e.label?.split('→')[0]?.trim() || 'Trip';
            }

            const lane = e.lane || 0;
            const topOffset = totalLanes === 1 ? 18 : rowPad + lane * lanePitch;
            const barHeight = totalLanes === 1 ? 28 : laneHeight;

            return (
              <button
                key={i}
                type="button"
                className={`nd-ev nd-ev--${e.type} ${isDone ? 'nd-ev--done' : ''} ${span === 1 ? 'nd-ev--compact' : ''}`.trim()}
                style={{
                  left: `calc(${s} * (100% / ${days}) + 4px)`,
                  width: `calc(${span} * (100% / ${days}) - 8px)`,
                  minWidth: '38px',
                  top: `${topOffset}px`,
                  height: `${barHeight}px`,
                }}
                title={`${v.registrationNumber}: ${e.label}${e.tons ? ` · ${e.tons}t` : ''} (${e.len} day${e.len > 1 ? 's' : ''})`}
                onClick={() => onOpenVehicle(v.vehicleId)}
              >
                <span className="nd-ev-ico">
                  <EvIcon size={totalLanes === 1 ? 12 : 11} />
                </span>
                <span className="nd-ev-label">{labelText}</span>
                {e.tons && span >= 3 && <span className="nd-ev-tons">{e.tons}t</span>}
              </button>
            );
          });

          const cells = Array.from({ length: days }, (_, i) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + i);
            const we = [0, 6].includes(d.getDay());
            return (
              <div
                key={i}
                className={`nd-gtrack ${i === 0 ? 'nd-today' : ''} ${we ? 'nd-we' : ''}`.trim()}
              />
            );
          });

          return (
            <div
              key={v.vehicleId}
              className={`nd-vrow ${v.vehicleId === selectedVehicleId ? 'nd-is-sel' : ''}`.trim()}
            >
              <button
                type="button"
                className="nd-gsticky nd-vcard"
                style={{ minHeight: `${rowHeight}px` }}
                onClick={() => onOpenVehicle(v.vehicleId)}
                title={`View ${v.registrationNumber} details`}
              >
                <div className="nd-vcard-ico">
                  <Truck size={13} />
                </div>
                <div className="nd-vcard-info">
                  <div className="nd-vcard-plate">{v.registrationNumber}</div>
                  <div className="nd-vcard-model">{v.model || 'Commercial'}</div>
                </div>
              </button>
              <div className="nd-gtrackrow" style={{ height: `${rowHeight}px` }}>
                {cells}
                {bars}
              </div>
            </div>
          );
        })}
        <div
          className="nd-nowline"
          style={{ left: `calc(220px + (100% - 220px) / ${days} * ${nowPct.toFixed(3)})` }}
        >
          <span className="nd-nowline-tag">NOW</span>
          <span className="nd-nowline-beam" />
        </div>
      </div>
    </div>
  );
}
