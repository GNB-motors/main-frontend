import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ShieldAlert, Truck, RefreshCw, Search, ArrowUpRight, Check, X } from 'lucide-react';
import PageShell from '../../components/ui/PageShell.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '../../components/ui/dialog.jsx';
import { useSupportPortal } from '../../contexts/supportPortalContext';
import { getInbox, acknowledgeItem } from '../../services/AlertInboxService.js';
import { SOURCE_LABELS, sinceLabel, reviewTarget, filterInbox } from './inboxModel.js';
import './AlertInbox.css';

export default function AlertInboxPage() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [actionError, setActionError] = React.useState(null);
  const [pending, setPending] = React.useState(new Set());
  const [status, setStatus] = React.useState('OPEN');
  const [query, setQuery] = React.useState('');
  const [severity, setSeverity] = React.useState('');
  const [source, setSource] = React.useState('');
  const [detailId, setDetailId] = React.useState(null);
  const [announcement, setAnnouncement] = React.useState('');
  const request = React.useRef(null);
  const mounted = React.useRef(true);
  const support = useSupportPortal();

  const load = React.useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await getInbox({ status: 'ALL', signal: controller.signal });
      if (!controller.signal.aborted) setData(result);
    } catch (err) {
      if (!controller.signal.aborted) setError(err?.message || 'Could not load alerts. Try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, [load]);

  const ack = async (id) => {
    setPending((current) => new Set(current).add(id));
    setActionError(null);
    try {
      const updated = await acknowledgeItem(id);
      if (!mounted.current) return;
      // Cancel older reads so they cannot restore an acknowledged row.
      request.current?.abort();
      setLoading(false);
      setData((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === id ? { ...item, ...updated, status: 'ACKNOWLEDGED' } : item,
        ),
      }));
      setAnnouncement('Alert acknowledged. The underlying issue remains available for review.');
    } catch (err) {
      if (mounted.current)
        setActionError(err?.message || 'Could not acknowledge this alert. Try again.');
    } finally {
      if (mounted.current)
        setPending((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
    }
  };

  const all = data?.items || [];
  const open = all.filter((item) => item.status === 'OPEN');
  const items = filterInbox(all, { status, query, severity, source });
  const detail = all.find((item) => item.id === detailId);
  const vehicleCount = new Set(
    open
      .filter(
        (item) => item.subjectKey && item.subjectKey !== 'ORG' && !item.subjectKey.includes(':'),
      )
      .map((item) => item.subjectKey),
  ).size;
  const reviewAction = (item) => {
    const target = reviewTarget(item);
    return target.ticketId ? (
      <Button
        size="sm"
        variant="secondary"
        disabled={!support.enabled}
        onClick={() => {
          setDetailId(null);
          support.openPortal(target.ticketId);
        }}
      >
        {target.label}
        <ArrowUpRight size={14} aria-hidden="true" />
      </Button>
    ) : (
      <Link className="ai-review" to={target.to}>
        {target.label}
        <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    );
  };

  return (
    <PageShell
      title="Alert Inbox"
      count={open.length}
      subtitle="Review fleet issues and follow up in one place."
      className="alert-inbox"
      actions={
        <Button variant="secondary" size="sm" onClick={load} disabled={loading || pending.size > 0}>
          <RefreshCw size={14} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      }
    >
      <div className="ai-notice">
        Feeds update periodically. For urgent incidents, check the dedicated alert pages.
      </div>
      <div className="ai-summary">
        {[
          { label: 'Open alerts', value: open.length, Icon: Bell },
          {
            label: 'Critical',
            value: open.filter((item) => item.severity === 'critical').length,
            Icon: ShieldAlert,
          },
          { label: 'Vehicles affected', value: vehicleCount, Icon: Truck },
        ].map(({ label, value, Icon }) => (
          <div className="ai-stat" key={label}>
            <span className="ai-stat-icon">
              {React.createElement(Icon, { size: 19, 'aria-hidden': true })}
            </span>
            <div>
              <span>{label}</span>
              <strong>{data ? value : '—'}</strong>
            </div>
          </div>
        ))}
      </div>
      <section className="ai-panel" aria-label="Fleet alert queue" aria-busy={loading}>
        <div className="ai-toolbar">
          <div className="ai-tabs" role="group" aria-label="Alert status">
            {['OPEN', 'ACKNOWLEDGED'].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={status === value}
                onClick={() => setStatus(value)}
              >
                {value === 'OPEN' ? 'Open' : 'Acknowledged'}{' '}
                <span>{all.filter((item) => item.status === value).length}</span>
              </button>
            ))}
          </div>
          <label className="ai-search">
            <Search size={16} aria-hidden="true" />
            <input
              aria-label="Search alerts"
              placeholder="Search vehicle or issue"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            aria-label="Severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          >
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="caution">Needs review</option>
            <option value="info">Information</option>
          </select>
          <select
            aria-label="Source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            <option value="">All sources</option>
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {error || actionError ? (
          <div role="alert" className="ai-error">
            {error || actionError}{' '}
            {error && (
              <button type="button" onClick={load}>
                Retry
              </button>
            )}
          </div>
        ) : null}
        {!data && loading ? (
          <div role="status" className="ai-empty">
            Loading your fleet alerts…
          </div>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <div className="ai-empty">
            <Bell size={28} aria-hidden="true" />
            <h2>
              {query || severity || source
                ? 'No matching alerts'
                : status === 'OPEN'
                  ? 'No open inbox alerts'
                  : 'No acknowledged alerts'}
            </h2>
            <p>
              {query || severity || source
                ? 'Try another search or clear your filters.'
                : 'Source feeds update periodically. Review urgent incidents in their dedicated pages.'}
            </p>
            {(query || severity || source) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setSeverity('');
                  setSource('');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : null}
        <ul className="ai-list">
          {items.map((item) => (
            <li key={item.id} className="ai-row">
              <span className={`ai-priority ai-priority--${item.severity}`}>
                {item.severity === 'critical'
                  ? 'Critical'
                  : item.severity === 'caution'
                    ? 'Needs review'
                    : 'Info'}
              </span>
              <div className="ai-row-main">
                <button className="ai-subject" type="button" onClick={() => setDetailId(item.id)}>
                  {item.subjectLabel || 'Your organisation'}
                </button>
                <h2>{item.label}</h2>
                <p className="ai-ask">
                  {item.wants || 'Open the source alert to review this issue.'}
                </p>
                <div className="ai-meta">
                  {[
                    ...new Set(
                      (item.sources || []).map((s) => SOURCE_LABELS[s.source] || 'Other source'),
                    ),
                  ].join(' · ')}
                  <span>Updated {sinceLabel(item.lastSeenAt)}</span>
                  {item.status === 'ACKNOWLEDGED' && (
                    <span>Acknowledged {sinceLabel(item.acknowledgedAt)}</span>
                  )}
                </div>
              </div>
              <div className="ai-row-actions">
                <Button variant="ghost" size="sm" onClick={() => setDetailId(item.id)}>
                  Details
                </Button>
                {reviewAction(item)}
                {item.status === 'OPEN' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending.has(item.id)}
                    onClick={() => ack(item.id)}
                  >
                    <Check size={14} aria-hidden="true" />
                    {pending.has(item.id) ? 'Saving…' : 'Acknowledge'}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {data && (
          <div className="ai-footer">
            Showing {items.length} of {all.filter((item) => item.status === status).length}{' '}
            {status === 'OPEN' ? 'open' : 'acknowledged'} alerts. Acknowledging records your review;
            it does not resolve the source issue.
          </div>
        )}
      </section>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <Dialog
        open={!!detail}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDetailId(null);
        }}
      >
        {detail && (
          <DialogContent className="ai-detail">
            <header>
              <div>
                <DialogTitle>{detail.subjectLabel || 'Your organisation'}</DialogTitle>
                <p>{detail.label}</p>
              </div>
              <DialogClose aria-label="Close alert details">
                <X size={18} />
              </DialogClose>
            </header>
            <div className="ai-detail-body">
              <h3>Recommended action</h3>
              <p>{detail.wants || 'Open the source alert to review this issue.'}</p>
              <h3>Evidence · {detail.sources?.length || 0} reports</h3>
              {(detail.sources || []).map((evidence, index) => (
                <article key={`${evidence.source}-${evidence.refId || index}-${evidence.at}`}>
                  <strong>{SOURCE_LABELS[evidence.source] || 'Other source'}</strong>
                  <p>{evidence.detail || 'Open the source page for more information.'}</p>
                  <small>{sinceLabel(evidence.at)}</small>
                </article>
              ))}
              <p className="ai-meta">
                First reported {sinceLabel(detail.firstSeenAt)} · Last activity{' '}
                {sinceLabel(detail.lastSeenAt)}
              </p>
              {reviewAction(detail)}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </PageShell>
  );
}
