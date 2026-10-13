import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import ErpMasterService from '../ErpMasters/ErpMasterService';
import PlacementService from './PlacementService';
import Row from './drawer/Row';
import PlannedStartField from './drawer/PlannedStartField';
import PlacementVerdict from './drawer/PlacementVerdict';
import OwnVehicleFields from './drawer/OwnVehicleFields';
import HireVehicleFields from './drawer/HireVehicleFields';
import HireTermsFields from './drawer/HireTermsFields';

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
            plannedStart: '',
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
            plannedStart: '',
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
        ...(form.plannedStart ? { plannedStart: new Date(form.plannedStart).toISOString() } : {}),
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
    ? Boolean(
        form.vendorId &&
        form.hireVehicleNumber?.trim() &&
        form.previousCargo?.trim() &&
        Number(form.plannedQty) > 0,
      )
    : true;

  const canSubmit = Boolean(
    check?.canPlace &&
    Number(form.plannedQty) > 0 &&
    (!isHire || (form.hireDriverName?.trim() && form.hireDriverPhone?.trim())) &&
    (!form.pbRate || form.pbRateRemark?.trim().length >= 3),
  );

  const turnaround = (check?.warnings || []).find((w) => w.code === 'TIGHT_TURNAROUND');

  /**
   * The turnaround cushion is measured from here back to when the tanker is
   * expected free, so scheduling the trip later is what makes a tight placement
   * acceptable. Left blank the server measures from now.
   */
  const plannedStartField = (
    <PlannedStartField form={form} setField={setField} turnaround={turnaround} />
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
          ...(form.plannedStart ? { plannedStart: new Date(form.plannedStart).toISOString() } : {}),
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
          ...(form.plannedStart ? { plannedStart: new Date(form.plannedStart).toISOString() } : {}),
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
    <PlacementVerdict
      checking={checking}
      hardBlocks={hardBlocks}
      fieldBlocks={fieldBlocks}
      check={check}
    />
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
        <Row label="Route">
          {order.fromLocation || '—'} → {order.toLocation || '—'}
        </Row>
        <Row label="Material">{order.material}</Row>
        <Row label="Still required">
          {remaining} {order.qtyUnit}
          <span className="erp-cell-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
            of {order.qty} {order.qtyUnit}
          </span>
        </Row>
        {!isHire && (
          <Row label="Tanker capacity">
            {target.tanker.capacity != null ? (
              `${target.tanker.capacity} ${target.tanker.capacityUnit || ''}`
            ) : (
              <span className="erp-cell-muted">not recorded</span>
            )}
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
          <OwnVehicleFields
            form={form}
            setField={setField}
            drivers={drivers}
            order={order}
            remaining={remaining}
            target={target}
            plannedStartField={plannedStartField}
          />
        ) : step === 1 ? (
          <HireVehicleFields
            form={form}
            setField={setField}
            vendors={vendors}
            order={order}
            remaining={remaining}
            knownMaterials={knownMaterials}
            compat={compat}
          />
        ) : (
          <HireTermsFields
            form={form}
            setField={setField}
            pbRateRequired={pbRateRequired}
            vendors={vendors}
            order={order}
            verdict={verdict}
          />
        )}
      </form>
    </ErpDrawer>
  );
};

export default PlacementDrawer;
