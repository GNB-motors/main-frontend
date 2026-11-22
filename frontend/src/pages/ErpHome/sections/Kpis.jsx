import React from 'react';
import { formatInrCompact } from '../../../utils/formatters';
import CcIcon from '../commandCenterIcons';
import { RED, AMB, GRN } from '../commandCenterTones';
import SegBar from './SegBar';

const RATE_APPROVALS = new Set([
  'DO_MANUAL_RATE',
  'PLACEMENT_MANUAL_PB_RATE',
  'PLACEMENT_SB_PB_GAP',
  'UNLOADING_RATE_CHANGE',
  'BILLING_RATE_EDIT',
]);

/**
 * The headline figures of the command center.
 *
 * When the summary has not been loaded, every figure is unknown and says so
 * ("—" / "not checked"). A failed request must never look like a business with
 * nothing pending.
 */
function Kpis({ summary, loading, onReviewApprovals }) {
  const known = Boolean(summary);
  // A request that is still running is not the same as a figure we never got.
  const unknownNote = loading ? 'loading…' : 'not checked';
  const counts = known ? summary.pendingCounts || {} : {};
  const fin = known ? summary.financials || {} : {};
  const load = known ? summary.load || {} : {};
  const placed = known ? counts.activeTrips?.PLACED || 0 : null;
  const dispatched = known ? counts.activeTrips?.DISPATCHED || 0 : null;
  const active = known ? placed + dispatched : null;

  const byType = known ? counts.pendingApprovalsByType || {} : {};
  const approvals = Object.entries(byType).reduce(
    (acc, [type, n]) => {
      if (type.startsWith('ADVANCE_')) acc.advances += n;
      else if (RATE_APPROVALS.has(type)) acc.rates += n;
      else acc.other += n;
      return acc;
    },
    { advances: 0, rates: 0, other: 0 },
  );
  const approvalParts = [
    [approvals.advances, 'advance'],
    [approvals.rates, 'rate revision'],
    [approvals.other, 'other'],
  ].filter(([n]) => n > 0);

  const ageing = known ? fin.receivablesAgeing || {} : {};
  const recv = [
    { label: '0–30 d', value: ageing.d0to30 || 0, color: 'var(--nova-rage-400)' },
    { label: '31–60 d', value: ageing.d31to60 || 0, color: '#F0AA48' },
    { label: '60+ d', value: ageing.over60 || 0, color: '#C2323A' },
  ].map((p) => ({
    ...p,
    legend: known ? `${p.label} · ${formatInrCompact(p.value)}` : `${p.label} · —`,
  }));
  const recvTotal = known ? (fin.receivablesOutstanding ?? null) : null;

  const pay = [
    { label: 'Vendors', value: fin.vendorPayables || 0, color: 'var(--nova-rage-400)' },
    { label: 'Suppliers', value: fin.supplierPayables || 0, color: '#6A43D8' },
  ].map((p) => ({
    ...p,
    legend: known ? `${p.label} · ${formatInrCompact(p.value)}` : `${p.label} · —`,
  }));
  const payTotal = known ? (fin.payablesDue ?? null) : null;

  return (
    <section className="kpis">
      <div className="card kpi">
        <div className="kpi-top">
          <span
            className="ic"
            style={{ '--c': 'var(--nova-rage-600)', '--tint': 'var(--nova-rage-a10)' }}
          >
            <CcIcon n="truck" s={15} />
          </span>
          <span>Active trips</span>
        </div>
        <div className="kpi-val">{known ? active : '—'}</div>
        <div className="kpi-foot">
          {known ? (
            <>
              <span>
                <b>{placed}</b> placed
              </span>
              <span>·</span>
              <span>
                <b>{dispatched}</b> dispatched
              </span>
              {load.tonnageInTransit > 0 && (
                <>
                  <span>·</span>
                  <span>
                    <b>{load.tonnageInTransit.toLocaleString('en-IN')} t</b> moving
                  </span>
                </>
              )}
            </>
          ) : (
            <span>{unknownNote}</span>
          )}
        </div>
        <SegBar
          total={active || 0}
          parts={[
            { label: 'Placed', value: placed || 0, color: '#8FA6F5' },
            { label: 'Dispatched', value: dispatched || 0, color: 'var(--nova-rage-400)' },
          ]}
        />
      </div>

      <div className="card kpi">
        <div className="kpi-top">
          <span className="ic" style={{ '--c': AMB.c, '--tint': AMB.tint }}>
            <CcIcon n="clipboard" s={15} />
          </span>
          <span>Pending approvals</span>
        </div>
        <div className="kpi-val">{known ? counts.pendingApprovals || 0 : '—'}</div>
        <div className="kpi-foot">
          {!known ? (
            <span>{unknownNote}</span>
          ) : approvalParts.length ? (
            approvalParts.map(([n, word]) => (
              <span key={word}>
                <b>{n}</b> {n === 1 ? word : `${word}s`}
              </span>
            ))
          ) : (
            <span>Nothing waiting on you</span>
          )}
        </div>
        <a
          href="/erp/approvals"
          onClick={onReviewApprovals}
          style={{
            fontSize: 11,
            fontWeight: 600,
            marginTop: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Review approvals <CcIcon n="arrowR" s={12} />
        </a>
      </div>

      <div className="card kpi">
        <div className="kpi-top">
          <span className="ic" style={{ '--c': GRN.c, '--tint': GRN.tint }}>
            <CcIcon n="down" s={15} />
          </span>
          <span>Receivables due</span>
        </div>
        <div className="kpi-val" style={{ color: GRN.c }}>
          {known ? formatInrCompact(recvTotal) : '—'}
        </div>
        <div className="kpi-foot">
          {known ? (
            <span>
              <b style={{ color: RED.c }}>{formatInrCompact(ageing.over60)}</b> over 60 days
            </span>
          ) : (
            <span>{unknownNote}</span>
          )}
        </div>
        <SegBar parts={recv} total={recvTotal ?? 0} />
      </div>

      <div className="card kpi">
        <div className="kpi-top">
          <span className="ic" style={{ '--c': '#6A43D8', '--tint': 'rgba(106,67,216,.12)' }}>
            <CcIcon n="up" s={15} />
          </span>
          <span>Payables due</span>
        </div>
        <div className="kpi-val">{known ? formatInrCompact(payTotal) : '—'}</div>
        <div className="kpi-foot">
          {known ? (
            <span>
              <b>{formatInrCompact(fin.payablesDueThisWeek)}</b> due this week
            </span>
          ) : (
            <span>{unknownNote}</span>
          )}
        </div>
        <SegBar parts={pay} total={payTotal ?? 0} />
      </div>
    </section>
  );
}

export default Kpis;
