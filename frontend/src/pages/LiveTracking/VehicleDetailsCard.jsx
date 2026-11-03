import { Truck } from 'lucide-react';
import SectionCard from '../../components/redesign/SectionCard';
import { formatIst, formatKm } from '../../utils/redesign/format';
import { makeLabel, modelLabel } from './vehiclePanelModel';

/**
 * VehicleDetailsCard — the paperwork, collapsed.
 *
 * It sits at the bottom of the panel because an owner chasing a truck does
 * not open the panel for the VIN. It is there when they need it.
 */
export default function VehicleDetailsCard({ now }) {
  const identity = now?.identity ?? {};
  const service = identity.service ?? null;

  const nextService =
    service?.nextKm != null
      ? `at ${formatKm(service.nextKm)}${service.nextDueAt ? ` (${formatIst(service.nextDueAt, { withDate: true })})` : ''}`
      : service?.nextDueAt
        ? formatIst(service.nextDueAt, { withDate: true })
        : null;

  // Only what we know. A card of "Not known" rows says nothing, so a row
  // without a value is left out, and a card without rows is not drawn.
  const rows = [
    { label: 'Make', value: makeLabel(identity.make) },
    { label: 'Model', value: modelLabel(identity.model) },
    { label: 'Series', value: identity.modelLine ?? null },
    { label: 'VIN', value: identity.vin ?? null, mono: true },
    { label: 'Year', value: identity.year != null ? String(identity.year) : null },
    {
      label: 'Last service',
      value: service?.lastAt ? formatIst(service.lastAt, { withDate: true }) : null,
    },
    { label: 'Next service', value: nextService },
  ].filter((row) => row.value);

  if (!rows.length) return null;

  return (
    <SectionCard icon={Truck} tone="info" title="Vehicle details">
      <dl className="m-0 flex flex-col gap-1.5 text-[13px]">
        {rows.map((row) => (
          <Row key={row.label} label={row.label} value={row.value} mono={row.mono} />
        ))}
      </dl>
    </SectionCard>
  );
}

/** One line of the details card. */
function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[var(--rd-ink-2)]">{label}</dt>
      <dd
        className={`min-w-0 truncate text-right text-[var(--rd-ink)] ${mono ? 'font-mono text-[12px]' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}
