import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import copyText from './copyText';
import { legLabel, makeLabel, modelLabel, statusLabel } from './vehiclePanelModel';
import { formatIst } from '../../utils/redesign/format';
import FreshnessBadge from '../../components/redesign/FreshnessBadge';

/**
 * VehiclePanelHeader — what truck this is, and is the data live?
 *
 * The freshness line is the important part: a reading from September must
 * never look like a reading from now. The badge says how old the value is,
 * and the account warning appears only when the vendor account is actually
 * disconnected.
 */
export default function VehiclePanelHeader({ now, account = null, onOpenAccount = null }) {
  const [copied, setCopied] = useState(false);
  const identity = now?.identity ?? {};
  const view = now?.view ?? {};
  const activity = now?.activity ?? null;
  const trip = now?.trip ?? null;

  const plate = now?.registrationNumber ?? '—';
  const make = makeLabel(identity.make);
  const model = modelLabel(identity.model);
  const modelLine = identity.modelLine ?? null;
  const leg = legLabel(activity?.kind, trip?.leg);

  const handleCopy = () => {
    if (!identity.vin) return;
    copyText(identity.vin)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setCopied(false));
  };

  const needsRelink = account?.state === 'NEEDS_RELINK' || account?.state === 'RECOVERING';

  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[22px] leading-7 font-bold text-[var(--rd-ink)]">{plate}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-[var(--rd-ink-2)]">
            <span>
              {make ? `${make} ${model ?? ''}`.trim() : 'Make not known'}
              {modelLine ? ` (${modelLine})` : ''}
            </span>
            {model ? null : <span className="text-[var(--rd-ink-3)]">Model not known</span>}
          </div>
          {identity.vin ? (
            <div className="mt-1 flex items-center gap-1.5">
              <code className="font-mono text-[12px] text-[var(--rd-ink-2)]">{identity.vin}</code>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy VIN"
                title="Copy VIN"
                className="rounded p-0.5 text-[var(--rd-ink-3)] transition-colors hover:text-[var(--rd-ink-2)]"
              >
                {copied ? (
                  <Check size={13} aria-hidden="true" />
                ) : (
                  <Copy size={13} aria-hidden="true" />
                )}
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--rd-card-2)] px-2.5 py-1 text-[12px] font-semibold text-[var(--rd-ink)]">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: 'var(--rd-moving)' }}
            />
            {statusLabel(view.status)}
            {leg ? <span className="font-normal text-[var(--rd-ink-2)]">· {leg}</span> : null}
          </span>
        </div>
      </div>

      {/* Freshness and the last report */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        <FreshnessBadge reading={now?.readings?.gps ?? null} size="sm" />
        <span className="text-[var(--rd-ink-3)]">
          {view.lastFixAt ? `last report ${formatIst(view.lastFixAt)}` : 'no report yet'}
        </span>
        {needsRelink ? (
          <button
            type="button"
            onClick={onOpenAccount}
            className="rounded-full bg-[var(--rd-act-tint)] px-2 py-0.5 text-[12px] font-semibold text-[var(--rd-act-ink)]"
          >
            Account needs re-link
          </button>
        ) : null}
      </div>

      {/* GPS and ignition chips */}
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full border border-[var(--rd-line)] px-2 py-0.5 text-[11px] text-[var(--rd-ink-2)]">
          {view.hasGpsFix
            ? 'GPS fix'
            : view.hasPosition
              ? `Last known position${view.ageMin != null ? ` · ${Math.round(view.ageMin)} min ago` : ''}`
              : 'No GPS position'}
        </span>
        <span className="rounded-full border border-[var(--rd-line)] px-2 py-0.5 text-[11px] text-[var(--rd-ink-2)]">
          {view.ignition === 'ON'
            ? 'Engine on'
            : view.ignition === 'OFF'
              ? 'Engine off'
              : 'Engine: not known'}
        </span>
      </div>
    </header>
  );
}
