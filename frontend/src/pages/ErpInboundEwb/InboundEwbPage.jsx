/**
 * Inbound e-Way Bills (GST auto-fill).
 *
 * e-Way Bills pulled from the GST network where we're named as transporter,
 * auto-matched to open trips. High-confidence rows are SUGGESTED against a trip;
 * one click confirms → creates the consignment via the normal save-CN flow.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Truck, CheckCircle2, X, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import InboundEwbService from './InboundEwbService';
import '../../styles/erp.css';

const STATUS_TABS = [
  { key: 'SUGGESTED', label: 'Suggested' },
  { key: 'UNMATCHED', label: 'Unmatched' },
  { key: 'LINKED', label: 'Linked' },
  { key: 'IGNORED', label: 'Ignored' },
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

const scoreBadge = (score) => {
  if (score >= 60) return { text: `${score} · strong`, cls: 'success' };
  if (score >= 30) return { text: `${score} · likely`, cls: 'warning' };
  return { text: `${score}`, cls: '' };
};

const InboundEwbPage = () => {
  const [status, setStatus] = useState('SUGGESTED');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await InboundEwbService.list({ status });
      setRows(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleConfirm = async (row) => {
    setBusyId(row._id);
    try {
      const { consignment } = await InboundEwbService.confirm(row._id);
      toast.success(`Consignment ${consignment?.cnNumber || ''} created from e-Way Bill ${row.ewbNumber}`);
      fetchRows();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleIgnore = async (row) => {
    setBusyId(row._id);
    try {
      await InboundEwbService.ignore(row._id);
      toast.info(`e-Way Bill ${row.ewbNumber} ignored`);
      fetchRows();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const canConfirm = (row) => row.matchStatus !== 'LINKED' && (row.matchedTripId || status === 'UNMATCHED');
  const actionable = status === 'SUGGESTED' || status === 'UNMATCHED';

  return (
    <div className="erp-container">
      <div className="erp-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={22} /> Inbound e-Way Bills
          </h1>
          <p className="erp-cell-muted" style={{ margin: '4px 0 0' }}>
            Pulled from the GST network and auto-matched to open trips. Confirm to create the consignment.
          </p>
        </div>
        <div className="erp-header-actions">
          <button className="btn btn-secondary" onClick={fetchRows} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="erp-inline" style={{ gap: 8, marginBottom: 16 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            className={`btn ${status === t.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatus(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="erp-card">
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }} className="erp-cell-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }} className="erp-cell-muted">
            No {status.toLowerCase()} e-Way Bills.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>e-Way Bill</th>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Party GSTIN</th>
                  <th>Qty</th>
                  <th>Match</th>
                  {actionable && <th style={{ textAlign: 'right' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const badge = scoreBadge(row.matchScore || 0);
                  return (
                    <tr key={row._id}>
                      <td className="erp-cell-strong">
                        {row.ewbNumber}
                        {row.sourceInvoiceNumber && (
                          <div className="erp-cell-muted" style={{ fontSize: 12 }}>Inv {row.sourceInvoiceNumber}</div>
                        )}
                      </td>
                      <td>{fmtDate(row.ewbDate)}</td>
                      <td>
                        <span className="erp-inline" style={{ gap: 4 }}>
                          <Truck size={14} /> {row.vehicleNumber || '—'}
                        </span>
                      </td>
                      <td>{row.partyGstin || '—'}</td>
                      <td>{row.qty ? `${row.qty} ${row.qtyUnit || ''}` : '—'}</td>
                      <td>
                        {row.matchStatus === 'SUGGESTED' ? (
                          <span className={`erp-badge ${badge.cls}`} title={row.matchReason}>
                            {badge.text}
                          </span>
                        ) : (
                          <span className="erp-cell-muted">{row.matchStatus}</span>
                        )}
                      </td>
                      {actionable && (
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            disabled={!canConfirm(row) || busyId === row._id}
                            onClick={() => handleConfirm(row)}
                            title={canConfirm(row) ? 'Create consignment on the matched trip' : 'No matched trip to link'}
                          >
                            <CheckCircle2 size={14} /> Confirm
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: 12, marginLeft: 6 }}
                            disabled={busyId === row._id}
                            onClick={() => handleIgnore(row)}
                          >
                            <X size={14} /> Ignore
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboundEwbPage;
