import React, { useState } from 'react';
import { X } from 'lucide-react';
import Link from '@/components/redesign/FleetLink';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import DataTooltip from '@/components/ui/DataTooltip';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorCard from '@/components/redesign/ErrorCard';
import { trackLink } from '@/utils/redesign/links';
import { formatIstDate } from '@/utils/redesign/format';
import useApi from '../../hooks/useApi';
import PerformanceApi from '../../api/performance';
import SourceCell from './SourceCell';
import { DrawerSection } from './PerformanceParts';
import {
  cellNumber,
  formatCellNumber,
  isUnknownCell,
  plainReason,
  words,
} from './performanceCells';
import {
  VEHICLE_METRICS,
  bandLabel,
  findingPill,
  keyOf,
  providerLabel,
  shareGroup,
} from './vehiclesModel';

const clampPct = (cell) => Math.max(0, Math.min(100, cellNumber(cell) ?? 0));

function ShareRows({ title, map }) {
  const { rows, allUnknownReason } = shareGroup(map, isUnknownCell, plainReason);
  if (!rows.length && !allUnknownReason) return null;
  return (
    <div className="pf-tracks">
      <p className="pf-subhead">{title}</p>
      {allUnknownReason ? (
        <p className="pf-section-note">Not comparable. {allUnknownReason}</p>
      ) : (
        rows.map(([key, cell]) => (
          <div className="pf-track-row" key={key}>
            <span>{bandLabel(key)}</span>
            <span className="pf-track" aria-hidden="true">
              <span style={{ width: `${clampPct(cell)}%` }} />
            </span>
            <SourceCell cell={cell} reason="hidden" />
          </div>
        ))
      )}
    </div>
  );
}

