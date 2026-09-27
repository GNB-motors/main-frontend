import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  MessageSquare,
  Droplet,
  Download,
  Search,
  Truck,
  ChevronRight,
  Inbox,
  Check,
  CheckCheck,
  Wallet,
  BookText,
  Gauge,
  Radio,
  PencilLine,
} from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../../utils/session';
import {
  STATUS_META,
  TABS,
  checkList,
  displayStatus,
  isPending,
  km,
  listStats,
  money,
  num2,
  openCount,
  orgOf,
  photoOdometerOf,
  searchFilter,
  shortDateTime,
  submitterOf,
  toCsv,
  vehicleOf,
} from './whatsappApprovals.logic';
import '../../../styles/nova/novaDesignSystem.css';
import './ReceiptApproval.css';

/* Inbox for fuel bills captured over WhatsApp.
   Ported from the "WhatsApp Approvals" Nova Edge Pro mockup; the endpoints
   underneath are unchanged. */

const ODOMETER_MODES = [
  {
    key: 'INTERACTIVE',
    label: 'Ask driver',
    icon: <MessageSquare size={13} />,
    hint: 'The bot asks for the odometer — photo, typed reading, or FleetEdge.',
  },
  {
    key: 'FLEETEDGE',
    label: 'Auto FleetEdge',
    icon: <Radio size={13} />,
    hint: 'Pull the latest telematics reading; fall back to asking if none.',
  },
  {
    key: 'MANUAL',
    label: 'Manual only',
    icon: <PencilLine size={13} />,
    hint: 'Only a photo or typed reading — never offer FleetEdge.',
  },
];

/* Per-org odometer capture mode. Sits as the fifth tile in the stat strip,
   which is where the mockup puts it. Hidden on the cross-org superadmin route
   because there is no single org to set it for. */
