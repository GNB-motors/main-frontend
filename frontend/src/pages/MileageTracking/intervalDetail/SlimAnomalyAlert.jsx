import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronDown } from 'lucide-react';

/* ── 1. Collapsible Telematics Anomaly Alert Dropdown Banner ── */
const SlimAnomalyAlert = ({ flags }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!flags || flags.length === 0) return null;

  const isBaseline = flags.every((f) => {
    const l = (typeof f === 'string' ? f : '').toLowerCase();
    return (
      l.includes('initial') ||
      l.includes('baseline') ||
      l.includes('first fill') ||
      l.includes('no prior') ||
      l.includes('odometer gap')
    );
  });

  const heading = isBaseline ? 'Initial Baseline Reading' : 'Telematics Flags & Anomalies';
  const badgeLabel = isBaseline
    ? 'Initial Baseline'
    : `${flags.length} ${flags.length === 1 ? 'Anomaly' : 'Anomalies'}`;
  const Icon = isBaseline ? Info : AlertTriangle;

  return (
    <div
      className={`mt-anomaly-dropdown ${isBaseline ? 'mt-anomaly-dropdown--baseline' : ''} ${
        isOpen ? 'is-open' : ''
      }`}
    >
      <div
        className="mt-anomaly-dropdown__bar"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        <div className="mt-anomaly-dropdown__left">
          <div className="mt-anomaly-dropdown__icon-wrap">
            <Icon size={15} />
          </div>
          <span className="mt-anomaly-dropdown__heading">{heading}</span>
          <span className="mt-anomaly-dropdown__badge">{badgeLabel}</span>
          <span className="mt-anomaly-dropdown__preview">
            {flags[0]}
            {flags.length > 1 && ` (+${flags.length - 1} more)`}
          </span>
        </div>
        <button
          type="button"
          className="mt-anomaly-dropdown__toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          aria-label={isOpen ? 'Collapse anomalies' : 'Expand anomalies'}
        >
          <span>{isOpen ? 'Hide Details' : 'View Details'}</span>
          <ChevronDown
            size={14}
            className={`mt-anomaly-dropdown__chevron ${isOpen ? 'is-flipped' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="mt-anomaly-dropdown__body">
          <div className="mt-anomaly-dropdown__grid">
            {flags.map((reason, idx) => (
              <div key={idx} className="mt-anomaly-dropdown__item">
                <span className="mt-anomaly-dropdown__bullet">
                  <AlertCircle size={14} />
                </span>
                <span className="mt-anomaly-dropdown__text">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlimAnomalyAlert;
