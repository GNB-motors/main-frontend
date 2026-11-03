import { Phone } from 'lucide-react';

/**
 * PlaceLandmarkActions — what a driver can do about a landmark.
 *
 * "Call" opens the phone app, "Directions" opens Google Maps in a new tab.
 * Both are ordinary links, so they work on a phone without any JavaScript.
 */
export default function PlaceLandmarkActions({ place }) {
  if (!place) return null;

  const phone = place.phone ?? null;
  const openingHours = place.openingHours ?? null;
  const brand = place.brand ?? null;

  if (!phone && !openingHours && !brand) return null;

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

  return (
    <div className="flex flex-col gap-2">
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="inline-flex w-fit items-center gap-2 rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-3 py-1.5 text-[13px] font-medium text-[var(--rd-brand-2)] no-underline transition-colors hover:border-[var(--rd-line-strong)]"
        >
          <Phone size={14} aria-hidden="true" />
          Call {phone}
        </a>
      ) : null}
      {openingHours ? (
        <div className="flex items-center justify-between gap-3 text-[13px]">
          <span className="text-[var(--rd-ink-2)]">Open</span>
          <span className="text-[var(--rd-ink)]">{openingHours}</span>
        </div>
      ) : null}
      {brand ? (
        <div className="flex items-center justify-between gap-3 text-[13px]">
          <span className="text-[var(--rd-ink-2)]">Brand</span>
          <span className="text-[var(--rd-ink)]">{brand}</span>
        </div>
      ) : null}
      <a
        href={directions}
        target="_blank"
        rel="noreferrer"
        className="text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
      >
        Directions →
      </a>
    </div>
  );
}
