import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  HelpCircle,
  ImageIcon,
  MapPin,
  MessageSquare,
  MessageSquareWarning,
  MousePointerClick,
  RefreshCw,
  Receipt,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Truck,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { WhatsAppAuditService } from './WhatsAppAuditService';
import './WhatsAppAuditPage.css';

const STAGE_LABELS = {
  IDENTITY_AUTH: { label: 'Identity / Auth', color: '#dc2626', icon: ShieldAlert },
  OCR_EXTRACTION: { label: 'OCR & Receipt Parsing', color: '#ea580c', icon: ImageIcon },
  VEHICLE_RESOLUTION: { label: 'Vehicle Resolution', color: '#d97706', icon: Bot },
  MEDIA_VALIDATION: { label: 'Media Format / Size', color: '#b45309', icon: FileText },
  RATE_LIMIT: { label: 'Rate Limiting', color: '#7c3aed', icon: AlertTriangle },
  FEATURE_FLAG: { label: 'Feature Flag Disabled', color: '#6366f1', icon: SlidersHorizontal },
  OUTBOUND_DELIVERY: { label: 'Outbound Meta Send', color: '#e11d48', icon: Send },
  WORKER_LOCK: { label: 'Lock Contention', color: '#475569', icon: Clock },
  SYSTEM_ERROR: { label: 'System Exception', color: '#991b1b', icon: AlertCircle },
};

