import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Truck,
  Navigation,
  MapPin,
  PackageCheck,
  Scale,
  Receipt,
  Banknote,
  Calendar,
  Check,
  Lock,
  CreditCard,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'react-toastify';
import TripDashboardService from './TripDashboardService';
import '../../styles/erp.css';
import './TripDetail.css';
import StatusBadge from '../../components/Erp/StatusBadge';
import AdvanceDrawer from '../../components/Erp/Drawers/AdvanceDrawer';
import ConsignmentDrawer from '../../components/Erp/Drawers/ConsignmentDrawer';
import TripCloseDrawer from '../../components/Erp/Drawers/TripCloseDrawer';
import PodDrawer from '../../components/Erp/Drawers/PodDrawer';
import UnloadingDrawer from '../../components/Erp/Drawers/UnloadingDrawer';
import SaleBillDrawer from '../../components/Erp/Drawers/SaleBillDrawer';
import ReceiptDrawer from '../../components/Erp/Drawers/ReceiptDrawer';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const stamp = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const Facts = ({ items }) => (
  <dl className="trip360-kv">
    {items
      .filter((f) => f)
      .map((f) => (
        <React.Fragment key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value ?? '—'}</dd>
        </React.Fragment>
      ))}
  </dl>
);

const MoneyRow = ({ label, value, tone, total }) => (
  <div className={`trip360-money ${total ? 'total' : ''} ${tone || ''}`}>
    <span className="trip360-money-label">{label}</span>
    <span className="trip360-money-value">{value}</span>
  </div>
);

const km = (v) => (v == null ? '—' : `${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`);

// Human labels for the telematics reconciliation flags surfaced from the backend.
const TELEMATICS_FLAGS = {
  EXTRA_KM: 'Extra km',
  UNLOAD_DATE_MISMATCH: 'Unload date mismatch',
  GHOST_KM_NEARBY: 'Unexplained km nearby',
  RECONCILE_GAP: 'Odometer gap',
  ROUTE_DEVIATION: 'Route deviation',
  ARRIVAL_MISMATCH: 'Arrival mismatch',
};

const TELEMATICS_UNAVAILABLE = {
  NO_TELEMATICS: 'No telematics for this vehicle',
  NO_DATA: 'No GPS data in the trip window',
  PENDING: 'Awaiting trip close',
  FAILED: 'Telematics computation failed',
};

// Pillar 1 — human labels for the append-only stage event log (ErpTripEvent).
const EVENT_LABELS = {
  'trip.placed': 'Placed',
  'advance.created': 'Advance created',
  'advance.approved': 'Advance approved',
  'advance.paid': 'Advance paid',
  'cn.saved': 'CN saved → Dispatched',
  'trip.closed': 'Trip closed',
  'pod.recorded': 'POD received',
  'unloading.saved': 'Unloaded',
  'saleBill.approved': 'Billed',
  'saleBill.cancelled': 'Bill cancelled',
  'placement.deleted': 'Cancelled',
};

