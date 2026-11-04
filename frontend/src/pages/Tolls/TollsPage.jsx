import { useCallback, useEffect, useMemo, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import EmptyState from '../../components/cluster/EmptyState';
import TollsService from '../../services/TollsService';
import PlazaMasterTab from './PlazaMasterTab';
import RankingTab from './RankingTab';
import { completenessLine, crossingMoney } from './tollsView';
import './TollsPage.css';

const TABS = [
  { key: 'plazas', label: 'Plaza master' },
  { key: 'crossings', label: 'Crossings' },
  { key: 'report', label: 'Vehicle report' },
  { key: 'ranking', label: 'Driver ranking' },
];

/** The toll ledger is read a month at a time — that is the window the API has. */
const CURRENT_MONTH = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Tolls — the plaza master, the crossings, and the cross-check between what we
 * estimate and what drivers actually paid.
 *
 * The page is ordered the way the decision is made: what we know about the plazas
 * first, then the money, then the two witnesses side by side. It never opens on
 * a single "total toll" number, because there isn't one yet and pretending
 * otherwise is the mistake this work was written to remove.
 */
export default function TollsPage() {
  const [tab, setTab] = useState('plazas');
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [plazas, setPlazas] = useState([]);
  const [crossings, setCrossings] = useState([]);
  const [report, setReport] = useState({ vehicles: [] });
  const [ranking, setRanking] = useState({ drivers: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, cross, rep, rank] = await Promise.all([
        TollsService.listPlazas({ limit: 200 }),
        TollsService.getCrossings({ month, limit: 200 }),
        TollsService.getReport({ month }),
        TollsService.getRanking({ month }),
      ]);
      setPlazas(p || []);
      setCrossings(cross?.rows || []);
      setReport(rep || { vehicles: [] });
      setRanking(rank || { drivers: [] });
    } catch (err) {
      setError(err.message || 'Could not load tolls');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const onReview = useCallback(
    async (code, state) => {
      setBusy(true);
      try {
        await TollsService.updatePlaza(code, { review: { state } });
        await load();
      } catch (err) {
        setError(err.message || 'Could not save the review');
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const counts = useMemo(
    () => ({
      report: report.vehicles || [],
      crossings: crossings.length,
      ranking: (ranking.drivers || []).length,
    }),
    [report, crossings, ranking],
  );

  return (
    <PageShell
      title="Tolls"
      count={plazas.length}
      subtitle="Plaza gates on the road network, crossings found on the road-matched path, and what drivers actually paid."
      filters={
        <div className="tolls-filters">
          <div className="tolls-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`tolls-tab${tab === t.key ? ' tolls-tab--on' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="tolls-window" htmlFor="tolls-month">
            Month
            <input
              id="tolls-month"
              aria-label="Toll month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
        </div>
      }
      footer={completenessLine(counts.report)}
    >
      {error ? <div className="tolls-banner tolls-banner--bad">{error}</div> : null}

      {loading ? (
        <div className="tolls-loading">Reading the toll ledger…</div>
      ) : tab === 'plazas' ? (
        <PlazaMasterTab plazas={plazas} onReview={onReview} busy={busy} />
      ) : tab === 'crossings' ? (
        <CrossingsTab rows={crossings} plazas={plazas} />
      ) : tab === 'report' ? (
        <ReportTab report={report} />
      ) : (
        <RankingTab ranking={ranking} />
      )}

      {plazas.length === 0 && !loading && tab === 'plazas' ? (
        <EmptyState
          title="No toll plazas on file yet"
          hint="This surface fills from the OpenStreetMap toll booths your fleet's map sweep has already collected, and then resolves each one into the road edges that make up its gate. Until a booth is swept, there is nothing here to price — and the trips that crossed one in the meantime are counted as unknown rather than as free."
        />
      ) : null}
    </PageShell>
  );
}

/**
 * Crossings — every gate a truck went through this month.
 *
 * The amount is the honest one: a crossing we could not price is "unknown",
 * never ₹0, and a crossing the return rule made free says "free".
 */
function CrossingsTab({ rows = [], plazas = [] }) {
  if (!rows.length) {
    return (
      <EmptyState
        title="No toll crossings in this month"
        hint="A crossing appears here once the detector has matched a truck's road-matched path against a plaza gate. A crossing with no rate on file is listed as unknown, never as zero — a pass we cannot price is still money the owner owes."
      />
    );
  }

  const plazaName = new Map(
    plazas.map((p) => [String(p._id ?? p.id), p.name || p.code || '—']),
  );

  return (
    <table className="tolls-table">
      <thead>
        <tr>
          <th>Vehicle</th>
          <th>Plaza</th>
          <th>Direction</th>
          <th>When</th>
          <th className="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row._id ?? `${row.vehicleId}-${row.crossedAt}`}>
            <td>{row.registrationNumber || '—'}</td>
            <td>{plazaName.get(String(row.plazaId)) || '—'}</td>
            <td>{row.direction || 'onward'}</td>
            <td>
              {row.crossedAt ? new Date(row.crossedAt).toLocaleString('en-IN') : '—'}
            </td>
            <td className="num">{crossingMoney(row).text}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReportTab({ report }) {
  const rows = report.vehicles || [];
  if (!rows.length) {
    return (
      <EmptyState
        title="No toll charges in this window"
        hint="A vehicle appears here once the detector has matched its road-matched path against a plaza gate. A charge with no amount is listed as unknown, never as zero — a pass we cannot price is still money the owner owes."
      />
    );
  }
  return (
    <table className="tolls-table">
      <thead>
        <tr>
          <th>Vehicle</th>
          <th>Toll class</th>
          <th className="num">Charges</th>
          <th className="num">Known</th>
          <th className="num">Unreconciled estimates</th>
          <th className="num">Unknown</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((v) => (
          <tr key={v.vehicleId || 'none'}>
            <td>{v.registrationNumber || '—'}</td>
            <td>{v.vehicleClass || 'unknown'}</td>
            <td className="num">{v.charges}</td>
            <td className="num">
              ₹{Number(v.knownInr || 0).toLocaleString('en-IN')}
              {!v.complete ? <span className="tolls-flag">lower bound</span> : null}
            </td>
            <td className="num">{v.unreconciledEstimates || 0}</td>
            <td className="num">{v.complete ? '—' : v.unknownPasses}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}