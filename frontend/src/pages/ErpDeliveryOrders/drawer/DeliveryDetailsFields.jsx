import React from 'react';
import { DO_TYPES, unitFor } from '../deliveryOrder.constants';
import DoPlaceFields from '../DoPlaceFields';

const DeliveryDetailsFields = ({
  fromCall,
  form,
  setField,
  parties,
  suggested,
  others,
  sourceTask,
}) => (
  <div className="erp-form-grid">
    {!fromCall && (
      <div className="erp-field full">
        <label htmlFor="do-party">
          Account <span className="required">*</span>
        </label>
        <select
          id="do-party"
          value={form.partyId}
          onChange={(e) => setField('partyId', e.target.value)}
          required
        >
          <option value="">Select an account</option>
          {parties.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
      </div>
    )}

    <div className="erp-field full">
      <label htmlFor="do-route">
        Route <span className="required">*</span>
      </label>
      <select
        id="do-route"
        value={form.routeId}
        onChange={(e) => setField('routeId', e.target.value)}
        required
      >
        <option value="">Select a route</option>
        {suggested.length > 0 && (
          <optgroup label="Rated for this account and material">
            {suggested.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </optgroup>
        )}
        {others.length > 0 && (
          <optgroup label={suggested.length ? 'Other routes — no rate on file' : 'All routes'}>
            {others.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {suggested.length > 0 && (
        <span className="erp-field-hint">
          {suggested.length} route{suggested.length === 1 ? '' : 's'} already have a sale rate for
          this account and material. Others will need a manual rate and approval.
        </span>
      )}
      <span className="erp-field-hint">The route sets the price. The exact places are below.</span>
    </div>

    <DoPlaceFields form={form} setField={setField} />

    <div className="erp-field">
      <label htmlFor="do-material">
        Material <span className="required">*</span>
      </label>
      <input
        id="do-material"
        aria-label="Material"
        value={form.material}
        onChange={(e) => setField('material', e.target.value.toUpperCase())}
        placeholder="MTO"
        required
      />
      {fromCall && sourceTask.orderMaterial && (
        <span className="erp-field-hint">From the confirmed order.</span>
      )}
    </div>

    <div className="erp-field">
      <label htmlFor="do-date">
        DO date <span className="required">*</span>
      </label>
      <input
        id="do-date"
        aria-label="DO date"
        type="date"
        value={form.doDate}
        onChange={(e) => setField('doDate', e.target.value)}
        required
      />
    </div>

    <div className="erp-field">
      <label htmlFor="do-type">
        Measured in <span className="required">*</span>
      </label>
      <select id="do-type" value={form.doType} onChange={(e) => setField('doType', e.target.value)}>
        {DO_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>

    <div className="erp-field">
      <label htmlFor="do-qty">
        Quantity ({unitFor(form.doType)}) <span className="required">*</span>
      </label>
      <input
        id="do-qty"
        aria-label={`Quantity (${unitFor(form.doType)})`}
        type="number"
        min="0"
        step="0.01"
        value={form.qty}
        onChange={(e) => setField('qty', e.target.value)}
        placeholder="100"
        required
      />
      {/* Releasing less than was confirmed is legitimate — the rest can
          go on a second DO — but it should be a visible decision. */}
      {fromCall &&
        sourceTask.orderQty != null &&
        Number(form.qty) !== Number(sourceTask.orderQty) && (
          <span className="erp-field-hint">
            Confirmed quantity was {sourceTask.orderQty} {sourceTask.orderQtyUnit}.
            {Number(form.qty) < Number(sourceTask.orderQty) &&
              ` Raise another DO later for the remaining ${(
                Number(sourceTask.orderQty) - Number(form.qty)
              ).toLocaleString('en-IN')}.`}
          </span>
        )}
    </div>

    {form.doType === 'VEHICLE_COUNT_DO' && (
      <div className="erp-field">
        <label htmlFor="do-capacity">
          Capacity per vehicle (KL) <span className="required">*</span>
        </label>
        <input
          id="do-capacity"
          aria-label="Capacity per vehicle (KL)"
          type="number"
          min="0"
          step="0.01"
          value={form.vehicleCapacity}
          onChange={(e) => setField('vehicleCapacity', e.target.value)}
          placeholder="34"
          required
        />
      </div>
    )}

    <div className="erp-field">
      <label htmlFor="do-expiry">Expiry date</label>
      <input
        id="do-expiry"
        aria-label="Expiry date"
        type="date"
        value={form.expiryDate}
        min={form.doDate}
        onChange={(e) => setField('expiryDate', e.target.value)}
      />
      <span className="erp-field-hint">Blank = DO date + 3 days</span>
    </div>
  </div>
);

export default DeliveryDetailsFields;
