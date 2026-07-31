import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  RefreshCw,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Search,
  Send,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../Drivers/Component';
import apiClient from '../../../utils/axiosConfig';
import './FeatureFlags.css';
import './WhatsAppAdmin.css';

const STATUS_META = {
  ok: { label: 'Healthy', className: 'wa-pill--ok' },
  degraded: { label: 'Degraded', className: 'wa-pill--warn' },
  down: { label: 'Down', className: 'wa-pill--fail' },
  disabled: { label: 'Disabled', className: 'wa-pill--muted' },
};

const CHECK_ICON = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
  na: MinusCircle,
};

const WhatsAppAdminPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);

  const [sessionPhone, setSessionPhone] = useState('');
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  const [testPhone, setTestPhone] = useState('');
  const [testText, setTestText] = useState('');
  const [testSending, setTestSending] = useState(false);

  const [drafts, setDrafts] = useState([]);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftFilter, setDraftFilter] = useState('READY');
  const [draftBusyId, setDraftBusyId] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/api/whatsapp/admin/status');
      setStatus(res.data?.data ?? null);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load WhatsApp status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDrafts = useCallback(async () => {
    setDraftsLoading(true);
    try {
      const res = await apiClient.get('/api/whatsapp/admin/drafts', {
        params: { status: draftFilter, limit: 50 },
      });
      setDrafts(res.data?.data?.items ?? []);
      setDraftsTotal(res.data?.data?.total ?? 0);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load drafts');
      setDrafts([]);
      setDraftsTotal(0);
    } finally {
      setDraftsLoading(false);
    }
  }, [draftFilter]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const handleLookupSession = async (e) => {
    e.preventDefault();
    if (!sessionPhone.trim()) return;
    setSessionLoading(true);
    setSessionData(null);
    try {
      const res = await apiClient.get(
        `/api/whatsapp/admin/session/${encodeURIComponent(sessionPhone.trim())}`,
      );
      setSessionData(res.data?.data ?? null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Session lookup failed');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone.trim()) return;
    setTestSending(true);
    try {
      const res = await apiClient.post('/api/whatsapp/admin/send-test', {
        phone: testPhone.trim(),
        ...(testText.trim() ? { text: testText.trim() } : {}),
      });
      toast.success(
        `Test sent${res.data?.data?.providerMessageId ? ` (${res.data.data.providerMessageId})` : ''}`,
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send test failed');
    } finally {
      setTestSending(false);
    }
  };

  const handleToggleOrgFlag = async (org) => {
    try {
      await apiClient.patch(`/api/feature-flags/${org.orgId}`, {
        features: { whatsappMileage: !org.whatsappMileage },
      });
      toast.success(
        `${org.companyName}: whatsappMileage ${!org.whatsappMileage ? 'enabled' : 'disabled'}`,
      );
      await loadStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update flag');
    }
  };

  const runDraftAction = async (id, action) => {
    setDraftBusyId(id);
    try {
      if (action === 'publish') {
        await apiClient.post(`/api/whatsapp/admin/drafts/${id}/publish`);
        toast.success('Draft published to org mileage');
      } else if (action === 'reject') {
        const reason = window.prompt('Reject reason (optional)') || undefined;
        await apiClient.post(`/api/whatsapp/admin/drafts/${id}/reject`, { reason });
        toast.success('Draft rejected');
      } else if (action === 'clear') {
        await apiClient.post(`/api/whatsapp/admin/drafts/${id}/clear`, {
          note: 'cleared_from_ui',
        });
        toast.success('Draft cleared');
      }
      await Promise.all([loadDrafts(), loadStatus()]);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} draft`);
    } finally {
      setDraftBusyId(null);
    }
  };

  const overall = STATUS_META[status?.overall] || STATUS_META.disabled;
  const enabledOrgs = (status?.orgs || []).filter((o) => o.whatsappMileage);

  return (
    <div className="ff-page wa-page">
      <PageHeader
        backLabel="Dashboard"
        backPath="/superadmin"
        currentLabel="WhatsApp"
        title="WhatsApp mileage"
        description="Status, Meta sync, and the draft inbox — publish WhatsApp fills into org mileage."
      />

      <div className="ff-toolbar">
        <span className="ff-meta">
          {loading
            ? 'Checking…'
            : status?.checkedAt
              ? <>Last check <strong>{new Date(status.checkedAt).toLocaleString()}</strong></>
              : '—'}
          {status?.drafts ? (
            <>
              {' · '}
              <strong>{status.drafts.READY || 0}</strong> ready drafts
            </>
          ) : null}
        </span>
        <div className="ff-toolbar__actions">
          <button
            type="button"
            className="ff-btn ff-btn--secondary"
            onClick={() => {
              loadStatus();
              loadDrafts();
            }}
            disabled={loading || draftsLoading}
          >
            <RefreshCw
              size={16}
              className={loading || draftsLoading ? 'wa-spin' : undefined}
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="ff-alert ff-alert--error" role="alert">
          {error}
        </div>
      )}

      {status && (
        <>
          <section className={`wa-hero wa-hero--${status.overall}`}>
            <div className="wa-hero__icon">
              <MessageCircle size={28} />
            </div>
            <div className="wa-hero__body">
              <div className="wa-hero__top">
                <span className={`wa-pill ${overall.className}`}>{overall.label}</span>
                <span className="wa-hero__sync">
                  {status.global.enabled
                    ? status.sync?.inSync
                      ? 'In sync with Meta'
                      : status.sync?.probed
                        ? 'Not in sync'
                        : 'Sync not probed'
                    : 'Globally disabled'}
                </span>
              </div>
              <p className="wa-hero__summary">{status.summary}</p>
            </div>
          </section>

          <div className="wa-grid">
            <div className="ff-card wa-card">
              <h3 className="wa-card__title">Global switch</h3>
              <dl className="wa-dl">
                <div>
                  <dt>WHATSAPP_ENABLED</dt>
                  <dd>{status.global.enabled ? 'true' : 'false'}</dd>
                </div>
                <div>
                  <dt>Config complete</dt>
                  <dd>{status.global.configComplete ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt>Phone number id</dt>
                  <dd>{status.global.phoneNumberIdMasked || '—'}</dd>
                </div>
                <div>
                  <dt>WABA id</dt>
                  <dd>{status.global.businessAccountIdMasked || '—'}</dd>
                </div>
                <div>
                  <dt>Access token</dt>
                  <dd>{status.global.accessTokenConfigured ? 'Set' : 'Missing'}</dd>
                </div>
                <div>
                  <dt>App secret / verify token</dt>
                  <dd>
                    {status.global.appSecretConfigured ? 'Secret set' : 'Secret missing'}
                    {' · '}
                    {status.global.verifyTokenConfigured ? 'Verify set' : 'Verify missing'}
                  </dd>
                </div>
                <div>
                  <dt>API</dt>
                  <dd>
                    {status.global.apiVersion} · auto-link {status.global.autoLink ? 'on' : 'off'}
                  </dd>
                </div>
              </dl>
              {!!status.global.missingConfig?.length && (
                <p className="wa-card__hint wa-card__hint--fail">
                  Missing env: {status.global.missingConfig.join(', ')}
                </p>
              )}
            </div>

            <div className="ff-card wa-card">
              <h3 className="wa-card__title">Meta sync</h3>
              <dl className="wa-dl">
                <div>
                  <dt>Graph reachable</dt>
                  <dd>
                    {status.sync.graphReachable == null
                      ? '—'
                      : status.sync.graphReachable
                        ? `Yes (${status.sync.graphLatencyMs} ms)`
                        : 'No'}
                  </dd>
                </div>
                <div>
                  <dt>Display number</dt>
                  <dd>{status.sync.displayPhoneNumber || '—'}</dd>
                </div>
                <div>
                  <dt>Verified name</dt>
                  <dd>{status.sync.verifiedName || '—'}</dd>
                </div>
                <div>
                  <dt>Quality</dt>
                  <dd>{status.sync.qualityRating || '—'}</dd>
                </div>
              </dl>
              {status.sync.graphError && (
                <p className="wa-card__hint wa-card__hint--fail">{status.sync.graphError}</p>
              )}
            </div>

            <div className="ff-card wa-card">
              <h3 className="wa-card__title">Queues</h3>
              <dl className="wa-dl">
                <div>
                  <dt>Inbound received / claimed / failed</dt>
                  <dd>
                    {status.queue.inboundReceived} / {status.queue.inboundClaimed} /{' '}
                    {status.queue.inboundFailed}
                  </dd>
                </div>
                <div>
                  <dt>Images last 24h</dt>
                  <dd>{status.queue.inboundImagesLast24h}</dd>
                </div>
                <div>
                  <dt>Sessions awaiting / processing</dt>
                  <dd>
                    {status.queue.sessionsAwaiting} / {status.queue.sessionsProcessing}
                  </dd>
                </div>
                <div>
                  <dt>Active links</dt>
                  <dd>{status.queue.activeLinks}</dd>
                </div>
              </dl>
            </div>
          </div>

          <section className="ff-card wa-card">
            <div className="wa-card__head">
              <h3 className="wa-card__title">Draft inbox</h3>
              <select
                className="wa-select"
                value={draftFilter}
                onChange={(e) => setDraftFilter(e.target.value)}
                aria-label="Draft status filter"
              >
                <option value="READY">READY</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CLEARED">CLEARED</option>
                <option value="ALL">ALL</option>
              </select>
            </div>
            <p className="wa-card__hint">
              Manager confirms on WhatsApp → draft lands here. Publish writes the real fuel log for
              that org. ({draftsTotal} shown)
            </p>
            {draftsLoading ? (
              <p className="wa-card__hint">Loading drafts…</p>
            ) : drafts.length === 0 ? (
              <p className="wa-card__hint">No drafts in this filter.</p>
            ) : (
              <div className="ff-table-wrap">
                <table className="ff-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Org</th>
                      <th>Vehicle</th>
                      <th>Fill</th>
                      <th>Odo</th>
                      <th>Status</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((d) => (
                      <tr key={d._id}>
                        <td>{d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}</td>
                        <td>
                          <div className="ff-org-name">
                            {d.orgId?.companyName || String(d.orgId || '—')}
                          </div>
                        </td>
                        <td>{d.vehicleReg || d.vehicleId?.registrationNumber || '—'}</td>
                        <td>
                          {d.litres != null ? `${Number(d.litres).toFixed(1)} L` : '—'}
                          {d.fillingType === 'FULL_TANK'
                            ? ' · full'
                            : d.fillingType === 'PARTIAL'
                              ? ' · partial'
                              : ''}
                        </td>
                        <td>
                          {d.odometerReading != null
                            ? `${Number(d.odometerReading).toLocaleString()} (${d.odometerSource || '—'})`
                            : '—'}
                        </td>
                        <td>
                          <span
                            className={`wa-pill ${
                              d.status === 'READY'
                                ? 'wa-pill--warn'
                                : d.status === 'PUBLISHED'
                                  ? 'wa-pill--ok'
                                  : 'wa-pill--muted'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="ff-center wa-draft-actions">
                          {d.status === 'READY' && (
                            <>
                              <button
                                type="button"
                                className="ff-btn ff-btn--primary ff-btn--sm"
                                disabled={draftBusyId === d._id}
                                onClick={() => runDraftAction(d._id, 'publish')}
                              >
                                Publish
                              </button>
                              <button
                                type="button"
                                className="ff-btn ff-btn--secondary ff-btn--sm"
                                disabled={draftBusyId === d._id}
                                onClick={() => runDraftAction(d._id, 'reject')}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className="ff-btn ff-btn--secondary ff-btn--sm"
                                disabled={draftBusyId === d._id}
                                onClick={() => runDraftAction(d._id, 'clear')}
                              >
                                Clear
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="ff-card wa-card">
            <h3 className="wa-card__title">What to check</h3>
            <ul className="wa-checklist">
              {(status.checklist || []).map((item) => {
                const Icon = CHECK_ICON[item.status] || MinusCircle;
                return (
                  <li key={item.id} className={`wa-check wa-check--${item.status}`}>
                    <Icon size={18} />
                    <div>
                      <div className="wa-check__label">{item.label}</div>
                      <div className="wa-check__detail">{item.detail}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="ff-card wa-card">
            <div className="wa-card__head">
              <h3 className="wa-card__title">Org rollout (whatsappMileage)</h3>
              <Link to="/superadmin/feature-flags" className="wa-link">
                Feature flags <ExternalLink size={14} />
              </Link>
            </div>
            <p className="wa-card__hint">
              Global env turns the webhook on. Each org still needs the{' '}
              <strong>whatsappMileage</strong> flag before managers can link and submit.
              {enabledOrgs.length
                ? ` ${enabledOrgs.length} org(s) currently enabled.`
                : ' None enabled yet.'}
            </p>
            <div className="ff-table-wrap">
              <table className="ff-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th className="ff-center">Flag</th>
                    <th className="ff-center">Active links</th>
                    <th aria-label="Toggle" />
                  </tr>
                </thead>
                <tbody>
                  {(status.orgs || []).map((org) => (
                    <tr key={org.orgId}>
                      <td>
                        <div className="ff-org-name">{org.companyName}</div>
                      </td>
                      <td className="ff-center">
                        <span
                          className={`wa-pill ${
                            org.whatsappMileage ? 'wa-pill--ok' : 'wa-pill--muted'
                          }`}
                        >
                          {org.whatsappMileage ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="ff-center">{org.activeLinks}</td>
                      <td className="ff-center">
                        <button
                          type="button"
                          className="ff-btn ff-btn--secondary ff-btn--sm"
                          onClick={() => handleToggleOrgFlag(org)}
                        >
                          {org.whatsappMileage ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="wa-grid wa-grid--2">
            <section className="ff-card wa-card">
              <h3 className="wa-card__title">Look up session</h3>
              <form className="wa-form" onSubmit={handleLookupSession}>
                <label>
                  Phone / waId
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={sessionPhone}
                    onChange={(e) => setSessionPhone(e.target.value)}
                  />
                </label>
                <button type="submit" className="ff-btn ff-btn--primary" disabled={sessionLoading}>
                  <Search size={16} />
                  {sessionLoading ? 'Loading…' : 'Inspect'}
                </button>
              </form>
              {sessionData && (
                <pre className="wa-pre">{JSON.stringify(
                  {
                    waIdDigest: sessionData.waIdDigest,
                    state: sessionData.session?.state,
                    orgId: sessionData.session?.orgId || sessionData.link?.orgId,
                    link: sessionData.link,
                    pendingMedia: sessionData.session?.pendingMedia?.length,
                    inbound: sessionData.inbound?.slice(0, 5),
                    outbound: sessionData.outbound?.slice(0, 5),
                  },
                  null,
                  2,
                )}
                </pre>
              )}
            </section>

            <section className="ff-card wa-card">
              <h3 className="wa-card__title">Send test message</h3>
              <form className="wa-form" onSubmit={handleSendTest}>
                <label>
                  Phone
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                </label>
                <label>
                  Text (optional)
                  <input
                    type="text"
                    placeholder="GNB Edge WhatsApp test message"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  className="ff-btn ff-btn--primary"
                  disabled={testSending || !status.global.enabled}
                >
                  <Send size={16} />
                  {testSending ? 'Sending…' : 'Send test'}
                </button>
              </form>
              {!status.global.enabled && (
                <p className="wa-card__hint">Enable WHATSAPP_ENABLED before sending.</p>
              )}
            </section>
          </div>

          {status.metrics?.alerts?.alerts?.length > 0 && (
            <section className="ff-card wa-card">
              <h3 className="wa-card__title">Runtime alerts</h3>
              <ul className="wa-alerts">
                {status.metrics.alerts.alerts.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default WhatsAppAdminPage;
