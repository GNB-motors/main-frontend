import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Truck,
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

const TripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
              { label: 'Grand total', value: money(saleBill.grandTotal) },
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
              { label: 'Invoiced', value: money(saleBill.grandTotal) },
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
  const billed = saleBill?.grandTotal || 0;
  const hireCost = purchaseBill?.netAmount || 0;
  const settled = currentIdx >= stages.length;
  const nextStage = settled ? null : stages[currentIdx];

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

      {/* ── Next best action ── */}
      <div className={`trip360-nba ${settled ? 'settled' : ''}`}>
        <div>
          <div className="trip360-nba-eyebrow">{settled ? 'Complete' : 'Next step'}</div>
          <p className="trip360-nba-title">
            {settled ? 'This trip is fully settled' : nextStage.label}
          </p>
          <p className="trip360-nba-hint">
            {settled
              ? 'Billed and payment received. No action pending.'
              : nextStage.available === false
                ? `Waiting on ${nextStage.blockedBy}`
                : 'This is the only step you can act on right now.'}
          </p>
        </div>
        {!settled && (nextStage.action || nextStage.render === 'advanceCn') && (
          <button
            className="trip360-btn primary trip360-nba-cta"
            onClick={() => openDrawer(nextStage.render === 'advanceCn' ? 'cn' : nextStage.action.drawer)}
          >
            {nextStage.render === 'advanceCn'
              ? nextStage.hasCn
                ? 'Update CN'
                : 'Create CN'
              : nextStage.action.label}
            <ArrowRight size={15} />
          </button>
        )}
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
              {saleBill && (
                <MoneyRow
                  label={saleBill.status === 'PAID' ? 'Received' : 'Outstanding'}
                  value={money(billed)}
                  tone={saleBill.status === 'PAID' ? 'pos' : 'neg'}
                  total
                />
              )}
            </div>
          </section>
        </aside>

        {/* Detail — the lifecycle */}
        <div className="trip360-stages">
          {stages.map((stage, idx) => {
            const st = statusOf(stage, idx);
            const Icon = stage.icon;
            const blocked = st === 'blocked';

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
