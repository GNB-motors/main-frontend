const OwnVehicleFields = ({
  form,
  setField,
  drivers,
  order,
  remaining,
  target,
  plannedStartField,
}) => (
  <div className="erp-form-grid">
    <div className="erp-field full">
      <label htmlFor="pl-driver">
        Driver <span className="required">*</span>
      </label>
      <select
        id="pl-driver"
        value={form.driverId || ''}
        onChange={(e) => setField('driverId', e.target.value)}
        required
      >
        <option value="">Select a driver</option>
        {drivers.map((d) => (
          <option key={d._id} value={d._id}>
            {d.firstName} {d.lastName}
          </option>
        ))}
      </select>
      <span className="erp-field-hint">
        {drivers.length === 0
          ? 'No spare drivers at this location — every one is on a live placement.'
          : `${drivers.length} driver${drivers.length === 1 ? '' : 's'} free at this location.`}
      </span>
    </div>

    <div className="erp-field">
      <label htmlFor="pl-qty">
        Quantity ({order.qtyUnit}) <span className="required">*</span>
      </label>
      <input
        id="pl-qty"
        aria-label={`Quantity (${order.qtyUnit})`}
        type="number"
        min="0"
        step="0.01"
        max={remaining || undefined}
        value={form.plannedQty || ''}
        onChange={(e) => setField('plannedQty', e.target.value)}
        required
      />
      <span className="erp-field-hint">
        {target.tanker.capacity != null && Number(form.plannedQty) > target.tanker.capacity
          ? `Over this tanker's ${target.tanker.capacity} ${target.tanker.capacityUnit || ''} capacity.`
          : `Up to ${remaining} ${order.qtyUnit} outstanding. Lower it to split across tankers.`}
      </span>
    </div>
    {plannedStartField}
  </div>
);

export default OwnVehicleFields;
