import { Trophy, Star, TrendingDown } from 'lucide-react';
import { Panel } from './overview.primitives.jsx';
import { getInitials } from '../overviewFormat.js';
import { formatNum } from '../../../utils/formatters';

const DriverCard = ({ driver, label, variant = 'top' }) => {
  if (!driver) return null;
  const isTop = variant === 'top';
  return (
    <Panel eyebrow={label}>
      <div className="flex items-center gap-4">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
          style={{
            background: isTop
              ? 'color-mix(in srgb, var(--gnb-400) 14%, transparent)'
              : 'color-mix(in srgb, var(--critical) 14%, transparent)',
            color: isTop ? 'var(--gnb-400)' : 'var(--critical)',
          }}
        >
          {getInitials(driver.driverName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold" style={{ color: 'var(--cluster-text)' }}>
            {driver.driverName}
          </p>
          {driver.mobileNumber && <p className="num text-xs text-dim">{driver.mobileNumber}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="ov-pill ov-pill--inert">{driver.tripCount || 0} trips</span>
            <span className="ov-pill ov-pill--inert">
              {formatNum(driver.totalFuelLitres || 0)} L
            </span>
          </div>
        </div>
        <div
          className="num flex items-center gap-1 text-lg font-bold"
          style={{
            color:
              driver.rating >= 4
                ? 'var(--ok)'
                : driver.rating >= 3
                  ? 'var(--caution)'
                  : 'var(--critical)',
          }}
        >
          {isTop ? <Trophy size={16} /> : <TrendingDown size={16} />}
          <Star size={16} fill="currentColor" />
          {(driver.rating || 0).toFixed(1)}
        </div>
      </div>
    </Panel>
  );
};

export default DriverCard;
