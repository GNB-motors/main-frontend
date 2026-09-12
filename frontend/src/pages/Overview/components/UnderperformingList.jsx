import { Star } from 'lucide-react';
import { Panel } from './overview.primitives.jsx';
import { getInitials } from '../overviewFormat.js';

const UnderperformingList = ({ drivers }) => {
  if (!drivers?.length || !drivers[0]?.driverName) return null;
  return (
    <Panel eyebrow="Underperforming drivers">
      <div className="flex flex-col gap-2.5">
        {drivers.map((driver) => (
          <div key={driver.driverId || driver.id} className="ov-inset flex items-center gap-3 p-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: 'color-mix(in srgb, var(--critical) 14%, transparent)',
                color: 'var(--critical)',
              }}
            >
              {getInitials(driver.driverName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: 'var(--cluster-text)' }}>
                {driver.driverName}
              </p>
              {driver.mobileNumber && <p className="num text-xs text-dim">{driver.mobileNumber}</p>}
            </div>
            <div
              className="num flex items-center gap-1 text-sm font-bold"
              style={{ color: driver.rating >= 3 ? 'var(--caution)' : 'var(--critical)' }}
            >
              <Star size={13} fill="currentColor" />
              {(driver.rating || 0).toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

export default UnderperformingList;
