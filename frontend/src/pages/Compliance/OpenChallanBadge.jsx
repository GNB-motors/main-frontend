import { useEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { fetchOpenChallanBadge, oldestOpenAgeDays } from '../../services/challanService';

/**
 * OpenChallanBadge — the compliance strip on the vehicle detail page.
 *
 * Renders nothing when the vehicle has no open challans, so the header
 * stays quiet for a clean fleet; the moment one is open it shows the
 * count and the age of the worst one (an old open challan is a
 * registration blocker, a fresh one is not).
 *
 * Self-fetching so any page with a vehicle number can drop it in one
 * line — no prop drilling, no store wiring.
 */
export default function OpenChallanBadge({ vehicleNumber, className = '' }) {
  const [badge, setBadge] = useState(null);

  useEffect(() => {
    if (!vehicleNumber) {
      setBadge(null);
      return undefined;
    }
    let cancelled = false;
    fetchOpenChallanBadge(vehicleNumber)
      .then((d) => {
        if (!cancelled) setBadge(d);
      })
      .catch(() => {
        // A badge must never be the reason a page shows an error state.
        if (!cancelled) setBadge({ count: 0, oldestOpenDate: null, totalAmount: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [vehicleNumber]);

  if (!badge || !badge.count) return null;

  const days = oldestOpenAgeDays(badge.oldestOpenDate);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 ${className}`}
      title={`${badge.count} open challan${badge.count === 1 ? '' : 's'}${
        days != null ? ` · oldest ${days} days` : ''
      }`}
    >
      <CircleAlert className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>
        {badge.count} open challan{badge.count === 1 ? '' : 's'}
      </span>
      {days != null && <span className="font-mono opacity-80">· oldest {days} d</span>}
    </span>
  );
}