/** Pillar 1 — the precise, ordered stage history with real timestamps. */
const TimelinePanel = ({ events }) => {
  if (!Array.isArray(events) || events.length === 0) return null;
  return (
    <section className="trip360-panel">
      <div className="trip360-panel-head">History</div>
      <div className="trip360-panel-body">
        <ol className="trip360-timeline">
          {events.map((e) => (
            <li key={e.seq ?? `${e.jobName}-${e.at}`} className="trip360-timeline-item">
              <span className="trip360-timeline-label">{EVENT_LABELS[e.jobName] || e.toState || e.jobName}</span>
              <span className="trip360-timeline-time">{stamp(e.at)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

/**
 * Pillar 3 — actual-vs-planned reconciliation from FleetEdge, computed at trip close.
 * Renders "unavailable + reason" (HIRE / unlinked / no data) rather than an error.
 */
const TelematicsPanel = ({ telematics, plannedKm, onRecompute, recomputing }) => {
  const t = telematics;
  const status = t?.status || 'PENDING';
  const ready = status === 'COMPUTED';
  const reason = t?.statusReason ? ` (${t.statusReason})` : '';
  const a = t?.actual || {};
  const v = t?.variance || {};

  return (
    <section className="trip360-panel">
      <div className="trip360-panel-head trip360-panel-head--action">
        <span>Telematics</span>
        <button
          type="button"
          className="trip360-btn ghost trip360-btn--xs"
          onClick={onRecompute}
          disabled={recomputing}
        >
          {recomputing ? 'Recomputing…' : 'Recompute'}
        </button>
      </div>
      <div className="trip360-panel-body">
        {!ready ? (
          <p className="trip360-muted">{(TELEMATICS_UNAVAILABLE[status] || 'Telematics unavailable') + reason}</p>
        ) : (
          <>
            <Facts
              items={[
                { label: 'Actual distance', value: km(a.totalTripKm) },
                { label: 'Planned distance', value: km(plannedKm) },
                {
                  label: 'Extra',
                  value:
                    v.extraKm != null
                      ? `${km(v.extraKm)}${v.extraKmPct != null ? ` (${v.extraKmPct}%)` : ''}`
                      : '—',
                },
                { label: 'Laden / Approach / Return', value: `${km(a.ladenKm)} / ${km(a.approachKm)} / ${km(a.returnKm)}` },
                a.fuelDetourKm ? { label: 'of which fuel detour', value: km(a.fuelDetourKm) } : null,
                a.serviceKmExcluded ? { label: 'Service (excluded)', value: km(a.serviceKmExcluded) } : null,
                a.fuelConsumedL != null ? { label: 'Fuel used', value: `${a.fuelConsumedL} L` } : null,
                a.lastMovementAt ? { label: 'GPS arrival', value: stamp(a.lastMovementAt) } : null,
                t.confidence ? { label: 'Confidence', value: t.confidence } : null,
              ]}
            />
            {Array.isArray(t.flags) && t.flags.length > 0 && (
              <div className="trip360-flags">
                {t.flags.map((f) => (
                  <span key={f} className="trip360-chip trip360-chip--warn">
                    {TELEMATICS_FLAGS[f] || f}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const TripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  /**
   * Which finished stage the user has opened. Completed and locked stages
   * collapse to one line; only the stage you can act on is expanded, so the
   * current step is on screen without scrolling past 200px cards for work
   * already done and work that cannot start.
   */
  const [openStageId, setOpenStageId] = useState(null);

  /**
   * Prefer real history so the user lands back where they came from — the
   * pipeline, ERP Home's pending queue, or a search. On a cold load (pasted
   * link, new tab) there is nothing to go back to, so fall back to the list.
   */
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/erp/pipeline');
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDrawer, setActiveDrawer] = useState(null);

  const fetchTrip = useCallback(async () => {
    try {
      const result = await TripDashboardService.getTripById(tripId);
      setData(result);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch trip details');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const [recomputing, setRecomputing] = useState(false);
  const handleRecomputeTelematics = useCallback(async () => {
    setRecomputing(true);
    try {
      await TripDashboardService.recomputeTelematics(tripId);
      toast.success('Telematics recomputed');
      await fetchTrip();
    } catch (error) {
      toast.error(error.message || 'Failed to recompute telematics');
    } finally {
      setRecomputing(false);
    }
  }, [tripId, fetchTrip]);

  useEffect(() => {
    const drawerParam = searchParams.get('drawer');
    if (drawerParam) setActiveDrawer(drawerParam.toLowerCase());
  }, [searchParams]);

  const openDrawer = (name) => {
    setActiveDrawer(name);
    setSearchParams({ drawer: name }, { replace: true });
  };

  const closeDrawer = () => {
    setActiveDrawer(null);
    setSearchParams({}, { replace: true });
  };

  /**
   * The lifecycle, derived from trip state rather than hardcoded ordering.
   *
   * Each stage reports done / current / blocked so the UI can show one action
   * and visibly disable the rest. `blockedBy` names the stage that has to
   * happen first — a blocked button without a reason just looks broken.
   */
  const stages = useMemo(() => {
    if (!data) return [];

    // Backend (erpTrip.service.js getById) returns `saleBill` / `purchaseBill`.
    const saleBill = data.saleBill;
    const hasCn = !!data.consignment || data.cnGate === 'UPDATED' || data.loadedQty != null;
    const closed = !!data.tripClosedAt || data.state === 'TRIP_CLOSED';
    const hasPod = !!data.pod || data.state === 'POD_RECEIVED';
    const hasUnloading = !!data.unloading;
    const hasBill = !!saleBill;
    const isPaid = saleBill?.status === 'PAID';

    const advances = data.advances || [];
    const u = data.unloading;

    return [
      {
        id: 'DO',
        label: 'Delivery Order',
        icon: FileText,
        done: true,
        facts: [
          { label: 'DO number', value: data.doId?.doNumber },
          { label: 'Client', value: data.partyId?.name },
          { label: 'Material', value: data.material || data.doId?.material },
          { label: 'Planned qty', value: data.plannedQty ? `${data.plannedQty} KL` : null },
        ],
      },
      {
        id: 'PLACEMENT',
        label: 'Placement',
        icon: Calendar,
        done: true,
        facts: [
          { label: 'Route', value: `${data.fromLocation || '—'} → ${data.toLocation || '—'}` },
          { label: 'Distance', value: data.totalKm ? `${data.totalKm} km` : null },
          { label: 'Vehicle', value: `${data.vehicleNumber || '—'} (${data.vehicleType || '—'})` },
          { label: 'Trip date', value: day(data.tripDate) },
        ],
      },
      {
        id: 'ADVANCE_CN',
        label: 'Advance & CN',
        icon: Truck,
        done: hasCn,
        available: true,
        render: 'advanceCn',
        advances,
        hasCn,
      },
      {
        /**
         * The vehicle is on the road. This state has always existed —
         * ERP_TRIP_STATES has DISPATCHED, stamped the moment the CN is saved
         * (see erpTrip.constants) — but the lifecycle jumped straight from
         * "Advance & CN" to "Trip Close", so the longest-lived phase of a trip
         * was the one it never showed. There is deliberately no action: nothing
         * to do here but wait for the vehicle to arrive.
         */
        id: 'TRANSIT',
        label: 'In transit',
        icon: Navigation,
        done: closed || hasPod || hasUnloading || hasBill,
        available: hasCn,
        blockedBy: 'CN update',
        facts: hasCn
          ? [
              { label: 'Dispatched', value: stamp(data.dispatchedAt) },
              { label: 'Expected free', value: stamp(data.expectedFreeAt) },
              { label: 'Distance', value: data.totalKm ? `${data.totalKm} km` : null },
            ]
          : null,
      },
      {
        id: 'CLOSE',
        label: 'Trip Close',
        icon: MapPin,
        done: closed,
        available: hasCn,
        blockedBy: 'CN update',
        action: { label: closed ? 'View / re-close' : 'Close trip', drawer: 'close' },
        facts: closed
          ? [
              { label: 'Closed at', value: stamp(data.tripClosedAt) },
              { label: 'Unload at', value: data.unloadLocation },
              {
                label: 'Closed by',
                value: data.tripClosedBy
                  ? `${data.tripClosedBy.firstName || ''} ${data.tripClosedBy.lastName || ''}`.trim()
                  : null,
              },
              { label: 'Remarks', value: data.closeRemarks || null },
            ]
          : null,
      },
      {
        id: 'POD',
        label: 'POD Receipt',
        icon: PackageCheck,
        done: hasPod,
        available: closed,
        blockedBy: 'Trip Close',
        action: { label: hasPod ? 'Update POD' : 'Upload POD', drawer: 'pod' },
        facts: data.pod
          ? [
              { label: 'Received', value: day(data.pod.receivedDate) },
              { label: 'Received by', value: data.pod.receivedByName || 'Office' },
            ]
          : null,
      },
      {
        id: 'UNLOADING',
        label: 'Unloading',
        icon: Scale,
        done: hasUnloading,
        available: hasPod,
        blockedBy: 'POD Receipt',
        action: { label: hasUnloading ? 'Update unloading' : 'Enter unloading', drawer: 'unloading' },
        facts: u
          ? [
              { label: 'Unloaded', value: `${u.unloadedQty ?? '—'} KL` },
              { label: 'Shortage', value: `${u.shortageQty ?? 0} (${money(u.shortageDeduction)})` },
              { label: 'Detention', value: `${u.detentionDays ?? 0} d (${money(u.detentionAmount)})` },
            ]
          : null,
      },
      {
        id: 'BILLING',
        label: 'Sale Bill',
        icon: Receipt,
        done: hasBill,
        available: hasUnloading,
        blockedBy: 'Unloading',
        action: { label: hasBill ? 'View bill' : 'Generate sale bill', drawer: 'salebill' },
        facts: saleBill
          ? [
              { label: 'Bill no', value: saleBill.billNumber },
              { label: 'Bill date', value: day(saleBill.billDate) },
              { label: 'Grand total', value: money(saleBill.netAmount) },
            ]
          : null,
      },
      {
        id: 'PAID',
        label: 'Payment Received',
        icon: Banknote,
        done: isPaid,
        available: hasBill,
        blockedBy: 'Sale Bill',
        action: { label: 'Record receipt', drawer: 'receipt' },
        facts: hasBill
          ? [
              { label: 'Status', value: saleBill.status || 'BILLED' },
              { label: 'Invoiced', value: money(saleBill.netAmount) },
            ]
          : null,
      },
    ];
  }, [data]);

  // Current = first stage that is not done. Everything after it is pending.
  const currentIdx = useMemo(() => {
    const i = stages.findIndex((s) => !s.done);
    return i === -1 ? stages.length : i;
  }, [stages]);

  /** The single line a collapsed stage shows instead of its full card. */
  const summaryOf = (stage) => {
    if (stage.render === 'advanceCn') {
      return stage.hasCn ? 'CN updated' : 'No consignment note yet';
    }
    const facts = (stage.facts || []).filter((f) => f.value);
    if (facts.length) return facts.slice(0, 3).map((f) => f.value).join(' · ');
    return null;
  };

  const statusOf = (stage, idx) => {
    if (stage.done) return 'done';
    if (idx === currentIdx) return 'current';
    return stage.available ? 'current' : 'blocked';
  };

  if (loading) {
    return (
      <div className="erp-page">
        <div className="erp-muted">Loading trip…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="erp-page">
        <div className="erp-muted">Trip not found</div>
      </div>
    );
  }

  const advances = data.advances || [];
  const advanceTotal = advances.reduce((a, x) => a + (x.amount || 0), 0);
  const saleBill = data.saleBill;
  const purchaseBill = data.purchaseBill;
  const billed = saleBill?.netAmount || 0;
  // Falls back to the full invoice when the field is absent (older bills), so a
  // missing value never reads as "fully paid".
  const outstanding = saleBill ? (saleBill.outstandingAmount ?? billed) : 0;
  const received = Math.max(0, billed - outstanding);
  const hireCost = purchaseBill?.netAmount || 0;
  const settled = currentIdx >= stages.length;

  return (
    <div className="erp-page trip360">
      {/* ── Identity ── */}
      <div className="trip360-back">
        <button type="button" className="trip360-btn ghost" onClick={goBack}>
          <ArrowLeft size={15} />
          Back
        </button>
        <nav className="erp-muted" style={{ fontSize: 12.5 }}>
          <Link to="/erp">ERP</Link> <span className="trip360-meta-sep">›</span>{' '}
          <Link to="/erp/pipeline">Pipeline</Link> <span className="trip360-meta-sep">›</span>{' '}
          {data.tripNumber}
        </nav>
      </div>

      <div className="trip360-id">
        <h1 className="trip360-number">{data.tripNumber}</h1>
        <StatusBadge status={data.state} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {data.vehicleType && (
            <span className={`trip360-chip ${data.vehicleType === 'HIRE' ? 'hire' : ''}`}>
              <Truck size={12} /> {data.vehicleType}
            </span>
          )}
          {data.partyId?.creditLimit != null && (
            <span className="trip360-chip">
              <CreditCard size={12} /> Credit {money(data.partyId.creditLimit)}
            </span>
          )}
        </div>
      </div>

      <div className="trip360-meta">
        <span>{day(data.tripDate)}</span>
        <span className="trip360-meta-sep">•</span>
        <span>{data.vehicleNumber || '—'}</span>
        <span className="trip360-meta-sep">•</span>
        <span>{data.partyId?.name || '—'}</span>
        <span className="trip360-meta-sep">•</span>
        <span>
          {data.fromLocation || '—'} → {data.toLocation || '—'}
        </span>
      </div>

      {/* ── Stepper ── */}
      <div className="trip360-stepper">
        {stages.map((s, idx) => {
          const st = statusOf(s, idx);
          const Icon = s.icon;
          return (
            <div key={s.id} className={`trip360-step ${st}`}>
              <span className="trip360-step-dot">
                {st === 'done' ? <Check size={14} strokeWidth={3} /> : <Icon size={13} />}
              </span>
              <span className="trip360-step-label">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Master / detail ── */}
      <div className="trip360-body">
        {/* Master rail */}
        <aside className="trip360-rail">
          <section className="trip360-panel">
            <div className="trip360-panel-head">Consignment</div>
            <div className="trip360-panel-body">
              <Facts
                items={[
                  { label: 'Client', value: data.partyId?.name },
                  { label: 'DO', value: data.doId?.doNumber },
                  { label: 'Material', value: data.material },
                  {
                    label: 'Qty',
                    value: `${data.plannedQty ?? '—'} planned${
                      data.loadedQty != null ? ` · ${data.loadedQty} loaded` : ''
                    }`,
                  },
                ]}
              />
            </div>
          </section>

          <section className="trip360-panel">
            <div className="trip360-panel-head">Vehicle &amp; route</div>
            <div className="trip360-panel-body">
              <Facts
                items={[
                  { label: 'Vehicle', value: data.vehicleNumber },
                  { label: 'Ownership', value: data.vehicleType },
                  {
                    label: 'Route',
                    value: `${data.fromLocation || '—'} → ${data.toLocation || '—'}`,
                  },
                  { label: 'Distance', value: data.totalKm ? `${data.totalKm} km` : null },
                  data.expectedFreeAt ? { label: 'Free at', value: stamp(data.expectedFreeAt) } : null,
                ]}
              />
            </div>
          </section>

          <TelematicsPanel
            telematics={data.telematics}
            plannedKm={data.totalKm}
            onRecompute={handleRecomputeTelematics}
            recomputing={recomputing}
          />

          <TimelinePanel events={data.events} />

          <section className="trip360-panel">
            <div className="trip360-panel-head">Money</div>
            <div className="trip360-panel-body">
              <MoneyRow label={`Advances (${advances.length})`} value={money(advanceTotal)} />
              <MoneyRow label="Sale bill" value={saleBill ? money(billed) : 'Not billed'} />
              {data.vehicleType === 'HIRE' && (
                <MoneyRow
                  label="Hire cost"
                  value={purchaseBill ? money(hireCost) : 'Not billed'}
                />
              )}
              {data.unloading && (
                <>
                  <MoneyRow label="Shortage" value={money(data.unloading.shortageDeduction)} />
                  <MoneyRow label="Detention" value={money(data.unloading.detentionAmount)} />
                </>
              )}
              {saleBill && received > 0 && (
                <MoneyRow label="Received" value={money(received)} tone="pos" />
              )}
              {saleBill && (
                <MoneyRow
                  label={outstanding > 0 ? 'Outstanding' : 'Fully received'}
                  value={money(outstanding)}
                  tone={outstanding > 0 ? 'neg' : 'pos'}
                  total
                />
              )}
            </div>
          </section>
        </aside>

        {/* Detail — the lifecycle */}
        <div className="trip360-stages">
          {settled && (
            <div className="trip360-settled">
              <Check size={15} strokeWidth={3} />
              <div>
                <strong>Trip complete</strong>
                <span className="erp-cell-muted">
                  Billed and payment received. Open any stage below to see what was recorded.
                </span>
              </div>
            </div>
          )}

          {stages.map((stage, idx) => {
            const st = statusOf(stage, idx);
            const Icon = stage.icon;
            const blocked = st === 'blocked';
            // The current stage is always open. A finished one opens on click;
            // a locked one has nothing to open.
            const expanded = st === 'current' || openStageId === stage.id;
            const summary = summaryOf(stage);

            if (!expanded) {
              return (
                <section key={stage.id} className={`trip360-stage ${st} is-collapsed`}>
                  <header
                    className="trip360-stage-head"
                    onClick={blocked ? undefined : () => setOpenStageId(stage.id)}
                    role={blocked ? undefined : 'button'}
                    tabIndex={blocked ? undefined : 0}
                    onKeyDown={
                      blocked
                        ? undefined
                        : (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setOpenStageId(stage.id);
                          }
                        }
                    }
                  >
                    <span className="trip360-stage-index">{idx + 1}</span>
                    <span className="trip360-stage-icon">
                      {st === 'done' ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                    </span>
                    <h2 className="trip360-stage-title">{stage.label}</h2>
                    {summary && !blocked && (
                      <span className="trip360-stage-summary">{summary}</span>
                    )}
                    <div className="trip360-stage-status">
                      {blocked ? (
                        <span className="trip360-blocked-note">
                          <Lock size={12} /> After {stage.blockedBy}
                        </span>
                      ) : (
                        <StatusBadge status="COMPLETED" />
                      )}
                    </div>
                  </header>
                </section>
              );
            }

            return (
              <section key={stage.id} className={`trip360-stage ${st}`}>
                <header className="trip360-stage-head">
                  <span className="trip360-stage-index">{idx + 1}</span>
                  <span className="trip360-stage-icon">
                    {st === 'done' ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                  </span>
                  <h2 className="trip360-stage-title">{stage.label}</h2>
                  <div className="trip360-stage-status">
                    {blocked ? (
                      <span className="trip360-blocked-note">
                        <Lock size={12} /> After {stage.blockedBy}
                      </span>
                    ) : (
                      <StatusBadge status={st === 'done' ? 'COMPLETED' : 'PENDING'} />
                    )}
                    {st !== 'current' && (
                      <button
                        type="button"
                        className="trip360-btn ghost trip360-btn--xs"
                        onClick={() => setOpenStageId(null)}
                      >
                        Hide
                      </button>
                    )}
                  </div>
                </header>

                <div className="trip360-stage-body">
                  {stage.render === 'advanceCn' ? (
                    <>
                      <div className="trip360-sub">
                        <p className="trip360-sub-title">Advances</p>
                        {stage.advances.length ? (
                          <ul className="trip360-rows">
                            {stage.advances.map((a) => (
                              <li key={a._id} className="trip360-row">
                                <span>{a.advanceType}</span>
                                <StatusBadge status={a.status} />
                                <span className="trip360-row-amount">{money(a.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="trip360-empty">No advances raised.</p>
                        )}
                        <div className="trip360-stage-actions">
                          <button
                            className="trip360-btn secondary"
                            onClick={() => openDrawer('advance')}
                          >
                            {stage.advances.length ? 'Manage advances' : 'Raise advance'}
                          </button>
                        </div>
                      </div>

                      <div className="trip360-sub">
                        <p className="trip360-sub-title">Consignment note</p>
                        {data.consignment ? (
                          <Facts
                            items={[
                              { label: 'CN number', value: data.consignment.cnNumber },
                              {
                                label: 'Loaded qty',
                                value: `${data.consignment.loadedQty} ${
                                  data.consignment.loadedQtyUnit || 'KL'
                                }`,
                              },
                            ]}
                          />
                        ) : stage.hasCn ? (
                          <Facts
                            items={[
                              { label: 'CN status', value: 'Updated' },
                              { label: 'Loaded qty', value: `${data.loadedQty} KL` },
                            ]}
                          />
                        ) : (
                          <p className="trip360-empty">No consignment note yet.</p>
                        )}
                        <div className="trip360-stage-actions">
                          <button
                            className={`trip360-btn ${stage.hasCn ? 'secondary' : 'primary'}`}
                            onClick={() => openDrawer('cn')}
                          >
                            {stage.hasCn ? 'Update CN' : 'Create CN'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {stage.facts ? (
                        <Facts items={stage.facts} />
                      ) : (
                        <p className="trip360-empty">
                          {blocked ? `Available once ${stage.blockedBy} is done.` : 'Not recorded yet.'}
                        </p>
                      )}

                      {stage.action && (
                        <div className="trip360-stage-actions">
                          <button
                            className={`trip360-btn ${st === 'current' ? 'primary' : 'secondary'}`}
                            disabled={blocked}
                            onClick={() => openDrawer(stage.action.drawer)}
                          >
                            {stage.action.label}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* ── Drawers ── */}
      <AdvanceDrawer
        isOpen={activeDrawer === 'advance'}
        onClose={closeDrawer}
        initialTripId={data._id}
        mode="RAISE"
        onSuccess={fetchTrip}
      />
      <ConsignmentDrawer
        isOpen={activeDrawer === 'cn'}
        onClose={closeDrawer}
        trip={data}
        onSuccess={fetchTrip}
      />
      <TripCloseDrawer
        isOpen={activeDrawer === 'close'}
        onClose={closeDrawer}
        trip={data}
        onSuccess={fetchTrip}
      />
      <PodDrawer isOpen={activeDrawer === 'pod'} onClose={closeDrawer} trip={data} onSuccess={fetchTrip} />
      <UnloadingDrawer
        isOpen={activeDrawer === 'unloading'}
        onClose={closeDrawer}
        trip={data}
        onSuccess={fetchTrip}
      />
      <SaleBillDrawer
        isOpen={activeDrawer === 'salebill'}
        onClose={closeDrawer}
        unloading={
          data.unloading
            ? { ...data.unloading, tripNumber: data.tripNumber, partyId: data.partyId }
            : null
        }
        onSuccess={fetchTrip}
      />
      <ReceiptDrawer
        isOpen={activeDrawer === 'receipt'}
        onClose={closeDrawer}
        bill={data.saleBill}
        party={data.partyId}
        onSuccess={fetchTrip}
      />
    </div>
  );
};

export default TripDetailPage;
