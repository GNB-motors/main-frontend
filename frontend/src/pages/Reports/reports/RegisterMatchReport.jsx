import { useMemo, useState } from 'react';
import { ClipboardCheck, ListChecks, Percent, Satellite } from 'lucide-react';
import EmptyState from '../../../components/cluster/EmptyState';
import ReportDataNotice from '../../../components/ui/ReportDataNotice';
import useApi from '../../../hooks/useApi';
import AutoTripService from '../../../services/AutoTripService';
import { formatNum } from '../../../utils/formatters';
import { PlantChart } from '../../AutoTrips/RegisterMatchCard';
import { fmtDateRange } from '../../AutoTrips/autoTripFormat';
import ReportFrame, { ReportFooter, ReportSearch } from './ReportFrame';
import { matchesSearch, pageCount, pageSlice, rangeLabel, REPORT_PAGE_SIZE } from './reportFilters';
import useReportPage from './useReportPage';

// The algorithm the register-match card reports on.
const ALGO = 'autotrip-3';
const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`);

// Same frame as the DataTable a report would otherwise show.
const CARD_STYLE = {
  padding: '16px 20px',
  borderColor: 'var(--rpt-edge)',
  borderRadius: 11,
  boxShadow: 'var(--rpt-shadow)',
};

function registerKpis(totals) {
  const t = totals || {};
  return [
    {
      label: 'Register found',
      value: pct(t.recall),
      icon: ClipboardCheck,
      hint: `${formatNum(t.found)} of ${formatNum(t.cycles)} register trips found among the GPS trips`,
    },
    {
      label: 'Register trips',
      value: formatNum(t.cycles),
      icon: ListChecks,
      tone: 'violet',
    },
    {
      label: 'GPS could track',
      value: formatNum(t.detectable),
      icon: Satellite,
      tone: 'teal',
      hint: 'Register trips whose truck was sending GPS at the time',
    },
    {
      label: 'Matched of those',
      value: pct(t.recallDetectable),
      icon: Percent,
      tone: 'green',
      hint: `${formatNum(t.foundDetectable)} of ${formatNum(t.detectable)} trackable trips matched`,
    },
  ];
}

function errorText(error) {
  const status = error?.response?.status;
  if (status === 403) return 'You do not have access to the trip register match.';
  return (
    error?.response?.data?.message ||
    error?.message ||
    'The server did not answer. Check your connection and try again.'
  );
}

/** The org's own trip register against the trips rebuilt from GPS, checked every night. */
export default function RegisterMatchReport() {
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useApi(
    (signal) => AutoTripService.registerMatch({ signal }),
    [],
  );

  const latest = error ? null : data?.latest?.[ALGO] || null;
  const hasRegister = Boolean(latest?.totals?.cycles);
  const plants = useMemo(() => Object.entries(latest?.byFrom || {}), [latest]);
  const shown = useMemo(
    () => plants.filter(([label]) => matchesSearch(search, [label])),
    [plants, search],
  );
  const scaleMax = Math.max(...plants.map(([, b]) => b.cycles ?? 0), 1);

  const [page, setPage] = useReportPage(search.trim());
  const pagePlants = pageSlice(shown, page);
  const range = fmtDateRange(latest?.window?.from, latest?.window?.to);

  let body;
  if (error) {
    body = (
      <div className="dt">
        <div className="dt-error" role="alert">
          <p>Could not load the register match. {errorText(error)}</p>
          <button type="button" className="pshell-btn" onClick={refetch}>
            Try again
          </button>
        </div>
      </div>
    );
  } else if (!data && loading) {
    body = (
      <div className="dt">
        <div className="dt-empty">
          <EmptyState title="Loading the register match…" />
        </div>
      </div>
    );
  } else if (!hasRegister) {
    body = (
      <div className="dt">
        <div className="dt-empty">
          <EmptyState
            title="No trip register to compare yet"
            hint="This fills in once your trip register (the oil report) is imported; the match runs every night."
          />
        </div>
      </div>
    );
  } else if (!shown.length) {
    body = (
      <div className="dt">
        <div className="dt-empty">
          <EmptyState
            title="No plant matches the search"
            hint="Clear the search to see every plant."
          />
        </div>
      </div>
    );
  } else {
    body = (
      <div className="atx-scope atx-banner" style={CARD_STYLE}>
        <strong>Plant-wise</strong>
        <span style={{ marginLeft: 8, color: 'var(--rpt-muted)', fontSize: 13 }}>
          register trips by the plant they loaded at{range ? ` · ${range}` : ''}
        </span>
        <PlantChart plants={pagePlants} max={scaleMax} />
      </div>
    );
  }

  return (
    <ReportFrame
      layout="inline"
      title="Trip Register Match"
      subtitle="How many trips in your own register (the oil report) the GPS trips found, plant by plant — checked every night"
      filters={
        hasRegister ? (
          <ReportSearch value={search} onChange={setSearch} placeholder="Search plant" />
        ) : null
      }
      notice={
        hasRegister ? (
          <ReportDataNotice
            dataAsOf={latest.computedAt || latest.day}
            label="Last checked"
            staleHint="The nightly match has not run since — the figures below are from that night."
          />
        ) : null
      }
      kpis={hasRegister ? registerKpis(latest.totals) : null}
      footer={
        hasRegister ? (
          <ReportFooter
            summary={`${rangeLabel(page, REPORT_PAGE_SIZE, shown.length)} plants`}
            page={page}
            totalPages={pageCount(shown.length)}
            onPage={setPage}
          />
        ) : null
      }
    >
      {body}
    </ReportFrame>
  );
}
