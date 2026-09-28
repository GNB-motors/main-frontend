import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast as notify } from 'react-toastify';
import ConsignmentDrawer from '../../components/Erp/Drawers/ConsignmentDrawer';
import TripCloseDrawer from '../../components/Erp/Drawers/TripCloseDrawer';
import PodDrawer from '../../components/Erp/Drawers/PodDrawer';
import UnloadingDrawer from '../../components/Erp/Drawers/UnloadingDrawer';
import { useTheme } from '../../hooks/useTheme.js';
import ErpDashboardService from './ErpDashboardService';
import CcIcon from './commandCenterIcons';
import './erpCommandCenter.css';

const STAGES = [
  { k: 'do', l: 'DOs open', verb: 'Place vehicle', col: 'DO' },
  { k: 'cn', l: 'Pending CN', verb: 'Generate CN', drawer: 'cn' },
  { k: 'dispatch', l: 'Awaiting dispatch', verb: 'Pay advance' },
  { k: 'close', l: 'Pending close', verb: 'Close trip', drawer: 'close' },
  { k: 'pod', l: 'Pending POD', verb: 'Record POD', drawer: 'pod' },
  { k: 'unload', l: 'Pending unload', verb: 'Mark unloaded', drawer: 'unloading' },
  { k: 'bill', l: 'Pending bill', verb: 'Create bill' },
];
const stageOf = (k) => STAGES.find((s) => s.k === k);

const RED = { c: '#C2323A', tint: 'rgba(229,104,107,.14)' };
const AMB = { c: '#C56200', tint: 'rgba(240,170,72,.16)' };
const GRN = { c: '#187A32', tint: 'rgba(37,186,76,.12)' };

const RATE_APPROVALS = new Set([
  'DO_MANUAL_RATE',
  'PLACEMENT_MANUAL_PB_RATE',
  'PLACEMENT_SB_PB_GAP',
  'UNLOADING_RATE_CHANGE',
  'BILLING_RATE_EDIT',
]);

