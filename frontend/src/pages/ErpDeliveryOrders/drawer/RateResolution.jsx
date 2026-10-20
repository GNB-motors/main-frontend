import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { money } from '../deliveryOrder.constants';

const RateResolution = ({ rateInfo, form, setField, needsManualRate, manualRateActive }) => (
  <div style={{ marginTop: 18 }}>
    {rateInfo?.found && !form.useManualRate && (
      <div className="erp-callout success">
        <CheckCircle2 size={16} />
        <span>
          Rate master: <strong>{money(rateInfo.rate)}</strong>{' '}
          {rateInfo.unit?.replace('PER_', 'per ').toLowerCase()}
          {' — '}
          <button
            type="button"
            className="erp-inline-link"
            onClick={() => setField('useManualRate', true)}
          >
            override manually
          </button>
        </span>
      </div>
    )}

    {needsManualRate && (
      <div className="erp-callout info">
        <Info size={16} />
        <span>
          No rate in the master for this combination. Enter one manually — it will need approval
          before the order can be placed.
        </span>
      </div>
    )}

    {manualRateActive && (
      <div className="erp-form-grid">
        <div className="erp-field">
          <label htmlFor="do-rate">
            Manual rate (₹) <span className="required">*</span>
          </label>
          <input
            id="do-rate"
            aria-label="Manual rate (₹)"
            type="number"
            min="0"
            step="0.01"
            value={form.sbRate}
            onChange={(e) => setField('sbRate', e.target.value)}
            required
          />
        </div>
        <div className="erp-field">
          <label htmlFor="do-rate-unit">
            Unit <span className="required">*</span>
          </label>
          <select
            id="do-rate-unit"
            value={form.sbRateUnit}
            onChange={(e) => setField('sbRateUnit', e.target.value)}
          >
            <option value="PER_KL">Per KL</option>
            <option value="PER_MT">Per MT</option>
            <option value="PER_TRIP">Per Trip</option>
          </select>
        </div>
        <div className="erp-field full">
          <label htmlFor="do-rate-remark">
            Reason for the manual rate <span className="required">*</span>
          </label>
          <textarea
            id="do-rate-remark"
            aria-label="Reason for the manual rate"
            value={form.rateRemark}
            onChange={(e) => setField('rateRemark', e.target.value)}
            placeholder="Negotiated for this lot"
            required
          />
        </div>
        {!needsManualRate && (
          <div className="erp-field full">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setField('useManualRate', false)}
            >
              Use the master rate instead
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);

export default RateResolution;
