import React, { useState } from 'react';
import { Fuel, Search, AlertCircle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { LemuService } from '../LemuService';
import { relativeTime } from './utils';
import FreshnessBadge from '../../../../components/cluster/FreshnessBadge';

const STATUS_ICONS = {
  ok: <CheckCircle2 size={16} />,
  stale: <AlertCircle size={16} />,
  missing: <XCircle size={16} />,
  default: <HelpCircle size={16} />,
};

const STATUS_CLASSES = {
  ok: 'lemu-lineage-node--ok',
  stale: 'lemu-lineage-node--stale',
  missing: 'lemu-lineage-node--missing',
};

const SOURCE_LABELS = {
  bill: 'Bill',
  tank: 'Tank sensor',
  ecu: 'ECU burn',
};

const FuelIntegrityLineagePanel = () => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const fetchLineage = async () => {
    const reg = registrationNumber.trim();
    if (!reg) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await LemuService.getFuelIntegrityLineage({ registrationNumber: reg });
      setResult(data.data || null);
    } catch (e) {
      setError(e.detail || e.message || 'Failed to load lineage.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchLineage();
  };

  const verdict = result?.verdict || {};
  const inputs = result?.inputs || [];
  const vehicle = result?.vehicle || {};
  const window = result?.window || {};

  const inputMap = {};
  inputs.forEach((input) => { inputMap[input.name] = input; });

  const pathOrder = ['bill', 'tank', 'ecu'];
  const pathNodes = pathOrder.map((name) => inputMap[name] || { name, source: SOURCE_LABELS[name] || name, status: 'missing' });

  return (
    <div className="lemu-lineage">
      <div className="lemu-section__head">
        <h2 className="lemu-section__title">
          <Fuel size={18} />
          Fuel-Integrity Lineage
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="lemu-lineage__search">
        <div className="lemu-search">
          <span className="lemu-search__icon"><Search size={14} /></span>
          <input
            type="text"
            className="lemu-input"
            placeholder="Enter registration number…"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            aria-label="Registration number"
          />
        </div>
        <button type="submit" className="lemu-btn lemu-btn--secondary" disabled={loading || !registrationNumber.trim()}>
          {loading ? 'Loading…' : 'Trace'}
        </button>
      </form>

      {error && (
        <div className="lemu-alert lemu-alert--error" role="alert">
          {error}
        </div>
      )}

      {!result && !error && !loading && (
        <div className="lemu-state">
          <div className="lemu-state__icon"><Fuel size={24} /></div>
          <div className="lemu-state__title">Enter a registration number to trace fuel integrity.</div>
        </div>
      )}

      {result && !vehicle?._id && (
        <div className="lemu-alert lemu-alert--warn" role="status">
          No vehicle or window found for <strong>{registrationNumber}</strong>.
        </div>
      )}

      {result && vehicle?._id && (
        <div className="lemu-lineage__body">
          <div className="lemu-lineage__meta">
            <div>
              <span className="lemu-lineage__label">Vehicle</span>
              <strong>{vehicle.registrationNumber || registrationNumber}</strong>
            </div>
            {window.from && window.to && (
              <div>
                <span className="lemu-lineage__label">Window</span>
                <span>{new Date(window.from).toLocaleString()} → {new Date(window.to).toLocaleString()}</span>
              </div>
            )}
            {verdict.computedAt && (
              <div>
                <span className="lemu-lineage__label">Computed</span>
                <span>{relativeTime(verdict.computedAt)}</span>
              </div>
            )}
          </div>

          <div className={`lemu-lineage-verdict lemu-lineage-verdict--${verdict.status || 'unknown'}`}>
            <div className="lemu-lineage-verdict__title">Verdict: {verdict.status || 'unknown'}</div>
            <div className="lemu-lineage-verdict__body">
              {verdict.unaccountedLossL !== undefined && (
                <div className="lemu-lineage-metric">
                  <span>Unaccounted loss</span>
                  <strong>{verdict.unaccountedLossL.toFixed ? verdict.unaccountedLossL.toFixed(1) : verdict.unaccountedLossL} L</strong>
                </div>
              )}
              {verdict.siphonSuspected !== undefined && (
                <div className="lemu-lineage-metric">
                  <span>Siphon suspected</span>
                  <strong>{verdict.siphonSuspected ? 'Yes' : 'No'}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="lemu-lineage-path" aria-label="Fuel lineage path">
            {pathNodes.map((input, index) => {
              const status = input.status || 'missing';
              const icon = STATUS_ICONS[status] || STATUS_ICONS.default;
              const lastAt = input.lastAt;
              return (
                <React.Fragment key={input.name}>
                  <div className={`lemu-lineage-node ${STATUS_CLASSES[status] || ''}`}>
                    <div className="lemu-lineage-node__icon">{icon}</div>
                    <div className="lemu-lineage-node__body">
                      <div className="lemu-lineage-node__title">{input.source || SOURCE_LABELS[input.name] || input.name}</div>
                      <div className="lemu-lineage-node__meta">
                        {input.valueL !== undefined && input.valueL !== null ? `${input.valueL.toFixed ? input.valueL.toFixed(1) : input.valueL} L` : '—'}
                      </div>
                      <div className="lemu-lineage-node__freshness">
                        <FreshnessBadge at={lastAt} always />
                      </div>
                      {input.note && <div className="lemu-lineage-node__note">{input.note}</div>}
                    </div>
                  </div>
                  {index < pathNodes.length - 1 && <div className="lemu-lineage-connector" aria-hidden="true" />}
                </React.Fragment>
              );
            })}
            <div className="lemu-lineage-connector" aria-hidden="true" />
            <div className={`lemu-lineage-verdict-dot lemu-lineage-verdict-dot--${verdict.status || 'unknown'}`}>
              <div className="lemu-lineage-verdict-dot__title">Verdict</div>
              <div className="lemu-lineage-verdict-dot__status">{verdict.status || '—'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelIntegrityLineagePanel;
