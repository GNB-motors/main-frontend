import { useCallback, useEffect, useMemo, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import EmptyState from '../../components/cluster/EmptyState';
import TollsService from '../../services/TollsService';
import PlazaMasterTab from './PlazaMasterTab';
import ReconciliationTab from './ReconciliationTab';
import RankingTab from './RankingTab';
import { completenessLine } from './tollsView';
import './TollsPage.css';

const TABS = [
  { key: 'plazas', label: 'Plaza master' },
  { key: 'reconciliation', label: 'Estimate vs bill' },
  { key: 'report', label: 'Vehicle report' },
  { key: 'ranking', label: 'Driver ranking' },
];

const DEFAULT_WINDOW = () => {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 86400000);
  return { from: from.toISOString(), to: to.toISOString() };
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
  const [window, setWindow] = useState(DEFAULT_WINDOW);
  const [plazas, setPlazas] = useState([]);
  const [reconciliation, setReconciliation] = useState([]);
  const [returnGaps, setReturnGaps] = useState([]);
  const [report, setReport] = useState({ vehicles: [] });
  const [ranking, setRanking] = useState({ drivers: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, rec, gaps, rep, rank] = await Promise.all([
        TollsService.listPlazas({ limit: 200 }),
        TollsService.getReconciliation(window),
        TollsService.getReturnGaps(window),
        TollsService.getReport(window),
        TollsService.getRanking(window),
      ]);
      setPlazas(p || []);
      setReconciliation(rec || []);
      setReturnGaps(gaps || []);
      setReport(rep || { vehicles: [] });
      setRanking(rank || { drivers: [] });
    } catch (err) {
      setError(err.message || 'Could not load tolls');
    } finally {
      setLoading(false);
    }
  }, [window]);

  useEffect(() => {
    load();
  }, [load]);

  const onSweep = useCallback(async () => {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const out = await TollsService.sweep();
      setNotice(
        `Swept ${out?.osm?.scanned ?? 0} OSM booths · ${out?.gate?.resolved ?? 0} gates resolved · ` +
          `${out?.detected?.crossings ?? 0} crossings found (${out?.detected?.priced ?? 0} priced, ` +
          `${out?.detected?.unpriced ?? 0} with no rate on file, ${out?.detected?.unmatched ?? 0} stretches of road unmatched).`,
      );
      await load();
    } catch (err) {
      setError(err.message || 'Sweep failed');
    } finally {
      setBusy(false);
    }
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
      reconciliation: reconciliation.length,
      ranking: (ranking.drivers || []).length,
    }),
    [report, reconciliation, ranking],
  );

  return (
    <PageShell
      title="Tolls"
      count={plazas.length}
      subtitle="Plaza gates on the road network, crossings found on the road-matched path, and what drivers actually paid."
      actions={
        <button className="pshell-btn pshell-btn--primary" onClick={onSweep} disabled={busy}>
          {busy ? 'Sweeping…' : 'Re-sweep plazas & detect'}
        </button>
      }
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
          <label className="tolls-window" htmlFor="tolls-from">
            From
            <input
              id="tolls-from"
              aria-label="Toll window start"
              type="date"
              value={window.from.slice(0, 10)}
              onChange={(e) => setWindow((w) => ({ ...w, from: e.target.value }))}
            />
          </label>
          <label className="tolls-window" htmlFor="tolls-to">
            To
            <input
              id="tolls-to"
              aria-label="Toll window end"
              type="date"
              value={window.to.slice(0, 10)}
              onChange={(e) => setWindow((w) => ({ ...w, to: e.target.value }))}
            />
          </label>
        </div>
      }
      footer={completenessLine(counts.report)}
    >
      {error ? <div className="tolls-banner tolls-banner--bad">{error}</div> : null}
      {notice ? <div className="tolls-banner">{notice}</div> : null}

      {loading ? (
        <div className="tolls-loading">Reading the toll ledger…</div>
      ) : tab === 'plazas' ? (
        <PlazaMasterTab plazas={plazas} onReview={onReview} busy={busy} />
      ) : tab === 'reconciliation' ? (
        <ReconciliationTab rows={reconciliation} gaps={returnGaps} />
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