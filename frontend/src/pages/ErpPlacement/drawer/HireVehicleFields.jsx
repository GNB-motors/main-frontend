import { AlertTriangle, Ban, CheckCircle2 } from 'lucide-react';

const HireVehicleFields = ({
  form,
  setField,
  vendors,
  order,
  remaining,
  knownMaterials,
  compat,
}) => (
  <div className="erp-form-grid">
    <div className="erp-field full">
      <label htmlFor="pl-vendor">
        Vendor <span className="required">*</span>
      </label>
      <select
        id="pl-vendor"
        value={form.vendorId || ''}
        onChange={(e) => setField('vendorId', e.target.value)}
        required
      >
        <option value="">Select a vendor</option>
        {vendors.map((v) => (
          <option key={v._id} value={v._id}>
            {v.name} {v.code ? `(${v.code})` : ''}
          </option>
        ))}
      </select>
    </div>

    <div className="erp-field">
      <label htmlFor="pl-tanker">
        Tanker number <span className="required">*</span>
      </label>
      <input
        id="pl-tanker"
        aria-label="Tanker number"
        value={form.hireVehicleNumber || ''}
        onChange={(e) => setField('hireVehicleNumber', e.target.value.toUpperCase())}
        placeholder="MH04GH4567"
        autoComplete="off"
        required
      />
    </div>

    <div className="erp-field">
      <label htmlFor="pl-qty-h">
        Quantity ({order.qtyUnit}) <span className="required">*</span>
      </label>
      <input
        id="pl-qty-h"
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
        {remaining} {order.qtyUnit} outstanding.
      </span>
    </div>

    <div className="erp-field full">
      <label htmlFor="pl-prev">
        Previous cargo <span className="required">*</span>
      </label>
      <input
        id="pl-prev"
        aria-label="Previous cargo"
        list="pl-materials"
        value={form.previousCargo || ''}
        onChange={(e) => setField('previousCargo', e.target.value.toUpperCase())}
        placeholder="DIESEL"
        autoComplete="off"
        required
      />
      <datalist id="pl-materials">
        {knownMaterials.map((m) => (
          <option key={m} value={m} aria-label={m} />
        ))}
      </datalist>
      {/* Not an arbitrary field: a hired tanker has no trip history in
                  this system, so this is the only input the material-compatibility
                  check has to work from. */}
      {compat ? (
        <span
          className={`erp-inline-verdict ${compat.ok ? (compat.warn ? 'is-warn' : 'is-ok') : 'is-no'}`}
        >
          {compat.ok ? (
            compat.warn ? (
              <AlertTriangle size={13} />
            ) : (
              <CheckCircle2 size={13} />
            )
          ) : (
            <Ban size={13} />
          )}
          {compat.text}
        </span>
      ) : (
        <span className="erp-field-hint">
          What this tanker last carried. The system has no history for a hired tanker, so this is
          what the compatibility check against {order.material} runs on.
        </span>
      )}
    </div>
  </div>
);

export default HireVehicleFields;
