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

function Kpis({ summary, onReviewApprovals }) {
  const counts = summary?.pendingCounts || {};
  const fin = summary?.financials || {};
  const load = summary?.load || {};
  const placed = counts.activeTrips?.PLACED || 0;
  const dispatched = counts.activeTrips?.DISPATCHED || 0;
  const active = placed + dispatched;

  const byType = counts.pendingApprovalsByType || {};
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

  const ageing = fin.receivablesAgeing || {};
  const recv = [
    { label: '0–30 d', value: ageing.d0to30 || 0, color: 'var(--nova-rage-400)' },
    { label: '31–60 d', value: ageing.d31to60 || 0, color: '#F0AA48' },
    { label: '60+ d', value: ageing.over60 || 0, color: '#C2323A' },
  ].map((p) => ({ ...p, legend: `${p.label} · ${formatInrCompact(p.value)}` }));
  const recvTotal = fin.receivablesOutstanding || 0;

  const pay = [
    { label: 'Vendors', value: fin.vendorPayables || 0, color: 'var(--nova-rage-400)' },
    { label: 'Suppliers', value: fin.supplierPayables || 0, color: '#6A43D8' },
  ].map((p) => ({ ...p, legend: `${p.label} · ${formatInrCompact(p.value)}` }));
  const payTotal = fin.payablesDue || 0;

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
        <div className="kpi-val">{active}</div>
        <div className="kpi-foot">
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
        </div>
        <SegBar
          total={active}
          parts={[
            { label: 'Placed', value: placed, color: '#8FA6F5' },
            { label: 'Dispatched', value: dispatched, color: 'var(--nova-rage-400)' },
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
        <div className="kpi-val">{counts.pendingApprovals || 0}</div>
        <div className="kpi-foot">
          {approvalParts.length ? (
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
          {formatInrCompact(recvTotal)}
        </div>
        <div className="kpi-foot">
          <span>
            <b style={{ color: RED.c }}>{formatInrCompact(ageing.over60)}</b> over 60 days
          </span>
        </div>
        <SegBar parts={recv} total={recvTotal} />
      </div>

      <div className="card kpi">
        <div className="kpi-top">
          <span className="ic" style={{ '--c': '#6A43D8', '--tint': 'rgba(106,67,216,.12)' }}>
            <CcIcon n="up" s={15} />
          </span>
          <span>Payables due</span>
        </div>
        <div className="kpi-val">{formatInrCompact(payTotal)}</div>
        <div className="kpi-foot">
          <span>
            <b>{formatInrCompact(fin.payablesDueThisWeek)}</b> due this week
          </span>
        </div>
        <SegBar parts={pay} total={payTotal} />
      </div>
    </section>
  );
}

export default Kpis;
