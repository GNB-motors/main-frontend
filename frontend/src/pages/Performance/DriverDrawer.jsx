import React from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorCard from '@/components/redesign/ErrorCard';
import { formatIstDate } from '@/utils/redesign/format';
import useApi from '../../hooks/useApi';
import PerformanceApi from '../../api/performance';
import { windowLabel } from './performanceGaps';
import SourceCell from './SourceCell';
import PaceCell from './PaceCell';
import { DrawerSection } from './PerformanceParts';
import { cellNumber, formatCellNumber, isUnknownCell, plainReason } from './performanceCells';
import { DNA_FACTS, DNA_SCORES, DRIVER_METRICS, driverTrucks, gradeTone } from './driversModel';

const isCell = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && 'source' in v;

function DnaBasis({ dna }) {
  const parts = [];
  if (typeof dna.registrationNumber === 'string') parts.push(dna.registrationNumber);
  if (dna.windowFrom && dna.windowTo) {
    parts.push(`${formatIstDate(dna.windowFrom)} → ${formatIstDate(dna.windowTo)}`);
  }
  const moving = cellNumber(dna.movingSamples);
  if (moving !== null) parts.push(`${moving.toLocaleString('en-IN')} moving readings`);
  if (!parts.length) return null;
  return <p className="pf-section-note">{`Based on ${parts.join(' · ')}.`}</p>;
}

export function DriverDna({ dna, reason }) {
  if (!dna) {
    return (
      <p className="pf-section-note">
        {plainReason({
          source: 'insufficient_data',
          reason: reason || 'no DNA day in this window',
        })}
      </p>
    );
  }
  const score = isCell(dna.drivingScore) ? dna.drivingScore : null;
  const tone = gradeTone(dna.grade);
  const scores = DNA_SCORES.filter((part) => isCell(dna[part.key]));
  const knownScores = scores.filter((part) => !isUnknownCell(dna[part.key]));
  const facts = DNA_FACTS.filter((fact) => isCell(dna[fact.key]));

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-3">
        {typeof dna.grade === 'string' && dna.grade ? (
          <span
            className={`pf-pill${tone ? ` pf-pill--${tone}` : ''}`}
          >{`Grade ${dna.grade}`}</span>
        ) : null}
        {score && !isUnknownCell(score) ? (
          <span className="text-[13px] text-[var(--ui-ink-3)]">
            <b className="font-medium text-[var(--ui-ink)]">
              {formatCellNumber(cellNumber(score), 0)}
            </b>{' '}
            of 100
          </span>
        ) : null}
      </div>

      {knownScores.length ? (
        <div className="pf-tracks">
          {scores.map((part) => (
            <div className="pf-track-row" key={part.key}>
              <span>{part.label}</span>
              <span className="pf-track" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.max(0, Math.min(100, cellNumber(dna[part.key]) ?? 0))}%`,
                  }}
                />
              </span>
              <SourceCell cell={dna[part.key]} decimals={0} reason="hidden" />
            </div>
          ))}
        </div>
      ) : scores.length ? (
        <p className="pf-section-note">{`No part of the score yet. ${plainReason(dna[scores[0].key])}`}</p>
      ) : null}

      {facts.length ? (
        <ul className="pf-rows">
          {facts.map((fact) => (
            <li key={fact.key}>
              <span className="text-[var(--ui-ink-3)]">{fact.label}</span>
              <SourceCell cell={dna[fact.key]} decimals={fact.decimals} />
            </li>
          ))}
        </ul>
      ) : null}

      <DnaBasis dna={dna} />
    </>
  );
}

/** One driver: their four numbers and the Driving DNA behind the score. */
export default function DriverDrawer({ driver, window, from, to, onClose }) {
  const id = driver?.driverId ?? null;
  const detail = useApi(
    (signal) => PerformanceApi.driver(id, { from, to }, signal),
    [id, from, to],
    {
      enabled: Boolean(id),
      scopeKey: `${id}:${from || 'default'}:${to || 'default'}`,
    },
  );

  if (!driver) return null;
  const range =
    windowLabel(from && to ? { from, to } : window) || `last ${window?.days ?? 30} days`;

  return (
    <Sheet open onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent className="intel-assessment-drawer pf-drawer">
        <SheetHeader>
          <div className="min-w-0">
            <SheetTitle className="pf-drawer-person">
              {driver.name || 'Name not on record'}
            </SheetTitle>
            <SheetDescription className="mt-1 text-[13px] text-[var(--ui-ink-3)]">
              {`${driverTrucks(driver)} · ${range}`}
            </SheetDescription>
          </div>
          <button type="button" onClick={onClose} aria-label="Close the driver">
            <X size={16} aria-hidden="true" />
          </button>
        </SheetHeader>

        <div className="pf-drawer-body">
          <div className="pf-stats">
            {DRIVER_METRICS.map((metric) => (
              <div className="pf-stat" key={metric.key}>
                <span>{metric.label}</span>
                {metric.pace ? (
                  <PaceCell cell={driver[metric.key]} />
                ) : (
                  <SourceCell cell={driver[metric.key]} decimals={metric.decimals} />
                )}
              </div>
            ))}
          </div>

          <DrawerSection
            title="Driving DNA"
            sub="The latest DNA day in this window, worked out from the truck’s own readings."
          >
            {detail.loading && !detail.data ? (
              <div role="status" aria-busy="true" className="flex flex-col gap-3">
                <span className="sr-only">Loading…</span>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : detail.error ? (
              <ErrorCard error={detail.error} onRetry={detail.refetch} />
            ) : (
              <DriverDna dna={detail.data?.dna ?? null} reason={detail.data?.dnaReason} />
            )}
          </DrawerSection>
        </div>
      </SheetContent>
    </Sheet>
  );
}
