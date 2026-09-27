import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Droplet,
  Wallet,
  Tag,
  Gauge,
  Clock,
  Receipt,
  Columns2,
  ChevronLeft,
  ChevronRight,
  Archive,
  XCircle,
  CheckCircle2,
  Check,
  AlertCircle,
  BookText,
  Plus,
  Minus,
  RotateCw,
  Maximize,
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import {
  STATUS_META,
  checkList,
  confidenceOf,
  dateTime,
  displayStatus,
  isPending,
  km,
  money,
  num2,
  openCount,
  orgOf,
  photoOdometerOf,
  submitterOf,
  vehicleOf,
} from './whatsappApprovals.logic';
import '../../../styles/nova/novaDesignSystem.css';
import './ReceiptApproval.css';

/* Review + decide on a single WhatsApp fuel bill.
   Ported from the "WhatsApp Approvals" Nova Edge Pro mockup; the publish /
   reject / clear endpoints underneath are unchanged. */

const REJECT_REASONS = [
  'Odometer photo does not match the fill',
  'Bill submitted too late',
  'Bill photo is unreadable',
  'Wrong vehicle on bill',
  'Duplicate bill',
];

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 6;

/* ── evidence viewer ─────────────────────────────────────────────────────── */

const NoPhoto = ({ kind }) => (
  <div className="nophoto">
    <span className="ic">
      <ImageIcon size={22} />
    </span>
    <b style={{ color: 'var(--fg-primary)' }}>
      {kind === 'bill' ? 'Bill photo' : 'Odometer photo'}
    </b>
    Not attached to this submission
  </div>
);

/**
 * Pan/zoom surface for the bill and odometer photos.
 *
 * A reviewer's real question is "what does the small print say", so the stage
 * is transformed rather than the image resized — the browser keeps the full
 * resolution and zooming stays sharp instead of resampling a scaled-down copy.
 */
