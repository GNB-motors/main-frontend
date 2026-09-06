import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Inbox, Truck, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import apiClient from '../../../utils/axiosConfig';
import './ReceiptApproval.css';

/* Inbox for WhatsApp fuel-bill drafts captured over WhatsApp.
   Lists drafts by status; clicking a row opens the review/approve detail. */

const STATUS_TABS = [
  { key: 'READY', label: 'Pending' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CLEARED', label: 'Cleared' },
  { key: 'ALL', label: 'All' },
];

const STATUS_BADGE = {
  READY: 'ra-badge--ready',
  PUBLISHED: 'ra-badge--published',
  REJECTED: 'ra-badge--rejected',
  CLEARED: 'ra-badge--cleared',
};

const fmtMoney = (n) =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const fmtLitres = (n) => (n == null ? '—' : `${Number(n).toLocaleString('en-IN')} L`);

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

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

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/api/whatsapp/admin/drafts', {
          params: { status, limit: 200 },
        });
        if (!alive) return;
        setItems(res.data?.data?.items ?? []);
      } catch (e) {
        if (!alive) return;
        setError(e.response?.data?.message || 'Failed to load receipts');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [status]);

  // Counts per status for the tab badges — best-effort, non-blocking.
  useEffect(() => {
    let alive = true;
    apiClient
      .get('/api/whatsapp/admin/drafts/counts')
      .then((res) => {
        if (alive) setCounts(res.data?.data ?? {});
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [status]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => {
      const veh = d.vehicleId?.registrationNumber || d.vehicleReg || '';
      const org = d.orgId?.companyName || '';
      const plate = d.plateText || '';
      return (
        veh.toLowerCase().includes(q) ||
        org.toLowerCase().includes(q) ||
        plate.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  return (
    <div className="ra-page">
      <PageHeader
        backLabel={isSuperadminRoute ? "Dashboard" : "Fleet Operations"}
        backPath={isSuperadminRoute ? "/superadmin" : "/overview"}
        currentLabel="WhatsApp Approvals"
        title="WhatsApp Fuel Approvals"
        description="Review fuel bills captured over WhatsApp and publish them into the fuel ledger."
      />

      <div className="ra-toolbar">
        <div className="ra-tabs">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              className={`ra-tab ${status === t.key ? 'is-active' : ''}`}
              onClick={() => setStatus(t.key)}
            >
              {t.label}
              {t.key !== 'ALL' && counts[t.key] != null && (
                <span className="ra-tab__count">{counts[t.key]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="ra-search">
          <span className="ra-search__icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search vehicle, org, plate"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="ra-alert ra-alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="ra-card">
        <div className="ra-table-wrap">
          <table className="ra-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Organization</th>
                <th className="ra-right">Litres</th>
                <th className="ra-right">Amount</th>
                <th className="ra-center">Odometer</th>
                <th className="ra-center">Status</th>
                <th>Received</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8}>
                    <div className="ra-state">
                      <div className="ra-spinner" />
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="ra-state">
                      <div className="ra-state__icon">
                        <Inbox size={22} />
                      </div>
                      <div className="ra-state__title">No receipts here</div>
                      <div>
                        {status === 'READY'
                          ? 'No fuel bills are waiting for review.'
                          : 'Nothing to show for this filter.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((d) => {
                  const veh = d.vehicleId?.registrationNumber || d.vehicleReg || '—';
                  return (
                    <tr
                      key={d._id}
                      className="ra-clickable"
                      onClick={() => navigate(`${basePath}/${d._id}`)}
                    >
                      <td>
                        <span className="ra-veh">
                          <span className="ra-veh__avatar">
                            <Truck size={16} />
                          </span>
                          {veh}
                        </span>
                      </td>
                      <td className="ra-muted">{d.orgId?.companyName || '—'}</td>
                      <td className="ra-right ra-strong">{fmtLitres(d.litres)}</td>
                      <td className="ra-right ra-strong">{fmtMoney(d.amount)}</td>
                      <td className="ra-center ra-muted">
                        {d.odometerReading != null ? d.odometerReading.toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="ra-center">
                        <span className={`ra-badge ${STATUS_BADGE[d.status] || 'ra-badge--cleared'}`}>
                          <span className="ra-badge__dot" />
                          {d.status}
                        </span>
                      </td>
                      <td className="ra-muted">{fmtDate(d.createdAt)}</td>
                      <td className="ra-right">
                        <span className="ra-chevron">
                          <ChevronRight size={18} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceiptApprovalPage;
