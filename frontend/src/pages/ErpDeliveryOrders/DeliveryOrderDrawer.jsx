import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowRight, CheckCircle2, Info, PhoneCall,
} from 'lucide-react';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import DeliveryOrderService from './DeliveryOrderService';
import RateMasterService from '../ErpMasters/RateMasterService';
import { DO_TYPES, money, shortDate, unitFor } from './deliveryOrder.constants';

const Row = ({ label, children }) => (
  <div className="erp-detail-row">
    <span className="erp-detail-label">{label}</span>
    <span className="erp-detail-value">{children}</span>
  </div>
);

const DeliveryOrderDrawer = ({
  isOpen, onClose, form, setForm, sourceTask = null, parties = [], routes = [], onCreated,
}) => {
  const [saving, setSaving] = useState(false);
  const [rateInfo, setRateInfo] = useState(null);
  const [creditInfo, setCreditInfo] = useState(null);
  const [ratedRouteIds, setRatedRouteIds] = useState(null);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');

  const fromCall = Boolean(sourceTask);
  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  useEffect(() => {
    if (!isOpen) return;
    setCreated(null);
    setError('');
    setRateInfo(null);
    setCreditInfo(null);
  }, [isOpen]);

  // Credit position follows the party.
  useEffect(() => {
    if (!isOpen || !form.partyId) {
      setCreditInfo(null);
      return undefined;
    }
    let cancelled = false;
    DeliveryOrderService.checkCredit(form.partyId)
      .then((res) => !cancelled && setCreditInfo(res.data))
      .catch(() => !cancelled && setCreditInfo(null));
    return () => { cancelled = true; };
  }, [isOpen, form.partyId]);

  /**
   * Routes this party already has a sale rate on, for this material. Dumping
   * every route in the company invites picking one with no rate, which then
   * forces a manual rate and an approval — an avoidable detour the rate master
   * already knows the answer to. `null` means "not narrowed", not "none".
   */
  const fetchRatedRoutes = useCallback(async () => {
    if (!form.partyId || !form.material.trim()) {
      setRatedRouteIds(null);
      return;
    }
    try {
      const res = await RateMasterService.getRates({
        rateType: 'SB',
        partyId: form.partyId,
        material: form.material.trim().toUpperCase(),
        status: 'ACTIVE',
        limit: 200,
      });
      const ids = (res.data || [])
        .map((r) => r.routeId?._id || r.routeId)
        .filter(Boolean)
        .map(String);
      setRatedRouteIds(ids.length ? [...new Set(ids)] : null);
    } catch {
      setRatedRouteIds(null);
    }
  }, [form.partyId, form.material]);

  useEffect(() => {
    if (isOpen) fetchRatedRoutes();
  }, [isOpen, fetchRatedRoutes]);

  // Live rate, so the user knows before submitting whether approval is coming.
  useEffect(() => {
    if (!isOpen || !form.partyId || !form.routeId || !form.material.trim()) {
      setRateInfo(null);
      return undefined;
    }
    let cancelled = false;
    RateMasterService.lookupRate({
      partyId: form.partyId,
      routeId: form.routeId,
      material: form.material.trim().toUpperCase(),
      onDate: form.doDate,
    })
      .then((res) => !cancelled && setRateInfo(res.data))
      .catch(() => !cancelled && setRateInfo(null));
    return () => { cancelled = true; };
  }, [isOpen, form.partyId, form.routeId, form.material, form.doDate]);

  const suggested = useMemo(
    () => (ratedRouteIds ? routes.filter((r) => ratedRouteIds.includes(String(r._id))) : []),
    [ratedRouteIds, routes],
  );
  const others = useMemo(
    () => (ratedRouteIds ? routes.filter((r) => !ratedRouteIds.includes(String(r._id))) : routes),
    [ratedRouteIds, routes],
  );

  const needsManualRate = rateInfo && rateInfo.found === false;
  const manualRateActive = form.useManualRate || needsManualRate;
  const orderValue =
    Number(form.qty) * Number(manualRateActive ? form.sbRate : rateInfo?.rate || 0);
  const willBreachCredit =
    creditInfo && orderValue > 0 && creditInfo.exposure + orderValue >= creditInfo.creditLimit;

  const valid = Boolean(
    form.partyId && form.routeId && form.material.trim() && Number(form.qty) > 0
      && (!manualRateActive || (Number(form.sbRate) > 0 && form.rateRemark.trim().length >= 3))
      && (form.doType !== 'VEHICLE_COUNT_DO' || Number(form.vehicleCapacity) > 0),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;

    setSaving(true);
    setError('');
    try {
      const payload = {
        partyId: form.partyId,
        routeId: form.routeId,
        material: form.material.trim().toUpperCase(),
        doDate: form.doDate,
        doType: form.doType,
        qty: Number(form.qty),
      };
      if (form.doType === 'VEHICLE_COUNT_DO') {
        payload.vehicleCapacity = Number(form.vehicleCapacity);
      }
      if (manualRateActive) {
        payload.sbRate = Number(form.sbRate);
        payload.sbRateUnit = form.sbRateUnit;
        payload.rateRemark = form.rateRemark.trim();
      }
      if (form.expiryDate) payload.expiryDate = form.expiryDate;
      // Writes CallTask.doId, which is what removes the row from the queue.
      if (form.sourceCallTaskId) payload.sourceCallTaskId = form.sourceCallTaskId;

      const res = await DeliveryOrderService.createOrder(payload);
      setCreated(res.data);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const party = parties.find((p) => p._id === form.partyId) || null;

  return (
    <ErpDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={created ? 'Delivery order created' : 'Create delivery order'}
      subtitle={
        created
          ? created.doNumber
          : fromCall
            ? `From a confirmed order · ${sourceTask.partyId?.name || ''}`
            : 'Raised by hand, without a confirmed order'
      }
      maxWidth="600px"
      footer={
        created ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {/* The next step is a different page, so name it. "Created" alone
                leaves the user to work out that a DO does nothing until vehicles
                are placed against it. */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onClose('placement')}
            >
              Go to placement
              <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              form="do-form"
              className="btn btn-primary"
              disabled={saving || !valid}
            >
              {saving ? 'Creating…' : 'Create delivery order'}
            </button>
          </>
        )
      }
    >
      {created ? (
        <>
          <div className={`erp-callout ${created.status === 'PENDING_APPROVAL' ? 'warning' : 'success'}`}>
            {created.status === 'PENDING_APPROVAL' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <div>
              <strong>
                {created.status === 'PENDING_APPROVAL'
                  ? `${created.doNumber} needs approval before it can be placed.`
                  : `${created.doNumber} is ready for placement.`}
              </strong>
              <div style={{ marginTop: 4 }}>
                {created.status === 'PENDING_APPROVAL'
                  ? 'It is in the approvals queue. Nothing can be placed against it until it clears.'
                  : 'Place vehicles against it to start drawing the quantity down.'}
              </div>
            </div>
          </div>
          <div className="erp-detail-block">
            <Row label="Account">{created.partyId?.name || party?.name || '—'}</Row>
            <Row label="Quantity">{created.qty} {created.qtyUnit}</Row>
            <Row label="Rate">
              {money(created.sbRate)}
              {created.rateSource === 'MANUAL' && (
                <span className="erp-cell-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
                  manual
                </span>
              )}
            </Row>
            <Row label="Expires">{shortDate(created.expiryDate)}</Row>
          </div>
        </>
      ) : (
        <form id="do-form" onSubmit={handleSubmit}>
          {error && (
            <div className="erp-callout danger">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {fromCall && (
            <>
              <h3 className="erp-detail-heading">
                <PhoneCall size={14} />
                Confirmed on the call
              </h3>
              <div className="erp-detail-block">
                <Row label="Account">
                  {sourceTask.partyId?.name || '—'}
                  {sourceTask.partyId?.code && (
                    <span className="erp-cell-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
                      {sourceTask.partyId.code}
                    </span>
                  )}
                </Row>
                <Row label="Material">
                  {sourceTask.orderMaterial || <span className="erp-cell-muted">not captured</span>}
                </Row>
                <Row label="Quantity">
                  {sourceTask.orderQty != null
                    ? `${sourceTask.orderQty} ${sourceTask.orderQtyUnit || ''}`
                    : <span className="erp-cell-muted">not captured</span>}
                </Row>
                <Row label="Confirmed by">
                  {sourceTask.kamId
                    ? `${sourceTask.kamId.firstName || ''} ${sourceTask.kamId.lastName || ''}`.trim()
                    : '—'}
                </Row>
                <Row label="Confirmed on">{shortDate(sourceTask.closedAt || sourceTask.scheduledDate)}</Row>
                {sourceTask.remarks && <Row label="Notes">{sourceTask.remarks}</Row>}
              </div>

              {(!sourceTask.orderMaterial || sourceTask.orderQty == null) && (
                <div className="erp-callout info">
                  <Info size={16} />
                  <span>
                    This order was confirmed before the call form captured material and quantity,
                    so both need filling in below.
                  </span>
                </div>
              )}
            </>
          )}

          <h3 className="erp-detail-heading">Delivery details</h3>

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
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </optgroup>
                )}
                {others.length > 0 && (
                  <optgroup label={suggested.length ? 'Other routes — no rate on file' : 'All routes'}>
                    {others.map((r) => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {suggested.length > 0 && (
                <span className="erp-field-hint">
                  {suggested.length} route{suggested.length === 1 ? '' : 's'} already have a sale
                  rate for this account and material. Others will need a manual rate and approval.
                </span>
              )}
            </div>

            <div className="erp-field">
              <label htmlFor="do-material">
                Material <span className="required">*</span>
              </label>
              <input
                id="do-material"
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
              <select
                id="do-type"
                value={form.doType}
                onChange={(e) => setField('doType', e.target.value)}
              >
                {DO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="erp-field">
              <label htmlFor="do-qty">
                Quantity ({unitFor(form.doType)}) <span className="required">*</span>
              </label>
              <input
                id="do-qty"
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
              {fromCall && sourceTask.orderQty != null
                && Number(form.qty) !== Number(sourceTask.orderQty) && (
                <span className="erp-field-hint">
                  Confirmed quantity was {sourceTask.orderQty} {sourceTask.orderQtyUnit}.
                  {Number(form.qty) < Number(sourceTask.orderQty)
                    && ` Raise another DO later for the remaining ${(
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
                type="date"
                value={form.expiryDate}
                min={form.doDate}
                onChange={(e) => setField('expiryDate', e.target.value)}
              />
              <span className="erp-field-hint">Blank = DO date + 3 days</span>
            </div>
          </div>

          {/* Rate resolution */}
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
                  No rate in the master for this combination. Enter one manually — it will need
                  approval before the order can be placed.
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

          {/* Credit last: it is a consequence of the numbers above, so it reads
              as one. A wall of rupees above the form is noise until there is a
              quantity and a rate to weigh it against. */}
          {creditInfo && (
            <div className="erp-credit">
              <div className="erp-credit-head">
                <span className={`erp-badge ${willBreachCredit ? 'danger' : 'active'}`}>
                  {willBreachCredit ? 'Over limit' : 'Within limit'}
                </span>
                <span className="erp-credit-figure">
                  {money(creditInfo.available)} available
                </span>
              </div>
              <div className="erp-credit-detail erp-cell-muted">
                Limit {money(creditInfo.creditLimit)} · outstanding {money(creditInfo.exposure)}
                {orderValue > 0 && ` · this order ${money(orderValue)}`}
              </div>
              {willBreachCredit && (
                <div className="erp-credit-detail" style={{ color: '#b91c1c' }}>
                  This order crosses the limit, so it will be created as awaiting approval and
                  cannot be placed until it clears.
                </div>
              )}
            </div>
          )}
        </form>
      )}
    </ErpDrawer>
  );
};

export default DeliveryOrderDrawer;
