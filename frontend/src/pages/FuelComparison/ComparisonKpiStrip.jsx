import { Fuel, Radio, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { fmtLitres } from './formatIST.js';

/**
 * Billed vs telematics totals and the flagged / clean / review cards that toggle
 * the status tab.
 *
 * The litres totals cover the intervals loaded on screen; the three count cards
 * come from the audit-wide sync status. A value nobody measured is shown as "—"
 * with the reason beside it — never as 0.
 */
const ComparisonKpiStrip = ({ kpiMetrics, activeTab, setActiveTab, loadError = null }) => {
  const loaded = kpiMetrics.loadedCount;
  const litresNote =
    loadError != null
      ? 'Comparisons could not be loaded'
      : loaded
        ? `${loaded} loaded interval${loaded === 1 ? '' : 's'}`
        : 'No intervals loaded';
  const litresValue = (value) => (value == null ? '—' : fmtLitres(value));
  const countValue = (value) => (value == null ? '—' : value);
  const countNote = (value) => (value == null ? 'Audit totals unavailable' : 'whole audit');

  return (
    <div className="fc-kpi-grid">
      {/* Total Billed */}
      <div className="fc-kpi-card">
        <div className="fc-kpi-card__head">
          <span className="fc-kpi-card__title">Total Billed</span>
          <div className="fc-kpi-card__icon fc-kpi-card__icon--blue">
            <Fuel size={16} />
          </div>
        </div>
        <div className="fc-kpi-card__val fc-mono">{litresValue(kpiMetrics.totalBilled)}</div>
        <div className="fc-kpi-card__note">{litresNote}</div>
      </div>

      {/* CAN-bus Telematics */}
      <div className="fc-kpi-card">
        <div className="fc-kpi-card__head">
          <span className="fc-kpi-card__title">CAN-bus Telematics</span>
          <div className="fc-kpi-card__icon fc-kpi-card__icon--purple">
            <Radio size={16} />
          </div>
        </div>
        <div className="fc-kpi-card__val fc-mono">{litresValue(kpiMetrics.totalTelematics)}</div>
        <div className="fc-kpi-card__note">{litresNote}</div>
      </div>

      {/* Flagged Divergence (Filterable) */}
      <button
        type="button"
        className={`fc-kpi-card fc-kpi-card--interactive ${
          kpiMetrics.flaggedCount > 0 ? 'fc-kpi-card--alert' : ''
        } ${activeTab === 'flagged' ? 'is-active' : ''}`}
        onClick={() => setActiveTab(activeTab === 'flagged' ? 'all' : 'flagged')}
        title="Click to toggle flagged discrepancies"
      >
        <div className="fc-kpi-card__head">
          <span className="fc-kpi-card__title">Flagged Divergence</span>
          <div className="fc-kpi-card__icon fc-kpi-card__icon--red">
            <AlertTriangle size={16} />
          </div>
        </div>
        <div className="fc-kpi-card__val fc-mono text-red-600 dark:text-red-400">
          {countValue(kpiMetrics.flaggedCount)}
        </div>
        <div className="fc-kpi-card__note">{countNote(kpiMetrics.flaggedCount)}</div>
      </button>

      {/* Verified Clean (Filterable) */}
      <button
        type="button"
        className={`fc-kpi-card fc-kpi-card--interactive ${activeTab === 'clean' ? 'is-active' : ''}`}
        onClick={() => setActiveTab(activeTab === 'clean' ? 'all' : 'clean')}
        title="Click to toggle verified clean records"
      >
        <div className="fc-kpi-card__head">
          <span className="fc-kpi-card__title">Verified Clean</span>
          <div className="fc-kpi-card__icon fc-kpi-card__icon--green">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="fc-kpi-card__val fc-mono text-emerald-600 dark:text-emerald-400">
          {countValue(kpiMetrics.cleanCount)}
        </div>
        <div className="fc-kpi-card__note">{countNote(kpiMetrics.cleanCount)}</div>
      </button>

      {/* Needs Review (Filterable) */}
      <button
        type="button"
        className={`fc-kpi-card fc-kpi-card--interactive ${
          kpiMetrics.pendingCount > 0 ? 'fc-kpi-card--warn' : ''
        } ${activeTab === 'review' ? 'is-active' : ''}`}
        onClick={() => setActiveTab(activeTab === 'review' ? 'all' : 'review')}
        title="Click to toggle pending review records"
      >
        <div className="fc-kpi-card__head">
          <span className="fc-kpi-card__title">Needs Review</span>
          <div className="fc-kpi-card__icon fc-kpi-card__icon--amber">
            <Clock size={16} />
          </div>
        </div>
        <div className="fc-kpi-card__val fc-mono text-amber-600 dark:text-amber-400">
          {countValue(kpiMetrics.pendingCount)}
        </div>
        <div className="fc-kpi-card__note">{countNote(kpiMetrics.pendingCount)}</div>
      </button>
    </div>
  );
};

export default ComparisonKpiStrip;
