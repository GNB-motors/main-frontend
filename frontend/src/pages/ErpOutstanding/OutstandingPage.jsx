/**
 * Outstanding / Payment Collection (ISOCL ERP Stage 11)
 *
 * Three independent reads (summary, party-wise, bill list). One failed request
 * never clears another section's data: each section keeps the last figures it
 * managed to load, says what went wrong in plain words and offers its own Retry.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Download } from 'lucide-react';
import OutstandingApi from './OutstandingService';
import PageShell from '../../components/Erp/PageShell';
import ErrorCard from '../../components/redesign/ErrorCard';
import logger from '../../utils/logger';
import '../../styles/erp.css';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

/** A count the server did not send is unknown, not zero. */
const count = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : '—');

const VIEWS = [
  ['ALL', 'Full outstanding'],
  ['DUE_TODAY', 'Due today'],
  ['OVERDUE', 'Overdue'],
  ['UPCOMING', 'Upcoming'],
];

const OutstandingPage = ({ embedded = false }) => {
  const [view, setView] = useState('ALL');
  const [tab, setTab] = useState('bills');
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [partyWise, setPartyWise] = useState([]);
  const [partyError, setPartyError] = useState(null);
  const [partyLoading, setPartyLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [rowsError, setRowsError] = useState(null);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [exportError, setExportError] = useState(null);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await OutstandingApi.getSummary();
      setSummary(res?.data ?? null);
      setSummaryError(null);
      return true;
    } catch (err) {
      logger.error('erp-outstanding', 'summary request failed', {
        status: err?.status ?? null,
        message: err?.message ?? String(err),
      });
      setSummaryError(err);
      return false;
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadParty = useCallback(async () => {
    setPartyLoading(true);
    try {
      const res = await OutstandingApi.getPartyWise();
      setPartyWise(res?.data || []);
      setPartyError(null);
      return true;
    } catch (err) {
      logger.error('erp-outstanding', 'party-wise request failed', {
        status: err?.status ?? null,
        message: err?.message ?? String(err),
      });
      setPartyError(err);
      return false;
    } finally {
      setPartyLoading(false);
    }
  }, []);

  const loadRows = useCallback(async () => {
    setRowsLoading(true);
    try {
      const res = await OutstandingApi.list({ view, limit: 100 });
      setRows(res?.data || []);
      setRowsError(null);
      return true;
    } catch (err) {
      logger.error('erp-outstanding', 'bill list request failed', {
        status: err?.status ?? null,
        message: err?.message ?? String(err),
        view,
      });
      setRowsError(err);
      return false;
    } finally {
      setRowsLoading(false);
    }
  }, [view]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadParty();
  }, [loadParty]);

  useEffect(() => {
    // Rows belong to the view they were loaded for — a new view starts empty.
    setRows([]);
    loadRows();
  }, [loadRows]);

  const exportCsv = async () => {
    setExportError(null);
    try {
      const blob = await OutstandingApi.exportCsv({ view });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outstanding-${view.toLowerCase()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('erp-outstanding', 'csv export failed', {
        status: err?.status ?? null,
        message: err?.message ?? String(err),
      });
      setExportError(err);
    }
  };

  return (
    <PageShell
      embedded={embedded}
      title={
        <>
          <Wallet size={22} /> Outstanding Receivables
        </>
      }
      subtitle="Party-wise and due-date views for submitted sale bills."
      breadcrumbs={[
        { label: 'ERP', to: '/erp' },
        { label: 'Billing', to: '/erp/billing' },
        { label: 'Outstanding' },
      ]}
      actions={
        <button type="button" className="erp-btn" onClick={exportCsv}>
          <Download size={16} /> Export CSV
        </button>
      }
    >
      {exportError ? (
        <div style={{ marginBottom: 16 }}>
          <ErrorCard error={exportError} onRetry={exportCsv} />
        </div>
      ) : null}

      {/* Summary — its own failure, its own retry. */}
      {summaryError ? (
        <div style={{ marginBottom: 16 }}>
          <ErrorCard error={summaryError} onRetry={loadSummary} />
          {summary ? <p className="erp-muted">Showing the last figures we loaded.</p> : null}
        </div>
      ) : null}

      {summary && (
        <div
          className="erp-stats-row"
          style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}
        >
          {[
            ['Total outstanding', money(summary.totalOutstanding)],
            ['Overdue', money(summary.overdueTotal)],
            ['Due today', money(summary.dueTodayTotal)],
            ['Parties', count(summary.partyCount)],
          ].map(([label, val]) => (
            <div key={label} className="erp-callout" style={{ minWidth: 140 }}>
              <div className="erp-muted">{label}</div>
              <strong>{val}</strong>
            </div>
          ))}
        </div>
      )}

      {!summary && !summaryError && summaryLoading ? <p className="erp-muted">Loading…</p> : null}

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

      {tab === 'parties' ? (
        partyLoading && partyWise.length === 0 ? (
          <p className="erp-muted">Loading…</p>
        ) : (
          <div className="erp-table-wrap">
            {partyError ? (
              <div style={{ marginBottom: 12 }}>
                <ErrorCard error={partyError} onRetry={loadParty} />
                {partyWise.length ? (
                  <p className="erp-muted">Showing the last list we loaded.</p>
                ) : null}
              </div>
            ) : null}
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
                {partyError && partyWise.length === 0 ? null : partyWise.length === 0 ? (
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
                        {p.overCreditLimit && <span className="erp-muted">(over limit)</span>}
                      </td>
                      <td>{count(p.billCount)}</td>
                      <td>{money(p.totalOutstanding)}</td>
                      <td>{money(p.overdueAmount)}</td>
                      <td>{money(p.creditLimit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : rowsLoading && rows.length === 0 ? (
        <p className="erp-muted">Loading…</p>
      ) : (
        <div className="erp-table-wrap">
          {rowsError ? (
            <div style={{ marginBottom: 12 }}>
              <ErrorCard error={rowsError} onRetry={loadRows} />
              {rows.length ? <p className="erp-muted">Showing the last list we loaded.</p> : null}
            </div>
          ) : null}
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
              {rowsError && rows.length === 0 ? null : rows.length === 0 ? (
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
                    <td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '—'}</td>
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