const CaptureTile = () => {
  const { organization } = useFeatureFlags();
  const [mode, setMode] = useState(organization?.whatsappSettings?.odometerMode || 'INTERACTIVE');
  const [saving, setSaving] = useState(false);

  const canEdit = ['OWNER', 'MANAGER'].includes((getUserRole() || '').toUpperCase());

  useEffect(() => {
    let alive = true;
    apiClient
      .get('/api/whatsapp/settings')
      .then((res) => {
        if (alive && res.data?.data?.odometerMode) setMode(res.data.data.odometerMode);
      })
      .catch(() => {}); // keep the default; the PATCH below surfaces any real error
    return () => {
      alive = false;
    };
  }, []);

  const change = useCallback(
    async (next) => {
      if (next === mode || saving || !canEdit) return;
      const prev = mode;
      setMode(next);
      setSaving(true);
      try {
        await apiClient.patch('/api/whatsapp/settings', { odometerMode: next });
        toast.success('Odometer capture mode updated');
      } catch (err) {
        setMode(prev);
        toast.error(err.response?.data?.message || 'Failed to update');
      } finally {
        setSaving(false);
      }
    },
    [mode, saving, canEdit],
  );

  const hint = ODOMETER_MODES.find((o) => o.key === mode)?.hint;

  return (
    <div className="capture">
      <div>
        <b>
          <Gauge size={14} />
          Odometer capture
        </b>
        <p>{hint}</p>
      </div>
      <div className="seg">
        {ODOMETER_MODES.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={mode === key}
            disabled={!canEdit || saving}
            onClick={() => change(key)}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

const StatTile = ({ accent, icon, k, v, n }) => (
  <div className={`stat ${accent ? 'stat--accent' : ''}`}>
    <div className="k">
      {icon}
      {k}
    </div>
    <div className="v">{v}</div>
    <div className="n">{n}</div>
  </div>
);

const ReceiptApprovalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperadminRoute = location.pathname.startsWith('/superadmin');
  const basePath = isSuperadminRoute ? '/superadmin/receipts' : '/whatsapp-approvals';

  const [status, setStatus] = useState('READY');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [draftsRes, countsRes] = await Promise.all([
        apiClient.get('/api/whatsapp/admin/drafts', { params: { status, limit: 200 } }),
        apiClient.get('/api/whatsapp/admin/drafts/counts').catch(() => null),
      ]);
      setItems(draftsRes.data?.data?.items ?? []);
      if (countsRes?.data?.data) setCounts(countsRes.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
    setPicked(new Set());
  }, [fetchData]);

  const rows = useMemo(() => searchFilter(items, query), [items, query]);
  const stats = useMemo(() => listStats(items, counts), [items, counts]);

  const pendingRows = useMemo(() => rows.filter(isPending), [rows]);
  const allChecked = pendingRows.length > 0 && pendingRows.every((d) => picked.has(d._id));

  /* Only bills with nothing open can be published in bulk. The single-bill
     screen is where a flagged one gets read and decided; letting the bulk bar
     wave them through would defeat the checks entirely. */
  const cleanPicked = useMemo(
    () => items.filter((d) => picked.has(d._id) && isPending(d) && !openCount(d)),
    [items, picked],
  );

  const togglePick = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (checked) =>
    setPicked((prev) => {
      const next = new Set(prev);
      pendingRows.forEach((d) => (checked ? next.add(d._id) : next.delete(d._id)));
      return next;
    });

  const publishClean = useCallback(async () => {
    if (!cleanPicked.length || busy) return;
    setBusy(true);
    try {
      const ids = cleanPicked.map((d) => d._id);
      const res = await apiClient.post('/api/whatsapp/admin/drafts/bulk-publish', { ids });
      const { successCount = 0, failureCount = 0, failed = [] } = res.data?.data || {};
      if (successCount) {
        toast.success(
          `${successCount} bill${successCount === 1 ? '' : 's'} published to the fuel ledger`,
        );
      }
      if (failureCount) {
        const msgs = Array.from(new Set(failed.map((f) => f.message).filter(Boolean)));
        if (msgs.length) msgs.forEach((m) => toast.error(m));
        else toast.error(`${failureCount} bill${failureCount === 1 ? '' : 's'} failed to publish`);
      }
      setPicked(new Set());
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk publish failed');
    } finally {
      setBusy(false);
    }
  }, [cleanPicked, busy, fetchData]);

  const exportCsv = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
    a.download = 'whatsapp-fuel-approvals.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`${rows.length} bill${rows.length === 1 ? '' : 's'} exported`);
  };

  const totals = rows.reduce(
    (acc, d) => ({
      litres: acc.litres + (Number(d.litres) || 0),
      amount: acc.amount + (Number(d.amount) || 0),
    }),
    { litres: 0, amount: 0 },
  );

  return (
    <div className="wa-root">
      <div className="lpage">
        <header className="head">
          <div className="mark" aria-hidden="true">
            <MessageSquare size={24} />
            <span className="drop">
              <Droplet size={11} fill="currentColor" />
            </span>
          </div>
          <div className="htitle">
            <h1>WhatsApp fuel approvals</h1>
            <p>Review fuel bills captured over WhatsApp and publish them into the fuel ledger.</p>
          </div>
          <span className="wa-sp" />
          <button type="button" className="btn" onClick={exportCsv} disabled={!rows.length}>
            <Download size={16} />
            Export
          </button>
        </header>

        <section className="stats">
          <StatTile
            accent
            icon={<Inbox size={14} />}
            k="Pending review"
            v={stats.pendingCount}
            n={stats.flaggedCount ? `${stats.flaggedCount} with open checks` : 'Nothing flagged'}
          />
          <StatTile
            icon={<Check size={14} />}
            k="Clean bills"
            v={stats.cleanCount}
            n="All checks passed"
          />
          <StatTile
            icon={<Wallet size={14} />}
            k="Pending value"
            v={`₹${Math.round(stats.pendingValue).toLocaleString('en-IN')}`}
            n={`${num2(stats.pendingLitres)} L waiting`}
          />
          <StatTile
            icon={<BookText size={14} />}
            k="Published"
            v={stats.publishedCount}
            n="All time"
          />
          {!isSuperadminRoute && <CaptureTile />}
        </section>

        <section className="card">
          <div className="bar">
            <div className="tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className="tab"
                  aria-pressed={status === t.key}
                  onClick={() => setStatus(t.key)}
                >
                  {t.label}
                  {t.key !== 'ALL' && counts[t.key] != null && <b>{counts[t.key]}</b>}
                </button>
              ))}
            </div>
            <span className="wa-sp" />
            <label className="search">
              <Search size={15} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vehicle, org, driver, station"
                aria-label="Search vehicle, organisation, driver or station"
              />
            </label>
          </div>

          {picked.size > 0 && (
            <div className="bulk">
              <span>
                {picked.size} selected · {cleanPicked.length} clean
              </span>
              <span className="wa-sp" />
              <button type="button" className="btn btn--sm" onClick={() => setPicked(new Set())}>
                Clear selection
              </button>
              <button
                type="button"
                className="btn btn--sm btn--primary"
                onClick={publishClean}
                disabled={!cleanPicked.length || busy}
              >
                {busy ? 'Publishing…' : `Publish ${cleanPicked.length} clean`}
              </button>
            </div>
          )}

          {error && <div className="wa-alert wa-alert--error">{error}</div>}

          <div className="tblwrap">
            <table>
              <thead>
                <tr>
                  <th className="cb">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      disabled={!pendingRows.length}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label="Select all pending bills"
                    />
                  </th>
                  <th>Vehicle</th>
                  <th>Organisation</th>
                  <th className="num">Litres</th>
                  <th className="num">Amount</th>
                  <th className="num">Odometer</th>
                  <th>Checks</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  rows.map((d) => {
                    const cs = checkList(d);
                    const okN = cs.filter((c) => c.ok !== false).length;
                    const odoWarn = cs.find((c) => c.id === 'odo' && c.ok === false);
                    const photoOdo = photoOdometerOf(d);
                    const s = STATUS_META[displayStatus(d)] || STATUS_META.CLEARED;
                    return (
                      <tr key={d._id} onClick={() => navigate(`${basePath}/${d._id}`)}>
                        <td className="cb" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={picked.has(d._id)}
                            disabled={!isPending(d)}
                            onChange={() => togglePick(d._id)}
                            aria-label={`Select bill for ${vehicleOf(d)}`}
                            title={`Select bill for ${vehicleOf(d)}`}
                          />
                        </td>
                        <td>
                          <div className="veh">
                            <span className="vi">
                              <Truck size={17} />
                            </span>
                            <div>
                              <b>{vehicleOf(d)}</b>
                              <span>{submitterOf(d)}</span>
                            </div>
                          </div>
                        </td>
                        <td>{orgOf(d)}</td>
                        <td className="num numv">
                          {d.litres != null ? `${num2(d.litres)} L` : '—'}
                        </td>
                        <td className="num numv">
                          {money(d.amount)}
                          {d.rate != null && <span className="sub">₹{d.rate}/L</span>}
                        </td>
                        <td className="num numv">
                          {km(d.odometerReading)}
                          {odoWarn && photoOdo ? (
                            <span className="sub warn">Photo shows {km(photoOdo)}</span>
                          ) : (
                            <span className="sub">km</span>
                          )}
                        </td>
                        <td>
                          <div className="dots">
                            {cs.map((c) => (
                              <i
                                key={c.id}
                                title={c.title}
                                style={{
                                  '--c':
                                    c.ok === false
                                      ? '#C56200'
                                      : c.ok === null
                                        ? '#C6C6C9'
                                        : '#187A32',
                                }}
                              />
                            ))}
                            <span>
                              {okN}/{cs.length}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="pill" style={{ '--c': s.c, '--tint': s.tint }}>
                            <i />
                            {s.label}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{shortDateTime(d.createdAt)}</td>
                        <td>
                          <span className="chev">
                            <ChevronRight size={16} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="wa-loading">
              <div className="wa-spin" />
            </div>
          )}

          {!loading && !rows.length && (
            <div className="empty">
              <span className="ok">
                <CheckCheck size={24} />
              </span>
              <b>{status === 'READY' && !query ? "You're all caught up" : 'Nothing here'}</b>
              <span>
                {query
                  ? 'No bills match your search.'
                  : status === 'READY'
                    ? 'New WhatsApp bills will appear here as drivers send them.'
                    : 'No bills in this state.'}
              </span>
            </div>
          )}

          {!loading && rows.length > 0 && (
            <div className="tfoot">
              <span>
                {rows.length} bill{rows.length === 1 ? '' : 's'} · {num2(totals.litres)} L ·{' '}
                {money(totals.amount)}
              </span>
              <span className="wa-sp" />
              <span>Click a row to open the receipt</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReceiptApprovalPage;
