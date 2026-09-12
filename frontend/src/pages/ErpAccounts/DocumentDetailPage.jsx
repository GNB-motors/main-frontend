import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, Receipt } from 'lucide-react';
import { toast } from 'react-toastify';
import PageShell from '../../components/Erp/PageShell';
import StatusBadge from '../../components/Erp/StatusBadge';
import EmptyState from '../../components/Erp/EmptyState';
import FinanceHubApi from './FinanceHubService';
import { accountPathFor, documentLabelFor } from './documentRoutes';
import { inr } from '../../utils/formatMoney';
import { formatDateIST } from '../../utils/dateUtils';
import '../../styles/erp.css';

/**
 * Document detail — the reverse drill-down.
 *
 * From any ledger line you can now reach the document that produced it, and
 * see the three things that explain it: the postings it created, everything
 * that has settled against it, and its timeline.
 *
 * Until this existed, every `Source` link in the Day Book and the Account 360
 * statement pointed at an unregistered route — and `/erp/accounts/voucher/:id`
 * was worse than a 404, because it matched the Account 360 catch-all and
 * rendered a broken account page instead.
 *
 * All of it comes from one endpoint that was already live:
 *   GET /erp/finance-hub/document/:docType/:docId/activity
 */

/** URL segment → the docType the activity endpoint expects. */
const SEGMENT_TO_TYPE = {
  bill: 'SALE_BILL',
  'purchase-bill': 'PURCHASE_BILL',
  'supplier-invoice': 'SUPPLIER_INVOICE',
  voucher: 'VOUCHER', // resolved from the document itself — see below
};

const HUB_BREADCRUMB = {
  SALE_BILL: { label: 'Billing', to: '/erp/billing' },
  PURCHASE_BILL: { label: 'Payables', to: '/erp/payables' },
  SUPPLIER_INVOICE: { label: 'Payables', to: '/erp/payables' },
  VOUCHER: { label: 'Accounts', to: '/erp/accounts' },
};