/** The truck's km/L day by day, with a dash-stub for a day without a reading. */
function DailyMileage({ series }) {
  const [active, setActive] = useState(null);
  const values = series.map((point) => cellNumber(point.kmPerL));
  const max = Math.max(0, ...values.filter((v) => v !== null));
  const point = active === null ? null : series[active];
  const dates = [series[0], series[Math.floor((series.length - 1) / 2)], series[series.length - 1]];

  return (
    <div className="pf-bars-wrap">
      <div
        className="pf-bars"
        role="group"
        aria-label="Daily km/L. A short grey stub is a day without a reading."
      >
        {series.map((day, index) => {
          const value = values[index];
          const label =
            value === null
              ? `${formatIstDate(day.istDay)} · no reading · ${plainReason(day.kmPerL)}`
              : `${formatIstDate(day.istDay)} · ${formatCellNumber(value, 2)} km/L`;
          return (
            <button
              type="button"
              key={day.istDay}
              className="pf-bar-hit"
              aria-label={label}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            >
              {value === null ? (
                <span className="pf-bar pf-bar--empty" />
              ) : (
                <span
                  className="pf-bar"
                  style={{ height: `${Math.max(4, max ? (value / max) * 100 : 0)}%` }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="pf-dates" aria-hidden="true">
        {dates.map((day, index) => (
          <span key={`${day?.istDay}-${index}`}>{day ? formatIstDate(day.istDay) : ''}</span>
        ))}
      </div>
      {point ? (
        <DataTooltip
          aria-hidden="true"
          className={`pf-bars-tooltip ${
            active < series.length / 2 ? 'pf-bars-tooltip--right' : 'pf-bars-tooltip--left'
          }`}
          label="Mileage"
          value={values[active] === null ? '—' : `${formatCellNumber(values[active], 2)} km/L`}
          details={[
            formatIstDate(point.istDay),
            values[active] === null ? plainReason(point.kmPerL) : 'Read from the truck',
          ]}
        />
      ) : null}
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-[120px] w-full" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}

/**
 * One truck: its four numbers, its gear and engine-speed use, its engine
 * health, its km/L against its own baseline, and iALERT's harsh events.
 */
export default function VehicleDrawer({ vehicle, window, onClose }) {
  const id = vehicle ? keyOf(vehicle) : null;
  const detail = useApi((signal) => PerformanceApi.vehicle(id, {}, signal), [id], {
    enabled: Boolean(id),
    scopeKey: id,
  });

  if (!vehicle) return null;

  const card = detail.data;
  const row = card?.vehicle ?? vehicle;
  const gear = card?.gearRpm ?? null;
  const findings = card?.health ?? [];
  const drift = card?.efficiencyDrift ?? null;
  const harsh = card?.harshEvents ?? [];
  const series = drift?.series ?? [];
  const days = window?.days ?? 30;

  return (
    <Sheet open onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent className="intel-assessment-drawer pf-drawer">
        <SheetHeader>
          <div className="min-w-0">
            <SheetTitle>{row.registration || '—'}</SheetTitle>
            <SheetDescription className="mt-1 text-[13px] text-[var(--ui-ink-3)]">
              {`${providerLabel(row.provider)} · last ${days} days`}
            </SheetDescription>
          </div>
          <button type="button" onClick={onClose} aria-label="Close the truck">
            <X size={16} aria-hidden="true" />
          </button>
        </SheetHeader>

        <div className="pf-drawer-body">
          <div className="pf-stats">
            {VEHICLE_METRICS.map((metric) => (
              <div className="pf-stat" key={metric.key}>
                <span>{metric.label}</span>
                <SourceCell cell={row[metric.key]} decimals={metric.decimals} />
              </div>
            ))}
          </div>

          {detail.loading && !card ? (
            <DrawerSkeleton />
          ) : detail.error ? (
            <ErrorCard error={detail.error} onRetry={detail.refetch} />
          ) : (
            <>
              <DrawerSection
                title="Daily mileage"
                sub="Each day’s km/L. Drift compares this window with the truck’s own last twelve weeks."
              >
                {drift?.driftPct ? (
                  <p className="pf-section-note">
                    {isUnknownCell(drift.driftPct) ? (
                      <>No drift yet. {plainReason(drift.driftPct)}</>
                    ) : (
                      <>
                        Drift against its own baseline:{' '}
                        <SourceCell cell={drift.driftPct} reason="hidden" />
                      </>
                    )}
                  </p>
                ) : null}
                {series.length ? (
                  <DailyMileage series={series} />
                ) : (
                  <p className="pf-section-note">No day in this window has a km/L reading.</p>
                )}
              </DrawerSection>

              <DrawerSection
                title="Gear and engine speed"
                sub="Share of driving time in each gear and engine-speed band."
              >
                {gear ? (
                  <>
                    <ShareRows title="Gear" map={gear.gearPct} />
                    <ShareRows title="Engine speed" map={gear.rpmBandPct} />
                  </>
                ) : (
                  <p className="pf-section-note">No gear or engine-speed reading in this window.</p>
                )}
              </DrawerSection>

              <DrawerSection
                title="Engine health"
                sub="Watching only. These do not raise an alert yet."
              >
                {findings.length ? (
                  <ul className="pf-rows">
                    {findings.map((finding) => {
                      const pill = findingPill(finding.status);
                      return (
                        <li key={`${finding.monitor}-${finding.title}`}>
                          <strong>{finding.title || words(finding.monitor)}</strong>
                          <span className={`pf-pill${pill.tone ? ` pf-pill--${pill.tone}` : ''}`}>
                            {pill.label}
                          </span>
                          {finding.detail ? <small>{finding.detail}</small> : null}
                          {finding.since ? (
                            <small>{`Since ${formatIstDate(finding.since)}`}</small>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="pf-section-note">Nothing was flagged for this truck.</p>
                )}
              </DrawerSection>

              <DrawerSection
                title="iALERT harsh events"
                sub="Counted by iALERT on the device. We compare our own count with theirs; we never adopt theirs."
              >
                {harsh.length ? (
                  <ul className="pf-rows">
                    {harsh.map((event, index) => (
                      <li key={`${event.at}-${event.type}-${index}`}>
                        <strong>{words(event.type)}</strong>
                        <span className="pf-mono">
                          {event.value === null || event.value === undefined
                            ? '—'
                            : `${formatCellNumber(event.value, 1)}${event.unit === '%' ? '%' : ` ${event.unit || ''}`}`}
                        </span>
                        <small>{event.at ? formatIstDate(event.at) : 'Day not on record'}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="pf-section-note">iALERT reported no harsh event for this truck.</p>
                )}
              </DrawerSection>
            </>
          )}

          {row.registration ? (
            <Link to={trackLink({ reg: row.registration })} className="pf-cta">
              Open in tracking →
            </Link>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
