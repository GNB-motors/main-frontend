import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Ban, CheckCircle2, Info,
} from 'lucide-react';
import { toast } from 'react-toastify';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import ErpMasterService from '../ErpMasters/ErpMasterService';
import PlacementService from './PlacementService';

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const Row = ({ label, children }) => (
  <div className="erp-detail-row">
    <span className="erp-detail-label">{label}</span>
    <span className="erp-detail-value">{children}</span>
  </div>
);

/**
 * Assign one vehicle — own or hired — to the selected delivery order.
 *
 * The order is context, not an input: it is chosen on the board before this
 * opens, so the drawer states the requirement and asks only what it cannot
 * know. Hire is split in two because its fields answer two unrelated questions
 * (which tanker, and on what terms), and the server's verdict depends only on
 * the first — so an incompatible tanker is caught before anyone types a driver's
 * phone number.
 */
const PlacementDrawer = ({ target, order, vendors = [], drivers = [], onClose, onPlaced }) => {
  const [form, setForm] = useState({});
  const [step, setStep] = useState(1);
  const [check, setCheck] = useState(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [knownMaterials, setKnownMaterials] = useState([]);

  /**
   * Suggestions from the compatibility master, offered through a datalist rather
   * than a <select>: a hired tanker may well have carried something nobody has
   * configured yet, and a closed list would make that unenterable.
   */
  useEffect(() => {
    if (!target || target.mode !== 'HIRE') return;
    ErpMasterService.getCompatibility({ limit: 200 })
      .then((res) => {
        const names = (res.data || [])
          .flatMap((r) => [r.previousMaterial, r.nextMaterial])
          .filter(Boolean)
          .map((m) => String(m).toUpperCase());
        setKnownMaterials([...new Set(names)].sort());
      })
      .catch(() => setKnownMaterials([]));
  }, [target]);

  const isHire = target?.mode === 'HIRE';
  const remaining = order?.balanceQty ?? 0;

  useEffect(() => {
    if (!target) return;
    setStep(1);
    setCheck(null);
    setForm(
      target.mode === 'OWN'
        ? {
            vehicleId: target.tanker.vehicleId,
            driverId: '',
            // Whichever runs out first. Defaulting to the whole balance put 100
            // KL against a 20 KL tanker and greeted the operator with an
            // over-capacity advisory on a form they had not touched.
            plannedQty: target.tanker.capacity
              ? Math.min(remaining, target.tanker.capacity) || ''
              : remaining || '',
          }
        : {
            vendorId: '',
            hireVehicleNumber: '',
            previousCargo: '',
            // The board passes the coverage gap — what the fleet demonstrably
            // cannot carry — so the operator does not recompute it here.
            plannedQty: target.suggestedQty || remaining || '',
            hireDriverName: '',
            hireDriverPhone: '',
            pbRate: '',
            pbRateUnit: 'PER_KL',
            pbRateRemark: '',
          },
    );
  }, [target, remaining]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  /** Ask the server what would happen — the same code path the submit runs. */
  const runCheck = useCallback(async () => {
    if (!target || !order) return;
    // Hire needs a vendor before the server can say anything useful.
    if (isHire && !form.vendorId) {
      setCheck(null);
      return;
    }
    setChecking(true);
    try {
      const payload = {
        doId: order._id,
        vehicleType: target.mode,
        ...(isHire
          ? {
              vendorId: form.vendorId,
              ...(form.hireVehicleNumber ? { hireVehicleNumber: form.hireVehicleNumber } : {}),
              ...(form.previousCargo ? { previousCargo: form.previousCargo } : {}),
              ...(form.pbRate ? { pbRate: Number(form.pbRate) } : {}),
            }
          : {
              vehicleId: form.vehicleId,
              ...(form.driverId ? { driverId: form.driverId } : {}),
            }),
        ...(form.plannedQty ? { plannedQty: Number(form.plannedQty) } : {}),
      };
      const res = await PlacementService.checkRestrictions(payload);
      setCheck(res.data);
    } catch (err) {
      toast.error(err.message);
      setCheck(null);
    } finally {
      setChecking(false);
    }
  }, [target, order, isHire, form]);

  useEffect(() => {
    if (!target) return undefined;
    const t = setTimeout(runCheck, 300);
    return () => clearTimeout(t);
  }, [target, runCheck]);

  /**
   * The server says there is no master purchase rate for this vendor, route and
   * material. It still blocks placement, but it is the operator's next input
   * rather than a dead end — see PlacementService#checkRestrictions.
   */
  const pbRateRequired = Boolean(check?.blocks?.some((b) => b.field === 'pbRate'));

  const hardBlocks = (check?.blocks || []).filter((b) => !b.field);
  const fieldBlocks = (check?.blocks || []).filter((b) => b.field);

  /**
   * Material compatibility, pulled out of the verdict so it can sit under the
   * previous-cargo field that decides it. A safety rule shown thirty pixels from
   * its own input reads as intelligence; shown in a list of unrelated callouts
   * it reads as noise.
   */
  const compat = useMemo(() => {
    if (!form.previousCargo?.trim()) return null;
    const blocked = (check?.blocks || []).find((b) => b.code === 'MATERIAL_INCOMPATIBLE');
    if (blocked) return { ok: false, text: blocked.message };
    const cleaning = (check?.info || []).find((i) => i.code === 'CLEANING_REQUIRED');
    if (cleaning) return { ok: true, warn: true, text: cleaning.message };
    const notSet = (check?.info || []).find((i) => i.code === 'COMPATIBILITY_NOT_CONFIGURED');
    if (notSet) return { ok: true, warn: true, text: notSet.message };
    if (check) return { ok: true, text: `Compatible with ${order.material}` };
    return null;
  }, [check, form.previousCargo, order]);

  const step1Complete = isHire
    ? Boolean(form.vendorId && form.hireVehicleNumber?.trim() && form.previousCargo?.trim()
      && Number(form.plannedQty) > 0)
    : true;

  const canSubmit = Boolean(
    check?.canPlace
      && Number(form.plannedQty) > 0
      && (!isHire || (form.hireDriverName?.trim() && form.hireDriverPhone?.trim()))
      && (!form.pbRate || form.pbRateRemark?.trim().length >= 3),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      // Every warning shown must be acknowledged — the server enforces this too.
      const acknowledgedWarnings = (check.warnings || []).map((w) => w.code);
      let res;
      if (isHire) {
        const payload = {
          doId: order._id,
          vendorId: form.vendorId,
          hireVehicleNumber: form.hireVehicleNumber.trim().toUpperCase(),
          hireDriverName: form.hireDriverName.trim(),
          hireDriverPhone: form.hireDriverPhone.trim(),
          previousCargo: form.previousCargo.trim().toUpperCase(),
          plannedQty: Number(form.plannedQty),
          acknowledgedWarnings,
        };
        if (form.pbRate) {
          payload.pbRate = Number(form.pbRate);
          payload.pbRateUnit = form.pbRateUnit;
          payload.pbRateRemark = form.pbRateRemark.trim();
        }
        res = await PlacementService.placeHire(payload);
      } else {
        res = await PlacementService.placeOwn({
          doId: order._id,
          vehicleId: form.vehicleId,
          driverId: form.driverId,
          plannedQty: Number(form.plannedQty),
          acknowledgedWarnings,
        });
      }
      toast.success(
        res.data.status === 'PENDING_APPROVAL'
          ? `${res.data.placementNumber} created — waiting for approval`
          : `${res.data.placementNumber} assigned`,
      );
      onPlaced();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!target || !order) return null;

  const verdict = (
    <>
      {checking && (
        <div className="erp-callout info">
          <Info size={16} />
          <span>Checking…</span>
        </div>
      )}

      {hardBlocks.map((b) => (
        <div className="erp-callout danger" key={b.code}>
          <Ban size={16} />
          <span><strong>Blocked:</strong> {b.message}</span>
        </div>
      ))}

      {fieldBlocks.map((b) => (
        <div className="erp-callout info" key={b.code}>
          <Info size={16} />
          <span>{b.message}</span>
        </div>
      ))}

      {check?.warnings?.map((w) => (
        <div className="erp-callout warning" key={w.code}>
          <AlertTriangle size={16} />
          <span><strong>Needs approval:</strong> {w.message}</span>
        </div>
      ))}

      {check?.info?.map((i) => (
        <div className="erp-callout info" key={i.code}>
          <Info size={16} />
          <span>{i.message}</span>
        </div>
      ))}

      {check?.canPlace && !check.needsApproval && (
        <div className="erp-callout success">
          <CheckCircle2 size={16} />
          <span>Nothing blocking — this will be assigned straight away.</span>
        </div>
      )}
    </>
  );

  return (
    <ErpDrawer
      isOpen
      onClose={onClose}
      title={isHire ? 'Hire a vehicle' : `Assign ${target.tanker.registrationNumber}`}
      subtitle={`${order.doNumber} · ${order.partyId?.name || ''}`}
      maxWidth="580px"
      footer={
        <>
          {isHire && step === 2 ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          )}

          {isHire && step === 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!step1Complete || hardBlocks.length > 0}
              onClick={() => setStep(2)}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              form="placement-form"
              className="btn btn-primary"
              disabled={saving || checking || !canSubmit}
            >
              {saving ? 'Assigning…' : isHire ? 'Assign hired vehicle' : 'Assign vehicle'}
            </button>
          )}
        </>
      }
    >
      {/* The requirement, restated. Everything below is in service of it. */}
      <div className="erp-detail-block">
        <Row label="Route">{order.fromLocation || '—'} → {order.toLocation || '—'}</Row>
        <Row label="Material">{order.material}</Row>
        <Row label="Still required">
          {remaining} {order.qtyUnit}
          <span className="erp-cell-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
            of {order.qty} {order.qtyUnit}
          </span>
        </Row>
        {!isHire && (
          <Row label="Tanker capacity">
            {target.tanker.capacity != null
              ? `${target.tanker.capacity} ${target.tanker.capacityUnit || ''}`
              : <span className="erp-cell-muted">not recorded</span>}
          </Row>
        )}
      </div>

      <form id="placement-form" onSubmit={handleSubmit}>
        {isHire && (
          <div className="erp-steps">
            <span className={`erp-step ${step === 1 ? 'active' : 'done'}`}>1 · Vehicle</span>
            <span className={`erp-step ${step === 2 ? 'active' : ''}`}>2 · Driver &amp; rate</span>
          </div>
        )}

        {(!isHire || step === 1) && verdict}

        {!isHire ? (
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
          </div>
        ) : step === 1 ? (
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
                list="pl-materials"
                value={form.previousCargo || ''}
                onChange={(e) => setField('previousCargo', e.target.value.toUpperCase())}
                placeholder="DIESEL"
                autoComplete="off"
                required
              />
              <datalist id="pl-materials">
                {knownMaterials.map((m) => <option key={m} value={m} />)}
              </datalist>
              {/* Not an arbitrary field: a hired tanker has no trip history in
                  this system, so this is the only input the material-compatibility
                  check has to work from. */}
              {compat ? (
                <span className={`erp-inline-verdict ${compat.ok ? (compat.warn ? 'is-warn' : 'is-ok') : 'is-no'}`}>
                  {compat.ok
                    ? (compat.warn ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />)
                    : <Ban size={13} />}
                  {compat.text}
                </span>
              ) : (
                <span className="erp-field-hint">
                  What this tanker last carried. The system has no history for a hired tanker, so
                  this is what the compatibility check against {order.material} runs on.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="erp-form-grid">
            <div className="erp-field">
              <label htmlFor="pl-dname">
                Driver name <span className="required">*</span>
              </label>
              <input
                id="pl-dname"
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
                  value={form.pbRateRemark || ''}
                  onChange={(e) => setField('pbRateRemark', e.target.value)}
                  placeholder="Negotiated for this lot"
                  required
                />
              </div>
            )}

            <div className="erp-field full">
              <div className="erp-detail-block" style={{ paddingBottom: 0 }}>
                <Row label="Vendor">
                  {vendors.find((v) => v._id === form.vendorId)?.name || '—'}
                </Row>
                <Row label="Tanker">{form.hireVehicleNumber || '—'}</Row>
                <Row label="Quantity">{form.plannedQty} {order.qtyUnit}</Row>
                <Row label="Sale rate">{money(order.sbRate)}</Row>
              </div>
            </div>

            {verdict}
          </div>
        )}
      </form>
    </ErpDrawer>
  );
};

export default PlacementDrawer;
