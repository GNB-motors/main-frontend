import { Activity } from 'lucide-react';
import SectionCard from '../../components/redesign/SectionCard';
import PlaceName from '../../components/redesign/PlaceName';
import DeepLink from '../../components/redesign/DeepLink';
import { formatDuration } from '../../utils/redesign/format';
import { legLabel, reportedActivity } from './vehiclePanelModel';
import VehicleLocation from './VehicleLocation.jsx';
import { formatAgoText } from './minutesAgoFormat.js';

/**
 * VehicleNowCard — what is this truck doing right now?
 *
 * It says the activity, how long it has been happening, how that compares
 * with this truck's usual stay, and where it is. When we know the trip, the
 * trip sits in the same card, so the owner reads one story.
 */
export default function VehicleNowCard({ now, vehicle = null, onOpenPlace = null }) {
  const activity = now?.activity ?? null;
  const place = now?.place ?? null;
  const trip = now?.trip ?? null;

  // No activity from the backend: say what the truck's last report proves,
  // and where it is. Nothing to say means no card at all.
  if (!activity) {
    const reported = reportedActivity(vehicle);
    if (!reported) return null;
    const ago = vehicle?.ago != null ? formatAgoText(vehicle.ago) : null;
    return (
      <SectionCard
        icon={Activity}
        tone={reported.tone}
        title={`Now · ${reported.title}`}
        meta={ago}
      >
        <div className="text-[13px] text-[var(--rd-ink-2)]">
          {reported.lastSeen ? (
            <span className="mb-0.5 block text-[12px] text-[var(--rd-ink-3)]">Last seen</span>
          ) : null}
          <VehicleLocation vehicle={vehicle} fallback="Away from your named places" />
        </div>
      </SectionCard>
    );
  }

  const usual = activity.vsUsual ?? null;
  const leg = legLabel(activity.kind, trip?.leg);

  return (
    <SectionCard
      icon={Activity}
      tone={activity.kind === 'OFFLINE' ? 'watch' : 'info'}
      title={activity.label}
      info={activity.why ? { text: activity.why.text, basis: activity.why.basis ?? null } : null}
      meta={activity.durationMin != null ? formatDuration(activity.durationMin) : null}
    >
      <div className="flex flex-col gap-1">
        <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
          {usual ? (
            <>
              <span>Usually {formatDuration(usual.usualMin)} here</span>
              {usual.diffMin > 30 ? (
                <span className="text-[var(--rd-watch-ink)]">
                  {' '}
                  · {formatDuration(usual.diffMin)} longer than usual
                </span>
              ) : null}
            </>
          ) : null}
          {place?.truckVisits != null ? (
            <span>
              {usual ? ' · ' : ''}this truck has been here {place.truckVisits} times
            </span>
          ) : null}
        </p>

        {place?.at ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <PlaceName place={place.at} showCategory />
            <button
              type="button"
              onClick={() => onOpenPlace?.(place.at)}
              className="text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
            >
              Open place →
            </button>
          </div>
        ) : null}
      </div>

      {trip ? (
        <div className="mt-3 border-t border-[var(--rd-line)] pt-2.5">
          <p className="m-0 text-[13px] text-[var(--rd-ink)]">
            {leg ? `${leg}  ` : ''}
            {trip.pickup?.name ?? 'Unknown pickup'}
            {' → '}
            {trip.drop?.name ?? 'not known yet'}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--rd-ink-2)]">
            {trip.material ? (
              <span
                title={trip.materialSource === 'PLANT_TYPE' ? 'Likely, from the plant type' : null}
              >
                {trip.materialSource === 'PLANT_TYPE' ? `Likely ${trip.material}` : trip.material}
              </span>
            ) : null}
            {trip.tonnage != null ? <span>{`· ${trip.tonnage} t`}</span> : null}
            {trip.kmSoFar != null ? <span>{`${trip.kmSoFar} km so far`}</span> : null}
          </div>
          {trip.link?.to ? (
            <div className="mt-1">
              <DeepLink link={trip.link} />
            </div>
          ) : null}
        </div>
      ) : null}
    </SectionCard>
  );
}
