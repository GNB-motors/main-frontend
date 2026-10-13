/**
 * Inbound e-Way Bill review queue (ISOCL ERP Stage 5)
 *
 * The consignment note is born here. A waybill raised by the consignor on the
 * GST portal is pulled in, scored against open trips by the matcher, and shown
 * as a SUGGESTED match. Confirming it creates the CN pre-filled from the
 * government document and stamps its provenance onto the consignment - which is
 * why the CN cannot simply be typed in.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileCheck2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import InboundEwbService from './InboundEwbService';
import TripDashboardService from '../ErpTrips/TripDashboardService';
import PageShell from '../../components/Erp/PageShell';
import EwbQueueTable from './EwbQueueTable';
import ConfirmEwbModal from './ConfirmEwbModal';
import '../../styles/erp.css';

/** EWB quantity units are messy (KLR/MTS/...); collapse to the CN enum. */
const toCnUnit = (qtyUnit, fallback = 'KL') => {
  const u = String(qtyUnit || '').toUpperCase();
  if (u.startsWith('K')) return 'KL';
  if (u.startsWith('M') || u.startsWith('T')) return 'MT';
  return fallback;
};

const asDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const InboundEwbPage = () => {
  const [rows, setRows] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const [active, setActive] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const tripsById = useMemo(() => {
    const map = {};
    for (const t of trips) map[t._id] = t;
    return map;
  }, [trips]);

  const fetchQueue = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await InboundEwbService.getQueue({ ...(status ? { status } : {}) });
      setRows(res.data || []);
    } catch (err) {
      if (err.status === 404) {
        toast.error('ERP is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await TripDashboardService.listTrips({ limit: 200 });
      setTrips(res.data || []);
    } catch {
      setTrips([]);
    }
  }, []);

  useEffect(() => {
    fetchQueue(statusFilter);
    fetchTrips();
  }, [fetchQueue, fetchTrips, statusFilter]);

  const openReview = (ewb) => {
    setActive(ewb);
    setForm({
      cnNumber: ewb.sourceInvoiceNumber || ewb.ewbNumber || '',
      cnDate: asDateInput(ewb.ewbDate) || asDateInput(new Date()),
      loadingDate: asDateInput(ewb.ewbDate) || asDateInput(new Date()),
      loadedQty: ewb.qty ?? '',
      loadedQtyUnit: toCnUnit(ewb.qtyUnit),
      tripId: ewb.matchedTripId || '',
    });
  };

  const closeReview = () => {
    setActive(null);
    setForm({});
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await InboundEwbService.sync();
      const d = res.data || {};
      toast.success(`Pulled ${d.pulled ?? 0} · ${d.new ?? 0} new · ${d.suggested ?? 0} suggested`);
      fetchQueue(statusFilter);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleIgnore = async (ewb) => {
    try {
      await InboundEwbService.ignore(ewb._id);
      toast.success(`${ewb.ewbNumber} ignored`);
      fetchQueue(statusFilter);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!active) return;
    if (!form.tripId) {
      toast.error('Pick the trip this waybill belongs to');
      return;
    }
    setSubmitting(true);
    try {
      const res = await InboundEwbService.confirm(active._id, {
        tripId: form.tripId,
        ...(form.cnNumber ? { cnNumber: form.cnNumber } : {}),
        ...(form.cnDate ? { cnDate: form.cnDate } : {}),
        ...(form.loadingDate ? { loadingDate: form.loadingDate } : {}),
        ...(form.loadedQty !== '' && form.loadedQty != null
          ? { loadedQty: Number(form.loadedQty) }
          : {}),
        ...(form.loadedQtyUnit ? { loadedQtyUnit: form.loadedQtyUnit } : {}),
      });
      const cn = res.data?.consignment;
      toast.success(`Consignment ${cn?.cnNumber || ''} created — trip dispatched`);
      closeReview();
      fetchQueue(statusFilter);
      fetchTrips();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = rows.filter((r) => r.matchStatus !== 'LINKED').length;
  const placedTrips = trips.filter((t) => t.state === 'PLACED');

  return (
    <PageShell
      title="Inbound e-Way Bills"
      subtitle={
        pendingCount > 0
          ? `${pendingCount} waybill${pendingCount === 1 ? '' : 's'} waiting to be matched to a trip`
          : 'Nothing waiting to be matched'
      }
      actions={
        <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
          <RefreshCw size={16} />
          {syncing ? 'Syncing…' : 'Sync from GST'}
        </button>
      }
    >
      <div className="erp-toolbar">
        <select
          className="erp-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Awaiting review</option>
          <option value="SUGGESTED">Suggested</option>
          <option value="UNMATCHED">Unmatched</option>
          <option value="LINKED">Linked</option>
          <option value="IGNORED">Ignored</option>
        </select>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading e-Way Bills...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="erp-state">
            <FileCheck2 size={48} />
            <p>
              {statusFilter === '' || statusFilter === 'SUGGESTED'
                ? 'No e-Way Bills waiting for review'
                : 'No e-Way Bills match this filter'}
            </p>
          </div>
        ) : (
          <EwbQueueTable
            rows={rows}
            tripsById={tripsById}
            openReview={openReview}
            handleIgnore={handleIgnore}
          />
        )}
      </div>

      {active && (
        <ConfirmEwbModal
          active={active}
          closeReview={closeReview}
          handleConfirm={handleConfirm}
          form={form}
          setField={setField}
          placedTrips={placedTrips}
          submitting={submitting}
        />
      )}
    </PageShell>
  );
};

export default InboundEwbPage;