const DocumentDetailPage = ({ segment }) => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Links now carry the voucher subtype (?type=RECEIPT); older links may not.
  const knownType = searchParams.get('type');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseType = SEGMENT_TO_TYPE[segment] || 'SALE_BILL';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // A voucher's real type is normally carried in the URL (?type=) so we make
      // exactly one call; only a legacy link with no type falls back to probing.
      let candidates;
      if (baseType === 'VOUCHER') {
        candidates = knownType ? [knownType] : ['RECEIPT', 'PAYMENT', 'ON_ACCOUNT', 'JOURNAL'];
      } else {
        candidates = [baseType];
      }

      let last = null;
      for (const type of candidates) {
        try {
          const res = await FinanceHubApi.getDocumentActivity(type, docId);
          if (res.data?.document) {
            setData(res.data);
            return;
          }
          last = res.data;
        } catch (e) {
          last = null;
          if (e.status === 404) throw e;
        }
      }
      setData(last);
      if (!last?.document) setError(new Error('Document not found'));
    } catch (err) {
      setError(err);
      if (err.status !== 404) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [baseType, docId, knownType]);

  useEffect(() => {
    load();
  }, [load]);

  const doc = data?.document;
  const docType = data?.docType || baseType;
  const crumb = HUB_BREADCRUMB[baseType] || HUB_BREADCRUMB.SALE_BILL;

  // Each document type names its number, date, counterparty and amount
  // differently — normalise once so the shell below stays generic.
  const number = doc?.billNumber || doc?.invoiceNumber || doc?.voucherNumber || '—';
  const date = doc?.billDate || doc?.invoiceDate || doc?.voucherDate;
  const amount = doc?.netAmount ?? doc?.amount ?? 0;
  const outstanding = doc?.outstandingAmount;
  const party = doc?.partyId || doc?.supplierId || doc?.vendorId;
  const partyName = typeof party === 'object' ? party?.name : null;
  const partyId = typeof party === 'object' ? party?._id : party;
  const accountType =
    docType === 'SALE_BILL'
      ? 'PARTY'
      : docType === 'SUPPLIER_INVOICE'
        ? 'SUPPLIER'
        : docType === 'PURCHASE_BILL'
          ? 'VENDOR'
          : doc?.partyType || 'PARTY';
  const accountLink = accountPathFor(accountType, partyId);

  if (loading) {
    return (
      <PageShell title="Loading document…" breadcrumbs={[{ label: 'ERP', to: '/erp' }, crumb]} />
    );
  }

  if (error || !doc) {
    return (
      <PageShell
        title="Document not found"
        breadcrumbs={[{ label: 'ERP', to: '/erp' }, crumb, { label: 'Not found' }]}
      >
        <div className="erp-card">
          <EmptyState
            icon={FileText}
            text="We couldn't find that document"
            hint="It may have been cancelled, or the link is out of date."
            cta={
              <button type="button" className="erp-btn" onClick={() => navigate(-1)}>
                Go back
              </button>
            }
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={
        <>
          <FileText size={20} /> {number}
        </>
      }
      subtitle={`${documentLabelFor(docType)}${date ? ` · ${formatDateIST(date)}` : ''}`}
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, crumb, { label: number }]}
      actions={
        <button type="button" className="erp-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>
      }
    >
      {/* ── Header facts ─────────────────────────────────────────────── */}
      <div className="erp-stat-grid">
        <div className="erp-stat">
          <div className="erp-stat-label">Amount</div>
          <div className="erp-stat-value">{inr(amount)}</div>
        </div>
        {outstanding !== undefined && (
          <div className="erp-stat">
            <div className="erp-stat-label">Outstanding</div>
            <div
              className="erp-stat-value"
              style={{ color: outstanding > 0 ? '#b45309' : '#15803d' }}
            >
              {inr(outstanding)}
            </div>
            <div className="erp-stat-sub">{outstanding > 0 ? 'Not fully settled' : 'Settled'}</div>
          </div>
        )}
        <div className="erp-stat">
          <div className="erp-stat-label">Settled so far</div>
          <div className="erp-stat-value">{inr(data.settledTotal)}</div>
          <div className="erp-stat-sub">{data.settlements.length} transaction(s)</div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Status</div>
          <div style={{ marginTop: 6 }}>
            <StatusBadge status={doc.status} />
          </div>
          {accountLink && (
            <div className="erp-stat-sub" style={{ marginTop: 8 }}>
              <Link to={accountLink}>{partyName || 'View account'} →</Link>
            </div>
          )}
        </div>
        {Array.isArray(data.trips) && data.trips.length > 0 && (
          <div className="erp-stat">
            <div className="erp-stat-label">{data.trips.length > 1 ? 'Trips' : 'Trip'}</div>
            <div className="erp-stat-sub" style={{ marginTop: 6 }}>
              {data.trips.map((t) => (
                <div key={t.tripId}>
                  <Link to={`/erp/trips/${t.tripId}`}>{t.tripNumber || 'View trip'} →</Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="erp-split"
        style={{ gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}
      >
        {/* ── Ledger postings ────────────────────────────────────────── */}
        <div className="erp-card" style={{ padding: '18px 20px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Ledger postings</h3>
          <p className="erp-field-hint" style={{ margin: '0 0 12px' }}>
            What this document did to the books.
          </p>

          {data.ledgerEntries.length === 0 ? (
            <EmptyState
              compact
              text="Nothing posted yet"
              hint={
                doc.status === 'PENDING_APPROVAL'
                  ? 'Nothing reaches the ledger until this is approved.'
                  : 'No ledger entries reference this document.'
              }
            />
          ) : (
            <>
              <div className="erp-table-wrap">
                <table className="erp-table compact" style={{ minWidth: 0 }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Account</th>
                      <th style={{ textAlign: 'right' }}>Debit</th>
                      <th style={{ textAlign: 'right' }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ledgerEntries.map((e) => {
                      const to = accountPathFor(e.accountType, e.accountId);
                      return (
                        <tr key={e._id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDateIST(e.entryDate)}</td>
                          <td>
                            {to ? <Link to={to}>{e.accountType}</Link> : e.accountType}
                            {e.narration && <div className="erp-field-hint">{e.narration}</div>}
                          </td>
                          <td className="erp-numeric" style={{ textAlign: 'right' }}>
                            {e.debit ? inr(e.debit) : '—'}
                          </td>
                          <td className="erp-numeric" style={{ textAlign: 'right' }}>
                            {e.credit ? inr(e.credit) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 20,
                  marginTop: 12,
                  fontSize: 13,
                }}
              >
                <span>
                  Dr <strong className="erp-numeric">{inr(data.ledgerTotals.debit)}</strong>
                </span>
                <span>
                  Cr <strong className="erp-numeric">{inr(data.ledgerTotals.credit)}</strong>
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Settlements ────────────────────────────────────────────── */}
        <div className="erp-card" style={{ padding: '18px 20px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Settlement history</h3>
          <p className="erp-field-hint" style={{ margin: '0 0 12px' }}>
            Receipts and payments that have been applied to this document.
          </p>

          {data.settlements.length === 0 ? (
            <EmptyState compact icon={Receipt} text="Nothing settled yet" />
          ) : (
            <div className="erp-table-wrap">
              <table className="erp-table compact" style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.settlements.map((s) => (
                    <tr key={s.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {s.date ? formatDateIST(s.date) : '—'}
                      </td>
                      <td>{s.number}</td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="erp-numeric" style={{ textAlign: 'right' }}>
                        {inr(s.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      {data.timeline.length > 0 && (
        <div className="erp-card" style={{ padding: '18px 20px', marginTop: 16 }}>
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Clock size={16} /> Timeline
          </h3>
          <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
            {data.timeline.map((t, i) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ padding: '0 14px' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{t.label}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{formatDateIST(t.at)}</div>
                </div>
                {i < data.timeline.length - 1 && <span style={{ color: '#cbd5e0' }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default DocumentDetailPage;
