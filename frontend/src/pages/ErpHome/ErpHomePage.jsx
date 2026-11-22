import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsignmentDrawer from '../../components/Erp/Drawers/ConsignmentDrawer';
import TripCloseDrawer from '../../components/Erp/Drawers/TripCloseDrawer';
import PodDrawer from '../../components/Erp/Drawers/PodDrawer';
import UnloadingDrawer from '../../components/Erp/Drawers/UnloadingDrawer';
import ErrorCard from '../../components/redesign/ErrorCard';
import logger from '../../utils/logger';
import { useTheme } from '../../hooks/useTheme.js';
import ErpDashboardService from './ErpDashboardService';
import CcIcon from './commandCenterIcons';
import { STAGES, stageOf } from './commandCenterStages';
import { RED } from './commandCenterTones';
import { plural } from './commandCenterFormat';
import Kpis from './sections/Kpis';
import Rail from './sections/Rail';
import PodWatch from './sections/PodWatch';
import QueueTable from './sections/QueueTable';
import CommandCenterHeader from './sections/CommandCenterHeader';
import './erpCommandCenter.css';

const unwrap = (res) => res?.data;

const QUEUE_PREVIEW = 8;

const ErpHomePage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const queueRef = useRef(null);

  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [cur, setCur] = useState('cn');
  const [queue, setQueue] = useState(null);
  const [queueError, setQueueError] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(true);
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

  const [summaryUpdatedAt, setSummaryUpdatedAt] = useState(null);
  const [queueUpdatedAt, setQueueUpdatedAt] = useState(null);
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

  // The summary and the queue are two independent reads. Each one keeps its
  // own failure, and a failed read never rewrites the other one.
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await ErpDashboardService.getSummary();
      if (res && res.success === false) {
        const err = new Error(res.message || 'Dashboard summary request failed');
        err.status = typeof res.status === 'number' ? res.status : null;
        throw err;
      }
      setSummary(unwrap(res));
      setSummaryError(null);
      setSummaryUpdatedAt(Date.now());
      return true;
    } catch (err) {
      logger.error('erp-dashboard', 'summary request failed', {
        status: err?.status ?? err?.response?.status ?? null,
        message: err?.message ?? String(err),
      });
      setSummaryError(err);
      return false;
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await ErpDashboardService.getQueue(cur, { limit: 200 });
      const next = unwrap(res);
      // The stage a queue belongs to is stamped on it, so a queue from another
      // stage is never shown under this one.
      setQueue(next ? { ...next, key: next.key ?? cur } : { key: cur, rows: [] });
      setQueueError(null);
      setQueueUpdatedAt(Date.now());
      return true;
    } catch (err) {
      logger.error('erp-dashboard', 'queue request failed', {
        status: err?.status ?? err?.response?.status ?? null,
        message: err?.message ?? String(err),
        stage: cur,
      });
      // The last queue we managed to load stays on screen, marked as stale.
      setQueueError(err);
      return false;
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

  // A refresh only counts as a refresh when the requests actually succeeded.
  const refreshAll = useCallback(async () => {
    const [summaryOk, queueOk] = await Promise.all([fetchSummary(), fetchQueue()]);
    return { summary: summaryOk, queue: queueOk };
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
  const queueForStage = queue && queue.key === cur ? queue : null;
  const allRows = useMemo(() => queueForStage?.rows || [], [queueForStage]);
  // Unknown stays unknown: a count nobody loaded is not a count of zero.
  const nLate = queueForStage ? (queueForStage.late ?? 0) : null;
  const total = queueForStage ? (queueForStage.count ?? null) : null;
  const limitDays = queueForStage ? (queueForStage.limitDays ?? null) : null;

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

  const handleRefresh = async () => {
    setSpinKey((k) => k + 1);
    const result = await refreshAll();
    if (result.summary && result.queue) {
      toast('Command center refreshed');
    } else {
      toast('Some sections could not be refreshed — showing the last data we have.');
    }
  };

  // The header shows how old the oldest confirmed section is. It never moves
  // forward on a request that failed.
  const confirmedAt =
    [summaryUpdatedAt, queueUpdatedAt].filter(Boolean).sort((a, b) => a - b)[0] ?? null;
  const mins = confirmedAt == null ? null : Math.floor((Date.now() - confirmedAt) / 60000);
  const selectedRows = allRows.filter((r) => sel.has(r._id));

  let body;
  if (loadingQueue && !allRows.length) {
    body = (
      <div className="empty">
        <span>Loading {stage.l.toLowerCase()}…</span>
      </div>
    );
  } else if (queueError && !allRows.length) {
    // The failure is shown in the card below — never as an empty queue.
    body = null;
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
          <CommandCenterHeader
            mins={mins}
            handleRefresh={handleRefresh}
            spinKey={spinKey}
            isDark={isDark}
            toggleTheme={toggleTheme}
          />

          {summaryError ? (
            <div style={{ marginBottom: 12 }}>
              <ErrorCard error={summaryError} onRetry={fetchSummary} />
              {summary ? (
                <p style={{ color: 'var(--fg-secondary)', fontSize: 12, margin: '6px 0 0' }}>
                  Showing the last figures we loaded — they may be out of date.
                </p>
              ) : null}
            </div>
          ) : null}

          <Kpis
            summary={summary}
            loading={summaryLoading && !summary}
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
                <span className="pill">
                  {total == null ? '—' : plural(total, stage.k === 'do' ? 'DO' : 'trip')}
                </span>
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
              {queueError ? (
                <div style={{ padding: '12px 16px 0' }}>
                  <ErrorCard error={queueError} onRetry={fetchQueue} />
                  {allRows.length ? (
                    <p style={{ color: 'var(--fg-secondary)', fontSize: 12, margin: '6px 0 0' }}>
                      Showing the last queue we loaded — it may be out of date.
                    </p>
                  ) : null}
                </div>
              ) : null}
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
                <QueueTable
                  visible={visible}
                  sel={sel}
                  allVisibleSelected={allVisibleSelected}
                  toggleAllVisible={toggleAllVisible}
                  toggleRow={toggleRow}
                  stage={stage}
                  limitDays={limitDays}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                  startRun={startRun}
                />
              )}
              {!body && (
                <div className="qfoot">
                  <span>
                    Showing {visible.length} of {rows.length} · limit{' '}
                    {limitDays == null ? '—' : plural(limitDays, 'day')} for this stage
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
