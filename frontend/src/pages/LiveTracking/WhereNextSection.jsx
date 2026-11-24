import { useEffect, useState } from 'react';
import { Navigation } from 'lucide-react';
import SectionCard from '../../components/redesign/SectionCard';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import { trafficWord } from './vehiclePanelModel';
import { etaHasPassed, ETA_PASSED_TEXT } from './etaPassed';
import {
  destinationHeading,
  destinationName,
  evidence,
  predictionConfidence,
} from './whereNextModel';

/**
 * WhereNextSection — where is this truck likely going, and when?
 *
 * It is collapsed by default, and the collapsed header already gives the
 * top guess, because that is the question the owner actually has. Opening
 * it shows the reasons, the road, the usual break and the overspeed risk.
 *
 * The API sends the reason in words ("usually goes here after JK BUXAR, 18
 * of 24 times"). We show it with the reported confidence when available.
 */
export default function WhereNextSection({
  registrationNumber,
  onSelectDestination = null,
  onPrediction = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const { data, loading, error } = useApi(
    (signal) => fleetViewService.getWhereNext(registrationNumber, { signal }),
    [registrationNumber],
    { enabled: Boolean(registrationNumber), scopeKey: registrationNumber },
  );

  const hasDestinations = Array.isArray(data?.destinations) && data.destinations[0]?.place;
  const prediction = loading || error || data?.held || !hasDestinations ? null : data;
  const destinations = prediction?.destinations;
  const top = destinations?.[0];
  const selected = destinations?.find((d) => d?.place?.id === selectedId) ?? top;

  useEffect(() => {
    onPrediction?.({ registrationNumber, data: prediction, open: Boolean(prediction && isOpen) });
  }, [registrationNumber, prediction, isOpen, onPrediction]);

  if (!top) return null;

  const confidence = predictionConfidence(top);
  const headerTitle = [
    destinationHeading(top),
    confidence,
    etaHasPassed(top.eta) ? ETA_PASSED_TEXT : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <SectionCard
      icon={Navigation}
      tone="info"
      title={headerTitle}
      action={
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] px-2.5 py-1 text-[12px] font-semibold text-[var(--rd-ink-2)] transition-colors hover:border-[var(--rd-line-strong)]"
        >
          {isOpen ? 'Close' : 'Open'}
        </button>
      }
    >
      {!isOpen ? (
        <p className="m-0 text-[12px] text-[var(--rd-ink-3)]">
          {top?.route?.viaNames?.length ? `usually via ${top.route.viaNames.join(' → ')} · ` : ''}
          {evidence(top)}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {data?.basis?.text ? (
            <p className="m-0 text-[12px] text-[var(--rd-ink-3)]">{data.basis.text}</p>
          ) : null}

          {destinations
            .filter((destination) => destination?.place)
            .slice(0, 3)
            .map((destination, index) => (
              <DestinationRow
                key={destination.place?.id ?? index}
                destination={destination}
                index={index}
                selected={selected?.place?.id === destination.place?.id}
                onSelect={() => {
                  setSelectedId(destination.place?.id);
                  onSelectDestination?.(destination);
                }}
              />
            ))}
        </div>
      )}
    </SectionCard>
  );
}

/** One destination: where, how often, when it would get there, and what to watch. */
function DestinationRow({ destination, index, selected, onSelect }) {
  const eta = destination.eta ?? null;
  const route = destination.route ?? null;
  const traffic = trafficWord(eta?.congestion);
  const breakHabit = destination.breakHabit ?? null;
  const overspeed = destination.overspeedRisk ?? null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col gap-0.5 rounded-[var(--rd-radius-sm)] border px-2.5 py-2 text-left transition-colors ${
        selected
          ? 'border-[var(--rd-brand-2)] bg-[var(--rd-brand-tint)]'
          : 'border-[var(--rd-line)] hover:border-[var(--rd-line-strong)]'
      }`}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-[14px] font-semibold text-[var(--rd-ink)]">
          <span className="mr-1 text-[var(--rd-ink-3)]">{index + 1}</span>
          {destinationName(destination.place)}
        </span>
        {predictionConfidence(destination) || evidence(destination) ? (
          <span className="shrink-0 text-[12px] text-[var(--rd-ink-2)] tabular-nums">
            {[predictionConfidence(destination), evidence(destination)].filter(Boolean).join(' · ')}
          </span>
        ) : null}
      </span>

      <span className="text-[12px] text-[var(--rd-ink-2)]">{destination.reason}</span>

      {etaHasPassed(eta) ? (
        <span className="text-[12px] text-[var(--rd-ink-3)]">{ETA_PASSED_TEXT}</span>
      ) : eta?.at && new Date(eta.at).getTime() > Date.now() ? (
        <span className="text-[12px] text-[var(--rd-ink-2)]">
          ETA {formatIst(eta.at)}
          {eta.earliestAt && eta.latestAt
            ? ` (${formatIst(eta.earliestAt)} – ${formatIst(eta.latestAt)})`
            : ''}
          {eta.driveMin != null ? ` · ${formatDuration(eta.driveMin)} drive` : ''}
          {eta.breakMin ? ` + ${formatDuration(eta.breakMin)} break` : ''}
        </span>
      ) : null}

      {route ? (
        <span className="text-[12px] text-[var(--rd-ink-3)]">
          Road: {route.viaNames?.length ? route.viaNames.join(' → ') : 'the usual road'}
          {traffic ? ` · usual traffic for this hour: ${traffic}` : ''}
          {eta?.congestionWhy ? ` (${eta.congestionWhy})` : ''}
        </span>
      ) : null}

      {breakHabit ? (
        <span className="text-[12px] text-[var(--rd-ink-3)]">{breakHabit.text}</span>
      ) : null}
      {overspeed ? (
        <span className="text-[12px] text-[var(--rd-watch-ink)]">{overspeed.text}</span>
      ) : null}
    </button>
  );
}