const Viewer = ({ src, view, caption }) => {
  const ref = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    setZoom(1);
    setRot(0);
    setPan({ x: 0, y: 0 });
  }, []);

  // A new photo should not inherit the previous one's zoom and offset.
  useEffect(reset, [src, reset]);

  const onWheel = (e) => {
    if (!src) return;
    e.preventDefault();
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * (e.deltaY < 0 ? 1.12 : 0.89))));
  };

  const onDown = (e) => {
    if (!src) return;
    drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    setDragging(true);
  };
  const onMove = (e) => {
    if (!drag.current) return;
    setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
  };
  const stop = () => {
    drag.current = null;
    setDragging(false);
  };

  return (
    <div
      className={`viewer${dragging ? ' dragging' : ''}${view === 'split' ? ' split' : ''}`}
      ref={ref}
      onWheel={onWheel}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={stop}
      onMouseLeave={stop}
      role="presentation"
    >
      <div className="pane">
        {caption && (
          <div className="caption">
            <span>{caption}</span>
          </div>
        )}
        {src ? (
          <div
            className="stage"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rot}deg)`,
            }}
          >
            <img src={src} alt={caption || 'Evidence'} draggable={false} />
          </div>
        ) : (
          <NoPhoto kind={view === 'odo' ? 'odo' : 'bill'} />
        )}
      </div>

      {src && (
        <div className="tools" onMouseDown={(e) => e.stopPropagation()} role="presentation">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z * 0.85))}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <Minus size={16} />
          </button>
          <span className="zl">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z * 1.18))}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={() => setRot((r) => (r + 90) % 360)}
            aria-label="Rotate"
            title="Rotate"
          >
            <RotateCw size={16} />
          </button>
          <button type="button" onClick={reset} aria-label="Fit to view" title="Fit to view">
            <Maximize size={16} />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            aria-label="Open full size"
            title="Open full size"
            style={{ width: 32, height: 32, display: 'grid', placeItems: 'center' }}
          >
            <ExternalLink size={16} />
          </a>
        </div>
      )}
    </div>
  );
};

/* ── details rows ────────────────────────────────────────────────────────── */

const Row = ({ k, v, src, full, warn }) => (
  <div className={`dr${full ? ' full' : ''}${warn ? ' warn' : ''}`}>
    <div className="k">
      {k}
      {src && <span className="src">{src}</span>}
    </div>
    <div className="v">{v ?? '—'}</div>
  </div>
);

/* ── page ────────────────────────────────────────────────────────────────── */

const ReceiptApprovalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperadminRoute = location.pathname.startsWith('/superadmin');
  const basePath = isSuperadminRoute ? '/superadmin/receipts' : '/whatsapp-approvals';

  const [draft, setDraft] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('bill');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  /* A reviewer's "I looked at this" decision. Session-only on purpose: there is
     no endpoint that stores it, and writing it to look persistent would lie. */
  const [acked, setAcked] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/api/whatsapp/admin/drafts/${id}`);
      setDraft(res.data?.data ?? null);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    setAcked(new Set());
    setView('bill');
    setRejecting(false);
  }, [load]);

  // The pager walks the same queue the list was showing, so "next" means the
  // next bill a reviewer would have clicked — not the next id in the database.
  useEffect(() => {
    let alive = true;
    apiClient
      .get('/api/whatsapp/admin/drafts', { params: { status: 'READY', limit: 200 } })
      .then((res) => {
        if (alive) setSiblings(res.data?.data?.items ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const act = useCallback(
    async (kind, body) => {
      setBusy(true);
      try {
        await apiClient.post(`/api/whatsapp/admin/drafts/${id}/${kind}`, body);
        toast.success(
          kind === 'publish'
            ? 'Published to the fuel ledger'
            : kind === 'reject'
              ? 'Bill rejected'
              : 'Cleared from the queue',
        );
        setRejecting(false);
        await load();
      } catch (e) {
        toast.error(e.response?.data?.message || `${kind} failed`);
      } finally {
        setBusy(false);
      }
    },
    [id, load],
  );

  const checks = useMemo(() => checkList(draft, acked), [draft, acked]);
  const open = useMemo(() => (draft ? openCount(draft, acked) : 0), [draft, acked]);

  const idx = useMemo(() => siblings.findIndex((d) => d._id === id), [siblings, id]);
  const go = (n) => {
    const next = siblings[n];
    if (next) navigate(`${basePath}/${next._id}`);
  };

  if (loading) {
    return (
      <div className="wa-root">
        <div className="wa-loading">
          <div className="wa-spin" />
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="wa-root">
        <div className="lpage">
          <button type="button" className="btn" onClick={() => navigate(basePath)}>
            <ChevronLeft size={16} /> Back to approvals
          </button>
          <div className="wa-alert wa-alert--error" style={{ margin: 0 }}>
            {error || 'Receipt not found.'}
          </div>
        </div>
      </div>
    );
  }

  const s = STATUS_META[displayStatus(draft, acked)] || STATUS_META.CLEARED;
  const pending = isPending(draft);
  const conf = confidenceOf(draft);
  const photoOdo = photoOdometerOf(draft);
  const odoCheck = checks.find((c) => c.id === 'odo');
  const lagCheck = checks.find((c) => c.id === 'lag');
  const mathCheck = checks.find((c) => c.id === 'math');
  const billSrc = draft.fuelImageUrl || null;
  const odoSrc = draft.odometerImageUrl || null;

  const verdict = !pending
    ? draft.status === 'PUBLISHED'
      ? {
          c: '#2F58EE',
          tint: 'rgba(47,88,238,.10)',
          icon: <BookText size={17} />,
          t: 'Published to the fuel ledger',
          sub: draft.publishedAt ? `On ${dateTime(draft.publishedAt)}.` : 'Already in the ledger.',
        }
      : draft.status === 'REJECTED'
        ? {
            c: '#C2323A',
            tint: 'rgba(229,104,107,.12)',
            icon: <XCircle size={17} />,
            t: 'Rejected',
            sub: draft.rejectReason || 'Removed from the queue.',
          }
        : {
            c: '#5D5D5E',
            tint: 'rgba(93,93,94,.10)',
            icon: <Archive size={17} />,
            t: 'Cleared from the queue',
            sub: draft.clearNote || 'Archived.',
          }
    : open
      ? {
          c: '#C56200',
          tint: 'rgba(240,170,72,.12)',
          icon: <AlertCircle size={17} />,
          t: `${open} thing${open > 1 ? 's' : ''} to check before publishing`,
          sub: 'Read each one, then mark it as reviewed.',
        }
      : {
          c: '#187A32',
          tint: 'rgba(37,186,76,.10)',
          icon: <Check size={17} />,
          t: 'Ready to publish',
          sub: 'All checks passed or reviewed.',
        };

  return (
    <div className="wa-root">
      <header className="top">
        <div className="topin">
          <div>
            <nav className="crumb">
              <button type="button" onClick={() => navigate(basePath)}>
                WhatsApp fuel approvals
              </button>
              <span>/</span>
              <span>{STATUS_META[draft.status]?.label || draft.status}</span>
            </nav>
            <div className="ttl">
              <h1>Fuel receipt · {vehicleOf(draft)}</h1>
              <span className="pill" style={{ '--c': s.c, '--tint': s.tint }}>
                <i />
                {s.label}
              </span>
            </div>
          </div>
          <span className="wa-sp" />
          {idx >= 0 && siblings.length > 1 && (
            <div className="pager">
              <button
                type="button"
                className="btn btn--icon btn--ghost"
                onClick={() => go(idx - 1)}
                disabled={idx <= 0}
                aria-label="Previous bill"
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                {idx + 1} of {siblings.length}
              </span>
              <button
                type="button"
                className="btn btn--icon btn--ghost"
                onClick={() => go(idx + 1)}
                disabled={idx >= siblings.length - 1}
                aria-label="Next bill"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {pending ? (
              <>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => act('clear', {})}
                  disabled={busy}
                >
                  <Archive size={16} />
                  Clear
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => setRejecting((r) => !r)}
                  disabled={busy}
                >
                  <XCircle size={16} />
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => act('publish', {})}
                  disabled={busy}
                >
                  <CheckCircle2 size={16} />
                  {open ? `Publish with ${open} open` : 'Publish to fuel ledger'}
                </button>
              </>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>{verdict.sub}</span>
            )}
          </div>
        </div>

        {rejecting && (
          <div className="rejwrap">
            <div className="reject">
              <span style={{ fontSize: 'var(--type-2xs)', fontWeight: 600, color: '#C2323A' }}>
                Reject this bill
              </span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-label="Rejection reason"
              >
                {REJECT_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <span className="wa-sp" />
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => setRejecting(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--sm btn--danger"
                style={{ borderColor: 'rgba(194,50,58,.3)' }}
                onClick={() => act('reject', { reason })}
                disabled={busy}
              >
                Confirm reject
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="dpage">
        <section className="figs">
          <div className="fig">
            <div className="k">
              <Droplet size={14} />
              Litres
            </div>
            <div className="v">
              {draft.litres != null ? num2(draft.litres) : '—'} <small>L</small>
            </div>
            <div className="n">
              {(draft.fuelType || '—').toLowerCase()} ·{' '}
              {(draft.fillingType || '').replace('_', ' ').toLowerCase() || '—'}
            </div>
          </div>
          <div className="fig">
            <div className="k">
              <Wallet size={14} />
              Amount
            </div>
            <div className="v">{money(draft.amount)}</div>
            <div className="n">
              {mathCheck?.ok === true && <Check size={12} />}
              {mathCheck?.ok === true
                ? 'Matches litres × rate'
                : mathCheck?.ok === false
                  ? 'Does not match litres × rate'
                  : 'Not checked'}
            </div>
          </div>
          <div className="fig">
            <div className="k">
              <Tag size={14} />
              Rate
            </div>
            <div className="v">
              {draft.rate != null ? `₹${draft.rate}` : '—'}
              <small>/L</small>
            </div>
            <div className="n">Pump price on the bill</div>
          </div>
          <div className={`fig${odoCheck?.ok === false ? ' warn' : ''}`}>
            <div className="k">
              <Gauge size={14} />
              Odometer
            </div>
            <div className="v">
              {km(draft.odometerReading)} <small>km</small>
            </div>
            <div className="n">
              {odoCheck?.ok === false && <AlertCircle size={12} />}
              {odoCheck?.ok === false && photoOdo
                ? `Photo shows ${km(photoOdo)}`
                : draft.odometerSource
                  ? `From ${String(draft.odometerSource).toLowerCase()}`
                  : 'As read'}
            </div>
          </div>
          <div className={`fig${lagCheck?.ok === false ? ' warn' : ''}`}>
            <div className="k">
              <Clock size={14} />
              Bill date
            </div>
            <div className="v" style={{ fontSize: 'var(--type-l)' }}>
              {draft.billDatetime
                ? new Date(draft.billDatetime).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </div>
            <div className="n">
              {lagCheck?.ok === false && <AlertCircle size={12} />}
              {lagCheck?.value === 'No data' ? 'No bill date' : lagCheck?.title}
            </div>
          </div>
        </section>

        <section className="grid">
          <div className="card evcard">
            <div className="chead">
              <h2>Evidence</h2>
              <span className="hint">
                {billSrc || odoSrc ? 'Scroll to zoom, drag to pan' : 'No photos on this submission'}
              </span>
              <span className="wa-sp" />
              <div className="seg">
                <button
                  type="button"
                  aria-pressed={view === 'bill'}
                  onClick={() => setView('bill')}
                >
                  <Receipt size={13} />
                  Fuel bill
                </button>
                <button type="button" aria-pressed={view === 'odo'} onClick={() => setView('odo')}>
                  <Gauge size={13} />
                  Odometer
                </button>
                <button
                  type="button"
                  aria-pressed={view === 'split'}
                  onClick={() => setView('split')}
                >
                  <Columns2 size={13} />
                  Side by side
                </button>
              </div>
            </div>

            {view === 'split' ? (
              <div className="viewer split">
                <Viewer src={billSrc} view="bill" caption="Fuel bill" />
                <Viewer src={odoSrc} view="odo" caption="Odometer" />
              </div>
            ) : (
              <Viewer
                src={view === 'odo' ? odoSrc : billSrc}
                view={view}
                caption={view === 'odo' ? 'Odometer' : 'Fuel bill'}
              />
            )}

            <div className="thumbs">
              <button
                type="button"
                className="thumb"
                aria-pressed={view === 'bill'}
                onClick={() => setView('bill')}
                aria-label="Show the fuel bill"
                title="Fuel bill"
              >
                {billSrc ? <img src={billSrc} alt="" /> : <Receipt size={18} />}
              </button>
              <button
                type="button"
                className="thumb"
                aria-pressed={view === 'odo'}
                onClick={() => setView('odo')}
                aria-label="Show the odometer photo"
                title="Odometer"
              >
                {odoSrc ? <img src={odoSrc} alt="" /> : <Gauge size={18} />}
              </button>
              <span className="meta">
                <b>{vehicleOf(draft)}</b>
                {submitterOf(draft)} · {dateTime(draft.createdAt)}
              </span>
            </div>
          </div>

          <div className="side">
            <div className="card">
              <div
                className={`verdict${pending ? '' : ' done'}`}
                style={{ '--c': verdict.c, '--tint': verdict.tint }}
              >
                <span className="vc">{verdict.icon}</span>
                <div>
                  <b>{verdict.t}</b>
                  <span>{verdict.sub}</span>
                </div>
                <span className="score">
                  {checks.length - open}/{checks.length}
                  {pending ? '' : ' checks passed'}
                </span>
              </div>
              <div className="checks">
                {checks.map((c) => {
                  const tone =
                    c.ok === false
                      ? {
                          c: '#C56200',
                          tint: 'rgba(240,170,72,.16)',
                          icon: <AlertCircle size={13} />,
                        }
                      : c.ok === null
                        ? { c: '#5D5D5E', tint: 'rgba(93,93,94,.10)', icon: <Minus size={13} /> }
                        : { c: '#187A32', tint: 'rgba(37,186,76,.12)', icon: <Check size={13} /> };
                  return (
                    <div key={c.id} className="ck" style={{ '--c': tone.c, '--tint': tone.tint }}>
                      <span className="ci">{tone.icon}</span>
                      <div>
                        <b>{c.title}</b>
                        <p>{c.detail}</p>
                        {pending && c.ok === false && c.ackable && (
                          <div className="fix">
                            <button
                              type="button"
                              className="btn btn--sm"
                              onClick={() => setAcked((p) => new Set(p).add(c.id))}
                            >
                              Mark as reviewed
                            </button>
                          </div>
                        )}
                        {pending && acked.has(c.id) && (
                          <div className="fix">
                            <button
                              type="button"
                              className="btn btn--sm btn--ghost"
                              onClick={() =>
                                setAcked((p) => {
                                  const n = new Set(p);
                                  n.delete(c.id);
                                  return n;
                                })
                              }
                            >
                              Reviewed · undo
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="val">{c.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="chead">
                <h2>Extracted details</h2>
                <span className="hint">
                  {conf != null ? `Read from bill · ${conf}% confidence` : 'Read from bill'}
                </span>
              </div>
              <div>
                <div className="dgroup">
                  <h3>Fuel</h3>
                  <div className="dl">
                    <Row k="Litres" v={draft.litres != null ? `${num2(draft.litres)} L` : null} />
                    <Row k="Amount" v={draft.amount != null ? money(draft.amount) : null} />
                    <Row k="Rate" v={draft.rate != null ? `₹${draft.rate} /L` : null} />
                    <Row k="Fuel type" v={draft.fuelType} />
                    <Row k="Filling" v={draft.fillingType?.replace('_', ' ')} />
                  </div>
                </div>
                <div className="dgroup">
                  <h3>Vehicle</h3>
                  <div className="dl">
                    <Row k="Vehicle" v={vehicleOf(draft)} />
                    <Row k="Plate on bill" v={draft.plateText} src="OCR" />
                    <Row
                      k="Odometer"
                      v={draft.odometerReading != null ? `${km(draft.odometerReading)} km` : null}
                      src={draft.odometerSource}
                      warn={odoCheck?.ok === false}
                    />
                    {conf != null && (
                      <Row
                        k="OCR confidence"
                        v={
                          <span className="conf">
                            {conf}%
                            <span className="cb2">
                              <i style={{ width: `${conf}%` }} />
                            </span>
                          </span>
                        }
                      />
                    )}
                  </div>
                </div>
                <div className="dgroup">
                  <h3>Bill &amp; station</h3>
                  <div className="dl">
                    <Row
                      k="Bill date"
                      v={dateTime(draft.billDatetime)}
                      warn={lagCheck?.ok === false}
                    />
                    <Row k="Received" v={dateTime(draft.createdAt)} />
                    <Row k="Station" v={draft.stationName} full />
                  </div>
                </div>
                <div className="dgroup">
                  <h3>Submission</h3>
                  <div className="dl">
                    <Row k="Submitted by" v={submitterOf(draft)} />
                    <Row k="Organisation" v={orgOf(draft)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ReceiptApprovalDetailPage;
