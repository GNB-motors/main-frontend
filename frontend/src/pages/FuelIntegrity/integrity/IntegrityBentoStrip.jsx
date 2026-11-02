import { Fuel, ReceiptText, Droplets, ShieldCheck, ShieldAlert } from 'lucide-react';
import { onActivateKey } from '../../../utils/onActivateKey';

/** The four summary cards: dispensed fuel, fuel down while parked, bill variance and DEF; the DEF card toggles the DEF filter. */
const IntegrityBentoStrip = ({
  billCount,
  defCount,
  lossL,
  lossSigmaL = null,
  pricePerL,
  priceSource = 'CONFIG',
  setChip,
  totalFillsLitres,
  windowDays,
}) => (
  <div className="fi-bento-grid">
    {/* Card 1: Audited Dispensed Fuel */}
    <div className="fi-bento-card fi-bento-card--blue">
      <div className="fi-bento-head">
        <span className="fi-bento-label">Audited Volume</span>
        <div className="fi-bento-icon fi-bento-icon--blue">
          <Fuel size={16} />
        </div>
      </div>
      <div className="fi-bento-body">
        <div className="fi-bento-val-row">
          <span className="fi-bento-val">
            {totalFillsLitres.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
          </span>
          <span className="fi-bento-unit">L</span>
        </div>
      </div>
      <div className="fi-bento-foot">
        <span className="fi-bento-sub">
          {windowDays ? `${windowDays} days` : 'Over 7 days'} · ~
          {windowDays && totalFillsLitres > 0 ? (totalFillsLitres / windowDays).toFixed(0) : '0'}{' '}
          L/day
        </span>
        <span className="fi-bento-pill fi-bento-pill--ok">Audited</span>
      </div>
    </div>

    {/* Card 2: the fuel that went down while parked */}
    <div
      className={`fi-bento-card ${lossL > 0 ? 'fi-bento-card--rose' : 'fi-bento-card--emerald'}`}
    >
      <div className="fi-bento-head">
        {/* "Needs review", never an accusation: fuel can go down while parked for
            reasons other than a person taking it (audit FI-03/04). */}
        <span className="fi-bento-label">Fuel down while parked</span>
        <div
          className={`fi-bento-icon ${lossL > 0 ? 'fi-bento-icon--rose' : 'fi-bento-icon--emerald'}`}
        >
          {lossL > 0 ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
        </div>
      </div>
      <div className="fi-bento-body">
        <div className="fi-bento-val-row">
          <span
            className="fi-bento-val"
            style={{ color: lossL > 0 ? 'var(--critical, #dc2626)' : undefined }}
          >
            {lossL == null ? '—' : lossL.toFixed(1)}
          </span>
          {lossL == null ? null : <span className="fi-bento-unit">L</span>}
          {lossSigmaL != null && lossL > 0 ? (
            <span className="fi-bento-secondary-val">± {lossSigmaL.toFixed(1)} L</span>
          ) : null}
          {lossL == null ? null : (
            <span
              className="fi-bento-secondary-val"
              title={
                priceSource === 'BILLS'
                  ? `At ₹${pricePerL}/L, your last 30 days of diesel bills`
                  : `At ₹${pricePerL}/L (configured price — not enough recent bills)`
              }
            >
              · ≈₹{(lossL * pricePerL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
      </div>
      <div className="fi-bento-foot">
        <span className="fi-bento-sub">
          {lossL == null
            ? 'Not measured yet'
            : lossL === 0
              ? 'Fills, burn and tank level agree'
              : 'Fills, burn and tank level do not add up'}
        </span>
        <span
          className={`fi-bento-pill ${lossL === 0 ? 'fi-bento-pill--ok' : 'fi-bento-pill--crit'}`}
        >
          {lossL == null ? 'Not measured' : lossL === 0 ? 'Balanced' : 'Needs review'}
        </span>
      </div>
    </div>

    {/* Card 3: Billed vs Sensor Variance */}
    <div className="fi-bento-card fi-bento-card--purple">
      <div className="fi-bento-head">
        <span className="fi-bento-label">Bill vs Tank Mismatches</span>
        <div className="fi-bento-icon fi-bento-icon--purple">
          <ReceiptText size={16} />
        </div>
      </div>
      <div className="fi-bento-body">
        <div className="fi-bento-val-row">
          <span className="fi-bento-val">{billCount}</span>
          <span className="fi-bento-unit">Flags</span>
        </div>
      </div>
      <div className="fi-bento-foot">
        <span className="fi-bento-sub">Invoices match sensor tank jump</span>
        <span
          className={`fi-bento-pill ${billCount === 0 ? 'fi-bento-pill--ok' : 'fi-bento-pill--warn'}`}
        >
          {billCount === 0 ? 'Clean Slips' : `${billCount} Flagged`}
        </span>
      </div>
    </div>

    {/* Card 4: DEF / AdBlue Discrepancies */}
    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- the card is named by its own text (DEF / AdBlue Ratio, the count, the caption); the rule stops two levels above that text */}
    <div
      className="fi-bento-card fi-bento-card--amber cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => setChip((c) => (c === 'def' ? 'all' : 'def'))}
      onKeyDown={onActivateKey(() => setChip((c) => (c === 'def' ? 'all' : 'def')))}
      title="Click to toggle DEF anomaly filter"
    >
      <div className="fi-bento-head">
        <span className="fi-bento-label">DEF / AdBlue Ratio</span>
        <div className="fi-bento-icon fi-bento-icon--amber">
          <Droplets size={16} />
        </div>
      </div>
      <div className="fi-bento-body">
        <div className="fi-bento-val-row">
          <span className="fi-bento-val" style={{ color: '#d97706' }}>
            {defCount}
          </span>
          <span className="fi-bento-unit">Under Review</span>
        </div>
      </div>
      <div className="fi-bento-foot">
        <span className="fi-bento-sub">AdBlue telemetry anomaly</span>
        <span
          className={`fi-bento-pill ${defCount === 0 ? 'fi-bento-pill--ok' : 'fi-bento-pill--warn'}`}
        >
          {defCount === 0 ? 'Ratio Normal' : 'Tamper Alert'}
        </span>
      </div>
    </div>
  </div>
);

export default IntegrityBentoStrip;
