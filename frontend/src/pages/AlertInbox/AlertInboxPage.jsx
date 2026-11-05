import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ShieldAlert,
  Truck,
  RefreshCw,
  Search,
  ArrowUpRight,
  Check,
  X,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';
import PageShell from '../../components/ui/PageShell.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '../../components/ui/dialog.jsx';
import { useSupportPortal } from '../../contexts/supportPortalContext';
import { getInbox, acknowledgeItem, acknowledgeAll } from '../../services/AlertInboxService.js';
import { fleetViewService } from '../../services/fleetViewService';
import useApi from '../../hooks/useApi';
import { SOURCE_LABELS, sinceLabel, reviewTarget, filterInbox, subjectTitle } from './inboxModel.js';
import AccountLinkBanner from './AccountLinkBanner.jsx';
import IncidentsTab from './IncidentsTab.jsx';
import { ackAllConfirmText } from './incidentsModel.js';
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
  const [view, setView] = React.useState('ALERTS');
  const [ackAllOpen, setAckAllOpen] = React.useState(false);
  const [ackAllPending, setAckAllPending] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState('');
  const request = React.useRef(null);
  const mounted = React.useRef(true);
  const support = useSupportPortal();

  // The state of the vendor accounts. A 404 means the endpoint is not
  // deployed yet, and then no banner is shown at all.
  const { data: linkStateData } = useApi(
    (signal) => fleetViewService.getAccountsLinkState({ signal }),
    [],
  );
  const linkState = Array.isArray(linkStateData?.items) ? linkStateData.items : [];

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

  const ackEverything = async () => {
    setAckAllPending(true);
    setActionError(null);
    try {
      await acknowledgeAll();
      setAckAllOpen(false);
      await load();
      setAnnouncement('Every open alert is marked as seen.');
    } catch (err) {
      if (mounted.current) {
        setActionError(err?.message || 'Could not mark the alerts as seen. Try again.');
      }
    } finally {
      if (mounted.current) setAckAllPending(false);
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
        className="ai-review"
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
        <Bell size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
        <span>Feeds update periodically. For urgent incidents, check the dedicated alert pages.</span>
      </div>

      {/* A vendor account that stopped sending data explains why the trucks
          went quiet, and carries the one button that fixes it (F6). */}
      {linkState
        .filter((account) => account.state === 'NEEDS_RELINK' || account.state === 'EXPIRING')
        .map((account) => (
          <AccountLinkBanner key={account.accountId} account={account} />
        ))}

      <div className="ai-tabs ai-views" role="group" aria-label="Inbox views">
        <button
          type="button"
          aria-pressed={view === 'ALERTS'}
          onClick={() => setView('ALERTS')}
        >
          Alerts <span>{open.length}</span>
        </button>
        <button
          type="button"
          aria-pressed={view === 'INCIDENTS'}
          onClick={() => setView('INCIDENTS')}
        >
          Incidents
        </button>
      </div>

      {view === 'INCIDENTS' ? (
        <IncidentsTab />
      ) : (
        <>
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
          {ackAllOpen ? (
            <span
              className="ai-confirm"
              role="group"
              aria-label="Confirm marking every alert as seen"
            >
              <span>{ackAllConfirmText(open.length)}</span>
              <Button size="sm" onClick={ackEverything} disabled={ackAllPending}>
                {ackAllPending ? 'Saving…' : 'Yes, mark all'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAckAllOpen(false)}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAckAllOpen(true)}
              disabled={loading || open.length === 0}
            >
              Acknowledge all
            </Button>
          )}
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
          <div role="status" className="ai-empty" aria-label="Loading your fleet alerts…">
            <span className="sr-only">Loading your fleet alerts…</span>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 8 }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="ai-row ai-row--skeleton" style={{ width: '100%', margin: 0 }}>
                  <div className="ai-skel-bar" style={{ width: 96, height: 26, borderRadius: 6, flexShrink: 0 }} />
                  <div className="ai-row-main">
                    <div className="ai-skel-bar" style={{ width: 140, height: 18 }} />
                    <div className="ai-skel-bar" style={{ width: '65%', height: 20, marginTop: 8 }} />
                    <div className="ai-skel-bar" style={{ width: '90%', height: 36, marginTop: 8 }} />
                    <div className="ai-skel-bar" style={{ width: 220, height: 14, marginTop: 8 }} />
                  </div>
                  <div className="ai-row-actions">
                    <div className="ai-skel-bar" style={{ width: 70, height: 32 }} />
                    <div className="ai-skel-bar" style={{ width: 95, height: 32 }} />
                  </div>
                </div>
              ))}
            </div>
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
                  {subjectTitle(item.subjectLabel)}
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
        </>
      )}
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
            <header className="ai-detail-header">
              <div>
                <div className="ai-detail-header-top">
                  <span className="ai-detail-plate">
                    <Truck size={14} aria-hidden="true" />
                    {subjectTitle(detail.subjectLabel)}
                  </span>
                  <span className={`ai-priority ai-priority--${detail.severity}`}>
                    {detail.severity === 'critical'
                      ? 'Critical'
                      : detail.severity === 'caution'
                        ? 'Needs review'
                        : 'Info'}
                  </span>
                  {detail.status === 'ACKNOWLEDGED' && (
                    <span className="ai-detail-ack-badge">
                      <Check size={12} aria-hidden="true" />
                      Acknowledged
                    </span>
                  )}
                </div>
                <DialogTitle className="ai-detail-title">{detail.label}</DialogTitle>
              </div>
              <DialogClose className="ai-detail-close" aria-label="Close alert details">
                <X size={18} />
              </DialogClose>
            </header>
            <div className="ai-detail-body">
              <div className="ai-detail-section-header">
                <Sparkles size={14} aria-hidden="true" className="ai-detail-icon-accent" />
                <h3>Recommended action</h3>
              </div>
              <div className="ai-detail-action-card">
                <p>{detail.wants || 'Open the source alert to review this issue.'}</p>
              </div>

              <div className="ai-detail-section-header">
                <FileText size={14} aria-hidden="true" className="ai-detail-icon-accent" />
                <h3>Evidence</h3>
                <span className="ai-detail-count-pill">{detail.sources?.length || 0} reports</span>
              </div>
              <div className="ai-detail-cards">
                {(detail.sources || []).map((evidence, index) => (
                  <article
                    key={`${evidence.source}-${evidence.refId || index}-${evidence.at}`}
                    className="ai-detail-card"
                  >
                    <div className="ai-detail-card-head">
                      <span className="ai-detail-source-badge">
                        {SOURCE_LABELS[evidence.source] || 'Other source'}
                      </span>
                      <span className="ai-detail-time">
                        <Clock size={12} aria-hidden="true" />
                        {sinceLabel(evidence.at)}
                      </span>
                    </div>
                    <p className="ai-detail-card-text">
                      {evidence.detail || 'Open the source page for more information.'}
                    </p>
                  </article>
                ))}
              </div>
            </div>
            <footer className="ai-detail-footer">
              <div className="ai-detail-meta">
                <Clock size={13} aria-hidden="true" />
                <span>
                  First reported {sinceLabel(detail.firstSeenAt)} · Last activity{' '}
                  {sinceLabel(detail.lastSeenAt)}
                </span>
              </div>
              <div className="ai-detail-actions">
                <Button variant="outline" size="sm" onClick={() => setDetailId(null)}>
                  Close
                </Button>
                {reviewAction(detail)}
              </div>
            </footer>
          </DialogContent>
        )}
      </Dialog>
    </PageShell>
  );
}
