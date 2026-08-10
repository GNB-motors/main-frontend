/**
 * Outstanding / Payment Collection (ISOCL ERP Stage 11)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import OutstandingApi from './OutstandingService';
import PageShell from '../../components/Erp/PageShell';
import '../../styles/erp.css';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

const VIEWS = [
  ['ALL', 'Full outstanding'],
  ['DUE_TODAY', 'Due today'],
  ['OVERDUE', 'Overdue'],
  ['UPCOMING', 'Upcoming'],
];

const OutstandingPage = ({ embedded = false }) => {
  const [view, setView] = useState('ALL');
  const [summary, setSummary] = useState(null);
  const [partyWise, setPartyWise] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('bills');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, partyRes, listRes] = await Promise.all([
        OutstandingApi.getSummary(),
        OutstandingApi.getPartyWise(),
        OutstandingApi.list({ view, limit: 100 }),
      ]);
      setSummary(sumRes.data);
      setPartyWise(partyRes.data || []);
      setRows(listRes.data || []);
    } catch (err) {
      if (err.status === 404) {
        toast.error('Outstanding / accounts is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setSummary(null);
      setPartyWise([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = async () => {
    try {
      const blob = await OutstandingApi.exportCsv({ view });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outstanding-${view.toLowerCase()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <PageShell
      embedded={embedded}
      title={<><Wallet size={22} /> Outstanding Receivables</>}
      subtitle="Party-wise and due-date views for submitted sale bills."
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Billing', to: '/erp/billing' }, { label: 'Outstanding' }]}
      actions={(
        <button type="button" className="erp-btn" onClick={exportCsv}>
          <Download size={16} /> Export CSV
        </button>
      )}
    >

      {summary && (
        <div className="erp-stats-row" style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            ['Total outstanding', money(summary.totalOutstanding)],
            ['Overdue', money(summary.overdueTotal)],
            ['Due today', money(summary.dueTodayTotal)],
            ['Parties', summary.partyCount],
          ].map(([label, val]) => (
            <div key={label} className="erp-callout" style={{ minWidth: 140 }}>
              <div className="erp-muted">{label}</div>
              <strong>{val}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="erp-tabs">
        {[
          ['bills', 'Bill list'],
          ['parties', 'Party-wise'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`erp-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'bills' && (
        <div className="erp-tabs" style={{ marginBottom: 12 }}>
          {VIEWS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`erp-tab ${view === key ? 'active' : ''}`}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="erp-muted">Loading…</p>
      ) : tab === 'parties' ? (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Party</th>
                <th>Bills</th>
                <th>Outstanding</th>
                <th>Overdue</th>
                <th>Credit limit</th>
              </tr>
            </thead>
            <tbody>
              {partyWise.length === 0 ? (
                <tr>
                  <td colSpan={5} className="erp-muted">
                    No outstanding balances.
                  </td>
                </tr>
              ) : (
                partyWise.map((p) => (
                  <tr key={p.partyId}>
                    <td>
                      {p.partyName}{' '}
                      {p.overCreditLimit && (
                        <span className="erp-muted">(over limit)</span>
                      )}
                    </td>
                    <td>{p.billCount}</td>
                    <td>{money(p.totalOutstanding)}</td>
                    <td>{money(p.overdueAmount)}</td>
                    <td>{money(p.creditLimit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Party</th>
                <th>Due date</th>
                <th>Outstanding</th>
                <th>Overdue days</th>
                <th>Bucket</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="erp-muted">
                    No bills in this view.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.billId}>
                    <td>{r.billNumber}</td>
                    <td>{r.partyName}</td>
                    <td>
                      {r.dueDate
                        ? new Date(r.dueDate).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td>{money(r.outstandingAmount)}</td>
                    <td>{r.overdueDays ?? '—'}</td>
                    <td>{r.ageingBucket}</td>
                    <td>{r.remarks || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
};

export default OutstandingPage;
