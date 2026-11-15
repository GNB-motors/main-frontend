import React, { useMemo } from 'react';
import DataTable from '../../../components/ui/DataTable';
import ErrorCard from '../../../components/redesign/ErrorCard';
import HeldCard from '../../../components/redesign/HeldCard';
import InfoTip from '../../../components/redesign/InfoTip';
import NotYetAvailable from '../../../components/redesign/NotYetAvailable';
import ToneBadge from '../../../components/redesign/ToneBadge';
import { useApi } from '../../../hooks/useApi';
import { DASH, formatIstDate, formatKm, formatL, formatPct } from '../../../utils/redesign/format';
import { rangeToParams } from '../mileageDates';
import { MileageService } from '../MileageService';
import {
  DEF_LEARNED_COPY,
  DEF_PCT_COPY,
  RECONCILED_COPY,
  defBandCaption,
  defPctTone,
  isReconciled,
  kmPerLTone,
  rowsOf,
} from '../mileageVerdicts';
import MileageVerdictBadge from './MileageVerdictBadge';

/** The ink each reading wears: green when it is right, red when it is not. */
const INK = {
  good: 'text-[var(--rd-good-ink)]',
  act: 'text-[var(--rd-act-ink)]',
  watch: 'text-[var(--rd-watch-ink)]',
};

const kmPerLText = (value) => (value == null ? DASH : `${value.toFixed(2)} km/L`);

const matches = (row, needle) => {
  if (!needle) return true;
  return `${row?.registrationNumber ?? ''}`.toLowerCase().includes(needle);
};

/**
 * "Fill to fill (reconciled)" — one row per fill-to-fill cycle.
 *
 * A cycle that was checked against the owner's oil report says so, so the
 * owner can tell a checked cycle from a cycle the truck alone produced.
 */
export default function FillToFillView({ range, searchQuery = '', onOpenCycles = null }) {
  const { data, loading, error, refetch } = useApi(
    (signal) =>
      MileageService.getMileage({ groupBy: 'cycle', ...rangeToParams(range) }, signal),
    [range.from, range.to, range.manufacturer],
  );

  const rows = useMemo(() => {
    const needle = String(searchQuery || '').trim().toLowerCase();
    return rowsOf(data).filter((row) => matches(row, needle));
  }, [data, searchQuery]);

  const columns = useMemo(
    () => [
      {
        key: 'truck',
        label: 'Truck',
        render: (t) => (
          <>
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
            <span className="mhub-sub">{t.driverName || ' '}</span>
          </>
        ),
      },
      {
        key: 'from',
        label: 'From',
        render: (t) => <span>{formatIstDate(t.from)}</span>,
      },
      {
        key: 'to',
        label: 'To',
        render: (t) => <span>{formatIstDate(t.to)}</span>,
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
          return <span className={`num ${tone ? INK[tone] : ''}`}>{kmPerLText(t.kmPerL)}</span>;
        },
      },
      {
        key: 'usualKmPerL',
        label: 'Usual km/L',
        align: 'right',
        render: (t) => <span className="num">{kmPerLText(t.usualKmPerL)}</span>,
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
            <span className={`num ${tone ? INK[tone] : ''}`}>
              {formatPct(t.defPctOfDiesel)}
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
      {
        key: 'source',
        label: 'Where it came from',
        render: (t) =>
          isReconciled(t) ? (
            <span className="inline-flex items-center gap-1">
              <ToneBadge tone="info">{RECONCILED_COPY.label}</ToneBadge>
              <InfoTip text={RECONCILED_COPY.tip} label="What your oil report means here" />
            </span>
          ) : (
            <span className="mhub-sub">From the truck</span>
          ),
      },
    ],
    [onOpenCycles],
  );

  if (error?.status === 404) {
    return <NotYetAvailable what="The fill-to-fill list" />;
  }

  if (data?.held) return <HeldCard why={data.why} />;

  if (error) {
    return <ErrorCard error={error} onRetry={refetch} />;
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(t, i) => `${t.registrationNumber ?? ''}-${t.from ?? i}-${t.to ?? i}`}
      loading={loading && !data}
      showing={rows.length}
      total={rows.length}
      onRowClick={onOpenCycles ? (t) => onOpenCycles(t) : undefined}
      emptyTitle="No fill-to-fill cycles in these dates"
      emptyHint="A cycle appears once a truck has filled up twice."
    />
  );
}