function relativeTime(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.round((now - then) / 1000);
  if (seconds < 0) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

const WhatsAppAuditPage = () => {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [organizations, setOrganizations] = useState([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [orgFilter, setOrgFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30);

  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Trace Drawer
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [traceData, setTraceData] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [replayingWamid, setReplayingWamid] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const searchDebounceRef = useRef(null);

  const dateParams = useMemo(() => {
    if (timeRange === 'all') return {};
    const now = new Date();
    let start = new Date();
    if (timeRange === '24h') {
      start.setHours(now.getHours() - 24);
    } else if (timeRange === '7d') {
      start.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      start.setDate(now.getDate() - 30);
    }
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }, [timeRange]);

  // Load organizations on mount
  useEffect(() => {
    WhatsAppAuditService.getOrganizations()
      .then((orgs) => setOrganizations(Array.isArray(orgs) ? orgs : []))
      .catch(() => {});
  }, []);

  // Fetch stats and requests
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const statsParams = {
        ...dateParams,
        ...(orgFilter ? { orgId: orgFilter } : {}),
      };

      const requestsParams = {
        ...dateParams,
        ...(orgFilter ? { orgId: orgFilter } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(stageFilter !== 'ALL' ? { stage: stageFilter } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        page: pagination.page,
        limit: pagination.limit,
      };

      const [statsRes, reqsRes] = await Promise.all([
        WhatsAppAuditService.getStats(statsParams),
        WhatsAppAuditService.getRequests(requestsParams),
      ]);

      setStats(statsRes);
      setRequests(reqsRes.items || []);
      setPagination(reqsRes.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('[WhatsApp Audit] Failed to load data:', err);
      setError(err.message || 'Failed to load reliability audit data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateParams, orgFilter, statusFilter, stageFilter, searchQuery, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefreshInterval) return;
    const intervalId = setInterval(() => {
      fetchData(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, fetchData]);

  // Open Trace Drawer
  const openTrace = async (id) => {
    setSelectedRequestId(id);
    setTraceLoading(true);
    try {
      const trace = await WhatsAppAuditService.getRequestTrace(id);
      setTraceData(trace);
    } catch (err) {
      console.error('Failed to load trace:', err);
      setToastMessage({ type: 'error', text: err.message || 'Failed to load request trace.' });
    } finally {
      setTraceLoading(false);
    }
  };

  const closeTrace = () => {
    setSelectedRequestId(null);
    setTraceData(null);
  };

  // Replay message
  const handleReplay = async (wamid) => {
    if (!wamid) return;
    setReplayingWamid(wamid);
    try {
      await WhatsAppAuditService.replayMessage(wamid);
      setToastMessage({ type: 'success', text: `Message re-queued successfully (${wamid.slice(-8)})` });
      // Refresh requests list after a short delay
      setTimeout(() => fetchData(true), 1500);
      if (selectedRequestId) {
        setTimeout(() => openTrace(selectedRequestId), 1500);
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to replay message' });
    } finally {
      setReplayingWamid(null);
    }
  };

  // Quick copy phone
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Render message type badge
  const renderTypeBadge = (type) => {
    switch (type) {
      case 'image':
        return <span className="wa-badge wa-badge--neutral"><ImageIcon size={12} /> Photo</span>;
      case 'document':
        return <span className="wa-badge wa-badge--neutral"><FileText size={12} /> Document</span>;
      case 'interactive':
        return <span className="wa-badge wa-badge--neutral"><MousePointerClick size={12} /> Interactive</span>;
      case 'location':
        return <span className="wa-badge wa-badge--neutral"><MapPin size={12} /> Location</span>;
      default:
        return <span className="wa-badge wa-badge--neutral"><MessageSquare size={12} /> Text</span>;
    }
  };

  // Render request status badge
  const renderStatusBadge = (req) => {
    if (req.status === 'PROCESSED' && !req.isFailed) {
      return <span className="wa-badge wa-badge--success"><CheckCircle2 size={12} /> Succeeded</span>;
    }
    if (req.isFailed || req.status === 'FAILED') {
      return <span className="wa-badge wa-badge--fail"><XCircle size={12} /> Failed</span>;
    }
    if (req.status === 'CLAIMED') {
      return <span className="wa-badge wa-badge--processing"><RefreshCw size={12} className="wa-spin" /> In-Flight</span>;
    }
    return <span className="wa-badge wa-badge--queued"><Clock size={12} /> Queued</span>;
  };

  // Render rich message content inside the trace inspection view
  const renderMessageContentDetail = (req, draft) => {
    if (!req) return <div style={{ color: 'var(--wa-text-muted)', fontSize: 12 }}>No message content</div>;
    const type = req.messageType || 'text';
    const payload = req.payload || {};

    let textBody = '';
    if (typeof payload === 'string') {
      textBody = payload;
    } else if (payload?.text?.body) {
      textBody = payload.text.body;
    } else if (payload?.body) {
      textBody = payload.body;
    } else if (payload?.caption) {
      textBody = payload.caption;
    }

    const buttonReply = payload?.interactive?.button_reply;
    const listReply = payload?.interactive?.list_reply;
    const image = payload?.image;
    const document = payload?.document;
    const location = payload?.location;

    return (
      <div className="wa-msg-content-box">
        {/* WhatsApp Chat Speech Bubble */}
        <div className="wa-chat-bubble">
          {type === 'text' && (
            <div className="wa-chat-bubble__text">
              {textBody || <span style={{ fontStyle: 'italic', color: 'var(--wa-text-muted)' }}>Empty text message</span>}
            </div>
          )}

          {type === 'interactive' && (
            <div className="wa-chat-bubble__interactive">
              {buttonReply && (
                <div>
                  <div className="wa-bubble-badge">
                    <MousePointerClick size={12} />
                    <span>Quick Reply Selected</span>
                  </div>
                  <div className="wa-bubble-choice-title">"{buttonReply.title}"</div>
                  <div className="wa-bubble-choice-id">Button ID: <code>{buttonReply.id}</code></div>
                </div>
              )}
              {listReply && (
                <div>
                  <div className="wa-bubble-badge">
                    <MousePointerClick size={12} />
                    <span>List Option Chosen</span>
                  </div>
                  <div className="wa-bubble-choice-title">"{listReply.title}"</div>
                  {listReply.description && <div className="wa-bubble-choice-desc">{listReply.description}</div>}
                  <div className="wa-bubble-choice-id">Item ID: <code>{listReply.id}</code></div>
                </div>
              )}
              {!buttonReply && !listReply && (
                <div className="wa-chat-bubble__text">
                  Interactive Response ({typeof payload.interactive === 'object' ? JSON.stringify(payload.interactive) : 'Action'})
                </div>
              )}
            </div>
          )}

          {type === 'image' && (
            <div className="wa-chat-bubble__media">
              <div className="wa-media-head">
                <ImageIcon size={20} color="#059669" />
                <div>
                  <strong>Fuel Receipt / Bill Image</strong>
                  <div className="wa-media-sub">
                    {image?.mime_type || 'image/jpeg'}
                    {image?.id ? ` • ID: ${image.id.slice(-8)}` : ''}
                  </div>
                </div>
              </div>
              {(image?.caption || draft?.extractedText) && (
                <div className="wa-media-caption">
                  "{image?.caption || draft?.extractedText}"
                </div>
              )}
              {draft && (
                <div className="wa-media-draft-badge">
                  <span>Draft Extracted: </span>
                  <strong>{draft.vehicleReg || 'Pending'}</strong>
                  {draft.amount ? ` • ₹${draft.amount.toLocaleString()}` : ''}
                  {draft.litres ? ` • ${draft.litres}L` : ''}
                </div>
              )}
            </div>
          )}

          {type === 'location' && (
            <div className="wa-chat-bubble__media">
              <div className="wa-media-head">
                <MapPin size={20} color="#2563eb" />
                <div>
                  <strong>{location?.name || 'GPS Location Coordinate'}</strong>
                  <div className="wa-media-sub">{location?.address || 'Geolocation coordinate'}</div>
                </div>
              </div>
              {location?.latitude && location?.longitude && (
                <div className="wa-media-caption">
                  📍 Latitude: {location.latitude}, Longitude: {location.longitude}
                </div>
              )}
            </div>
          )}

          {type === 'document' && (
            <div className="wa-chat-bubble__media">
              <div className="wa-media-head">
                <FileText size={20} color="#d97706" />
                <div>
                  <strong>{document?.filename || 'Document Attachment'}</strong>
                  <div className="wa-media-sub">{document?.mime_type || 'application/pdf'}</div>
                </div>
              </div>
              {document?.caption && (
                <div className="wa-media-caption">"{document.caption}"</div>
              )}
            </div>
          )}

          <div className="wa-chat-bubble__meta">
            <span>{relativeTime(req.receivedAt)}</span>
            <CheckCircle2 size={11} color="#16a34a" />
          </div>
        </div>

        {/* WAMID Copy Row */}
        <div className="wa-wamid-row">
          <span className="wa-wamid-lbl">Meta Provider WAMID:</span>
          <code className="wa-wamid-code" title={req.wamid}>
            {req.wamid || '—'}
          </code>
          {req.wamid && (
            <button
              type="button"
              className="wa-copy-btn"
              onClick={() => copyToClipboard(req.wamid, 'drawer-wamid')}
              title="Copy WAMID"
            >
              {copiedId === 'drawer-wamid' ? (
                <CheckCircle2 size={12} color="#16a34a" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="wa-audit-page" id="wa-reliability-audit">
      {/* Toast */}
      {toastMessage && (
        <aside
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 10001,
            padding: '12px 18px',
            borderRadius: 8,
            backgroundColor: toastMessage.type === 'error' ? '#991b1b' : '#166534',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toastMessage.text}
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 8 }}
          >
            <X size={14} />
          </button>
        </aside>
      )}

      {/* Top Header */}
      <header className="wa-audit-header">
        <div className="wa-audit-header__title-group">
          <h1>
            <MessageSquareWarning size={28} color="#4f46e5" />
            WhatsApp Chat Reliability Audit
          </h1>
          <p>
            Real-time error tracking, failure root cause analysis, and request delivery observability for every chatbot user.
          </p>
        </div>

        <nav aria-label="Audit filters and actions" className="wa-audit-header__controls">
          {/* Organization filter */}
          <select
            aria-label="Filter by organization"
            className="wa-audit-select"
            value={orgFilter}
            onChange={(e) => {
              setOrgFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="">All Organizations</option>
            {organizations.map((o) => (
              <option key={o._id} value={o._id}>
                {o.companyName}
              </option>
            ))}
          </select>

          {/* Time range */}
          <select
            aria-label="Filter by time range"
            className="wa-audit-select"
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          {/* Auto refresh interval */}
          <select
            aria-label="Auto-refresh interval"
            className="wa-audit-select"
            value={autoRefreshInterval}
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
          >
            <option value={0}>Auto-refresh: Off</option>
            <option value={15}>Auto-refresh: 15s</option>
            <option value={30}>Auto-refresh: 30s</option>
            <option value={60}>Auto-refresh: 60s</option>
          </select>

          {/* Refresh button */}
          <button
            className="wa-audit-btn"
            onClick={() => fetchData(false)}
            disabled={loading || refreshing}
            title="Refresh statistics and requests"
          >
            <RefreshCw size={15} className={refreshing ? 'wa-spin' : ''} />
            <span>Refresh</span>
          </button>
        </nav>
      </header>

      {/* Error alert banner */}
      {error && (
        <section aria-label="Error announcement" className="wa-diagnosis-box" style={{ marginBottom: 20 }}>
          <div className="wa-diagnosis-box__head">
            <AlertCircle size={18} />
            <span>Observability Error</span>
          </div>
          <div className="wa-diagnosis-box__reason">{error}</div>
        </section>
      )}

      {/* Executive KPI Cards */}
      <section aria-label="Executive summary metrics" className="wa-audit-kpis">
        {/* Total Bill Processing (Replaces Total Inbound Requests in position 1) */}
        <article className="wa-kpi-card">
          <div className="wa-kpi-card__head">
            <span className="wa-kpi-card__label">Total Bill Processing</span>
            <div className="wa-kpi-card__icon wa-kpi-card__icon--ok">
              <Receipt size={16} />
            </div>
          </div>
          <div className="wa-kpi-card__val" style={{ color: '#16a34a' }}>
            {stats ? (stats.fuelBills?.total ?? 0).toLocaleString() : '—'}
          </div>
          <div className="wa-kpi-card__sub">
            <Clock size={12} />
            <span>
              Avg {stats?.fuelBills?.avgDurationMs ? `${(stats.fuelBills.avgDurationMs / 1000).toFixed(1)}s` : '—'} • ₹
              {stats?.fuelBills?.totalAmount?.toLocaleString() || 0} ({stats?.fuelBills?.totalLitres || 0} L)
            </span>
          </div>
        </article>

        <article className="wa-kpi-card">
          <div className="wa-kpi-card__head">
            <span className="wa-kpi-card__label">Success Rate</span>
            <div
              className={`wa-kpi-card__icon ${
                (stats?.summary?.successRate ?? 100) >= 90
                  ? 'wa-kpi-card__icon--ok'
                  : 'wa-kpi-card__icon--warn'
              }`}
            >
              <TrendingUp size={16} />
            </div>
          </div>
          <div
            className="wa-kpi-card__val"
            style={{
              color: (stats?.summary?.successRate ?? 100) >= 90 ? '#16a34a' : '#d97706',
            }}
          >
            {stats ? `${stats.summary?.successRate}%` : '—'}
          </div>
          <div className="wa-kpi-card__sub">
            <span>{stats?.summary?.succeededCount?.toLocaleString() || 0} succeeded requests</span>
          </div>
        </article>

        <article className="wa-kpi-card">
          <div className="wa-kpi-card__head">
            <span className="wa-kpi-card__label">Failed Requests</span>
            <div className="wa-kpi-card__icon wa-kpi-card__icon--fail">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="wa-kpi-card__val" style={{ color: '#dc2626' }}>
            {stats ? stats.summary?.failedCount?.toLocaleString() : '—'}
          </div>
          <div className="wa-kpi-card__sub">
            <span>
              {stats?.summary?.totalRequests
                ? `${((stats.summary.failedCount / stats.summary.totalRequests) * 100).toFixed(1)}% of total requests`
                : '0% failure rate'}
            </span>
          </div>
        </article>

        <article className="wa-kpi-card">
          <div className="wa-kpi-card__head">
            <span className="wa-kpi-card__label">In-Flight / Queued</span>
            <div className="wa-kpi-card__icon wa-kpi-card__icon--warn">
              <Clock size={16} />
            </div>
          </div>
          <div className="wa-kpi-card__val">
            {stats ? stats.summary?.inFlightCount?.toLocaleString() : '—'}
          </div>
          <div className="wa-kpi-card__sub">
            <span>Processing under worker lock</span>
          </div>
        </article>

        <article className="wa-kpi-card">
          <div className="wa-kpi-card__head">
            <span className="wa-kpi-card__label">Active Users</span>
            <div className="wa-kpi-card__icon wa-kpi-card__icon--info">
              <Users size={16} />
            </div>
          </div>
          <div className="wa-kpi-card__val">
            {stats ? stats.summary?.uniqueUsers?.toLocaleString() : '—'}
          </div>
          <div className="wa-kpi-card__sub">
            <span>Unique WhatsApp senders</span>
          </div>
        </article>

        <article className="wa-kpi-card">
          <div className="wa-kpi-card__head">
            <span className="wa-kpi-card__label">Outbound Delivery</span>
            <div className="wa-kpi-card__icon wa-kpi-card__icon--primary">
              <Send size={16} />
            </div>
          </div>
          <div className="wa-kpi-card__val">
            {stats ? `${stats.summary?.deliveryRate}%` : '—'}
          </div>
          <div className="wa-kpi-card__sub">
            <span>
              {stats?.outbound?.delivered || 0} delivered / {stats?.outbound?.failed || 0} failed
            </span>
          </div>
        </article>

        {/* Total Inbound Requests (Moved AFTER Outbound Delivery) */}
        <article className="wa-kpi-card">
          <div className="wa-kpi-card__head">
            <span className="wa-kpi-card__label">Total Inbound Requests</span>
            <div className="wa-kpi-card__icon wa-kpi-card__icon--primary">
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="wa-kpi-card__val">
            {stats ? stats.summary?.totalRequests?.toLocaleString() : '—'}
          </div>
          <div className="wa-kpi-card__sub">
            <Clock size={12} />
            <span>Avg {stats?.summary?.avgDurationMs || 0}ms latency</span>
          </div>
        </article>
      </section>

      {/* Analytics Split: Failure Stage Breakdown & Top Errors */}
      <section aria-label="Failure stages and error distribution" className="wa-audit-analytics">
        {/* Failure Stage Breakdown */}
        <div className="wa-panel">
          <div className="wa-panel__head">
            <h3>
              <ShieldAlert size={18} color="#dc2626" />
              Where Requests Fail (Error Stages)
            </h3>
            <span className="wa-panel__head-meta">
              {stats?.failureStages?.length || 0} failure categories detected
            </span>
          </div>

          <div className="wa-stage-list">
            {stats?.failureStages && stats.failureStages.length > 0 ? (
              stats.failureStages.map((s) => {
                const conf = STAGE_LABELS[s.stage] || {
                  label: s.stage,
                  color: '#dc2626',
                  icon: AlertCircle,
                };
                const Icon = conf.icon;
                return (
                  <div
                    key={s.stage}
                    className="wa-stage-item"
                    onClick={() => {
                      setStageFilter(s.stage);
                      setStatusFilter('FAILED');
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    title={`Click to filter by ${conf.label}`}
                  >
                    <div className="wa-stage-item__header">
                      <span className="wa-stage-item__name">
                        <Icon size={14} color={conf.color} />
                        {conf.label}
                      </span>
                      <span className="wa-stage-item__stat">
                        {s.count} ({s.pct}%)
                      </span>
                    </div>
                    <div className="wa-progress-track">
                      <div
                        className="wa-progress-fill"
                        style={{ width: `${Math.min(100, s.pct)}%`, background: conf.color }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="wa-empty-state">
                <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 8px', display: 'block' }} />
                No failures or error spikes recorded in this window. Chatbot is healthy!
              </div>
            )}
          </div>
        </div>

        {/* Top Errors Table */}
        <div className="wa-panel">
          <div className="wa-panel__head">
            <h3>
              <AlertTriangle size={18} color="#d97706" />
              Most Frequent Errors
            </h3>
            <span className="wa-panel__head-meta">Root cause diagnostics</span>
          </div>

          {stats?.topErrors && stats.topErrors.length > 0 ? (
            <table className="wa-errors-table">
              <thead>
                <tr>
                  <th>Error Message</th>
                  <th>Stage</th>
                  <th>Occurrences</th>
                  <th>Last Observed</th>
                </tr>
              </thead>
              <tbody>
                {stats.topErrors.map((e, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="wa-error-msg" title={e.message}>
                        {e.message}
                      </div>
                    </td>
                    <td>
                      <span className="wa-stage-tag">
                        {STAGE_LABELS[e.stage]?.label || e.stage}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{e.count}</td>
                    <td style={{ fontSize: 11, color: 'var(--wa-text-muted)' }}>
                      {relativeTime(e.lastSeenAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="wa-empty-state">
              <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 8px', display: 'block' }} />
              No recurring error messages detected.
            </div>
          )}
        </div>
      </section>

      {/* Stream & Requests Table */}
      <section aria-label="Inbound requests stream" className="wa-stream-card">
        {/* Table Toolbar */}
        <header className="wa-stream-toolbar">
          {/* Status Tabs */}
          <div className="wa-status-pills">
            <button
              className={`wa-status-pill ${statusFilter === 'ALL' ? 'wa-status-pill--active' : ''}`}
              onClick={() => {
                setStatusFilter('ALL');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              All Requests ({pagination.total})
            </button>
            <button
              className={`wa-status-pill ${statusFilter === 'FAILED' ? 'wa-status-pill--active' : ''}`}
              onClick={() => {
                setStatusFilter('FAILED');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              Failed Only
            </button>
            <button
              className={`wa-status-pill ${statusFilter === 'SUCCEEDED' ? 'wa-status-pill--active' : ''}`}
              onClick={() => {
                setStatusFilter('SUCCEEDED');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              Succeeded
            </button>
            <button
              className={`wa-status-pill ${statusFilter === 'IN_FLIGHT' ? 'wa-status-pill--active' : ''}`}
              onClick={() => {
                setStatusFilter('IN_FLIGHT');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              In-Flight / Queued
            </button>
          </div>

          {/* Search Box */}
          <div className="wa-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search phone, text, WAMID, error…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = setTimeout(() => {
                  setPagination((p) => ({ ...p, page: 1 }));
                }, 300);
              }}
            />
          </div>

          {/* Stage Filter Dropdown */}
          <select
            className="wa-audit-select"
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="ALL">All Failure Stages</option>
            {Object.entries(STAGE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </header>

        {/* Inbound Requests Table */}
        <div className="wa-table-wrap">
          <table className="wa-audit-table">
            <thead>
              <tr>
                <th>Vehicle No</th>
                <th>Driver / User</th>
                <th>Organization</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && requests.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <RefreshCw size={24} className="wa-spin" style={{ margin: '0 auto 8px', display: 'block', color: 'var(--wa-primary)' }} />
                    Loading WhatsApp interaction stream…
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--wa-text-muted)' }}>
                    No WhatsApp interactions matched the selected filters.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className={r.isFailed ? 'wa-row--failed' : ''}>
                    {/* Vehicle No */}
                    <td>
                      <div className="wa-vehicle-cell">
                        <button
                          type="button"
                          className={`wa-vehicle-pill-btn ${r.vehicleReg ? 'wa-vehicle-pill-btn--assigned' : 'wa-vehicle-pill-btn--unassigned'}`}
                          onClick={() => openTrace(r.id)}
                          title="Click vehicle number to inspect full trace, time, message content & reliability status"
                        >
                          <Truck size={13} className="wa-vehicle-pill-icon" />
                          <span className="wa-vehicle-reg-text">{r.vehicleReg || 'Unassigned'}</span>
                          <ExternalLink size={10} className="wa-vehicle-link-icon" />
                        </button>
                        {r.draft && (
                          <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2, fontWeight: 500 }}>
                            Fuel Bill: ₹{r.draft.amount?.toLocaleString() || 0} ({r.draft.litres || 0}L)
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Driver / User */}
                    <td>
                      <div className="wa-user-cell">
                        <div className="wa-phone-row">
                          <span>+{r.waId}</span>
                          <button
                            type="button"
                            className="wa-copy-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(r.waId, r.id);
                            }}
                            title="Copy phone number"
                          >
                            {copiedId === r.id ? <CheckCircle2 size={12} color="#16a34a" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="wa-user-sub-info">
                          {r.user ? (
                            <span>{r.user.name} ({r.user.role})</span>
                          ) : (
                            <span style={{ color: '#dc2626' }}>Unlinked Sender</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Organization */}
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--wa-text)' }}>
                        {r.org?.name || 'Unassigned Tenant'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="wa-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="wa-audit-btn wa-audit-btn--primary"
                          style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                          onClick={() => openTrace(r.id)}
                          title="Inspect complete lifecycle trace, time, message content & reliability status"
                        >
                          <Eye size={13} />
                          <span>View Trace</span>
                        </button>

                        {r.isFailed && (
                          <button
                            className="wa-audit-btn"
                            style={{ height: 32, padding: '0 8px', borderColor: '#fecaca', color: '#991b1b' }}
                            onClick={() => handleReplay(r.wamid)}
                            disabled={replayingWamid === r.wamid}
                            title="Replay inbound message"
                          >
                            <RotateCcw
                              size={13}
                              className={replayingWamid === r.wamid ? 'wa-spin' : ''}
                            />
                            <span>Retry</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <footer className="wa-pagination">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.total, pagination.page * pagination.limit)} of {pagination.total} requests
          </div>
          <div className="wa-pagination__btns">
            <button
              className="wa-audit-btn"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </button>
            <span style={{ alignSelf: 'center', fontSize: 12, padding: '0 8px' }}>
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              className="wa-audit-btn"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      {/* Slide-Out Request Trace Drawer */}
      {selectedRequestId && (
        <aside aria-label="Request lifecycle trace details" className="wa-drawer-backdrop" onClick={closeTrace}>
          <section className="wa-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="wa-drawer__header">
              <h2>
                <Truck size={20} color="#4f46e5" />
                Vehicle &amp; Interaction Audit Trace
              </h2>
              <button className="wa-drawer__close" onClick={closeTrace} aria-label="Close trace drawer">
                <X size={18} />
              </button>
            </div>

            <div className="wa-drawer__body">
              {traceLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <RefreshCw size={24} className="wa-spin" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--wa-primary)' }} />
                  Retrieving request lifecycle trace…
                </div>
              ) : traceData ? (
                <>
                  {/* Vehicle & Driver Identity Banner */}
                  <div className="wa-drawer-vehicle-banner">
                    <div className="wa-drawer-vehicle-banner__top">
                      <div className="wa-plate-box">
                        <span className="wa-plate-ind">IND</span>
                        <span className="wa-plate-number">
                          {traceData.vehicle?.vehicleReg || traceData.draft?.vehicleReg || 'UNASSIGNED'}
                        </span>
                      </div>
                      <div className="wa-drawer-status-group">
                        {renderStatusBadge(traceData.request)}
                      </div>
                    </div>

                    <div className="wa-drawer-vehicle-banner__grid">
                      <div className="wa-meta-item">
                        <span className="wa-meta-item__lbl"><User size={11} /> Driver / User</span>
                        <strong className="wa-meta-item__val">
                          {traceData.sender.user
                            ? `${traceData.sender.user.firstName || ''} ${traceData.sender.user.lastName || ''}`.trim() || traceData.sender.user.email
                            : 'Unlinked WhatsApp Sender'}
                        </strong>
                        <div className="wa-phone-row" style={{ marginTop: 2 }}>
                          <span>+{traceData.request.waId}</span>
                          <button
                            type="button"
                            className="wa-copy-btn"
                            onClick={() => copyToClipboard(traceData.request.waId, 'drawer-phone')}
                            title="Copy phone number"
                          >
                            {copiedId === 'drawer-phone' ? <CheckCircle2 size={12} color="#16a34a" /> : <Copy size={12} />}
                          </button>
                          <span className="wa-meta-item__sub" style={{ marginLeft: 4 }}>• {traceData.sender.user?.role || 'Guest'}</span>
                        </div>
                      </div>
                      <div className="wa-meta-item">
                        <span className="wa-meta-item__lbl">🏢 Organization</span>
                        <strong className="wa-meta-item__val">{traceData.sender.org?.companyName || 'Unassigned Tenant'}</strong>
                        <span className="wa-meta-item__sub">
                          {traceData.vehicle?.vehicleReg ? `Fleet: ${traceData.vehicle.vehicleReg}` : 'Unassigned Fleet'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fuel Bill Processing Details Card (if draft or OCR details exist) */}
                  {(traceData.draft || traceData.request.messageType === 'image') && (
                    <div className="wa-panel" style={{ padding: 16, borderColor: '#bbf7d0', background: '#f8fdf9', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: '#166534' }}>
                          <Receipt size={16} color="#16a34a" />
                          Chat Fuel Bill Processing Details
                        </h4>
                        {traceData.draft?.status && (
                          <span className="wa-badge wa-badge--success" style={{ textTransform: 'uppercase' }}>
                            Draft {traceData.draft.status}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, fontSize: 12 }}>
                        <div>
                          <span style={{ color: 'var(--wa-text-muted)', display: 'block', fontSize: 11 }}>Bill Amount</span>
                          <strong style={{ fontSize: 15, color: '#166534' }}>
                            {traceData.draft?.amount ? `₹${traceData.draft.amount.toLocaleString()}` : '—'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--wa-text-muted)', display: 'block', fontSize: 11 }}>Fuel Litres</span>
                          <strong>{traceData.draft?.litres ? `${traceData.draft.litres} L` : '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--wa-text-muted)', display: 'block', fontSize: 11 }}>Fuel Rate</span>
                          <strong>{traceData.draft?.rate ? `₹${traceData.draft.rate}/L` : '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--wa-text-muted)', display: 'block', fontSize: 11 }}>Fuel Type / Filling</span>
                          <strong>{traceData.draft?.fuelType || 'DIESEL'} ({traceData.draft?.fillingType || 'FULL_TANK'})</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--wa-text-muted)', display: 'block', fontSize: 11 }}>Plate on Bill</span>
                          <strong>{traceData.draft?.plateText || traceData.vehicle?.vehicleReg || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--wa-text-muted)', display: 'block', fontSize: 11 }}>Odometer</span>
                          <strong>{traceData.draft?.odometerReading ? `${traceData.draft.odometerReading} km` : 'Pending'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pipeline Stepper (The Trace) */}
                  <div>
                    <h4 style={{ margin: '0 0 14px 0', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={16} color="#4f46e5" />
                      Processing Pipeline Lifecycle
                    </h4>
                    <div className="wa-timeline">
                      {traceData.pipeline.map((step) => (
                        <div
                          key={step.step}
                          className={`wa-step ${
                            step.status === 'ok'
                              ? 'wa-step--ok'
                              : step.status === 'failed'
                                ? 'wa-step--failed'
                                : step.status === 'running'
                                  ? 'wa-step--running'
                                  : ''
                          }`}
                        >
                          <div className="wa-step__marker">
                            {step.status === 'ok' && <CheckCircle2 size={12} />}
                            {step.status === 'failed' && <XCircle size={12} />}
                            {step.status === 'running' && <RefreshCw size={10} className="wa-spin" />}
                          </div>
                          <div className="wa-step__content">
                            <div className="wa-step__title">
                              <span>Step {step.step}: {step.name}</span>
                              <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', color: step.status === 'failed' ? '#dc2626' : '#16a34a' }}>
                                {step.status}
                              </span>
                            </div>
                            <div className="wa-step__desc">{step.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Under the Trace: Time, Message Content & Reliability Status */}
                  <div className="wa-under-trace-section">
                    <h4 className="wa-under-trace-title">
                      <Clock size={16} color="#2563eb" />
                      Trace Details &amp; Execution Audit
                    </h4>

                    <div className="wa-under-trace-cards">
                      {/* 1. Time & Processing Latency */}
                      <div className="wa-audit-subcard wa-audit-subcard--time">
                        <div className="wa-audit-subcard__head">
                          <div className="wa-audit-subcard__head-title">
                            <Clock size={15} color="#2563eb" />
                            <strong>Execution Time &amp; Latency</strong>
                          </div>
                          <span className="wa-time-relative-tag">
                            {relativeTime(traceData.request.receivedAt)}
                          </span>
                        </div>
                        <div className="wa-audit-subcard__content">
                          <div className="wa-time-grid">
                            <div className="wa-time-stat">
                              <span className="wa-time-stat__label">Inbound Ingested</span>
                              <strong className="wa-time-stat__value">
                                {formatDate(traceData.request.receivedAt)}
                              </strong>
                              <span className="wa-time-stat__sub">
                                Received from Meta Webhook
                              </span>
                            </div>
                            <div className="wa-time-stat">
                              <span className="wa-time-stat__label">Pipeline Latency</span>
                              <strong
                                className="wa-time-stat__value"
                                style={{
                                  color: traceData.request.durationMs > 3000 ? '#dc2626' : '#16a34a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Activity size={14} />
                                {traceData.request.durationMs != null ? `${traceData.request.durationMs}ms` : '—'}
                              </strong>
                              <span className="wa-time-stat__sub">
                                {traceData.request.durationMs != null
                                  ? traceData.request.durationMs < 1000
                                    ? 'High Performance (<1s)'
                                    : traceData.request.durationMs < 3000
                                      ? 'Standard SLA (<3s)'
                                      : 'Slow Processing SLA'
                                  : 'Queue time'}
                              </span>
                            </div>
                            {traceData.outboundMessages?.[0]?.createdAt && (
                              <div className="wa-time-stat">
                                <span className="wa-time-stat__label">Bot Response Dispatched</span>
                                <strong className="wa-time-stat__value">
                                  {formatDate(traceData.outboundMessages[0].createdAt)}
                                </strong>
                                <span className="wa-time-stat__sub">
                                  {relativeTime(traceData.outboundMessages[0].createdAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Message Content */}
                      <div className="wa-audit-subcard wa-audit-subcard--message">
                        <div className="wa-audit-subcard__head">
                          <div className="wa-audit-subcard__head-title">
                            <MessageSquare size={15} color="#059669" />
                            <strong>Message Content</strong>
                          </div>
                          <div>{renderTypeBadge(traceData.request.messageType)}</div>
                        </div>
                        <div className="wa-audit-subcard__content">
                          {renderMessageContentDetail(traceData.request, traceData.draft)}
                        </div>
                      </div>

                      {/* 3. Reliability Status */}
                      <div className="wa-audit-subcard wa-audit-subcard--status">
                        <div className="wa-audit-subcard__head">
                          <div className="wa-audit-subcard__head-title">
                            <ShieldAlert
                              size={15}
                              color={traceData.request.isFailed || traceData.request.status === 'FAILED' ? '#dc2626' : '#16a34a'}
                            />
                            <strong>Reliability Status</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {renderStatusBadge(traceData.request)}
                            {traceData.request.errorStage && (
                              <span className="wa-stage-tag" style={{ margin: 0 }}>
                                {STAGE_LABELS[traceData.request.errorStage]?.label || traceData.request.errorStage}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="wa-audit-subcard__content">
                          {/* Failure Diagnosis or Success Banner */}
                          {traceData.diagnosis ? (
                            <div className="wa-diagnosis-box" style={{ margin: '0 0 12px 0' }}>
                              <div className="wa-diagnosis-box__head">
                                <AlertCircle size={16} />
                                <span>
                                  Failure Identified in {STAGE_LABELS[traceData.diagnosis.stage]?.label || traceData.diagnosis.stage}
                                </span>
                              </div>
                              <div className="wa-diagnosis-box__reason">
                                <strong>Root Cause:</strong> {traceData.diagnosis.reason}
                              </div>
                              <div className="wa-diagnosis-box__action">
                                <strong>Suggested Resolution:</strong> {traceData.diagnosis.suggestedAction}
                              </div>
                            </div>
                          ) : (
                            <div className="wa-success-box">
                              <div className="wa-success-box__head">
                                <CheckCircle2 size={16} color="#16a34a" />
                                <span>All Reliability Checks Passed</span>
                              </div>
                              <div className="wa-success-box__desc">
                                Inbound request successfully passed Webhook Signature, Identity Verification, OCR &amp; Vehicle Resolution with zero errors.
                              </div>
                            </div>
                          )}

                          {/* Reliability KPI Breakdown */}
                          <div className="wa-reliability-metrics-bar">
                            <div className="wa-rel-metric">
                              <span className="wa-rel-metric__label">Delivery Attempts</span>
                              <strong className="wa-rel-metric__value">
                                {traceData.request.attempts || 1}
                              </strong>
                              <span className="wa-rel-metric__sub">
                                {traceData.request.attempts > 1 ? 'Re-queued / Retried' : 'Direct execution'}
                              </span>
                            </div>
                            <div className="wa-rel-metric">
                              <span className="wa-rel-metric__label">Failure Stage</span>
                              <strong className="wa-rel-metric__value" style={{ color: traceData.request.errorStage ? '#dc2626' : '#16a34a' }}>
                                {traceData.request.errorStage || 'NONE (PASSED)'}
                              </strong>
                              <span className="wa-rel-metric__sub">
                                {traceData.request.errorStage ? 'Requires attention' : 'Healthy flow'}
                              </span>
                            </div>
                            <div className="wa-rel-metric">
                              <span className="wa-rel-metric__label">Outbound Reply Status</span>
                              <strong className="wa-rel-metric__value">
                                {traceData.outboundMessages && traceData.outboundMessages.length > 0
                                  ? traceData.outboundMessages[0].status
                                  : 'Idle / No Outbound'}
                              </strong>
                              <span className="wa-rel-metric__sub">
                                {traceData.outboundMessages && traceData.outboundMessages.length > 0
                                  ? `Kind: ${traceData.outboundMessages[0].kind}`
                                  : 'No message required'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Outbound Delivery Logs */}
                  {traceData.outboundMessages && traceData.outboundMessages.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700 }}>
                        Bot Outbound Delivery Receipts
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {traceData.outboundMessages.map((msg, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '10px 12px',
                              background: 'var(--wa-bg)',
                              borderRadius: 6,
                              border: '1px solid var(--wa-border)',
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 600 }}>Reply Kind: {msg.kind}</span>
                              <div style={{ color: 'var(--wa-text-muted)', fontSize: 11 }}>
                                {formatDate(msg.createdAt)}
                              </div>
                            </div>
                            <span
                              className={`wa-badge ${
                                msg.status === 'DELIVERED' || msg.status === 'READ'
                                  ? 'wa-badge--success'
                                  : msg.status === 'FAILED'
                                    ? 'wa-badge--fail'
                                    : 'wa-badge--queued'
                              }`}
                            >
                              {msg.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Inbound Payload Viewer */}
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700 }}>
                      Raw Meta Payload
                    </h4>
                    <pre className="wa-json-viewer">
                      {JSON.stringify(traceData.request.payload, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="wa-empty-state">No trace details available.</div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="wa-drawer__footer">
              <button className="wa-audit-btn" onClick={closeTrace}>
                Close
              </button>
              {traceData?.request && (
                <button
                  className="wa-audit-btn wa-audit-btn--primary"
                  onClick={() => handleReplay(traceData.request.wamid)}
                  disabled={replayingWamid === traceData.request.wamid}
                >
                  <RotateCcw size={14} className={replayingWamid === traceData.request.wamid ? 'wa-spin' : ''} />
                  <span>Replay Message</span>
                </button>
              )}
            </div>
          </section>
        </aside>
      )}
    </main>
  );
};

export default WhatsAppAuditPage;
