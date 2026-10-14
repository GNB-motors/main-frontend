import Row from './Row';

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const HireTermsFields = ({ form, setField, pbRateRequired, vendors, order, verdict }) => (
  <div className="erp-form-grid">
    <div className="erp-field">
      <label htmlFor="pl-dname">
        Driver name <span className="required">*</span>
      </label>
      <input
        id="pl-dname"
        aria-label="Driver name"
        value={form.hireDriverName || ''}
        onChange={(e) => setField('hireDriverName', e.target.value)}
        autoComplete="off"
        required
      />
    </div>

    <div className="erp-field">
      <label htmlFor="pl-dphone">
        Driver phone <span className="required">*</span>
      </label>
      <input
        id="pl-dphone"
        aria-label="Driver phone"
        value={form.hireDriverPhone || ''}
        onChange={(e) => setField('hireDriverPhone', e.target.value)}
        autoComplete="off"
        required
      />
    </div>

    <div className="erp-field">
      <label htmlFor="pl-pb">
        Purchase rate (₹)
        {pbRateRequired && <span className="required"> *</span>}
      </label>
      <input
        id="pl-pb"
        aria-label="Purchase rate (₹)"
        type="number"
        min="0"
        step="0.01"
        value={form.pbRate || ''}
        onChange={(e) => setField('pbRate', e.target.value)}
        required={pbRateRequired}
      />
      <span className="erp-field-hint">
        {pbRateRequired
          ? 'No master rate for this vendor, route and material — enter one, with a reason.'
          : 'Blank uses the rate master. Entering one needs a remark.'}
      </span>
    </div>

    <div className="erp-field">
      <label htmlFor="pl-pbunit">Rate unit</label>
      <select
        id="pl-pbunit"
        value={form.pbRateUnit || 'PER_KL'}
        onChange={(e) => setField('pbRateUnit', e.target.value)}
      >
        <option value="PER_KL">Per KL</option>
        <option value="PER_MT">Per MT</option>
        <option value="PER_TRIP">Per Trip</option>
      </select>
    </div>

    {(form.pbRate || pbRateRequired) && (
      <div className="erp-field full">
        <label htmlFor="pl-pbremark">
          Reason for the manual rate <span className="required">*</span>
        </label>
        <textarea
          id="pl-pbremark"
          aria-label="Reason for the manual rate"
          value={form.pbRateRemark || ''}
          onChange={(e) => setField('pbRateRemark', e.target.value)}
          placeholder="Negotiated for this lot"
          required
        />
      </div>
    )}

    <div className="erp-field full">
      <div className="erp-detail-block" style={{ paddingBottom: 0 }}>
        <Row label="Vendor">{vendors.find((v) => v._id === form.vendorId)?.name || '—'}</Row>
        <Row label="Tanker">{form.hireVehicleNumber || '—'}</Row>
        <Row label="Quantity">
          {form.plannedQty} {order.qtyUnit}
        </Row>
        <Row label="Sale rate">{money(order.sbRate)}</Row>
      </div>
    </div>

    {verdict}
  </div>
);

export default HireTermsFields;
