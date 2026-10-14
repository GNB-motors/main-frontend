import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import DeliveryOrderService from './DeliveryOrderService';
import RateMasterService from '../ErpMasters/RateMasterService';
import { placesProblem } from './doPlaces';
import CreatedSummary from './drawer/CreatedSummary';
import ConfirmedCallSummary from './drawer/ConfirmedCallSummary';
import DeliveryDetailsFields from './drawer/DeliveryDetailsFields';
import RateResolution from './drawer/RateResolution';
import CreditPosition from './drawer/CreditPosition';

const DeliveryOrderDrawer = ({
  isOpen,
  onClose,
  form,
  setForm,
  sourceTask = null,
  parties = [],
  routes = [],
  onCreated,
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
    return () => {
      cancelled = true;
    };
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
    return () => {
      cancelled = true;
    };
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
    form.partyId &&
    form.routeId &&
    !placesProblem(form) &&
    form.material.trim() &&
    Number(form.qty) > 0 &&
    (!manualRateActive || (Number(form.sbRate) > 0 && form.rateRemark.trim().length >= 3)) &&
    (form.doType !== 'VEHICLE_COUNT_DO' || Number(form.vehicleCapacity) > 0),
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
        pickupSiteId: form.pickupSiteId,
        dropSiteId: form.dropSiteId,
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
            <button type="button" className="btn btn-primary" onClick={() => onClose('placement')}>
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
        <CreatedSummary created={created} party={party} />
      ) : (
        <form id="do-form" onSubmit={handleSubmit}>
          {error && (
            <div className="erp-callout danger">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {fromCall && <ConfirmedCallSummary sourceTask={sourceTask} />}

          <h3 className="erp-detail-heading">Delivery details</h3>

          <DeliveryDetailsFields
            fromCall={fromCall}
            form={form}
            setField={setField}
            parties={parties}
            suggested={suggested}
            others={others}
            sourceTask={sourceTask}
          />

          {/* Rate resolution */}
          <RateResolution
            rateInfo={rateInfo}
            form={form}
            setField={setField}
            needsManualRate={needsManualRate}
            manualRateActive={manualRateActive}
          />

          {/* Credit last: it is a consequence of the numbers above, so it reads
              as one. A wall of rupees above the form is noise until there is a
              quantity and a rate to weigh it against. */}
          {creditInfo && (
            <CreditPosition
              creditInfo={creditInfo}
              willBreachCredit={willBreachCredit}
              orderValue={orderValue}
            />
          )}
        </form>
      )}
    </ErpDrawer>
  );
};

export default DeliveryOrderDrawer;
