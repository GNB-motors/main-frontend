import React from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet';
import ErrorCard from '../../../components/redesign/ErrorCard';
import HeldCard from '../../../components/redesign/HeldCard';
import InfoTip from '../../../components/redesign/InfoTip';
import NotYetAvailable from '../../../components/redesign/NotYetAvailable';
import ToneBadge from '../../../components/redesign/ToneBadge';
import { useApi } from '../../../hooks/useApi';
import { DASH, formatIstDate, formatKm, formatL, formatPct } from '../../../utils/redesign/format';
import { rangeToParams } from '../mileageDates';
import { MileageService } from '../MileageService';
import { RECONCILED_COPY, isReconciled, rowsOf } from '../mileageVerdicts';
import MileageVerdictBadge from './MileageVerdictBadge';

const kmPerLText = (value) => (value == null ? DASH : `${value.toFixed(2)} km/L`);

/**
 * One truck's fill-to-fill cycles.
 *
 * This is the drilldown behind a row in "By truck" or "Fill to fill": the
 * cycles of that one truck, each with its own check, so the owner can see
 * which round moved and which did not.
 */
export default function MileageCyclesDrawer({ truck = null, range, onClose }) {
  const registrationNumber = truck?.registrationNumber ?? null;
  const { data, loading, error, refetch } = useApi(
    (signal) =>
      MileageService.getMileage(
        { groupBy: 'cycle', vehicle: registrationNumber, ...rangeToParams(range) },
        signal,
      ),
    [registrationNumber, range.from, range.to, range.manufacturer],
    { enabled: Boolean(registrationNumber) },
  );

  const cycles = rowsOf(data);

  return (
    <Sheet
      open={Boolean(registrationNumber)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full !max-w-[460px] gap-0 p-0">
        <SheetHeader className="shrink-0 items-start gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <SheetTitle className="flex items-center gap-2">
              <span className="mhub-plate">{registrationNumber || DASH}</span>
              {truck?.driverName ? <span className="mhub-sub">{truck.driverName}</span> : null}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Fill to fill: every full-tank cycle of this truck in these dates.
            </SheetDescription>
          </div>
          <SheetClose className="pshell-btn" aria-label="Close">
            <X size={16} />
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {loading && !data ? (
            <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">Loading this truck’s cycles…</p>
          ) : null}

          {error?.status === 404 ? <NotYetAvailable what="This truck’s cycles" /> : null}

          {error && error?.status !== 404 ? (
            <ErrorCard error={error} onRetry={refetch} />
          ) : null}

          {data?.held ? <HeldCard why={data.why} /> : null}

          {!loading && !error && !data?.held && cycles.length === 0 ? (
            <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
              No fill-to-fill cycles for this truck in these dates.
            </p>
          ) : null}

          {cycles.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {cycles.map((cycle, index) => (
                <li
                  key={`${cycle.from ?? 'x'}-${cycle.to ?? index}`}
                  className="flex flex-col gap-1.5 rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-[var(--rd-ink-2)]">
                      {formatIstDate(cycle.from)} – {formatIstDate(cycle.to)}
                    </span>
                    <MileageVerdictBadge item={cycle} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--rd-ink-2)]">
                    <span>{formatKm(cycle.km)}</span>
                    <span>{formatL(cycle.dieselL, { digits: 0 })}</span>
                    <span>{kmPerLText(cycle.kmPerL)}</span>
                    <span>DEF {formatL(cycle.defL, { digits: 0 })}</span>
                    <span>DEF {formatPct(cycle.defPctOfDiesel)} of diesel</span>
                  </div>
                  {isReconciled(cycle) ? (
                    <span className="inline-flex items-center gap-1">
                      <ToneBadge tone="info">{RECONCILED_COPY.label}</ToneBadge>
                      <InfoTip text={RECONCILED_COPY.tip} label="What your oil report means here" />
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
