import { TrafficCone } from 'lucide-react';
import InfoTip from '../../components/redesign/InfoTip';

/**
 * TrafficToggle — switches Google's live traffic on and off.
 *
 * It is off by default and remembered between visits, because a map full of
 * traffic lines is noise for an owner who only wants to see his own trucks.
 */
export default function TrafficToggle({ on = false, onToggle }) {
  return (
    <div className="absolute top-4 right-4 z-[600] flex items-center gap-1.5 rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] py-1.5 pr-1.5 pl-3 shadow-[var(--rd-shadow-float)]">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className={`flex items-center gap-1.5 rounded-[var(--rd-radius-sm)] px-2 py-1 text-[13px] font-medium transition-colors ${
          on
            ? 'bg-[var(--rd-info-tint)] text-[var(--rd-info-ink)]'
            : 'text-[var(--rd-ink-2)] hover:bg-[var(--rd-card-2)]'
        }`}
      >
        <TrafficCone size={15} aria-hidden="true" />
        Traffic
      </button>
      <InfoTip
        text="Google’s live traffic on the roads. It shows what is slow right now; the ETA in the vehicle panel uses our own road network."
        basis={null}
        side="left"
      />
    </div>
  );
}