const lakh = (n) => {
  const v = n || 0;
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${Math.round(v)}`;
};
const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const pct = (part, total) => (total > 0 ? `${(part / total) * 100}%` : '0%');
const unwrap = (res) => res?.data;

const QUEUE_PREVIEW = 8;

function SegBar({ parts, total }) {
  return (
    <>
      <div className="seg">
        {parts.map((p) => (
          <i key={p.label} style={{ width: pct(p.value, total), background: p.color }} />
        ))}
      </div>
      <div className="segleg">
        {parts.map((p) => (
          <span key={p.label} style={{ '--c': p.color }}>
            {p.legend ?? p.label}
          </span>
        ))}
      </div>
    </>
  );
}

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
  ].map((p) => ({ ...p, legend: `${p.label} · ${lakh(p.value)}` }));
  const recvTotal = fin.receivablesOutstanding || 0;

  const pay = [
    { label: 'Vendors', value: fin.vendorPayables || 0, color: 'var(--nova-rage-400)' },
    { label: 'Suppliers', value: fin.supplierPayables || 0, color: '#6A43D8' },
  ].map((p) => ({ ...p, legend: `${p.label} · ${lakh(p.value)}` }));
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
          {lakh(recvTotal)}
        </div>
        <div className="kpi-foot">
          <span>
            <b style={{ color: RED.c }}>{lakh(ageing.over60)}</b> over 60 days
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
        <div className="kpi-val">{lakh(payTotal)}</div>
        <div className="kpi-foot">
          <span>
            <b>{lakh(fin.payablesDueThisWeek)}</b> due this week
          </span>
        </div>
        <SegBar parts={pay} total={payTotal} />
      </div>
    </section>
  );
}

function Rail({ pipeline, cur, onPick }) {
  const byKey = Object.fromEntries((pipeline || []).map((s) => [s.key, s]));
  const lates = STAGES.map((s) => byKey[s.k]?.late || 0);
  const worst = Math.max(0, ...lates);
  const bnIdx = worst > 0 ? lates.indexOf(worst) : -1;
  const trips = STAGES.filter((s) => s.k !== 'do').reduce(
    (n, s) => n + (byKey[s.k]?.count || 0),
    0,
  );
  const freight = STAGES.reduce((n, s) => n + (byKey[s.k]?.freight || 0), 0);

  return (
    <section className="card">
      <div className="card-head">
        <h2>Operational pipeline</h2>
        <span className="hint">Click a stage to open its queue</span>
        <span className="sp" />
        <span className="hint">
          {plural(trips, 'trip')} · {plural(byKey.do?.count || 0, 'DO')} in pipeline ·{' '}
          {lakh(freight)} freight
        </span>
      </div>
      <div className="railwrap">
        <div className="rail">
          {STAGES.map((s, i) => {
            const st = byKey[s.k] || { count: 0, freight: 0, late: 0, limitDays: 0 };
            return (
              <button
                type="button"
                key={s.k}
                className="stage"
                aria-pressed={s.k === cur}
                style={{ '--i': i }}
                onClick={() => onPick(s.k)}
              >
                {i === bnIdx && <span className="bn">Bottleneck</span>}
                <span className="n">{s.l}</span>
                <span className="c">{st.count}</span>
                <span className="v">
                  {st.count && st.freight ? `${lakh(st.freight)} freight` : '—'}
                </span>
                <span className={`late ${st.late ? '' : 'ok'}`}>
                  {st.late ? (
                    <>
                      <CcIcon n="alert" s={11} />
                      {st.late} past {st.limitDays}d limit
                    </>
                  ) : (
                    <>
                      <CcIcon n="check" s={11} />
                      On time
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PodWatch({ summary, onOpen }) {
  const ageing = summary?.pendingCounts?.podAgeing || {};
  const total = summary?.pendingCounts?.pendingPods || 0;
  const buckets = [
    { l: 'Under 7 days', n: ageing.under7d || 0, ...GRN, bar: '#25BA4C' },
    { l: '7–14 days', n: ageing.from7to14d || 0, ...AMB, bar: '#F0AA48' },
    { l: 'Over 14 days', n: ageing.over14d || 0, ...RED, bar: '#C2323A' },
  ];
  const oldest = summary?.podOldest || [];

  return (
    <div className="card" id="pod">
      <div className="card-head">
        <span style={{ color: 'var(--fg-brand)', display: 'inline-flex' }}>
          <CcIcon n="clock" />
        </span>
        <h2>POD ageing watch</h2>
      </div>
      <div className="pod-body">
        <div>
          <div className="pod-total">
            <span className="v">{total}</span>
            <span className="hint" style={{ color: 'var(--fg-secondary)' }}>
              trips closed, waiting for the physical POD
            </span>
          </div>
        </div>
        <div className="pod-bar">
          {total > 0 &&
            buckets.map((b) => (
              <i key={b.l} style={{ width: pct(b.n, total), background: b.bar }} />
            ))}
        </div>
        <div className="buckets">
          {buckets.map((b) => (
            <button
              type="button"
              key={b.l}
              className="bucket"
              style={{ '--c': b.c }}
              onClick={onOpen}
            >
              <div className="k">{b.l}</div>
              <div className="v">{b.n}</div>
            </button>
          ))}
        </div>
        <div className="oldest">
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            Oldest waiting
          </div>
          {oldest.length ? (
            oldest.map((t) => {
              const tone = t.ageDays > 14 ? RED : t.ageDays >= 7 ? AMB : GRN;
              return (
                <div className="orow" key={t._id}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="strong">
                      {t.vehicleNumber || '—'}{' '}
                      <span className="mono muted" style={{ fontWeight: 400 }}>
                        {t.ref}
                      </span>
                    </div>
                    <div className="muted">{t.partyName || '—'}</div>
                  </div>
                  <span className="pill" style={{ '--c': tone.c, '--tint': tone.tint }}>
                    {t.ageDays}d
                  </span>
                </div>
              );
            })
          ) : (
            <div className="orow">
              <span className="muted">No PODs outstanding.</span>
            </div>
          )}
        </div>
        <button type="button" className="btn" style={{ justifyContent: 'center' }} onClick={onOpen}>
          View all POD trips <CcIcon n="arrowR" s={14} />
        </button>
      </div>
    </div>
  );
}

function SortTh({ k, label, cls = '', sortKey, sortDir, onSort }) {
  const active = sortKey === k;
  return (
    <th
      className={`sortable ${cls}`}
      aria-sort={active ? (sortDir < 0 ? 'descending' : 'ascending') : undefined}
      onClick={() => onSort(k)}
    >
      {label}
      <span className="arr">{active ? (sortDir < 0 ? '↓' : '↑') : '↕'}</span>
    </th>
  );
}

const ErpHomePage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const queueRef = useRef(null);

  const [summary, setSummary] = useState(null);
  const [cur, setCur] = useState('cn');
  const [queue, setQueue] = useState({ key: null, rows: [], count: 0, late: 0, limitDays: 0 });
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [sortKey, setSortKey] = useState('ageDays');
  const [sortDir, setSortDir] = useState(-1);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [sel, setSel] = useState(() => new Set());

  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const pendingRunRef = useRef([]);
  const doneRunRef = useRef(0);
  const succeededRef = useRef(false);

  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [, setTick] = useState(0);
  const [spinKey, setSpinKey] = useState(0);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await ErpDashboardService.getSummary();
      if (res.success) setSummary(unwrap(res));
      else notify.error(res.message || 'Failed to load dashboard summary');
    } catch (err) {
      notify.error(
        err.response?.data?.message || err.message || 'Failed to load dashboard summary',
      );
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await ErpDashboardService.getQueue(cur, { limit: 200 });
      setQueue(unwrap(res) || { key: cur, rows: [] });
    } catch (err) {
      setQueue({ key: cur, rows: [], count: 0, late: 0, limitDays: 0 });
      notify.error(err.response?.data?.message || 'Failed to load queue');
    } finally {
      setLoadingQueue(false);
    }
  }, [cur]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const refreshAll = useCallback(() => {
    setUpdatedAt(Date.now());
    return Promise.all([fetchSummary(), fetchQueue()]);
  }, [fetchSummary, fetchQueue]);

  const pickStage = (k) => {
    setCur(k);
    setSel(new Set());
    setQuery('');
    setShowAll(false);
  };

  const openPod = () => {
    pickStage('pod');
    setSortKey('ageDays');
    setSortDir(-1);
    const el = queueRef.current;
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 16,
        behavior: 'smooth',
      });
    }
  };

  const stage = stageOf(cur);
  const allRows = useMemo(() => (queue.key === cur ? queue.rows || [] : []), [queue, cur]);
  const nLate = queue.key === cur ? queue.late || 0 : 0;
  const total = queue.key === cur ? queue.count || 0 : 0;
  const limitDays = queue.limitDays || 0;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = allRows.filter(
      (r) =>
        !q || [r.ref, r.partyName, r.vehicleNumber, r.material].join(' ').toLowerCase().includes(q),
    );
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return (av > bv ? 1 : av < bv ? -1 : 0) * sortDir;
    });
  }, [allRows, query, sortKey, sortDir]);
  const visible = showAll ? rows : rows.slice(0, QUEUE_PREVIEW);

  const onSort = (k) => {
    setSortDir(sortKey === k ? -sortDir : -1);
    setSortKey(k);
  };

  const toggleRow = (id, on) =>
    setSel((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const allVisibleSelected = visible.length > 0 && visible.every((r) => sel.has(r._id));
  const toggleAllVisible = (on) =>
    setSel((prev) => {
      const next = new Set(prev);
      visible.forEach((r) => (on ? next.add(r._id) : next.delete(r._id)));
      return next;
    });

  const navigateFor = (st, row) => {
    if (st.k === 'do') navigate('/erp/pipeline?tab=placement');
    else if (st.k === 'dispatch')
      navigate(row ? `/erp/trips/${row._id}` : '/erp/pipeline?tab=trips');
    else if (st.k === 'bill') navigate('/erp/billing?tab=bills');
  };

  const startRun = (targets) => {
    if (!targets.length) return;
    if (!stage.drawer) {
      navigateFor(stage, targets.length === 1 ? targets[0] : null);
      return;
    }
    const [first, ...rest] = targets;
    pendingRunRef.current = rest;
    doneRunRef.current = 0;
    succeededRef.current = false;
    setSelectedTrip(first);
    setActiveDrawer(stage.drawer);
  };

  const handleDrawerSuccess = () => {
    succeededRef.current = true;
  };

  const handleDrawerClose = () => {
    if (succeededRef.current) {
      succeededRef.current = false;
      doneRunRef.current += 1;
      const next = pendingRunRef.current.shift();
      if (next) {
        setSelectedTrip(next);
        return;
      }
    }
    const done = doneRunRef.current;
    pendingRunRef.current = [];
    doneRunRef.current = 0;
    setActiveDrawer(null);
    setSelectedTrip(null);
    if (done) {
      const idx = STAGES.indexOf(stage);
      const nextStage = STAGES[idx + 1];
      toast(
        `${stage.verb} done for ${plural(done, 'trip')}${nextStage ? ` · moved to ${nextStage.l}` : ''}`,
      );
      setSel(new Set());
      refreshAll();
    }
  };

  const handleRefresh = () => {
    setSpinKey((k) => k + 1);
    refreshAll().then(() => toast('Command center refreshed'));
  };

  const mins = Math.floor((Date.now() - updatedAt) / 60000);
  const selectedRows = allRows.filter((r) => sel.has(r._id));

  let body;
  if (loadingQueue && !allRows.length) {
    body = (
      <div className="empty">
        <span>Loading {stage.l.toLowerCase()}…</span>
      </div>
    );
  } else if (!allRows.length) {
    body = (
      <div className="empty">
        <span className="ok">
          <CcIcon n="check" s={22} />
        </span>
        <b>Queue is clear</b>
        <span>Nothing is waiting in {stage.l.toLowerCase()}.</span>
      </div>
    );
  } else if (!rows.length) {
    body = (
      <div className="empty">
        <b>No matches</b>
        <span>No record in this queue matches “{query}”.</span>
      </div>
    );
  }

  return (
    <>
      <div className="nova-cc">
        <div className="page">
          <header className="head">
            <div>
              <div className="crumbs">
                <span>ERP</span>
                <span>›</span>
                <b>Home</b>
              </div>
              <h1>ERP Command Center</h1>
              <div className="sub">
                Trips, approvals and money owed — and what needs doing next.
              </div>
            </div>
            <div className="tools">
              <span className="updated">
                <i />
                <span>{mins <= 0 ? 'Updated just now' : `Updated ${mins}m ago`}</span>
              </span>
              <button type="button" className="btn" onClick={handleRefresh}>
                <CcIcon key={spinKey} n="refresh" className={spinKey ? 'spin' : ''} />
                Refresh
              </button>
              <button
                type="button"
                className="btn btn--icon"
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                <CcIcon n={isDark ? 'sun' : 'moon'} s={18} />
              </button>
            </div>
          </header>

          <Kpis
            summary={summary}
            onReviewApprovals={(e) => {
              e.preventDefault();
              navigate('/erp/approvals');
            }}
          />

          <Rail pipeline={summary?.pipeline} cur={cur} onPick={pickStage} />

          <section className="cols">
            <div className="card" id="queue" ref={queueRef}>
              <div className="qhead">
                <h2>{stage.l}</h2>
                <span className="pill">{plural(total, stage.k === 'do' ? 'DO' : 'trip')}</span>
                {nLate > 0 && (
                  <span className="pill" style={{ '--c': RED.c, '--tint': RED.tint }}>
                    <i />
                    {nLate} past {limitDays}d limit
                  </span>
                )}
                <span className="sp" />
                <label className="search">
                  <CcIcon n="search" s={15} />
                  <input
                    type="search"
                    placeholder="Trip, party, vehicle…"
                    aria-label="Search queue"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              <div className={`bulk ${sel.size > 0 ? 'on' : ''}`}>
                <b>{sel.size} selected</b>
                <span className="sp" />
                <button type="button" className="btn btn--sm" onClick={() => setSel(new Set())}>
                  Clear
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--primary"
                  onClick={() => startRun(selectedRows)}
                >
                  {stage.verb} for selected
                </button>
              </div>
              {body || (
                <div style={{ overflowX: 'auto' }}>
                  <table className="tbl">
                    {
                      <>
                        <thead>
                          <tr>
                            <th style={{ width: 36 }}>
                              <input
                                type="checkbox"
                                className="cb"
                                aria-label="Select all"
                                checked={allVisibleSelected}
                                onChange={(e) => toggleAllVisible(e.target.checked)}
                              />
                            </th>
                            <th>{stage.col || 'Trip'}</th>
                            <th>Party</th>
                            <th className="hide-sm">Vehicle</th>
                            <th className="hide-sm">Material</th>
                            <SortTh k="ageDays" label="Waiting" {...{ sortKey, sortDir, onSort }} />
                            <SortTh
                              k="freight"
                              label="Freight"
                              cls="num"
                              {...{ sortKey, sortDir, onSort }}
                            />
                            <th style={{ textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((r) => {
                            const ratio = limitDays > 0 ? r.ageDays / limitDays : 0;
                            const tone = ratio > 1 ? RED : ratio >= 0.75 ? AMB : GRN;
                            return (
                              <tr key={r._id} className={sel.has(r._id) ? 'sel' : ''}>
                                <td>
                                  <input
                                    type="checkbox"
                                    className="cb"
                                    aria-label={`Select ${r.ref}`}
                                    checked={sel.has(r._id)}
                                    onChange={(e) => toggleRow(r._id, e.target.checked)}
                                  />
                                </td>
                                <td>
                                  <div className="strong mono">{r.ref}</div>
                                  <div className="muted">{shortDate(r.date)}</div>
                                </td>
                                <td>{r.partyName || '—'}</td>
                                <td className="hide-sm">
                                  <span className="strong">{r.vehicleNumber || '—'}</span>
                                </td>
                                <td className="hide-sm">
                                  {r.material || '—'}
                                  <div className="muted">
                                    {r.qty} {r.qtyUnit}
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className="pill"
                                    style={{ '--c': tone.c, '--tint': tone.tint }}
                                  >
                                    <i />
                                    {r.ageDays === 0 ? 'Today' : `${r.ageDays}d`}
                                  </span>
                                </td>
                                <td className="num">{r.freight == null ? '—' : inr(r.freight)}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    className="btn btn--sm"
                                    onClick={() => startRun([r])}
                                  >
                                    {stage.verb}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </>
                    }
                  </table>
                </div>
              )}
              {!body && (
                <div className="qfoot">
                  <span>
                    Showing {visible.length} of {rows.length} · limit {plural(limitDays, 'day')} for
                    this stage
                  </span>
                  <span className="sp" />
                  {rows.length > QUEUE_PREVIEW && (
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => setShowAll((v) => !v)}
                    >
                      {showAll ? 'Show fewer' : `Show all ${rows.length}`}
                    </button>
                  )}
                </div>
              )}
            </div>

            <PodWatch summary={summary} onOpen={openPod} />
          </section>
        </div>
        <div className={`toast ${toastMsg ? 'on' : ''}`} role="status">
          <CcIcon n="check" s={14} />
          <span>{toastMsg}</span>
        </div>
      </div>

      <ConsignmentDrawer
        isOpen={activeDrawer === 'cn'}
        onClose={handleDrawerClose}
        trip={selectedTrip}
        onSuccess={handleDrawerSuccess}
      />
      <TripCloseDrawer
        isOpen={activeDrawer === 'close'}
        onClose={handleDrawerClose}
        trip={selectedTrip}
        onSuccess={handleDrawerSuccess}
      />
      <PodDrawer
        isOpen={activeDrawer === 'pod'}
        onClose={handleDrawerClose}
        trip={selectedTrip}
        onSuccess={handleDrawerSuccess}
      />
      <UnloadingDrawer
        isOpen={activeDrawer === 'unloading'}
        onClose={handleDrawerClose}
        trip={selectedTrip}
        onSuccess={handleDrawerSuccess}
      />
    </>
  );
};

export default ErpHomePage;
