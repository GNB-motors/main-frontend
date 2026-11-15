import React, { useMemo } from 'react';
import DataTable from '../../../components/ui/DataTable';
import ErrorCard from '../../../components/redesign/ErrorCard';
import HeldCard from '../../../components/redesign/HeldCard';
import InfoTip from '../../../components/redesign/InfoTip';
import NotYetAvailable from '../../../components/redesign/NotYetAvailable';
import { useApi } from '../../../hooks/useApi';
import { DASH, formatKm, formatL, formatPct } from '../../../utils/redesign/format';
import { rangeToParams } from '../mileageDates';
import { MileageService } from '../MileageService';
import {
  DEF_LEARNED_COPY,
  DEF_PCT_COPY,
  defBandCaption,
  defPctTone,
  kmPerLReason,
  kmPerLTone,
  rowsOf,
  usualKmPerLReason,
} from '../mileageVerdicts';
import MileageVerdictBadge from './MileageVerdictBadge';
import TruckMileageView from './TruckMileageView';

/** The ink each reading wears: green when it is right, red when it is not. */
const INK = {
  good: 'text-[var(--rd-good-ink)]',
  act: 'text-[var(--rd-act-ink)]',
  watch: 'text-[var(--rd-watch-ink)]',
};

const kmPerLText = (value) =>
  value == null || Number.isNaN(Number(value)) ? DASH : `${Number(value).toFixed(2)} km/L`;

const matches = (row, needle) => {
  if (!needle) return true;
  const haystack = `${row?.registrationNumber ?? ''} ${row?.driverName ?? ''}`.toLowerCase();
  return haystack.includes(needle);
};

/**
 * "By truck" — km per litre and DEF for every truck in the hub's dates.
 *
 * The endpoint is the 3 Nov 2026 contract one. Until the backend answers it
 * the page falls back to the old model comparison, so the owner never gets a
 * dead screen for a feature that is still on its way.
 */
export default function ByTruckMileageView({ range, searchQuery = '', onOpenCycles = null }) {
  const { data, loading, error, refetch } = useApi(
    (signal) =>
      MileageService.getMileage(
        { groupBy: 'truck', ...rangeToParams(range) },
        signal,
      ),
    [range.from, range.to, range.manufacturer],
  );

  const rows = useMemo(() => {
    const needle = String(searchQuery || '').trim().toLowerCase();
    return rowsOf(data).filter((row) => matches(row, needle));
  }, [data, searchQuery]);

  // No driver on any truck: say it once, on the column, not on every row.
  const noDrivers = rows.length > 0 && rows.every((t) => !t.driverName);

  const columns = useMemo(
    () => [
      {
        key: 'truck',
        label: 'Truck',
        render: (t) => (
          <button
            type="button"
            className="mhub-plate"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCycles?.(t);
            }}
          >
            {t.registrationNumber || DASH}
          </button>
        ),
      },
      {
        key: 'driverName',
        label: (
          <span className="inline-flex items-center gap-1">
            Driver
            {noDrivers ? (
              <InfoTip text="Driver not assigned" label="Why the driver column is empty" />
            ) : null}
          </span>
        ),
        render: (t) => (noDrivers ? '' : <span>{t.driverName || DASH}</span>),
      },
      {
        key: 'km',
        label: 'km',
        align: 'right',
        render: (t) => <span className="num">{formatKm(t.km)}</span>,
      },
      {
        key: 'dieselL',
        label: 'Diesel',
        align: 'right',
        render: (t) => <span className="num">{formatL(t.dieselL, { digits: 0 })}</span>,
      },
      {
        key: 'kmPerL',
        label: 'km/L',
        align: 'right',
        render: (t) => {
          const tone = kmPerLTone(t.kmPerL, t.usualKmPerL);
          const reason = kmPerLReason(t);
          return (
            <span className="num">
              <span className={tone ? INK[tone] : ''}>{kmPerLText(t.kmPerL)}</span>
              {reason ? <span className="mhub-sub">{reason}</span> : null}
            </span>
          );
        },
      },
      {
        key: 'usualKmPerL',
        label: 'Usual km/L',
        align: 'right',
        render: (t) => {
          const reason = usualKmPerLReason(t);
          return (
            <span className="num">
              {kmPerLText(t.usualKmPerL)}
              {reason ? <span className="mhub-sub">{reason}</span> : null}
            </span>
          );
        },
      },
      {
        key: 'defL',
        label: (
          <span className="inline-flex items-center gap-1">
            DEF
            <InfoTip text={DEF_LEARNED_COPY} label="How DEF litres are worked out" />
          </span>
        ),
        align: 'right',
        render: (t) => <span className="num">{formatL(t.defL, { digits: 0 })}</span>,
      },
      {
        key: 'defPctOfDiesel',
        label: (
          <span className="inline-flex flex-col items-end leading-tight">
            <span>DEF % of diesel</span>
            <span className="mhub-sub">{defBandCaption()}</span>
          </span>
        ),
        align: 'right',
        render: (t) => {
          const tone = defPctTone(t.defPctOfDiesel, t.defBand);
          return (
            <span className="inline-flex items-center gap-1.5">
              <span className={`num ${tone ? INK[tone] : ''}`}>
                {formatPct(t.defPctOfDiesel)}
              </span>
              <InfoTip text={DEF_PCT_COPY} label="What DEF % of diesel means" />
            </span>
          );
        },
      },
      {
        key: 'verdict',
        label: 'Verdict',
        render: (t) => <MileageVerdictBadge item={t} />,
      },
    ],
    [onOpenCycles, noDrivers],
  );

  // The endpoint is not shipped yet: show the old mileage list rather than a
  // dead end.
  if (error?.status === 404) {
    return <TruckMileageView range={range} searchQuery={searchQuery} />;
  }

  if (data?.held) return <HeldCard why={data.why} />;

  if (error) {
    return <ErrorCard error={error} onRetry={refetch} />;
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(t, i) => t.registrationNumber ?? i}
      loading={loading && !data}
      showing={rows.length}
      total={rows.length}
      onRowClick={onOpenCycles ? (t) => onOpenCycles(t) : undefined}
      emptyTitle="No trucks in these dates"
      emptyHint="A truck shows up once it has driven in the range."
    />
  );
}
